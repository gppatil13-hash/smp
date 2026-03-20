# Multi-Tenant Quick Reference Guide

**One-page reference** for daily development with multi-tenant isolation.

---

## 🚀 Quick Start Checklist

Every new NestJS module needs:

### Step 1: Import Module
```typescript
import { TenantIsolationModule } from '../../../common/modules/tenant-isolation.module';

@Module({
  imports: [TenantIsolationModule],  // ← Add this
  controllers: [YourController],
  providers: [YourService],
})
export class YourModule {}
```

### Step 2: Add Guards to Routes
```typescript
@UseGuards(JwtAuthGuard, TenantValidationGuard)  // ← Add for CREATE/UPDATE/DELETE
@Post()
async create(@GetTenantId() tenantId: string, @Body() dto: CreateDto) { }

@UseGuards(JwtAuthGuard)  // ← Only JWT for READ operations
@Get()
async list(@GetTenantId() tenantId: string) { }
```

### Step 3: Inject Services
```typescript
constructor(
  private prisma: PrismaService,
  private queryBuilder: TenantQueryBuilderService,  // ← Add this
) {}
```

### Step 4: Use in Service
```typescript
async create(tenantId: string, dto: CreateDto) {
  const data = this.queryBuilder.buildCreateData(dto);
  return this.prisma.model.create({ data });
}

async list(tenantId: string) {
  const where = this.queryBuilder.buildWhere(filters);
  return this.prisma.model.findMany({ where });
}
```

---

## 📝 Common Patterns

### Create with Validation
```typescript
async create(tenantId: string, dto: CreateDto) {
  // 1. Build data with tenant
  const data = this.queryBuilder.buildCreateData(dto);
  
  // 2. Create
  return this.prisma.model.create({ data });
  // ✓ tenantId automatically added by Prisma middleware
}
```

### List with Filtering
```typescript
async findMany(tenantId: string, filters?: any) {
  // 1. Build WHERE with tenant isolation
  const where = this.queryBuilder.buildWhere(filters);
  
  // 2. Query
  return this.prisma.model.findMany({
    where,
    take: 10,
    skip: 0,
  });
  // ✓ Only tenant's data returned
}
```

### Get with Ownership Check
```typescript
async findOne(tenantId: string, id: string) {
  // 1. Get record
  const record = await this.prisma.model.findUnique({
    where: { id },
  });
  // ✓ Prisma middleware already filtered by tenant
  
  // 2. Verify found
  if (!record) throw new NotFoundException();
  
  // 3. Validate ownership
  this.queryBuilder.validateTenantOwnership(record);
  
  return record;
}
```

### Update with Ownership Check
```typescript
async update(tenantId: string, id: string, dto: UpdateDto) {
  // 1. Get record
  const record = await this.prisma.model.findUnique({
    where: { id },
  });
  
  if (!record) throw new NotFoundException();
  
  // 2. Validate ownership
  this.queryBuilder.validateTenantOwnership(record);
  
  // 3. Build update data (prevents tenantId change)
  const updateData = this.queryBuilder.buildUpdateData(dto);
  
  // 4. Update
  return this.prisma.model.update({
    where: { id },
    data: updateData,
  });
}
```

### Delete with Ownership Check
```typescript
async delete(tenantId: string, id: string) {
  // 1. Get record
  const record = await this.prisma.model.findUnique({
    where: { id },
  });
  
  if (!record) throw new NotFoundException();
  
  // 2. Validate ownership
  this.queryBuilder.validateTenantOwnership(record);
  
  // 3. Delete
  return this.prisma.model.delete({
    where: { id },
  });
}
```

### Cross-Resource Validation
```typescript
async createAdmission(tenantId: string, dto: CreateAdmissionDto) {
  // 1. Verify related resource exists AND belongs to tenant
  const class = await this.prisma.classMaster.findUnique({
    where: { id: dto.classId },
  });
  
  if (!class) throw new NotFoundException('Class not found');
  
  // 2. Validate ownership
  this.queryBuilder.validateTenantOwnership(class);
  
  // 3. Create with validation
  const data = this.queryBuilder.buildCreateData(dto);
  return this.prisma.admission.create({ data });
}
```

---

## ✅ Code Review Checklist

Before pushing code, verify:

- [ ] **Module imported**: `import { TenantIsolationModule }`
- [ ] **Guards applied**: `@UseGuards(JwtAuthGuard, TenantValidationGuard)`
- [ ] **Tenant injected**: `@GetTenantId() tenantId: string`
- [ ] **Query builder used**: `this.queryBuilder.buildWhere()`
- [ ] **Create safe**: `this.queryBuilder.buildCreateData()`
- [ ] **Update safe**: `this.queryBuilder.buildUpdateData()`
- [ ] **Ownership checked**: `this.queryBuilder.validateTenantOwnership()`
- [ ] **No manual tenantId**: Never add tenantId manually to queries
- [ ] **No hardcoded strings**: Never hardcode tenant IDs
- [ ] **Error handling**: All errors caught and handled

