# Architecture Documentation

## System Overview

School ERP is a multi-tenant SaaS application built with a modular, scalable architecture designed to handle schools of varying sizes (200-3000 students).

## Architecture Patterns

### 1. Multi-Tenant Pattern

**Isolation Strategy**: Database-level multi-tenancy with tenant_id field in all relevant tables.

**Advantages**:
- Simple implementation
- Cost-effective database management
- Easy debugging

**Trade-offs**:
- Requires careful query filtering
- Tenant isolation must be enforced in middleware

**Implementation**:
```typescript
// TenantMiddleware ensures tenantId is extracted from request
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const tenantId = extractFromSubdomain(host) || req.query.tenantId;
    (req as any).tenantId = tenantId;
    next();
  }
}
```

### 2. Module-Based Architecture

Each feature is encapsulated in a module with:
- **Controllers**: HTTP endpoints
- **Services**: Business logic
- **DTOs**: Input/output validation
- **Entities**: Database models (via Prisma)

```
Module
├── controllers/
├── services/
├── dtos/
└── module.ts
```

### 3. Role-Based Access Control (RBAC)

**Roles Hierarchy**:
```
SUPER_ADMIN (Platform Level)
├── SCHOOL_ADMIN (School Level)
│   ├── ADMISSION_COUNSELLOR
│   ├── ACCOUNTS_TEAM
│   ├── TEACHER
│   └── PARENT
└── STUDENT
```

**Guard Implementation**:
```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SCHOOL_ADMIN', 'ACCOUNTS_TEAM')
@Post('fees/payment')
async recordPayment() { }
```

## Request Flow

```
┌─────────────────────────────────────────────────────┐
│ 1. HTTP Request                                     │
└────────────────────────┬────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────┐
│ 2. TenantMiddleware                                 │
│    (Extract tenantId from subdomain/header)        │
└────────────────────────┬────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────┐
│ 3. JwtAuthGuard                                     │
│    (Validate JWT token)                             │
└────────────────────────┬────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────┐
│ 4. RolesGuard                                       │
│    (Check user role permissions)                    │
└────────────────────────┬────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────┐
│ 5. Route Handler (Controller Method)                │
│    (Execute business logic)                         │
└────────────────────────┬────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────┐
│ 6. Service Layer                                    │
│    (Database operations with tenant filtering)      │
└────────────────────────┬────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────┐
│ 7. Prisma ORM                                       │
│    (Query execution with tenant_id WHERE clause)    │
└────────────────────────┬────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────┐
│ 8. PostgreSQL Database                              │
│    (Persistent storage)                             │
└────────────────────────┬────────────────────────────┘
                         │
└────────────────────────┴────────────────────────────┘
```

## Deployment Architecture

```
┌─────────────────────────────────────────────────────┐
│                  AWS Route 53                       │
│              (DNS + Domain Routing)                 │
└────────────────────────┬────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────┐
│            CloudFront (CDN)                         │
│        (Static Assets + Caching)                    │
└────────────────────┬──────────────────────────────┐ │
                     │                              │ │
        ┌────────────▼──────┐           ┌──────────▼─┤
        │ S3 (Static Files) │           │ ALB        │
        │ (images, styles)  │           │ (Load      │
        └───────────────────┘           │  Balancer) │
                                        └──────┬─────┘
                                               │
              ┌────────────────────────────────┼────────────┐
              │                                │            │
        ┌─────▼──────┐              ┌─────────▼─────┐  ┌──▼────────┐
        │ ECS Tasks  │              │ ECS Tasks    │  │ ECS Tasks │
        │(Backend API)│             │(Backend API) │  │(Backend) │
        └─────┬──────┘              └──────┬───────┘  └──┬───────┘
              │                             │            │
        ┌─────▼──────────────────────────────▼───────────▼─────┐
        │         RDS PostgreSQL (Multi-AZ)                    │
        │    (Replicated Database with Backup)                │
        └──────────────────────────────────────────────────────┘
```

