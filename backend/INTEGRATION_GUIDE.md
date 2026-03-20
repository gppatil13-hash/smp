# Multi-Tenant Isolation Integration Guide

**Quick reference** for integrating tenant isolation into your NestJS modules.

---

## Table of Contents

1. [Module Setup](#module-setup)
2. [Controller Integration](#controller-integration)
3. [Service Integration](#service-integration)
4. [Guard & Interceptor Usage](#guard--interceptor-usage)
5. [Common Patterns](#common-patterns)
6. [Security Checklists](#security-checklists)

---

## Module Setup

### 1. Import TenantIsolationModule

```typescript
// student.module.ts
import { Module } from '@nestjs/common';
import { StudentController } from './student.controller';
import { StudentService } from './student.service';
import { TenantIsolationModule } from '../../../common/modules/tenant-isolation.module';

@Module({
  imports: [TenantIsolationModule], // Add this
  controllers: [StudentController],
  providers: [StudentService],
  exports: [StudentService],
})
export class StudentModule {}
```

### 2. Example: Admission Module

```typescript
// admission.module.ts
import { Module } from '@nestjs/common';
import { AdmissionController } from './admission.controller';
import { AdmissionService } from './admission.service';
import { TenantIsolationModule } from '../../../common/modules/tenant-isolation.module';

@Module({
  imports: [TenantIsolationModule],
  controllers: [AdmissionController],
  providers: [AdmissionService],
})
export class AdmissionModule {}
```

---

## Controller Integration

### Basic Pattern

```typescript
// controllers/student.controller.ts
import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { TenantValidationGuard } from '../../../common/guards/tenant-validation.guard';
import { GetTenantId } from '../../../common/decorators/get-tenant-id.decorator';
import { StudentService } from './student.service';
import { CreateStudentDto } from './dto/create-student.dto';

@Controller('students')
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  // Pattern 1: Create Resource
  @Post()
  @UseGuards(JwtAuthGuard, TenantValidationGuard)
  async create(
    @GetTenantId() tenantId: string,
    @Body() createStudentDto: CreateStudentDto,
  ) {
    return this.studentService.create(tenantId, createStudentDto);
  }

  // Pattern 2: List Resources
  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(@GetTenantId() tenantId: string) {
    return this.studentService.findAll(tenantId);
  }

  // Pattern 3: Get Single Resource
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(
    @GetTenantId() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.studentService.findOne(tenantId, id);
  }

  // Pattern 4: Update Resource
  @Patch(':id')
  @UseGuards(JwtAuthGuard, TenantValidationGuard)
  async update(
    @GetTenantId() tenantId: string,
    @Param('id') id: string,
    @Body() updateDto: UpdateStudentDto,
  ) {
    return this.studentService.update(tenantId, id, updateDto);
  }

  // Pattern 5: Delete Resource
  @Delete(':id')
  @UseGuards(JwtAuthGuard, TenantValidationGuard)
  async remove(
    @GetTenantId() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.studentService.remove(tenantId, id);
  }
}
```

### Admission Controller Example

```typescript
// admission.controller.ts
import { Controller, Get, Post, Body, Param, UseGuards, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { TenantValidationGuard } from '../../../common/guards/tenant-validation.guard';
import { GetTenantId } from '../../../common/decorators/get-tenant-id.decorator';
import { AdmissionService } from './admission.service';
import { CreateAdmissionDto } from './dto/create-admission.dto';

@Controller('admissions')
export class AdmissionController {
  constructor(private readonly admissionService: AdmissionService) {}

  @Post()
  @UseGuards(JwtAuthGuard, TenantValidationGuard)
  async createAdmission(
    @GetTenantId() tenantId: string,
    @Body() dto: CreateAdmissionDto,
  ) {
    return this.admissionService.createAdmission(tenantId, dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async getAdmissions(
    @GetTenantId() tenantId: string,
    @Query('status') status?: string,
    @Query('classId') classId?: string,
  ) {
    return this.admissionService.getAdmissions(tenantId, { status, classId });
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getAdmissionDetail(
    @GetTenantId() tenantId: string,
    @Param('id') admissionId: string,
  ) {
    return this.admissionService.getAdmissionDetail(tenantId, admissionId);
  }

  @Post(':id/approve')
  @UseGuards(JwtAuthGuard, TenantValidationGuard)
  async approveAdmission(
    @GetTenantId() tenantId: string,
    @Param('id') admissionId: string,
  ) {
    return this.admissionService.approveAdmission(tenantId, admissionId);
  }
}
```

---

## Service Integration

### Basic Service Pattern

```typescript
// student.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../config/prisma.service';
import { TenantQueryBuilderService } from '../../../common/services/tenant-query-builder.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';

@Injectable()
export class StudentService {
  constructor(
    private prisma: PrismaService,
    private queryBuilder: TenantQueryBuilderService,
  ) {}

  // Create with tenant isolation
  async create(tenantId: string, dto: CreateStudentDto) {
    const data = this.queryBuilder.buildCreateData({
      ...dto,
      enrollmentNo: this.generateEnrollmentNo(),
    });

    return this.prisma.student.create({ data });
    // ✓ Prisma middleware adds tenantId automatically
  }

  // List with filtering
  async findAll(tenantId: string) {
    const where = this.queryBuilder.buildWhere({
      // Additional filters if needed
    });

    return this.prisma.student.findMany({
      where,
      include: { school: true },
      orderBy: { createdAt: 'desc' },
    });
    // ✓ Prisma middleware adds tenantId to WHERE
  }

  // Get single with ownership validation
  async findOne(tenantId: string, id: string) {
    const student = await this.prisma.student.findUnique({
      where: { id },
      include: { school: true },
    });
    // ✓ Prisma middleware adds: WHERE tenantId = current_tenant

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    // Validate ownership
    this.queryBuilder.validateTenantOwnership(student);

    return student;
  }

  // Update with validation
  async update(tenantId: string, id: string, dto: UpdateStudentDto) {
    // 1. Verify ownership
    const student = await this.prisma.student.findUnique({
      where: { id },
    });

    if (!student) {
      throw new NotFoundException();
    }

    this.queryBuilder.validateTenantOwnership(student);

    // 2. Build safe update data
    const updateData = this.queryBuilder.buildUpdateData(dto);

    // 3. Update
    return this.prisma.student.update({
      where: { id },
      data: updateData,
    });
  }

  // Delete with validation
  async remove(tenantId: string, id: string) {
    // Verify ownership
    const student = await this.prisma.student.findUnique({
      where: { id },
    });

    if (!student) {
      throw new NotFoundException();
    }

    this.queryBuilder.validateTenantOwnership(student);

    // Delete
    return this.prisma.student.delete({
      where: { id },
    });
  }

  private generateEnrollmentNo(): string {
    return `E${Date.now()}`;
  }
}
```

### Admission Service Example

```typescript
// admission.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../config/prisma.service';
import { TenantQueryBuilderService } from '../../../common/services/tenant-query-builder.service';
import { CreateAdmissionDto } from './dto/create-admission.dto';

@Injectable()
export class AdmissionService {
  constructor(
    private prisma: PrismaService,
    private queryBuilder: TenantQueryBuilderService,
  ) {}

  async createAdmission(tenantId: string, dto: CreateAdmissionDto) {
    // 1. Verify class exists and belongs to tenant
    const classRecord = await this.prisma.classMaster.findUnique({
      where: { id: dto.classId },
    });

    if (!classRecord) {
      throw new NotFoundException('Class not found');
    }

    this.queryBuilder.validateTenantOwnership(classRecord);

    // 2. Create admission
    const data = this.queryBuilder.buildCreateData({
      ...dto,
      status: 'PENDING',
      appliedDate: new Date(),
    });

    return this.prisma.admission.create({
      data,
      include: { class: true },
    });
  }

  async getAdmissions(
    tenantId: string,
    filters?: { status?: string; classId?: string },
  ) {
    const where = this.queryBuilder.buildWhere({
      ...(filters?.status && { status: filters.status }),
      ...(filters?.classId && { classId: filters.classId }),
    });

    return this.prisma.admission.findMany({
      where,
      include: { class: true },
      orderBy: { appliedDate: 'desc' },
    });
  }

  async getAdmissionDetail(tenantId: string, admissionId: string) {
    const admission = await this.prisma.admission.findUnique({
      where: { id: admissionId },
      include: {
        class: true,
        appliedStudent: true,
      },
    });

    if (!admission) {
      throw new NotFoundException('Admission not found');
    }

    this.queryBuilder.validateTenantOwnership(admission);

    return admission;
  }

  async approveAdmission(tenantId: string, admissionId: string) {
    // 1. Get admission
    const admission = await this.prisma.admission.findUnique({
      where: { id: admissionId },
    });

    if (!admission) {
      throw new NotFoundException();
    }

    // 2. Validate ownership
    this.queryBuilder.validateTenantOwnership(admission);

    // 3. Validate status
    if (admission.status !== 'PENDING') {
      throw new BadRequestException('Only pending admissions can be approved');
    }

    // 4. Update status
    const updateData = this.queryBuilder.buildUpdateData({
      status: 'APPROVED',
      approvedDate: new Date(),
    });

    return this.prisma.admission.update({
      where: { id: admissionId },
      data: updateData,
    });
  }
}
```

### Complex Query with Multiple Models

```typescript
// Advanced service example
async getStudentWithRelations(tenantId: string, studentId: string) {
  // 1. Get student with all relations
  const student = await this.prisma.student.findUnique({
    where: { id: studentId },
    include: {
      school: true,
      class: true,
      admissions: true,
      communications: {
        take: 10,
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!student) {
    throw new NotFoundException();
  }

  // 2. Validate ownership
  // (Not necessary - Prisma middleware already filtered)
  // But good practice for explicit validation
  this.queryBuilder.validateTenantOwnership(student);

  // 3. Apply business logic
  return {
    ...student,
    totalAdmissions: student.admissions.length,
    latestCommunication: student.communications[0],
  };
}
```

---

## Guard & Interceptor Usage

### 1. Apply Guards to Sensitive Routes

```typescript
// Routes that create/update/delete data
@Post()
@UseGuards(JwtAuthGuard, TenantValidationGuard)  // Both guards
async create(@GetTenantId() tenantId: string, @Body() dto: CreateDto) {
  // ...
}

// Routes that only read data
@Get()
@UseGuards(JwtAuthGuard)  // Only JWT guard
async list(@GetTenantId() tenantId: string) {
  // ...
}
```

### 2. Apply Interceptor Globally

```typescript
// main.ts
import { TenantIsolationInterceptor } from './common/interceptors/tenant-isolation.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Apply globally
  app.useGlobalInterceptors(new TenantIsolationInterceptor());

  await app.listen(3000);
}

bootstrap();
```

### 3. Alternative: Apply to Specific Routes

```typescript
// Controller level
@Controller('students')
@UseInterceptors(TenantIsolationInterceptor)
export class StudentController {
  // All routes in this controller are intercepted
}

// Method level
@Get(':id')
@UseInterceptors(TenantIsolationInterceptor)
async getOne(@Param('id') id: string) {
  // ...
}
```

---

## Common Patterns

### Pattern 1: Create with Related Data

```typescript
async createStudentWithAdmission(
  tenantId: string,
  studentDto: CreateStudentDto,
  admissionDto: CreateAdmissionDto,
) {
  // Create student and admission in transaction
  return this.prisma.$transaction(async (tx) => {
    // Create student
    const student = await tx.student.create({
      data: this.queryBuilder.buildCreateData(studentDto),
    });

    // Create admission
    const admission = await tx.admission.create({
      data: this.queryBuilder.buildCreateData({
        ...admissionDto,
        studentId: student.id,
      }),
    });

    return { student, admission };
  });
}
```

### Pattern 2: Batch Operations with Tenant Filter

```typescript
async updateStudentStatus(tenantId: string, studentIds: string[]) {
  // Update all students (tenant context automatically applied)
  return this.prisma.student.updateMany({
    where: {
      id: { in: studentIds },
      // Don't add tenantId here - Prisma middleware adds it
    },
    data: { status: 'ACTIVE' },
  });
}
```

### Pattern 3: Aggregation with Tenant Scope

```typescript
async getStudentStatistics(tenantId: string) {
  // Aggregate data for current tenant
  return this.prisma.student.aggregate({
    where: { /* Additional filters - tenantId added by middleware */ },
    _count: true,
    _avg: { age: true },
  });
}
```

### Pattern 4: Full-Text Search with Tenant Filter

```typescript
async searchStudents(tenantId: string, query: string) {
  return this.prisma.student.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } },
        { enrollmentNo: { contains: query, mode: 'insensitive' } },
      ],
      // Prisma middleware adds: AND tenantId = current_tenant
    },
    take: 20,
  });
}
```

---

## Security Checklists

### Pre-Deployment Checklist

- [ ] All controllers use `@UseGuards(JwtAuthGuard)` at minimum
- [ ] All write operations use `@UseGuards(JwtAuthGuard, TenantValidationGuard)`
- [ ] All services receive `tenantId` parameter via `@GetTenantId()`
- [ ] No hardcoded tenant IDs anywhere
- [ ] All services use `TenantQueryBuilderService` for query building
- [ ] No manual `tenantId` filtering in services (rely on Prisma middleware)
- [ ] Database indexes created on all `tenantId` columns
- [ ] Sensitive operations validated with `validateTenantOwnership()`
- [ ] TenantIsolationModule imported in all business modules
- [ ] TenantMiddleware and TenantContextMiddleware configured in app.module.ts

### Code Review Checklist

For each service method:

- [ ] Does it accept `tenantId` parameter?
- [ ] Are queries built with `queryBuilder.buildWhere()`?
- [ ] Are creates built with `queryBuilder.buildCreateData()`?
- [ ] Are updates built with `queryBuilder.buildUpdateData()`?
- [ ] Is ownership validated for sensitive operations?
- [ ] Are errors properly handled?
- [ ] Is tenant context logged for audit trail?
- [ ] Could a user override tenantId somehow?

### Testing Checklist

- [ ] Unit tests for all services
- [ ] E2E tests for API endpoints
- [ ] Cross-tenant access prevention tests
- [ ] Token tenant mismatch rejection tests
- [ ] Parameter injection attack prevention tests
- [ ] Database isolation validation tests
- [ ] Concurrent request isolation tests

### Runtime Monitoring Checklist

- [ ] Log all tenant context extractions
- [ ] Alert on validation failures
- [ ] Track isolation breaches
- [ ] Monitor performance of tenant-filtered queries
- [ ] Audit trail for all mutations

---

## Common Mistakes to Avoid

### ❌ Mistake 1: Trusting User Input for Tenant

```typescript
// WRONG - User could override tenant
async create(@Body() dto: CreateStudentDto & { tenantId?: string }) {
  return this.prisma.student.create({
    data: { ...dto, tenantId: dto.tenantId ?? 'default' }, // ✗ DANGEROUS
  });
}

// CORRECT
async create(
  @GetTenantId() tenantId: string,
  @Body() dto: CreateStudentDto, // No tenantId in DTO
) {
  const data = this.queryBuilder.buildCreateData(dto);
  return this.prisma.student.create({ data });
}
```

### ❌ Mistake 2: Duplicating Tenant Filter

```typescript
// WRONG - Duplicate filtering
const students = await this.prisma.student.findMany({
  where: {
    tenantId: tenantId,  // ✗ Unnecessary - Prisma middleware adds this
    status: 'ACTIVE',
  },
});

// CORRECT
const where = this.queryBuilder.buildWhere({ status: 'ACTIVE' });
const students = await this.prisma.student.findMany({ where });
```

### ❌ Mistake 3: Missing Ownership Validation

```typescript
// WRONG - No validation
async deleteStudent(tenantId: string, studentId: string) {
  return this.prisma.student.delete({
    where: { id: studentId },
  });
}

// CORRECT
async deleteStudent(tenantId: string, studentId: string) {
  const student = await this.prisma.student.findUnique({
    where: { id: studentId },
  });
  if (!student) throw new NotFoundException();

  this.queryBuilder.validateTenantOwnership(student);

  return this.prisma.student.delete({ where: { id: studentId } });
}
```

### ❌ Mistake 4: Routes Without Guards

```typescript
// WRONG - No authentication
@Post('admin/statistics')
async getStats() {
  // Anyone can call this!
}

// CORRECT
@Post('admin/statistics')
@UseGuards(JwtAuthGuard, TenantValidationGuard)
async getStats(@GetTenantId() tenantId: string) {
  // Only authenticated users from correct tenant
}
```

### ❌ Mistake 5: Not Using Module

```typescript
// WRONG - Missing TenantIsolationModule
@Module({
  controllers: [StudentController],
  providers: [StudentService],
})
export class StudentModule {}

// CORRECT
@Module({
  imports: [TenantIsolationModule],
  controllers: [StudentController],
  providers: [StudentService],
})
export class StudentModule {}
```

---

## Summary

| Task | How |
|------|-----|
| **Create service** | Inject `TenantQueryBuilderService` and `PrismaService` |
| **Build where clause** | Use `queryBuilder.buildWhere(filters)` |
| **Create data** | Use `queryBuilder.buildCreateData(dto)` |
| **Update data** | Use `queryBuilder.buildUpdateData(dto)` |
| **Validate ownership** | Use `queryBuilder.validateTenantOwnership(resource)` |
| **Protect route** | Add `@UseGuards(JwtAuthGuard, TenantValidationGuard)` |
| **Get tenant ID** | Use `@GetTenantId()` in controller |
| **Access tenant context** | Inject `TenantContextService` and call `getTenantContext()` |

Your services are now tenant-safe. Every query is automatically filtered by tenant!

