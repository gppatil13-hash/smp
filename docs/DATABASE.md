# Database Schema Documentation

## Overview

PostgreSQL database with normalized schema supporting multi-tenant architecture. All tables include `tenantId` for data isolation.

## Entity-Relationship Diagram

```
┌─────────────────────────────────────────────────┐
│                   Tenant                        │
│  ├─ id (PK)                                     │
│  ├─ name (UNIQUE)                               │
│  ├─ subdomain (UNIQUE)                          │
│  └─ subscriptionPlan                            │
└──────┬──────────────────────────────────┬───────┘
       │                                  │
       │ 1:N                              │ 1:N
       │                                  │
    ┌──▼─────────────────┐          ┌────▼──────────────┐
    │ School              │          │ User               │
    │ ├─ id (PK)          │          │ ├─ id (PK)         │
    │ ├─ tenantId (FK)    │          │ ├─ tenantId (FK)   │
    │ ├─ name             │          │ ├─ email (UNIQUE)  │
    │ └─ registrationNo   │          │ ├─ role            │
    └──┬───────────────┬──┘          │ └─ passwordHash    │
       │               │             └────────────────────┘
       │ 1:N           │ 1:N
       │               │
    ┌──▼──────────┐   ┌──▼──────────────┐
    │ Student     │   │ Admission       │
    │ ├─ id (PK)  │   │ ├─ id (PK)      │
    │ ├─ tenantId │   │ ├─ tenantId     │
    │ ├─ schoolId │   │ ├─ schoolId     │
    │ ├─ classId  │   │ ├─ applicationNo│
    │ └─ status   │   │ └─ status       │
    └────┬────────┘   └───┬────────────┘
         │                │
         │ 1:N            │ 1:N
         │                │
    ┌────▼────────────────▼──────────┐
    │ Communication                   │
    │ ├─ id (PK)                      │
    │ ├─ type (SMS/WHATSAPP/EMAIL)    │
    │ ├─ status (PENDING/SENT/FAILED) │
    │ └─ externalId                   │
    └─────────────────────────────────┘

    ┌──────────────────────────┐
    │ FeeStructure             │
    │ ├─ id (PK)               │
    │ ├─ tenantId (FK)         │
    │ ├─ schoolId (FK)         │
    │ ├─ academicYear          │
    │ ├─ classSection          │
    │ └─ amount                │
    └─────────┬────────────────┘
              │ 1:N
              │
    ┌─────────▼──────────────┐
    │ FeeRecord              │
    │ ├─ id (PK)             │
    │ ├─ studentId (FK)      │
    │ ├─ feeStructureId (FK) │
    │ ├─ status              │
    │ └─ paidAmount          │
    └────────────────────────┘
```

## Core Tables

### 1. Tenant
Central table for multi-tenancy. Each row represents a separate school/institution.