---

## 🔐 Security Rules

### ✓ DO

```typescript
// ✓ Get tenantId from decorator
async create(@GetTenantId() tenantId: string) { }

// ✓ Use query builder
const where = this.queryBuilder.buildWhere({ status: 'ACTIVE' });

// ✓ Build safe data
const data = this.queryBuilder.buildCreateData(dto);

// ✓ Validate ownership
this.queryBuilder.validateTenantOwnership(resource);

// ✓ Use guards
@UseGuards(JwtAuthGuard, TenantValidationGuard)

// ✓ Pass tenantId to service
this.service.create(tenantId, dto);
```

### ✗ DON'T

```typescript
// ✗ Trust user input for tenant
const tenantId = req.query.tenantId;

// ✗ Manual WHERE with tenantId
const students = await prisma.student.findMany({
  where: { tenantId: tenantId, status: 'ACTIVE' }
});

// ✗ Allow tenantId in DTO
class CreateStudentDto {
  name: string;
  tenantId: string;  // ✗ Remove this!
}

// ✗ Skip ownership validation
const record = await this.prisma.model.findUnique(...);
await this.prisma.model.delete({ where: { id } }); // ✗ Missing validation

// ✗ Routes without guards
@Post('admin-endpoint')
async dangerousOp() { }  // ✗ Add guards!

// ✗ Hardcode tenant IDs
if (tenantId === 'admin-tenant') { }  // ✗ Never hardcode!
```

---

## 🚨 Common Mistakes

| Mistake | Impact | Fix |
|---------|--------|-----|
| Missing `@UseGuards()` | Anyone can access | Add guards to route |
| Missing `@GetTenantId()` | Tenant context lost | Add decorator to param |
| Not using `buildWhere()` | Duplicate filtering | Use query builder |
| Not validating ownership | Unauthorized access | Add validate call |
| Using manual tenantId | Override vulnerability | Use buildCreateData() |
| Missing TenantIsolationModule | Services unavailable | Import in module |
| Hardcoded tenant IDs | Inflexible code | Always pass as parameter |

---

## 📊 Response Codes

| Code | Meaning | Check |
|------|---------|-------|
| 201 | Created | Resource created with correct tenantId |
| 200 | OK | Resource retrieved, tenant verified |
| 204 | No Content | Deletion successful |
| 400 | Bad Request | Invalid input (validation) |
| 401 | Unauthorized | Missing/invalid JWT token |
| 403 | Forbidden | Tenant mismatch or access denied |
| 404 | Not Found | Resource not found (or filtered by tenant) |
| 500 | Server Error | Unexpected error (check logs) |

---

## 🔍 Debugging

### Check Tenant Context
```typescript
// Use in service
const tenantId = this.tenantContextService.getTenantId();
const context = this.tenantContextService.getTenantContext();

console.log('Current tenant:', tenantId);
console.log('Full context:', context);
```

### Verify Database
```typescript
// Direct Prisma query (for debugging only)
const student = await this.prisma.student.findUnique({
  where: { id: 'student-id' }
});

// Should only find if student belongs to current tenant
// If returns null, check:
// 1. Is student ID correct?
// 2. Does student belong to authenticated tenant?
// 3. Is tenantId in student record?
```

### Manual Tenant Context (Testing)
```typescript
// Set context for specific tenant (testing only)
await this.prisma.withTenantContext(
  { tenantId: 'test-tenant' },
  async () => {
    const students = await this.prisma.student.findMany();
    // Only test-tenant's students returned
  }
);
```

---

## 📚 File Locations

```
src/
├── common/
│   ├── services/
│   │   ├── tenant-context.service.ts          ← Context management
│   │   └── tenant-query-builder.service.ts    ← Query building
│   ├── middleware/
│   │   ├── tenant.middleware.ts               ← Tenant extraction
│   │   └── tenant-context.middleware.ts       ← Context setup
│   ├── guards/
│   │   └── tenant-validation.guard.ts         ← Guard validation
│   ├── strategies/
│   │   └── jwt.strategy.ts                    ← JWT strategy
│   └── interceptors/
│       └── tenant-isolation.interceptor.ts    ← Request validation
├── modules/
│   └── tenant/
│       └── tenant-isolation.module.ts         ← Module exports
└── config/
    └── prisma.service.ts                      ← Prisma middleware
```

---

## 🎯 Decision Tree

### Is this a CREATE operation?
```
Yes → Use @UseGuards(JwtAuthGuard, TenantValidationGuard)
    → Use buildCreateData()
    → Create record
No  → Is this an UPDATE?
    → Use @UseGuards(JwtAuthGuard, TenantValidationGuard)
    → Validate ownership
    → Use buildUpdateData()
    → Update record
    → Is this a DELETE?
      → Use @UseGuards(JwtAuthGuard, TenantValidationGuard)
      → Validate ownership
      → Delete record
      → Is this a READ?
        → Use @UseGuards(JwtAuthGuard)
        → Use buildWhere()
        → Query and return
```

