# Multi-Tenant School ERP Database Schema Documentation

## Table of Contents
1. [Overview](#overview)
2. [Multi-Tenancy Architecture](#multi-tenancy-architecture)
3. [Core Modules](#core-modules)
4. [Schema Design Principles](#schema-design-principles)
5. [Key Relationships](#key-relationships)
6. [Query Examples](#query-examples)
7. [Performance Considerations](#performance-considerations)

---

## Overview

This PostgreSQL schema supports a comprehensive multi-tenant School ERP system designed for schools with 200-3000 students. The system is organized around 13 core modules with built-in support for multi-tenancy, flexible fee management, admission pipeline, and communication tracking.

### Key Features

- **Multi-Tenancy**: Each record includes `tenant_id` for complete data isolation
- **UUID Primary Keys**: All tables use UUID instead of auto-increment for distributed systems
- **Timestamps**: Every table includes `created_at` and `updated_at` for audit trails
- **Comprehensive Indexing**: Strategic indexes on frequently queried fields
- **Flexible Fee Structures**: Support for multiple fee types, components, and installments
- **Admission Pipeline**: Multi-stage admission workflow from inquiry to enrollment
- **Document Management**: Track student and admission-related documents
- **Communication Logs**: Record all SMS, email, WhatsApp communications

---

## Multi-Tenancy Architecture

### Tenant Isolation Strategy

All tables implement database-level tenant isolation:

```sql
-- Example: Each school (tenant) is completely isolated
SELECT * FROM "Student" WHERE "tenantId" = 'school-uuid-123';
```

### Tenant Table

The `Tenant` table represents individual schools:

```
tenant_id (PK)          -- UUID primary key
├── subdomain           -- Unique subdomain for multi-domain setup
├── name                -- School name
├── registrationNo      -- Unique registration number
├── subscription plan   -- STANDARD, PREMIUM, ENTERPRISE
├── maxSchools          -- Number of schools allowed
├── maxUsers            -- Maximum user accounts
├── maxStudents         -- Maximum student capacity
├── isActive            -- Soft delete flag
└── timestamps          -- created_at, updated_at
```

### Tenant-First Query Pattern

All queries must include tenant filter:

```sql
-- CORRECT: Filtered by tenant
SELECT s.* FROM "Student" s 
WHERE s."tenantId" = $tenantId 
AND s."enrollmentNo" = $enrollmentNo;

-- WRONG: Missing tenant filter (security issue)
SELECT * FROM "Student" WHERE "enrollmentNo" = $enrollmentNo;
```

---

## Core Modules

### 1. Schools Module

**Tables**: `School`

```
School (represents individual schools under a tenant)
├── id (PK)
├── tenantId (FK) ──> Each school belongs to one tenant
├── principalName
├── principalEmail
├── registrationNo (unique per tenant)
├── boardName (e.g., CBSE, ICSE, IB)
├── affiliationNumber
├── noOfStudents (denormalized for quick stats)
├── noOfClasses
├── noOfTeachers
├── isActive
└── timestamps
```

**Purpose**: Manage school information and settings

**Key Queries**:
```sql
-- Get all schools for a tenant
SELECT * FROM "School" 
WHERE "tenantId" = $tenantId 
AND "isActive" = true;
```

### 2. Users Module

**Tables**: `User`

```
User (staff, admins, teachers, parents)
├── id (PK)
├── tenantId (FK)
├── schoolId (FK) ──> Optional, can span multiple schools
├── email (unique per tenant)
├── password (hashed)
├── firstName, lastName
├── role (ENUM: SUPER_ADMIN, SCHOOL_ADMIN, TEACHER, etc.)
├── employeeId (unique per tenant/school)
├── department, designation
├── profileImageUrl
├── lastLoginAt (for tracking activity)
├── isActive
└── timestamps
```

**Supported Roles**:
- `SUPER_ADMIN` - System administrator
- `SCHOOL_ADMIN` - School administrator
- `PRINCIPAL` - School principal
- `TEACHER` - Teaching staff
- `ACCOUNTANT` - Finance staff
- `ADMISSION_COUNSELLOR` - Admission team
- `RECEPTIONIST` - Front desk staff
- `PARENT` - Student parents
- `STUDENT` - Students

**Purpose**: User authentication and access control

**Key Queries**:
```sql
-- Get all active users for a school with specific role
SELECT * FROM "User" 
WHERE "tenantId" = $tenantId 
AND "schoolId" = $schoolId 
AND role = 'TEACHER' 
AND "isActive" = true;
```

### 3. Students Module

**Tables**: `Student`

```
Student (complete student information)
├── id (PK)
├── tenantId (FK)
├── schoolId (FK)
├── enrollmentNo (unique per tenant)
├── rollNumber
├── firstName, lastName, gender
├── dateOfBirth, age
├── address, city, state, pincode
├── profileImageUrl
├── classId (FK) ──> Current class assignment
├── status (ENUM: ACTIVE, INACTIVE, TRANSFERRED, etc.)
├── enrollmentDate
├── Parent Information
│   ├── fatherName, fatherPhone, fatherEmail
│   ├── motherName, motherPhone, motherEmail
│   └── guardianName, guardianPhone, guardianRelation
├── National IDs
│   ├── aadharNo
│   └── samadhaarNo
├── Medical Information
│   ├── bloodGroup
│   ├── medicalConditions
│   ├── specialNeeds
│   └── specialNeedsDetails
├── assignedBy (FK to User)
└── timestamps
```

**Status Values**:
- `ACTIVE` - Currently enrolled
- `INACTIVE` - Temporarily inactive
- `TRANSFERRED` - Moved to another school
- `PASSED_OUT` - Completed course
- `SUSPENDED` - Disciplinary action
- `DROPPED` - Resigned/Expelled

**Purpose**: Manage student records and enrollment

**Key Queries**:
```sql
-- Get all active students in a class
SELECT * FROM "Student" 
WHERE "tenantId" = $tenantId 
AND "classId" = $classId 
AND status = 'ACTIVE'
ORDER BY "rollNumber";

-- Find student by enrollment number
SELECT * FROM "Student" 
WHERE "tenantId" = $tenantId 
AND "enrollmentNo" = $enrollmentNo;
```

### 4. Courses Module

**Tables**: `Course`

```
Course (academic programs offered)
├── id (PK)
├── tenantId (FK)
├── schoolId (FK) ──> Optional, can be shared
├── code (unique per tenant/school)
├── name (e.g., "High School", "Junior College")
├── board (CBSE, ICSE, IB)
├── duration (in years)
├── description
└── timestamps
```

**Purpose**: Define academic programs/courses

**Key Queries**:
```sql
-- Get all courses offered by a school
SELECT * FROM "Course" 
WHERE "tenantId" = $tenantId 
AND "schoolId" = $schoolId;
```

### 5. Classes Module

**Tables**: `Class`

```
Class (sections within a course)
├── id (PK)
├── tenantId (FK)
├── schoolId (FK)
├── courseId (FK) ──> Must reference Course
├── classCode (unique per course/year)
├── className (e.g., "X-A", "XII Science")
├── academicYear (e.g., "2024-25")
├── section (A, B, C, etc.)
├── capacity (max students)
├── classTeacherId (FK to User)
├── classroomNo
├── floor
├── isActive
└── timestamps
```

**Purpose**: Organize students into classes/sections

**Key Relationships**:
- Each Class belongs to one Course
- Each Class belongs to one Academic Year
- Multiple Students can enroll in one Class
- One Class Teacher (User) can manage multiple Classes

**Key Queries**:
```sql
-- Get all classes for a course in an academic year
SELECT * FROM "Class" 
WHERE "tenantId" = $tenantId 
AND "courseId" = $courseId 
AND "academicYear" = '2024-25'
AND "isActive" = true;

-- Get class with student count
SELECT c.*, COUNT(s.id) as "studentCount"
FROM "Class" c
LEFT JOIN "Student" s ON c.id = s."classId" AND s."tenantId" = $tenantId
WHERE c."tenantId" = $tenantId 
AND c.id = $classId
GROUP BY c.id;
```

### 6. Admission Enquiry Module

**Tables**: `AdmissionEnquiry`

```
AdmissionEnquiry (initial student inquiries)
├── id (PK)
├── tenantId (FK)
├── schoolId (FK)
├── enquiryNo (unique per tenant)
├── enquiryDate
├── studentName, gender, dateOfBirth
├── parentName, parentEmail, parentPhone
├── interestedClass, course
├── address, city, state, pincode
├── status (ENUM: NEW, INTERESTED, AWAITING_INFO, etc.)
├── source (Website, Referral, Walk-in)
├── handledBy (FK to User)
├── followUpDate
├── notes
├── isConverted (if converted to formal admission)
└── timestamps
```

**Status Values**:
- `NEW` - Just created
- `INTERESTED` - Confirmed interest
- `AWAITING_INFO` - Waiting for additional information
- `QUALIFIED` - Passes selection criteria
- `NOT_INTERESTED` - Rejected by student/parent
- `REJECTED` - Rejected by school

**Purpose**: Track initial student inquiries

**Key Queries**:
```sql
-- Get pending enquiries needing follow-up
SELECT * FROM "AdmissionEnquiry" 
WHERE "tenantId" = $tenantId 
AND status IN ('INTERESTED', 'AWAITING_INFO')
AND "followUpDate" <= NOW()
AND "isConverted" = false
ORDER BY "followUpDate";

-- Get enquiries by source
SELECT source, COUNT(*) as count
FROM "AdmissionEnquiry"
WHERE "tenantId" = $tenantId
AND "enquiryDate" >= $startDate
GROUP BY source;
```

### 7. Admissions Module

**Tables**: `Admission`

```
Admission (formal admission process)
├── id (PK)
├── tenantId (FK)
├── schoolId (FK)
├── studentId (FK) ──> Linked to Student
├── applicationNo (unique per tenant)
├── applicationDate
├── status (ENUM: APPLIED, SHORTLISTED, ADMITTED, ENROLLED, REJECTED, etc.)
├── academicYear
├── classAppliedFor, section
├── admissionDate (when actually admitted)
├── approvedBy (FK to User), approvalDate
├── rejectionReason
├── previousSchool, previousClassPassed
├── previousPercentage
├── transferCertificateNo
├── medicalCheckupDone, medicalCheckupDate
├── notes
└── timestamps
```

**Status Values** (Admission Pipeline):
- `INQUIRY` - Initial inquiry
- `APPLIED` - Formal application submitted
- `SHORTLISTED` - Selected for consideration
- `ADMITTED` - Offered admission
- `ENROLLED` - Student activated
- `REJECTED` - Application rejected
- `CANCELLED` - Cancelled by student
- `WAITLISTED` - On waiting list

**Purpose**: Manage admission workflow

**Key Queries**:
```sql
-- Get admission statistics by status
SELECT status, COUNT(*) as count
FROM "Admission"
WHERE "tenantId" = $tenantId
AND "academicYear" = $academicYear
GROUP BY status;

-- Get all admissions approved in a date range
SELECT * FROM "Admission"
WHERE "tenantId" = $tenantId
AND "approvalDate" BETWEEN $startDate AND $endDate
AND status IN ('ADMITTED', 'ENROLLED');
```

### 8. Fee Structures Module

**Tables**: `FeeStructure`, `FeeComponent`

```
FeeStructure (defines fee configuration per class)
├── id (PK)
├── tenantId (FK)
├── schoolId (FK)
├── classId (FK) ──> Specific to a class
├── academicYear
├── feeType (Tuition, Uniform, Transport, etc.)
├── name (e.g., "Class X Regular Fee 2024-25")
├── frequency (ANNUAL, SEMESTER, QUARTERLY, MONTHLY)
├── totalAmount (calculated sum)
├── isActive
├── effectiveFrom, effectiveTo (date range)
└── timestamps

FeeComponent (individual fee components)
├── id (PK)
├── tenantId (FK)
├── feeStructureId (FK)
├── componentName (Tuition, Lab, Activity, etc.)
├── amount or percentage
├── isMandatory (can be made optional)
├── description
└── timestamps
```

**Features**:
- Multiple fee types per class (Tuition, Transport, Uniform, etc.)
- Flexible frequency (Annual, Semester, Quarterly, Monthly)
- Components can be percentage-based or fixed amount
- Soft deletion with `isActive` and `effectiveTo`
- Version history through `createdAt`

**Example Structure**:
```
Class: X-A, Year: 2024-25

FeeStructure: "Tuition Fee 2024-25"
├── FeeComponent: Tuition Fee → 50,000
├── FeeComponent: Lab Fee → 5,000
├── FeeComponent: Annual Fund → 2,000
└── Total: 57,000

FeeStructure: "Transport Fee 2024-25"
├── FeeComponent: Local Transport → 12,000
└── Total: 12,000
```

**Purpose**: Define flexible, configurable fee structures

**Key Queries**:
```sql
-- Get all fee components for a class
SELECT fc.* FROM "FeeComponent" fc
JOIN "FeeStructure" fs ON fc."feeStructureId" = fs.id
WHERE fs."tenantId" = $tenantId
AND fs."classId" = $classId
AND fs."academicYear" = $academicYear
AND fs."isActive" = true
ORDER BY fc."order";

-- Calculate total fees for a class
SELECT fs.*, SUM(fc.amount) as "totalAmount"
FROM "FeeStructure" fs
LEFT JOIN "FeeComponent" fc ON fs.id = fc."feeStructureId"
WHERE fs."tenantId" = $tenantId
AND fs."classId" = $classId
AND fs."academicYear" = $academicYear
AND fs."isActive" = true
GROUP BY fs.id;
```

### 9. Fee Installments Module

**Tables**: `FeeInstallment`, `StudentFeeInstallment`

```
FeeInstallment (defines installment schedule)
├── id (PK)
├── tenantId (FK)
├── feeStructureId (FK)
├── installmentNumber (1, 2, 3, 4)
├── installmentName ("First", "Second", etc.)
├── dueDate
├── amount (portion of total)
├── description
├── order
└── timestamps

StudentFeeInstallment (tracks individual student installments)
├── id (PK)
├── tenantId (FK)
├── studentId (FK)
├── installmentId (FK)
├── dueAmount
├── paidAmount
├── balanceAmount
├── status (PENDING, PARTIAL, PAID, OVERDUE, WAIVED, CANCELLED)
├── dueDate
├── paidDate
├── waiverAmount (if waived)
├── waiverReason
├── waiverApprovedBy
├── notes
└── timestamps
```

**Status Values**:
- `PENDING` - Not yet paid
- `PARTIAL` - Some amount paid
- `PAID` - Fully paid
- `OVERDUE` - Past due date
- `WAIVED` - Amount forgiven
- `CANCELLED` - Cancelled

**Key Characteristics**:
- Fixed payment schedule (can be customized per class)
- Per-student tracking with balance calculations
- Flexible waiver functionality with approval tracking
- Overdue status auto-detection (compare with current date)

**Example Installment Schedule**:
```
FeeStructure: Class X Annual Fee (57,000)
├── Installment 1: April deadline → 20,000
├── Installment 2: July deadline → 19,000
└── Installment 3: December deadline → 18,000

StudentFeeInstallment tracking for each student:
├── Student X, Installment 1: PAID (20,000)
├── Student X, Installment 2: PENDING (19,000)
└── Student X, Installment 3: PENDING (18,000)
```

**Purpose**: Track installment obligations and payments

**Key Queries**:
```sql
-- Get student's fee balance
SELECT 
  sfi.*,
  SUM(sfi."dueAmount") as "totalDue",
  SUM(sfi."paidAmount") as "totalPaid",
  SUM(sfi."balanceAmount") as "totalBalance"
FROM "StudentFeeInstallment" sfi
WHERE sfi."studentId" = $studentId
AND sfi."tenantId" = $tenantId
GROUP BY sfi."studentId";

-- Get overdue installments
SELECT * FROM "StudentFeeInstallment"
WHERE "tenantId" = $tenantId
AND "dueDate" < NOW()
AND status = 'PENDING'
ORDER BY "dueDate";

-- Student fee report
SELECT 
  s."enrollmentNo",
  s."firstName",
  COUNT(sfi.id) as "totalInstallments",
  SUM(sfi."dueAmount") as "totalDue",
  SUM(sfi."paidAmount") as "totalPaid",
  SUM(sfi."balanceAmount") as "balance"
FROM "Student" s
LEFT JOIN "StudentFeeInstallment" sfi ON s.id = sfi."studentId"
WHERE s."tenantId" = $tenantId
GROUP BY s.id
ORDER BY s."rollNumber";
```

### 10. Fee Payments Module

**Tables**: `FeePayment`

```
FeePayment (individual payment transactions)
├── id (PK)
├── tenantId (FK)
├── studentId (FK)
├── installmentId (FK) ──> Links to StudentFeeInstallment
├── paymentNo (unique per tenant)
├── paymentDate
├── amount
├── paymentMode (CASH, CHEQUE, BANK_TRANSFER, etc.)
├── status (COMPLETED, PENDING, FAILED, REFUNDED)
├── transactionId (for online payments)
├── referenceNo (Cheque No, Bank Ref, etc.)
├── remarks
├── uploadedByUserId
├── receiptId (FK)
└── timestamps
```

**Payment Modes**:
- `CASH` - Physical cash
- `CHEQUE` - Cheque payment
- `BANK_TRANSFER` - Direct bank transfer
- `CREDIT_CARD` - Credit card
- `DEBIT_CARD` - Debit card
- `UPI` - UPI payment
- `ONLINE` - Generic online
- `WALLET` - Digital wallet

**Payment Status**:
- `PENDING` - Yet to be processed
- `PROCESSING` - Being processed
- `COMPLETED` - Successfully completed
- `FAILED` - Failed transaction
- `REFUNDED` - Refunded to payer
- `CANCELLED` - Cancelled

**Purpose**: Track all payment transactions

**Key Queries**:
```sql
-- Get payment history for a student
SELECT * FROM "FeePayment"
WHERE "tenantId" = $tenantId
AND "studentId" = $studentId
ORDER BY "paymentDate" DESC;

-- Daily collection report
SELECT 
  "paymentDate"::DATE as date,
  "paymentMode",
  COUNT(*) as "transactionCount",
  SUM(amount) as "totalAmount"
FROM "FeePayment"
WHERE "tenantId" = $tenantId
AND status = 'COMPLETED'
AND "paymentDate"::DATE = $date
GROUP BY "paymentDate"::DATE, "paymentMode";

-- Monthly collection trend
SELECT 
  DATE_TRUNC('month', "paymentDate") as month,
  SUM(amount) as "collectionAmount",
  COUNT(*) as "transactions"
FROM "FeePayment"
WHERE "tenantId" = $tenantId
AND status = 'COMPLETED'
GROUP BY DATE_TRUNC('month', "paymentDate")
ORDER BY month DESC;
```

### 11. Receipts Module

**Tables**: `Receipt`

```
Receipt (formal payment receipts)
├── id (PK)
├── tenantId (FK)
├── receiptNo (unique per tenant)
├── studentId (FK)
├── paymentId (FK)
├── receiptDate
├── totalAmount (total billed)
├── paidAmount (actually paid)
├── remainingAmount (balance)
├── paymentMode
├── remarks
├── printCount
├── lastPrintedAt
└── timestamps
```

**Purpose**: Generate and track payment receipts

**Key Queries**:
```sql
-- Get receipt by number
SELECT * FROM "Receipt"
WHERE "tenantId" = $tenantId
AND "receiptNo" = $receiptNo;

-- Get unprinted receipts
SELECT * FROM "Receipt"
WHERE "tenantId" = $tenantId
AND "printCount" = 0
ORDER BY "receiptDate";
```

### 12. Documents Module

**Tables**: `Document`

```
Document (student and admission documents)
├── id (PK)
├── tenantId (FK)
├── studentId (FK) ──> For student documents
├── admissionEnquiryId (FK) ──> For enquiry documents
├── admissionId (FK) ──> For admission documents
├── documentType (ENUM: BIRTH_CERTIFICATE, AADHAR, PASSPORT, etc.)
├── fileName
├── fileUrl (S3 URL or local path)
├── fileSize (in bytes)
├── mimeType (image/jpeg, application/pdf, etc.)
├── status (PENDING, UPLOADED, VERIFIED, REJECTED, EXPIRED)
├── remarks
├── uploadedBy (user who uploaded)
├── verifiedBy (user who verified)
├── verificationDate
├── expiryDate (if applicable)
└── timestamps
```

**Document Types Supported**:
- `BIRTH_CERTIFICATE`
- `AADHAR`
- `PASSPORT`
- `ADMISSION_FORM`
- `TRANSFER_CERTIFICATE`
- `CHARACTER_CERTIFICATE`
- `MEDICAL_CERTIFICATE`
- `VACCINATION_CERTIFICATE`
- `PHOTOGRAPH`
- `PARENT_ID_PROOF`
- `ADDRESS_PROOF`
- `INCOME_CERTIFICATE`
- `CASTE_CERTIFICATE`
- `HEALTH_RECORD`
- `PREVIOUS_SCHOOL_REPORT`
- `OTHER`

**Document Status**:
- `PENDING` - Document not yet uploaded
- `UPLOADED` - Uploaded but not verified
- `VERIFIED` - Verified by administrator
- `REJECTED` - Rejected (re-upload required)
- `EXPIRED` - Document validity expired

**Purpose**: Store and track required documents

**Key Queries**:
```sql
-- Get all documents for a student
SELECT * FROM "Document"
WHERE "tenantId" = $tenantId
AND "studentId" = $studentId
ORDER BY "documentType", "createdAt" DESC;

-- Get pending documents for verification
SELECT * FROM "Document"
WHERE "tenantId" = $tenantId
AND status IN ('UPLOADED', 'REJECTED')
ORDER BY "createdAt";

-- Get document checklist for admission
SELECT 
  d."documentType",
  COUNT(*) as "uploadedCount",
  COUNT(CASE WHEN d.status = 'VERIFIED' THEN 1 END) as "verifiedCount"
FROM "Document" d
WHERE d."tenantId" = $tenantId
AND d."admissionId" = $admissionId
GROUP BY d."documentType";
```

### 13. Communication Logs Module

**Tables**: `CommunicationLog`

```
CommunicationLog (all communications)
├── id (PK)
├── tenantId (FK)
├── schoolId (FK)
├── senderId (FK to User) ──> User who sent
├── studentId (FK)
├── admissionEnquiryId (FK)
├── parentEmail, parentPhone
├── type (ENUM: SMS, EMAIL, WHATSAPP, IN_APP, PHONE_CALL)
├── recipientType (STUDENT, PARENT, BOTH)
├── subject (for email)
├── message (content)
├── status (PENDING, SENT, DELIVERED, FAILED, BOUNCED, MARKED_AS_READ)
├── sentAt, deliveredAt
├── failureReason
├── maxRetries, retryCount
├── externalId (API reference for tracking)
└── timestamps
```

**Communication Types**:
- `SMS` - Short Message Service
- `EMAIL` - Email notification
- `WHATSAPP` - WhatsApp message
- `IN_APP` - In-app notification
- `PHONE_CALL` - Phone call (log only)
- `PUSH_NOTIFICATION` - Mobile push

**Recipient Types**:
- `STUDENT` - Only student
- `PARENT` - Only parent/guardian
- `BOTH` - Both student and parent

**Status Values**:
- `PENDING` - Queued for sending
- `SENT` - Successfully sent
- `DELIVERED` - Delivered to recipient
- `FAILED` - Failed to send
- `BOUNCED` - Bounced (wrong phone/email)
- `MARKED_AS_READ` - Read by recipient

**Purpose**: Track all student and parent communications

**Key Queries**:
```sql
-- Get communication history for a student
SELECT * FROM "CommunicationLog"
WHERE "tenantId" = $tenantId
AND "studentId" = $studentId
ORDER BY "createdAt" DESC;

-- Get failed communications for retry
SELECT * FROM "CommunicationLog"
WHERE "tenantId" = $tenantId
AND status = 'FAILED'
AND "retryCount" < "maxRetries"
ORDER BY "createdAt";

-- Communication statistics
SELECT 
  type,
  status,
  COUNT(*) as count
FROM "CommunicationLog"
WHERE "tenantId" = $tenantId
AND "createdAt" >= NOW() - INTERVAL '30 days'
GROUP BY type, status;

-- Admission enquiry follow-up communications
SELECT * FROM "CommunicationLog"
WHERE "tenantId" = $tenantId
AND "admissionEnquiryId" = $enquiryId
ORDER BY "sentAt" DESC;
```

---

## Schema Design Principles

### 1. Multi-Tenant Isolation

**Principle**: Every table includes `tenantId` as the first foreign key

```sql
-- Every query filters by tenantId first
SELECT * FROM "Student" 
WHERE "tenantId" = $tenantId 
AND [other conditions];
```

**Benefit**: Complete data isolation between schools

### 2. UUID Primary Keys

**Principle**: All primary keys use UUID instead of auto-increment

```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
```

**Benefits**:
- Supports distributed systems
- No sequential ID leakage (privacy)
- Safe for public URLs
- Easier horizontal scaling

### 3. Soft Deletes

**Principle**: Use `isActive` boolean instead of hard delete

```sql
-- Soft delete
UPDATE "User" SET "isActive" = false WHERE id = $userId;

-- Query active records only
SELECT * FROM "User" 
WHERE "tenantId" = $tenantId AND "isActive" = true;
```

**Benefit**: Data preservation for audit trails

### 4. Timestamps

**Principle**: Every table has `created_at` and `updated_at`

```sql
"createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
"updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

**Benefit**: Complete audit trail and data lineage

### 5. Strategic Indexing

**Principle**: Index frequently queried columns

```sql
-- Tenant + status queries are common
CREATE INDEX idx_admission_tenantid ON "Admission"("tenantId");
CREATE INDEX idx_admission_status ON "Admission"(status);

-- Date range queries
CREATE INDEX idx_feepayment_paymentdate ON "FeePayment"("paymentDate");
```

**Benefit**: Fast query performance at scale

### 6. Configurable Fee Structures

**Principle**: Flexible fee definition with components

```
One Fee Structure Can Have:
├── Multiple Components (Tuition, Lab, Activity, etc.)
├── Multiple Installments (with different due dates)
├── Multiple frequency options (Annual, Semester, etc.)
└── Date-based activation (effectiveFrom, effectiveTo)
```

**Benefit**: Support any fee configuration without schema changes

### 7. Admission Pipeline

**Principle**: Multi-stage admission with status enum

```
Pipeline Flow:
Inquiry → Applied → Shortlisted → Admitted → Enrolled
                  ↓
                Rejected
                
Or: Inquiry → Applied → Waitlisted → Admitted → Enrolled
```

**Benefit**: Track students through entire admission process

---

## Key Relationships

### Student Enrollment Flow

```
Tenant
  └── School
      └── Course
          └── Class
              └── Student (enrolled via classId)
                  ├── StudentFeeInstallment
                  │   └── FeePayment
                  ├── Admission
                  │   └── Document
                  └── CommunicationLog
```

### Fee Management Flow

```
Class
  └── FeeStructure (per class, per academic year, per fee type)
      ├── FeeComponent (individual fee items)
      └── FeeInstallment (payment schedule)
          └── StudentFeeInstallment (per student)
              └── FeePayment (actual transactions)
                  └── Receipt
```

### Admission Workflow

```
AdmissionEnquiry
  ├── Document (supporting documents)
  ├── CommunicationLog (follow-ups)
  └── → Admission (when converted)
      ├── Document (required docs)
      └── CommunicationLog (status updates)
          └── → Student (when enrolled)
```

---

## Query Examples

### 1. Get Student's Complete Fee Summary

```sql
SELECT 
  s."enrollmentNo",
  s."firstName" || ' ' || s."lastName" as "studentName",
  c."className",
  COUNT(DISTINCT sfi.id) as "totalInstallments",
  SUM(sfi."dueAmount") as "totalDueAmount",
  SUM(sfi."paidAmount") as "totalPaidAmount",
  SUM(sfi."balanceAmount") as "balanceAmount",
  SUM(CASE WHEN sfi.status = 'PENDING' AND sfi."dueDate" < NOW() 
      THEN sfi."balanceAmount" ELSE 0 END) as "overdueAmount"
FROM "Student" s
JOIN "Class" c ON s."classId" = c.id
LEFT JOIN "StudentFeeInstallment" sfi ON s.id = sfi."studentId"
WHERE s."tenantId" = $tenantId
AND s."enrollmentNo" = $enrollmentNo
GROUP BY s.id, c.id;
```

### 2. Admission Pipeline Status Report

```sql
SELECT 
  a.status,
  COUNT(*) as "count",
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 2) as "percentage"
FROM "Admission" a
WHERE a."tenantId" = $tenantId
AND a."academicYear" = $academicYear
GROUP BY a.status
ORDER BY "count" DESC;
```

### 3. Class-wise Fee Collection Status

```sql
SELECT 
  c."className",
  COUNT(DISTINCT s.id) as "totalStudents",
  COALESCE(SUM(sfi."dueAmount"), 0) as "totalDue",
  COALESCE(SUM(sfi."paidAmount"), 0) as "totalCollected",
  COALESCE(SUM(sfi."balanceAmount"), 0) as "balancePending",
  ROUND(100.0 * COALESCE(SUM(sfi."paidAmount"), 0) / 
    NULLIF(COALESCE(SUM(sfi."dueAmount"), 0), 0), 2) as "collectionPercentage"
FROM "Class" c
LEFT JOIN "Student" s ON c.id = s."classId"
LEFT JOIN "StudentFeeInstallment" sfi ON s.id = sfi."studentId"
WHERE c."tenantId" = $tenantId
AND c."academicYear" = $academicYear
GROUP BY c.id
ORDER BY c."className";
```

### 4. Document Verification Status

```sql
SELECT 
  d."documentType",
  COUNT(*) as "total",
  COUNT(CASE WHEN d.status = 'PENDING' THEN 1 END) as "pending",
  COUNT(CASE WHEN d.status = 'UPLOADED' THEN 1 END) as "uploaded",
  COUNT(CASE WHEN d.status = 'VERIFIED' THEN 1 END) as "verified",
  COUNT(CASE WHEN d.status = 'REJECTED' THEN 1 END) as "rejected"
FROM "Document" d
WHERE d."tenantId" = $tenantId
AND d."studentId" IS NOT NULL
GROUP BY d."documentType"
ORDER BY "pending" DESC;
```

### 5. Communication Analytics

```sql
SELECT 
  type,
  status,
  DATE(CASE WHEN status = 'SENT' THEN "sentAt" 
            WHEN status = 'DELIVERED' THEN "deliveredAt"
            ELSE "createdAt" END) as date,
  COUNT(*) as count
FROM "CommunicationLog"
WHERE "tenantId" = $tenantId
AND "createdAt" >= NOW() - INTERVAL '30 days'
GROUP BY type, status, date
ORDER BY date DESC, type;
```

---

## Performance Considerations

### 1. Index Strategy

**Created Indexes**:
- `tenant_id` on all tables (required for multi-tenancy)
- `status` fields (used in WHERE clauses)
- `*_id` foreign keys
- Date fields for range queries

**Recommended Composite Indexes**:
```sql
-- For common "tenant + status" queries
CREATE INDEX idx_admission_tenant_status 
ON "Admission"("tenantId", status);

-- For date range queries within tenant
CREATE INDEX idx_feepayment_tenant_date 
ON "FeePayment"("tenantId", "paymentDate");

-- For finding overdue installments
CREATE INDEX idx_studentfeeinstallment_overdue 
ON "StudentFeeInstallment"("tenantId", "dueDate", status);
```

### 2. Denormalization

**Denormalized Fields for Performance**:
- `Student.age` - Calculated once during enrollment
- `FeeStructure.totalAmount` - Calculated sum
- `School.noOfStudents` - Updated on enrollment/deletion
- `StudentFeeInstallment.balanceAmount` - Calculated on payment

**Rationale**: Reduces join overhead for frequently accessed fields

### 3. Partitioning Strategy (Future)

For schools with 100,000+ students, consider partitioning:

```sql
-- Partition StudentFeeInstallment by tenant
CREATE TABLE IF NOT EXISTS "StudentFeeInstallment_2024"
  PARTITION OF "StudentFeeInstallment"
  FOR VALUES IN ($tenantId);
```

### 4. Archive Strategy

Move old data to archive tables:

```sql
-- Archive 2-year-old communication logs
DELETE FROM "CommunicationLog"
WHERE "tenantId" = $tenantId
AND "createdAt" < NOW() - INTERVAL '2 years'
AND archived = true;
```

### 5. Query Optimization Tips

```sql
-- GOOD: Filtered, indexed, limited results
SELECT * FROM "Student" 
WHERE "tenantId" = $tenantId 
AND "classId" = $classId
AND status = 'ACTIVE'
LIMIT 100;

-- BAD: No index on complex condition, might scan full table
SELECT * FROM "Student" 
WHERE YEAR("enrollmentDate") = 2024;

-- GOOD: Use indexed date comparison
SELECT * FROM "Student" 
WHERE "enrollmentDate" >= '2024-01-01' 
AND "enrollmentDate" < '2025-01-01';
```

---

## Migration from Previous Schema

If upgrading from the original schema (10 tables), follow this migration path:

```sql
-- 1. Create new tables with _v2 suffix
-- 2. Migrate data
-- 3. Validate data integrity
-- 4. Switch application to use new tables
-- 5. Archive old tables after success

-- Example migration:
INSERT INTO "Course_v2" 
SELECT * FROM "Course" WHERE "tenantId" = $tenantId;

-- Validate row counts
SELECT COUNT(*) FROM "Course";
SELECT COUNT(*) FROM "Course_v2";
```

---

## Conclusion

This schema provides a comprehensive, scalable foundation for a multi-tenant School ERP system. Key strengths:

✅ **Complete Multi-Tenancy**: Full data isolation  
✅ **Flexible Fee Management**: Supports any fee structure  
✅ **Admission Pipeline**: Multi-stage workflow support  
✅ **Document Management**: Centralized document storage  
✅ **Communication Tracking**: Complete audit trail  
✅ **Performance Optimized**: Strategic indexing and denormalization  
✅ **Future-Proof**: Easy to extend without schema changes
