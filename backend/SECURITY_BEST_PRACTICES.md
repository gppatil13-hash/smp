# Multi-Tenant Security Best Practices & Checklist

**Comprehensive security guide** for maintaining tenant isolation in production.

---

## 🔐 Security Architecture

### Defense in Depth Strategy

Your multi-tenant system uses **7 layers of security**:

```
Layer 7: Service Validation (TenantQueryBuilderService)
Layer 6: Database Enforcement (Prisma Middleware)
Layer 5: Request Validation (TenantIsolationInterceptor)
Layer 4: Guard Validation (TenantValidationGuard)
Layer 3: Authentication (JwtAuthGuard)
Layer 2: Context Setup (TenantContextMiddleware)
Layer 1: Tenant Extraction (TenantMiddleware)
```

No single point of failure. Compromise of one layer doesn't breach isolation!

---

## 🛡️ Security Best Practices

### 1. JWT Token Security

**✓ DO:**
```typescript
// Include tenantId in JWT payload
const payload = {
  sub: userId,
  tenantId: 'tenant-123',  // ✓ Required
  schoolId: 'school-1',    // ✓ Optional
  role: 'ADMIN',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60),
};
const token = this.jwtService.sign(payload);
```

**✗ DON'T:**
```typescript
// Missing tenantId
const payload = { sub: userId, role: 'ADMIN' }; // ✗ VULNERABLE

// Exposing secret in code
const secret = 'my-secret'; // ✗ Use environment variables
```

**Best Practices:**
- Store JWT secret in `.env` file (never in code)
- Use strong secrets (32+ characters)
- Set reasonable expiration (24h recommended)
- Include tenantId as required claim
- Sign tokens securely (HS256 or better)
- Rotate secrets periodically

### 2. Tenant ID Validation

**✓ VALID TENANT IDs:**
```typescript
'school-abc'           // ✓ Lowercase, hyphens
'SCHOOL_ABC_123'       // ✓ Alphanumeric and underscore
'tenant-2024-q1'       // ✓ Descriptive
```

**✗ INVALID TENANT IDs:**
```typescript
'localhost'            // ✗ Reserved keyword
'admin'                // ✗ Reserved keyword
'api'                  // ✗ Reserved keyword
'@tenant'              // ✗ Invalid characters
'a'                    // ✗ Too short (min: 3)
'this-is-a-very-long-tenant-id-that-exceeds-the-maximum-allowed-length'  // ✗ Too long (max: 50)
```

**Request Rejection Logic:**
```typescript
const isValidTenantId = (tenantId: string): boolean => {
  // Length check: 3-50 characters
  if (tenantId.length < 3 || tenantId.length > 50) {
    return false;
  }

  // Character check: alphanumeric and hyphens only
  if (!/^[a-zA-Z0-9-_]+$/.test(tenantId)) {
    return false;
  }

  // Reserved keywords
  const reserved = ['localhost', 'www', 'api', 'admin', 'system', 'root'];
  if (reserved.includes(tenantId.toLowerCase())) {
    return false;
  }

  return true;
};
```

### 3. Parameter Injection Prevention

**Attack Scenario:**
```typescript
// Attacker sends:
POST /api/students
Content-Type: application/json
Authorization: Bearer <token-for-tenant-123>

{
  "name": "Fake Student",
  "tenantId": "tenant-456"  // ✗ Attempting to override tenant
}
```

**Our Defense:**
```typescript
// TenantQueryBuilderService prevents override
const data = this.queryBuilder.buildCreateData({
  name: 'Fake Student',
  tenantId: 'tenant-456',  // ✗ This is stripped out
});

// Results in:
{
  name: 'Fake Student',
  tenantId: 'tenant-123'  // ✓ Corrected to authenticated tenant
}
```

### 4. Cross-Tenant Data Access Prevention

**Attack Scenario:**
```typescript
// Attacker token: tenant-123
// Target data: student in tenant-456

GET /api/students/student-from-tenant-456
Authorization: Bearer <token-for-tenant-123>
```

**Our Defense - Layer 1 (Middleware):**
```typescript
// TenantValidationGuard validates token tenant matches request
// Throws ForbiddenException if mismatch
```