## Data Flow Examples

### Login Flow
```
1. POST /auth/login
2. AuthService.login() validates credentials
3. JWT token generated with user claims
4. Token includes: userId, email, tenantId, role
5. User stored with lastLogin timestamp
6. Token returned to client
```

### Create Student Flow
```
1. POST /students (with JWT token)
2. TenantMiddleware extracts tenantId
3. JwtAuthGuard validates token
4. RolesGuard checks SCHOOL_ADMIN/ADMISSION_COUNSELLOR role
5. StudentService.create() called with tenantId
6. Prisma creates record with tenantId filter
7. Student object returned with all relationships
```

### Fee Payment Flow
```
1. PATCH /fees/record/:id/payment
2. FeesService retrieves fee record with tenantId filter
3. Validates payment amount
4. Updates paidAmount and status
5. Creates auditable transaction record
6. Sends notification via CommunicationService
7. Returns updated fee record
```

## Error Handling

**Global Exception Filter**:
```typescript
@Catch(Exception)
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: Exception, host: ArgumentsHost) {
    // Log error
    // Strip sensitive information
    // Return standardized error response
  }
}
```

**Standard Error Response**:
```json
{
  "statusCode": 400,
  "message": "Invalid request",
  "error": "Bad Request",
  "timestamp": "2024-03-19T10:30:00Z"
}
```

## Performance Considerations

### Database Indexing
```sql
-- Tenant isolation queries
CREATE INDEX idx_user_tenant_id ON users(tenant_id);
CREATE INDEX idx_student_tenant_school ON students(tenant_id, school_id);

-- Status filtering
CREATE INDEX idx_admission_status ON admissions(status);
CREATE INDEX idx_fee_status ON fee_records(status);

-- Temporal queries
CREATE INDEX idx_communication_created ON communications(created_at);
```

### Pagination Strategy
```typescript
// All list endpoints use pagination to prevent large data transfers
skip: pagination.page * pagination.limit
take: pagination.limit (default: 100, max: 1000)
```

### Caching Recommendations
```typescript
// Redis cache for:
// - JWT token blacklist (logout)
// - Fee structures (rarely change)
// - Class masters (rarely change)
// - User role permissions
```

## Security Architecture

### Authentication Flow
```
Browser
    │
    ├─ POST /auth/login
    │  (username, password)
    │
    └─ Server validates & returns JWT
         JWT contains: {userId, email, tenantId, role}

Browser stores JWT in:
    - localStorage (for SPA)
    - HttpOnly cookie (recommended for production)

Subsequent requests:
    - Authorization: Bearer <JWT>
    - Server validates signature
    - Extracts claims
    - Enforces tenant isolation
```

### Data Security
- All passwords hashed with bcrypt (salt rounds: 10)
- Sensitive data (SSN, bank details) should be encrypted at rest
- All API calls require authentication
- Request validation on all endpoints
- SQL injection prevention via Prisma ORM
- CORS configured for specific origins

## Monitoring & Logging

**Recommended Tools**:
- CloudWatch for AWS logs
- New Relic / DataDog for APM
- Sentry for error tracking
- ELK Stack for centralized logging

**Key Metrics**:
- API response times
- Database query performance
- Error rates by endpoint
- Tenant-specific usage metrics
- User login patterns

## Scaling Strategy

### Horizontal Scaling
```
Load Balancer
    ├─ Backend Instance 1
    ├─ Backend Instance 2
    ├─ Backend Instance 3
    └─ Backend Instance N
         All share same database
```

### Database Scaling
- Read replicas for analytics queries
- Connection pooling (PgBouncer)
- Archive old records to separate database
- Sharding by tenant_id if needed

### Caching Layer
- Redis for session data
- CloudFront for static assets
- Database query result caching

---

**Document Version**: 1.0
**Last Updated**: March 2026