```sql
CREATE TABLE "Tenant" (
  id VARCHAR(20) PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  subdomain VARCHAR(100) UNIQUE NOT NULL,
  status BOOLEAN DEFAULT true,
  subscriptionPlan VARCHAR(50),
  maxStudents INTEGER DEFAULT 3000,
  maxUsers INTEGER DEFAULT 100,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes**:
```sql
CREATE INDEX idx_tenant_subdomain ON "Tenant"(subdomain);
CREATE INDEX idx_tenant_status ON "Tenant"(status);
```

### 2. School
School information within a tenant.

```sql
CREATE TABLE "School" (
  id VARCHAR(20) PRIMARY KEY,
  "tenantId" VARCHAR(20) NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  "registrationNumber" VARCHAR(100) UNIQUE NOT NULL,
  address TEXT NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  "pinCode" VARCHAR(10) NOT NULL,
  "principalName" VARCHAR(255) NOT NULL,
  "principalEmail" VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  website VARCHAR(255),
  logo VARCHAR(500),
  status BOOLEAN DEFAULT true,
  "foundedYear" INTEGER NOT NULL,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("tenantId", "registrationNumber")
);
```

**Indexes**:
```sql
CREATE INDEX idx_school_tenant_id ON "School"("tenantId");
CREATE INDEX idx_school_status ON "School"(status);
```

### 3. User
User accounts with role-based access control.

```sql
CREATE TABLE "User" (
  id VARCHAR(20) PRIMARY KEY,
  "tenantId" VARCHAR(20) NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
  "schoolId" VARCHAR(20) REFERENCES "School"(id) ON DELETE SET NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  "firstName" VARCHAR(100) NOT NULL,
  "lastName" VARCHAR(100) NOT NULL,
  "passwordHash" VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'SCHOOL_ADMIN',
  status BOOLEAN DEFAULT true,
  "lastLogin" TIMESTAMP NULL,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("tenantId", email)
);
```

**Indexes**:
```sql
CREATE INDEX idx_user_tenant_id ON "User"("tenantId");
CREATE INDEX idx_user_school_id ON "User"("schoolId");
CREATE INDEX idx_user_role ON "User"(role);
CREATE INDEX idx_user_status ON "User"(status);
```

### 4. Student
Student records with contact information and academic details.

```sql
CREATE TABLE "Student" (
  id VARCHAR(20) PRIMARY KEY,
  "tenantId" VARCHAR(20) NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
  "schoolId" VARCHAR(20) NOT NULL REFERENCES "School"(id) ON DELETE CASCADE,
  "classId" VARCHAR(20) NOT NULL REFERENCES "ClassMaster"(id),
  "enrollmentNo" VARCHAR(50) NOT NULL,
  "rollNumber" INTEGER NOT NULL,
  "firstName" VARCHAR(100) NOT NULL,
  "lastName" VARCHAR(100) NOT NULL,
  "dateOfBirth" DATE NOT NULL,
  gender VARCHAR(10),
  "bloodGroup" VARCHAR(5),
  email VARCHAR(255),
  phone VARCHAR(20),
  "fatherName" VARCHAR(100) NOT NULL,
  "fatherPhone" VARCHAR(20) NOT NULL,
  "motherName" VARCHAR(100) NOT NULL,
  "motherPhone" VARCHAR(20) NOT NULL,
  address TEXT NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  "pinCode" VARCHAR(10) NOT NULL,
  "academicYear" VARCHAR(20) NOT NULL,
  "admissionDate" DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'ACTIVE',
  "profileImage" VARCHAR(500),
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("schoolId", "enrollmentNo"),
  UNIQUE("schoolId", "rollNumber", "classId", "academicYear")
);
```

**Indexes**:
```sql
CREATE INDEX idx_student_tenant ON "Student"("tenantId");
CREATE INDEX idx_student_school ON "Student"("schoolId");
CREATE INDEX idx_student_class ON "Student"("classId");
CREATE INDEX idx_student_status ON "Student"(status);
CREATE INDEX idx_student_academic_year ON "Student"("academicYear");
```

### 5. Admission
Admission inquiry and application management.

```sql
CREATE TABLE "Admission" (
  id VARCHAR(20) PRIMARY KEY,
  "tenantId" VARCHAR(20) NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
  "schoolId" VARCHAR(20) NOT NULL REFERENCES "School"(id) ON DELETE CASCADE,
  "applicationNo" VARCHAR(100) NOT NULL UNIQUE,
  "candidateName" VARCHAR(100) NOT NULL,
  "candidateEmail" VARCHAR(255) NOT NULL,
  "candidatePhone" VARCHAR(20) NOT NULL,
  dob DATE NOT NULL,
  gender VARCHAR(10),
  "fatherName" VARCHAR(100) NOT NULL,
  "fatherPhone" VARCHAR(20) NOT NULL,
  "motherName" VARCHAR(100) NOT NULL,
  "motherPhone" VARCHAR(20) NOT NULL,
  "applyingForClass" VARCHAR(50) NOT NULL,
  address TEXT NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  "pinCode" VARCHAR(10) NOT NULL,
  status VARCHAR(50) DEFAULT 'INQUIRY',
  remarks TEXT,
  "appliedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "admittedAt" TIMESTAMP NULL,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("schoolId", "applicationNo")
);
```

**Indexes**:
```sql
CREATE INDEX idx_admission_tenant ON "Admission"("tenantId");
CREATE INDEX idx_admission_school ON "Admission"("schoolId");
CREATE INDEX idx_admission_status ON "Admission"(status);
CREATE INDEX idx_admission_applied_at ON "Admission"("appliedAt");
```

### 6. FeeStructure
Defines fee types and amounts per class/year.

```sql
CREATE TABLE "FeeStructure" (
  id VARCHAR(20) PRIMARY KEY,
  "tenantId" VARCHAR(20) NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
  "schoolId" VARCHAR(20) NOT NULL REFERENCES "School"(id) ON DELETE CASCADE,
  "academicYear" VARCHAR(20) NOT NULL,
  "classSection" VARCHAR(50) NOT NULL,
  "feeType" VARCHAR(100) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  frequency VARCHAR(50) NOT NULL,
  "dueDate" INTEGER NOT NULL,
  description TEXT,
  status BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("schoolId", "academicYear", "classSection", "feeType")
);
```

**Indexes**:
```sql
CREATE INDEX idx_fee_structure_school ON "FeeStructure"("schoolId");
CREATE INDEX idx_fee_structure_academic_year ON "FeeStructure"("academicYear");
```

### 7. FeeRecord
Individual fee bills for students.

```sql
CREATE TABLE "FeeRecord" (
  id VARCHAR(20) PRIMARY KEY,
  "tenantId" VARCHAR(20) NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
  "schoolId" VARCHAR(20) NOT NULL REFERENCES "School"(id) ON DELETE CASCADE,
  "studentId" VARCHAR(20) NOT NULL REFERENCES "Student"(id) ON DELETE CASCADE,
  "feeStructureId" VARCHAR(20) NOT NULL REFERENCES "FeeStructure"(id),
  "academicYear" VARCHAR(20) NOT NULL,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  "totalAmount" DECIMAL(10, 2) NOT NULL,
  "paidAmount" DECIMAL(10, 2) DEFAULT 0,
  "dueDate" DATE NOT NULL,
  "paidDate" TIMESTAMP NULL,
  "paymentMode" VARCHAR(50),
  "transactionId" VARCHAR(255),
  status VARCHAR(50) DEFAULT 'PENDING',
  remarks TEXT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("studentId", "feeStructureId", "academicYear", month, year)
);
```

**Indexes**:
```sql
CREATE INDEX idx_fee_record_student ON "FeeRecord"("studentId");
CREATE INDEX idx_fee_record_status ON "FeeRecord"(status);
CREATE INDEX idx_fee_record_tenant ON "FeeRecord"("tenantId");
CREATE INDEX idx_fee_record_school ON "FeeRecord"("schoolId");
CREATE INDEX idx_fee_record_due_date ON "FeeRecord"("dueDate");
```

### 8. Communication
SMS, WhatsApp, and email communication logs.

```sql
CREATE TABLE "Communication" (
  id VARCHAR(20) PRIMARY KEY,
  "tenantId" VARCHAR(20) NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
  "schoolId" VARCHAR(20) NOT NULL REFERENCES "School"(id) ON DELETE CASCADE,
  "studentId" VARCHAR(20) REFERENCES "Student"(id) ON DELETE SET NULL,
  "admissionId" VARCHAR(20) REFERENCES "Admission"(id) ON DELETE SET NULL,
  "recipientName" VARCHAR(100) NOT NULL,
  "recipientEmail" VARCHAR(255),
  "recipientPhone" VARCHAR(20),
  type VARCHAR(50) NOT NULL,
  subject VARCHAR(255),
  message TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'PENDING',
  "externalId" VARCHAR(255),
  "sentAt" TIMESTAMP NULL,
  "deliveredAt" TIMESTAMP NULL,
  "failureReason" TEXT,
  "retryCount" INTEGER DEFAULT 0,
  "maxRetries" INTEGER DEFAULT 3,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes**:
```sql
CREATE INDEX idx_communication_tenant ON "Communication"("tenantId");
CREATE INDEX idx_communication_type ON "Communication"(type);
CREATE INDEX idx_communication_status ON "Communication"(status);
CREATE INDEX idx_communication_created_at ON "Communication"("createdAt");
CREATE INDEX idx_communication_student ON "Communication"("studentId");
```

## Query Examples

### Get all students with fee balance
```sql
SELECT 
  s.id,
  s."firstName",
  s."lastName",
  SUM(fr."totalAmount") as total_due,
  SUM(fr."paidAmount") as total_paid,
  SUM(fr."totalAmount") - SUM(fr."paidAmount") as balance
FROM "Student" s
LEFT JOIN "FeeRecord" fr ON s.id = fr."studentId"
WHERE s."tenantId" = $1 AND s."schoolId" = $2
GROUP BY s.id
HAVING SUM(fr."totalAmount") - SUM(fr."paidAmount") > 0;
```

### Get admission statistics
```sql
SELECT 
  status,
  COUNT(*) as count
FROM "Admission"
WHERE "tenantId" = $1 AND "schoolId" = $2
GROUP BY status;
```

### Get overdue fees
```sql
SELECT 
  s."id",
  s."firstName",
  s."lastName",
  fr."totalAmount",
  fr."paidAmount",
  fr."dueDate"
FROM "Student" s
JOIN "FeeRecord" fr ON s.id = fr."studentId"
WHERE 
  s."tenantId" = $1 
  AND s."schoolId" = $2
  AND fr.status IN ('PENDING', 'PARTIAL')
  AND fr."dueDate" < CURRENT_DATE
ORDER BY fr."dueDate" ASC;
```

## Data Retention & Archiving

- Student records: Keep indefinitely (graduation records needed)
- Fee records: Keep for 7 years (compliance)
- Communications: Archive after 2 years
- Audit logs: Archive after 1 year

---

**Document Version**: 1.0
**Last Updated**: March 2026