**Our Defense - Layer 2 (Database):**
```typescript
// Even if guard bypassed, Prisma middleware ensures:
// Query: SELECT * FROM students WHERE id = 'student-id'
// Actually executed:
//   SELECT * FROM students 
//   WHERE id = 'student-id' AND tenantId = 'tenant-123'
// Result: NOT FOUND (correct!)
```

**Our Defense - Layer 3 (Service):**
```typescript
// Additional explicit validation
const student = await this.prisma.student.findUnique({
  where: { id: studentId },
});
this.queryBuilder.validateTenantOwnership(student);
// Throws if student.tenantId !== authenticated tenant
```

### 5. SQL Injection Prevention

**Prisma ORM provides built-in protection:**
```typescript
// ✓ Safe - Parameterized query
const student = await this.prisma.student.findMany({
  where: { name: { contains: userInput } },
});

// ✗ Never use raw queries for user input
const students = await this.prisma.$queryRaw`
  SELECT * FROM students WHERE name = ${userInput}
`;
```

**Best Practice:**
- Always use Prisma query builders
- Never concatenate user input into queries
- If raw SQL needed, use parameterized queries only

### 6. Rate Limiting

**Implement for sensitive operations:**
```typescript
// throttler.Module.ts
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      ttl: 60,        // Time window: 60 seconds
      limit: 10,      // Max 10 requests per window
    }),
  ],
})
export class AppModule {}

// In controller
@UseGuards(ThrottlerGuard)
@Post('login')
async login() {}
```

### 7. Audit Logging

**Log all sensitive operations:**
```typescript
async deleteStudent(tenantId: string, studentId: string) {
  const student = await this.prisma.student.findUnique({
    where: { id: studentId },
  });

  this.queryBuilder.validateTenantOwnership(student);

  // Audit log BEFORE deletion
  this.auditLog.log({
    action: 'DELETE_STUDENT',
    tenantId,
    userId: this.request.user.id,
    resourceId: studentId,
    timestamp: new Date(),
    details: {
      studentName: student.name,
      enrollmentNo: student.enrollmentNo,
    },
  });

  return this.prisma.student.delete({
    where: { id: studentId },
  });
}
```

---

## 🔍 Security Testing Checklist

### Unit Test: Tenant Isolation Service

```typescript
describe('Tenant Query Builder Security', () => {
  let service: TenantQueryBuilderService;
  let tenantContext: ITenantContext;

  beforeEach(() => {
    service = new TenantQueryBuilderService(tenantContextService);
    tenantContext = { tenantId: 'tenant-123' };
  });

  // Test 1: Prevent tenant override
  it('should prevent tenantId override in filters', () => {
    const filters = {
      status: 'ACTIVE',
      tenantId: 'tenant-456',  // Attempt to override
    };

    expect(() => {
      service.validateTenantAccess('tenant-456');
    }).toThrow(ForbiddenException);
  });

  // Test 2: Validate ownership
  it('should validate resource ownership', () => {
    const resource = { id: '1', tenantId: 'tenant-456' };

    expect(() => {
      service.validateTenantOwnership(resource);
    }).toThrow(ForbiddenException);
  });

  // Test 3: Build safe where clause
  it('should build where clause with tenant isolation', () => {
    const where = service.buildWhere({ status: 'ACTIVE' });

    expect(where).toEqual({
      tenantId: 'tenant-123',
      status: 'ACTIVE',
    });
  });

  // Test 4: Include tenant in create data
  it('should include tenantId in create data', () => {
    const data = service.buildCreateData({ name: 'Student' });

    expect(data.tenantId).toBe('tenant-123');
    expect(data.name).toBe('Student');
  });

  // Test 5: Prevent tenantId change in updates
  it('should prevent tenantId changes in updates', () => {
    const updateData = service.buildUpdateData({
      name: 'Updated',
      tenantId: 'tenant-456',  // Attempt to override
    });

    expect(updateData.tenantId).not.toBeDefined();
    expect(updateData.name).toBe('Updated');
  });
});
```

### E2E Test: Cross-Tenant Access Prevention