### Do I need to check ownership?
```
Yes if: Modifying or deleting specific record
        Reading sensitive data
        Cross-resource check (e.g., student in class)

No if: Only reading list
       Current user's own data (already filtered)
```

---

## 🔄 Request/Response Cycle

```
1. Client sends request with JWT token
   ↓
2. TenantMiddleware extracts tenant from token
   ↓
3. TenantContextMiddleware sets context in Prisma
   ↓
4. JwtAuthGuard validates token
   ↓
5. TenantValidationGuard validates tenant match
   ↓
6. TenantIsolationInterceptor validates request
   ↓
7. Controller handler called with @GetTenantId() injected
   ↓
8. Service uses TenantQueryBuilderService for queries
   ↓
9. Prisma middleware adds tenantId to WHERE clause
   ↓
10. Database query executed with tenant filter
    ↓
11. Results returned (only tenant's data)
    ↓
12. Response sent to client
```

---

## 💡 Tips & Tricks

### Reuse Query Builders
```typescript
// DON'T: Rebuild where clause multiple times
const where1 = this.queryBuilder.buildWhere({ status: 'ACTIVE' });
const where2 = this.queryBuilder.buildWhere({ status: 'ACTIVE' });

// DO: Build once, reuse
const where = this.queryBuilder.buildWhere({ status: 'ACTIVE' });
const active = await this.prisma.model.findMany({ where });
const count = await this.prisma.model.count({ where });
```

### Batch Operations
```typescript
// Safe batch update (filters by tenant automatically)
await this.prisma.student.updateMany({
  where: { className: 'Grade 5' },  // Tenant added by middleware
  data: { status: 'PROMOTED' },
});
```

### Transactions Stay Isolated
```typescript
// Each operation in transaction respects tenant context
await this.prisma.$transaction([
  this.prisma.student.create({ data: studentData }),
  this.prisma.admission.create({ data: admissionData }),
]);
// Both scoped to same tenant
```

### Include Relations Safely
```typescript
// Can safely include relations (all filtered by tenant)
const student = await this.prisma.student.findUnique({
  where: { id: studentId },
  include: {
    school: true,           // ✓ Automatically filtered
    class: true,            // ✓ Automatically filtered
    admissions: true,       // ✓ Automatically filtered
  },
});
```

---

## 📞 When In Doubt

1. **Does this route modify data?**
   → Add `@UseGuards(JwtAuthGuard, TenantValidationGuard)`

2. **Am I querying specific record?**
   → Add ownership validation: `validateTenantOwnership(record)`

3. **Do I need to build a WHERE clause?**
   → Use `buildWhere()`, never manually add tenantId

4. **Creating/updating a record?**
   → Use `buildCreateData()` or `buildUpdateData()`

5. **Need to verify resource belongs to tenant?**
   → Use `validateTenantOwnership()` or `validateSchoolOwnership()`

---

## ✨ Your Code is Tenant-Safe When:

✅ All routes have `@UseGuards(JwtAuthGuard)` minimum  
✅ All mutations have TenantValidationGuard  
✅ All services receive tenantId parameter  
✅ All queries use buildWhere()  
✅ All creates use buildCreateData()  
✅ All updates use buildUpdateData()  
✅ All specific records validated for ownership  
✅ No hardcoded tenant IDs  
✅ No manual WHERE clauses with tenantId  
✅ TenantIsolationModule imported in all modules  

---

## Quick Reference Table

| Need | Use | Location |
|------|-----|----------|
| Get tenant ID | `@GetTenantId()` | Controller param |
| Build WHERE | `buildWhere()` | TenantQueryBuilderService |
| Create data | `buildCreateData()` | TenantQueryBuilderService |
| Update data | `buildUpdateData()` | TenantQueryBuilderService |
| Check ownership | `validateTenantOwnership()` | TenantQueryBuilderService |
| Protect route | `@UseGuards()` | Controller method |
| Set context | Auto via middleware | TenantContextMiddleware |
| Access context | `getTenantContext()` | TenantContextService |
| Manual context | `withTenantContext()` | PrismaService (testing) |

---

## 🎓 Learning Flow

1. **Day 1**: Read this quick reference
2. **Day 2**: Implement in first module
3. **Day 3**: Review examples in INTEGRATION_GUIDE.md
4. **Day 4**: Check security in SECURITY_BEST_PRACTICES.md
5. **Day 5**: Write E2E tests for cross-tenant prevention
6. **Week 2**: Roll out to all modules
7. **Week 3**: Production deployment

---

## 🎉 That's It!

Your multi-tenant system is secure by design. Every query is automatically filtered, and no cross-tenant access is possible.

Happy secure coding! 🚀