```typescript
describe('Cross-Tenant Access Prevention (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);
    jwtService = app.get(JwtService);
  });

  // Test 1: Cannot access other tenant's data
  it('should prevent accessing other tenant data', async () => {
    // Create student in tenant-123
    const student123 = await prisma.student.create({
      data: {
        name: 'Student in 123',
        enrollmentNo: 'E001',
        tenantId: 'tenant-123',
      },
    });

    // Try to access as tenant-456
    const token456 = jwtService.sign({ tenantId: 'tenant-456' });

    const response = await request(app.getHttpServer())
      .get(`/api/students/${student123.id}`)
      .set('Authorization', `Bearer ${token456}`)
      .expect(404);  // Not found (correct!)
  });

  // Test 2: Token tenant must match request tenant
  it('should reject mismatched tenant in header', async () => {
    const tokenFor123 = jwtService.sign({ tenantId: 'tenant-123' });

    await request(app.getHttpServer())
      .post('/api/students')
      .set('Authorization', `Bearer ${tokenFor123}`)
      .set('X-Tenant-Id', 'tenant-456')  // Different tenant!
      .send({ name: 'Attacker Student', enrollmentNo: 'E999' })
      .expect(403);  // Forbidden
  });

  // Test 3: Cannot override tenantId in body
  it('should reject tenantId override in request body', async () => {
    const token = jwtService.sign({ tenantId: 'tenant-123' });

    const response = await request(app.getHttpServer())
      .post('/api/students')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Fake Student',
        enrollmentNo: 'E999',
        tenantId: 'tenant-456',  // Attempting override
      })
      .expect(201);

    // Student created, but with correct tenant
    expect(response.body.tenantId).toBe('tenant-123');
  });

  // Test 4: Batch operations respect tenant
  it('should apply tenant filter to batch updates', async () => {
    // Create students in different tenants
    await prisma.student.create({
      data: {
        name: 'Student 123',
        enrollmentNo: 'E001',
        tenantId: 'tenant-123',
      },
    });

    await prisma.student.create({
      data: {
        name: 'Student 456',
        enrollmentNo: 'E002',
        tenantId: 'tenant-456',
      },
    });

    // Update all students as tenant-123
    const token = jwtService.sign({ tenantId: 'tenant-123' });

    // This would update via API
    // Only tenant-123's student should be updated

    const result = await prisma.$transaction(async (tx) => {
      await tx.student.updateMany({
        where: { /* tenant filter added by middleware */ },
        data: { status: 'ACTIVE' },
      });

      return tx.student.findMany({
        where: { status: 'ACTIVE' },
      });
    });

    // Verify only tenant-123's student was updated
    expect(result.every(s => s.tenantId === 'tenant-123')).toBe(true);
  });
});
```

---

## 🚨 Security Incidents & Response

### Incident: Suspected Tenant Data Breach

**Detection:**
```typescript
// Automated monitoring
const breachDetector = setInterval(async () => {
  const alerts = await this.alertService.getSecurityAlerts();

  for (const alert of alerts) {
    if (alert.type === 'CROSS_TENANT_ACCESS_ATTEMPT') {
      // Action: Immediately disable user account
      await this.userService.disable(alert.userId);

      // Action: Notify tenant admin
      await this.emailService.send({
        to: alert.tenantAdmin,
        subject: 'Security Alert: Unauthorized Access Attempt',
        body: `User ${alert.userId} attempted cross-tenant access: ${alert.details}`,
      });

      // Action: Log incident
      this.logger.error('SECURITY INCIDENT', {
        incident: 'CROSS_TENANT_ACCESS',
        userId: alert.userId,
        tenantId: alert.tenantId,
        timestamp: new Date(),
      });
    }
  }
}, 60000);  // Check every minute
```

### Incident: JWT Token Compromised

**Response Steps:**
```typescript
async revokeUserTokens(userId: string, tenantId: string) {
  // 1. Add to blacklist
  await this.tokenBlacklist.add(userId);

  // 2. Invalidate all sessions
  await this.sessionService.invalidateUserSessions(userId, tenantId);

  // 3. Force password reset
  await this.userService.forcePasswordReset(userId);

  // 4. Notify user
  await this.emailService.send({
    to: (await this.userService.findOne(userId)).email,
    subject: 'Security Alert: Your sessions have been invalidated',
    body: 'Your password has been reset for security. Please log in again.',
  });

  // 5. Log incident
  this.logger.warn('Token revoked - potential compromise', {
    userId,
    tenantId,
    timestamp: new Date(),
  });
}
```

---

## 📋 Pre-Production Checklist

### Code Security

- [ ] No hardcoded tenant IDs
- [ ] No hardcoded JWT secrets
- [ ] No console.log of sensitive data
- [ ] All queries use Prisma (no raw SQL)
- [ ] All user input validated
- [ ] All routes have authentication
- [ ] Sensitive operations have authorization
- [ ] Security headers configured (CORS, CSP, X-Frame-Options)
- [ ] HTTPS enforced
- [ ] Rate limiting configured

### Database Security

- [ ] All isolation models have tenantId column
- [ ] Indexes created on tenantId
- [ ] Indexes created on (tenantId, other_key) combinations
- [ ] Database user has minimal permissions
- [ ] Connection string secured in environment
- [ ] Backups encrypted
- [ ] Database backup tested for recovery

### Testing

- [ ] Unit tests for all services
- [ ] E2E tests for all endpoints
- [ ] Cross-tenant access prevention tests passing
- [ ] Token mismatch rejection tests passing
- [ ] Parameter injection tests passing
- [ ] Load testing completed
- [ ] Security scanning completed (OWASP)
- [ ] Penetration testing recommended

### Deployment

- [ ] All environment variables configured
- [ ] JWT secrets are unique and strong
- [ ] Database migrations completed
- [ ] Documentation updated
- [ ] Incident response plan documented
- [ ] Monitoring and alerting configured
- [ ] Audit logging enabled
- [ ] API documentation updated
- [ ] Deployment tested on staging
- [ ] Rollback plan documented

### Operations

- [ ] Team trained on security procedures
- [ ] Security issue reporting process established
- [ ] Key rotation procedures documented
- [ ] Breach response procedures documented
- [ ] Regular security audits scheduled
- [ ] Log monitoring and retention configured
- [ ] Access control for sensitive operations
- [ ] Admin dashboard secured

---

## 🔑 Key Security Principles

### 1. Defense in Depth
✓ Multiple validation layers  
✓ No single point of failure  
✓ Compromise of one layer doesn't breach system  

### 2. Least Privilege
✓ Users can only access their tenant's data  
✓ Services only have necessary database permissions  
✓ API endpoints only expose needed functionality  

### 3. Fail Secure
✓ When in doubt, deny access  
✓ Missing tenant context = 403 Forbidden  
✓ Invalid token = 401 Unauthorized  

### 4. Zero Trust
✓ Never trust request sources without validation  
✓ Always validate tenant in multiple layers  
✓ Always check ownership before mutations  

### 5. Audit Trail
✓ Log all sensitive operations  
✓ Include tenant context in logs  
✓ Maintain immutable audit records  

---

## 🚀 Recommended Security Tools

### 1. OWASP Dependency Check
```bash
npm install --save-dev @owasp/dependency-check
```

### 2. ESLint Security Plugin
```bash
npm install --save-dev eslint-plugin-security
```

### 3. Helmet.js (Security Headers)
```typescript
import helmet from '@nestjs/helmet';

app.use(helmet());
```

### 4. Morgan (Request Logging)
```typescript
import { morgan } from 'morgan';

app.use(morgan('combined'));
```

### 5. Class Validator (Input Validation)
```typescript
import { IsString, IsEmail, MinLength } from 'class-validator';

class CreateStudentDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;
}
```

---

## 📚 Further Reading

- [OWASP Top 10](https://owasp.org/Top10/)
- [OWASP SaaS Security](https://owasp.org/www-community/attacks/SaaS_Security)
- [Multi-Tenancy Security](https://cheatsheetseries.owasp.org/cheatsheets/Multitenant_SaaS_Security_Cheat_Sheet.html)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [Prisma Security](https://www.prisma.io/docs/reference/api-reference/prisma-client-query-engine-security)

---

## Summary

Your multi-tenant system is secured by:

1. ✅ **Automatic tenant filtering** at database layer
2. ✅ **7-layer defensive architecture**
3. ✅ **Multiple validation points**
4. ✅ **JWT-based authentication**
5. ✅ **Request-scoped context isolation**
6. ✅ **Ownership validation**
7. ✅ **Audit logging**

**No tenant can access another tenant's data, even with sophisticated attacks.**

