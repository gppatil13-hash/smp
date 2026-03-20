# Fees Management API Documentation

## Overview

The Fees Management module handles all fee-related operations in the School ERP system:

- **Course Configuration**: Define courses/classes with duration and academic year
- **Fee Structure Builder**: Create fee structures with configurable components (Tuition, Admission, Transport, Lab, etc.)
- **Installment Planning**: Create term-based payment plans (Term 1, Term 2, Term 3)
- **Student Fee Assignment**: Assign fee structures to students and generate payment schedules
- **Payment Recording**: Track student payments with multiple payment modes
- **Receipt Generation**: Generate and send PDF payment receipts
- **Due Reminders**: Automated payment reminders to parents

## Base URL

```
/api/fees
```

## Authentication

All endpoints require JWT authentication via Bearer token in Authorization header:

```
Authorization: Bearer <token>
```

## Role-Based Access Control

| Role | Access |
|------|--------|
| SCHOOL_ADMIN | All endpoints |
| ACCOUNTS_TEAM | All endpoints except course creation/deletion |
| TEACHER | View-only: courses, structures, installments |
| PARENT | View receipts and payment history |
| STUDENT | View own payment history |

---

## Course Management APIs

### 1. Create Course

**Endpoint**: `POST /fees/courses`

**Role**: SCHOOL_ADMIN

**Request Body**:
```json
{
  "name": "Class 10 - A",
  "section": "A",
  "academicYear": "2025-2026",
  "capacity": 40,
  "duration": 12,
  "description": "Class 10 Section A"
}
```

**Response** (201):
```json
{
  "id": "course_123",
  "name": "Class 10 - A",
  "section": "A",
  "academicYear": "2025-2026",
  "capacity": 40,
  "enrolledStudents": 35,
  "duration": 12,
  "createdAt": "2026-03-19T10:00:00Z"
}
```

### 2. Get All Courses

**Endpoint**: `GET /fees/courses?academicYear=2025-2026`

**Role**: SCHOOL_ADMIN, ACCOUNTS_TEAM, TEACHER

**Query Parameters**:
- `academicYear` (optional): Filter by academic year

**Response** (200):
```json
{
  "courses": [
    {
      "id": "course_123",
      "name": "Class 10 - A",
      "section": "A",
      "academicYear": "2025-2026",
      "capacity": 40,
      "enrolledStudents": 35
    }
  ],
  "total": 1
}
```

### 3. Get Course by ID

**Endpoint**: `GET /fees/courses/:courseId`

**Role**: SCHOOL_ADMIN, ACCOUNTS_TEAM, TEACHER

**Response** (200):
```json
{
  "id": "course_123",
  "name": "Class 10 - A",
  "section": "A",
  "academicYear": "2025-2026",
  "capacity": 40,
  "enrolledStudents": 35,
  "students": [
    {
      "id": "student_1",
      "name": "John Doe",
      "enrollmentNo": "E001"
    }
  ]
}
```

### 4. Update Course

**Endpoint**: `PUT /fees/courses/:courseId`

**Role**: SCHOOL_ADMIN

**Request Body**:
```json
{
  "name": "Class 10 - A (Updated)",
  "capacity": 45
}
```

**Response** (200):
```json
{
  "id": "course_123",
  "name": "Class 10 - A (Updated)",
  "capacity": 45,
  "message": "Course updated successfully"
}
```

### 5. Delete Course

**Endpoint**: `PATCH /fees/courses/:courseId/delete`

**Role**: SCHOOL_ADMIN

**Response** (200):
```json
{
  "message": "Course deleted successfully",
  "deletedCourseId": "course_123"
}
```

### 6. Get Course Statistics

**Endpoint**: `GET /fees/courses/stats/overview`

**Role**: SCHOOL_ADMIN, ACCOUNTS_TEAM

**Response** (200):
```json
{
  "totalCourses": 12,
  "totalStudents": 450,
  "averageStudentsPerCourse": 37.5,
  "courseWiseDetails": [
    {
      "courseId": "course_123",
      "name": "Class 10 - A",
      "capacity": 40,
      "enrolled": 35,
      "occupancyPercentage": 87.5
    }
  ]
}
```

---

## Fee Structure APIs

### 1. Create Fee Structure

**Endpoint**: `POST /fees/structures`

**Role**: SCHOOL_ADMIN, ACCOUNTS_TEAM

**Request Body**:
```json
{
  "name": "Class 10 Fee Structure 2025-26",
  "academicYear": "2025-2026",
  "classSection": "A",
  "feeType": "TUITION",
  "frequency": "MONTHLY",
  "dueDate": 10,
  "components": [
    {
      "componentName": "Tuition Fee",
      "amount": 3000,
      "description": "Monthly tuition fee"
    },
    {
      "componentName": "Lab Fee",
      "amount": 500,
      "description": "Laboratory facility charge"
    },
    {
      "componentName": "Transport Fee",
      "amount": 800,
      "description": "School bus transportation"
    }
  ]
}
```

**Response** (201):
```json
{
  "id": "structure_123",
  "name": "Class 10 Fee Structure 2025-26",
  "academicYear": "2025-2026",
  "classSection": "A",
  "totalAmount": 4300,
  "components": [
    {
      "componentName": "Tuition Fee",
      "amount": 3000
    },
    {
      "componentName": "Lab Fee",
      "amount": 500
    },
    {
      "componentName": "Transport Fee",
      "amount": 800
    }
  ],
  "createdAt": "2026-03-19T10:00:00Z"
}
```

### 2. Get All Fee Structures

**Endpoint**: `GET /fees/structures?academicYear=2025-2026`

**Role**: SCHOOL_ADMIN, ACCOUNTS_TEAM, TEACHER

**Query Parameters**:
- `academicYear` (optional): Filter by academic year

**Response** (200):
```json
{
  "structures": [
    {
      "id": "structure_123",
      "name": "Class 10 Fee Structure 2025-26",
      "totalAmount": 4300,
      "academicYear": "2025-2026",
      "affectedRecords": 35
    }
  ],
  "total": 1
}
```

### 3. Get Fee Structure by ID

**Endpoint**: `GET /fees/structures/:structureId`

**Role**: SCHOOL_ADMIN, ACCOUNTS_TEAM, TEACHER

**Response** (200):
```json
{
  "id": "structure_123",
  "name": "Class 10 Fee Structure 2025-26",
  "academicYear": "2025-2026",
  "classSection": "A",
  "totalAmount": 4300,
  "components": [
    {
      "componentName": "Tuition Fee",
      "amount": 3000
    }
  ],
  "affectedStudents": 35,
  "pendingRecords": 105
}
```

### 4. Update Fee Structure

**Endpoint**: `PUT /fees/structures/:structureId`

**Role**: SCHOOL_ADMIN, ACCOUNTS_TEAM

**Request Body**:
```json
{
  "components": [
    {
      "componentName": "Tuition Fee",
      "amount": 3200
    }
  ]
}
```

**Response** (200):
```json
{
  "id": "structure_123",
  "message": "Fee structure updated successfully",
  "totalAmount": 4500
}
```

### 5. Get Fee Structure by Class

**Endpoint**: `GET /fees/structures/class/A?academicYear=2025-2026`

**Role**: SCHOOL_ADMIN, ACCOUNTS_TEAM, TEACHER

**Response** (200):
```json
{
  "classSection": "A",
  "academicYear": "2025-2026",
  "structure": {
    "id": "structure_123",
    "name": "Class 10 Fee Structure 2025-26",
    "totalAmount": 4300
  }
}
```

### 6. Delete Fee Structure

**Endpoint**: `PATCH /fees/structures/:structureId/delete`

**Role**: SCHOOL_ADMIN, ACCOUNTS_TEAM

**Response** (200):
```json
{
  "message": "Fee structure deleted successfully",
  "deletedStructureId": "structure_123"
}
```

### 7. Get Fee Structure Statistics

**Endpoint**: `GET /fees/structures/stats/overview`

**Role**: SCHOOL_ADMIN, ACCOUNTS_TEAM

**Response** (200):
```json
{
  "totalStructures": 5,
  "totalStudentsAffected": 450,
  "averageFeeAmount": 4300,
  "frequencyBreakdown": {
    "MONTHLY": 3,
    "QUARTERLY": 2
  },
  "structures": [
    {
      "structureId": "structure_123",
      "name": "Class 10 Fee Structure 2025-26",
      "totalAmount": 4300,
      "affectedStudents": 35
    }
  ]
}
```

---

## Installment Planning APIs

### 1. Create Installment Plan

**Endpoint**: `POST /fees/installments`

**Role**: SCHOOL_ADMIN, ACCOUNTS_TEAM

**Request Body**:
```json
{
  "feeStructureId": "structure_123",
  "terms": [
    {
      "termName": "Term 1",
      "startDate": "2025-04-01",
      "endDate": "2025-06-30",
      "percentageAmount": 50,
      "dueDate": "2025-06-15"
    },
    {
      "termName": "Term 2",
      "startDate": "2025-07-01",
      "endDate": "2025-10-31",
      "percentageAmount": 30,
      "dueDate": "2025-10-15"
    },
    {
      "termName": "Term 3",
      "startDate": "2025-11-01",
      "endDate": "2026-03-31",
      "percentageAmount": 20,
      "dueDate": "2026-03-15"
    }
  ]
}
```

**Response** (201):
```json
{
  "feeStructureId": "structure_123",
  "terms": [
    {
      "termName": "Term 1",
      "percentageAmount": 50,
      "amountDue": 2150,
      "dueDate": "2025-06-15"
    },
    {
      "termName": "Term 2",
      "percentageAmount": 30,
      "amountDue": 1290,
      "dueDate": "2025-10-15"
    },
    {
      "termName": "Term 3",
      "percentageAmount": 20,
      "amountDue": 860,
      "dueDate": "2026-03-15"
    }
  ],
  "totalPercentage": 100,
  "createdAt": "2026-03-19T10:00:00Z"
}
```

### 2. Get Installment Plan

**Endpoint**: `GET /fees/installments/:feeStructureId`

**Role**: SCHOOL_ADMIN, ACCOUNTS_TEAM, TEACHER

**Response** (200):
```json
{
  "feeStructureId": "structure_123",
  "terms": [
    {
      "termName": "Term 1",
      "startDate": "2025-04-01",
      "endDate": "2025-06-30",
      "percentageAmount": 50,
      "amountDue": 2150,
      "dueDate": "2025-06-15"
    }
  ]
}
```

### 3. Get Term-wise Details

**Endpoint**: `GET /fees/installments/:feeStructureId/term/Term 1`

**Role**: SCHOOL_ADMIN, ACCOUNTS_TEAM, TEACHER

**Response** (200):
```json
{
  "feeStructureId": "structure_123",
  "termName": "Term 1",
  "percentageAmount": 50,
  "amountDue": 2150,
  "dueDate": "2025-06-15",
  "affectedStudents": 35
}
```

### 4. Update Installment Plan

**Endpoint**: `PUT /fees/installments/:feeStructureId`

**Role**: SCHOOL_ADMIN, ACCOUNTS_TEAM

**Request Body**:
```json
{
  "terms": [
    {
      "termName": "Term 1",
      "percentageAmount": 45,
      "dueDate": "2025-06-20"
    }
  ]
}
```

**Response** (200):
```json
{
  "message": "Installment plan updated successfully",
  "feeStructureId": "structure_123"
}
```

### 5. Generate Fee Records from Installments

**Endpoint**: `POST /fees/installments/:feeStructureId/generate-records`

**Role**: SCHOOL_ADMIN, ACCOUNTS_TEAM

**Response** (201):
```json
{
  "feeStructureId": "structure_123",
  "message": "Fee records generated successfully",
  "totalRecordsCreated": 105,
  "successCount": 105,
  "failureCount": 0,
  "timestamp": "2026-03-19T10:00:00Z"
}
```

### 6. Get Installment Statistics

**Endpoint**: `GET /fees/installments/stats/overview`

**Role**: SCHOOL_ADMIN, ACCOUNTS_TEAM

**Response** (200):
```json
{
  "totalStructures": 5,
  "totalTerms": 15,
  "averageNumberOfTerms": 3,
  "termDistribution": {
    "Term 1": {
      "count": 5,
      "averagePercentage": 50
    },
    "Term 2": {
      "count": 5,
      "averagePercentage": 30
    },
    "Term 3": {
      "count": 5,
      "averagePercentage": 20
    }
  },
  "structures": [
    {
      "structureId": "structure_123",
      "academicYear": "2025-2026",
      "termCount": 3,
      "totalAmount": 4300
    }
  ]
}
```

---

## Payment Recording APIs

### 1. Record Payment

**Endpoint**: `POST /fees/payments`

**Role**: SCHOOL_ADMIN, ACCOUNTS_TEAM

**Request Body**:
```json
{
  "feeRecordId": "record_123",
  "amount": 2150,
  "paymentMode": "BANK_TRANSFER",
  "transactionId": "TXN-2026-001",
  "paidDate": "2026-03-15"
}
```

**Response** (200):
```json
{
  "feeRecordId": "record_123",
  "studentName": "John Doe",
  "amountPaid": 2150,
  "totalAmount": 4300,
  "balanceRemaining": 2150,
  "paymentStatus": "PARTIAL",
  "paymentDate": "2026-03-15",
  "message": "Payment recorded successfully"
}
```

### 2. Get Payment History

**Endpoint**: `GET /fees/payments/student/:studentId`

**Role**: SCHOOL_ADMIN, ACCOUNTS_TEAM, PARENT

**Response** (200):
```json
{
  "studentId": "student_123",
  "studentName": "John Doe",
  "payments": [
    {
      "feeRecordId": "record_123",
      "academicYear": "2025-2026",
      "term": "Term 1",
      "totalAmount": 4300,
      "amountPaid": 2150,
      "balanceRemaining": 2150,
      "paymentDate": "2026-03-15",
      "paymentMode": "BANK_TRANSFER",
      "status": "PARTIAL"
    }
  ],
  "totalAmountDue": 2150,
  "totalAmountPaid": 2150
}
```

### 3. Get Payment Details

**Endpoint**: `GET /fees/payments/:feeRecordId`

**Role**: SCHOOL_ADMIN, ACCOUNTS_TEAM

**Response** (200):
```json
{
  "feeRecordId": "record_123",
  "studentName": "John Doe",
  "enrollmentNo": "E001",
  "academicYear": "2025-2026",
  "totalAmount": 4300,
  "amountPaid": 2150,
  "status": "PARTIAL",
  "dueDate": "2026-06-15",
  "overdueByDays": 10,
  "paymentDate": "2026-03-15",
  "paymentMode": "BANK_TRANSFER",
  "transactionReference": "TXN-2026-001"
}
```

### 4. Get Payment Statistics

**Endpoint**: `GET /fees/payments/stats/overview`

**Role**: SCHOOL_ADMIN, ACCOUNTS_TEAM

**Response** (200):
```json
{
  "totalRecords": 450,
  "statusBreakdown": {
    "PENDING": 150,
    "PARTIAL": 200,
    "PAID": 100,
    "OVERDUE": 0,
    "CANCELLED": 0
  },
  "totalCollected": 450000,
  "totalDue": 480000,
  "collectionPercentage": 93.75,
  "paymentModeBreakdown": {
    "CASH": 50,
    "CHEQUE": 30,
    "BANK_TRANSFER": 180,
    "DEBIT_CARD": 100,
    "CREDIT_CARD": 50,
    "UPI": 40
  },
  "monthlyCollection": {
    "2026-01": 150000,
    "2026-02": 170000,
    "2026-03": 130000
  }
}
```

### 5. Get Due Payment Reminders

**Endpoint**: `GET /fees/payments/reminders/due?daysBefore=3`

**Role**: SCHOOL_ADMIN, ACCOUNTS_TEAM

**Query Parameters**:
- `daysBefore` (optional, default: 3): Days before due date to show reminders

**Response** (200):
```json
{
  "remindersDue": [
    {
      "studentId": "student_123",
      "studentName": "John Doe",
      "parentName": "Jane Doe",
      "parentEmail": "jane@example.com",
      "parentPhone": "9876543210",
      "amountDue": 2150,
      "dueDate": "2026-03-22",
      "daysDue": 2,
      "term": "Term 1",
      "academicYear": "2025-2026"
    }
  ],
  "totalReminders": 45,
  "totalAmountDue": 96750
}
```

---

## Receipt APIs

### 1. Generate Receipt

**Endpoint**: `POST /fees/receipts/generate`

**Role**: SCHOOL_ADMIN, ACCOUNTS_TEAM

**Request Body**:
```json
{
  "paymentRecordId": "record_123"
}
```

**Response** (201):
```json
{
  "receiptNumber": "RCP-2026-03-001234",
  "studentName": "John Doe",
  "enrollmentNo": "E001",
  "amountPaid": 2150,
  "paymentDate": "2026-03-15",
  "pdfUrl": "/receipts/RCP-2026-03-001234.pdf",
  "generatedDate": "2026-03-19T10:00:00Z"
}
```

### 2. Get Receipt

**Endpoint**: `GET /fees/receipts/:receiptNumber`

**Role**: SCHOOL_ADMIN, ACCOUNTS_TEAM, PARENT

**Response** (200):
```json
{
  "receiptNumber": "RCP-2026-03-001234",
  "studentName": "John Doe",
  "enrollmentNo": "E001",
  "amountPaid": 2150,
  "paymentDate": "2026-03-15",
  "pdfUrl": "/receipts/RCP-2026-03-001234.pdf",
  "transactionReference": "TXN-2026-001"
}
```

### 3. Get Receipt History

**Endpoint**: `GET /fees/receipts/student/:studentId`

**Role**: SCHOOL_ADMIN, ACCOUNTS_TEAM, PARENT

**Response** (200):
```json
{
  "studentName": "John Doe",
  "enrollmentNo": "E001",
  "totalReceipts": 3,
  "totalAmountPaid": 6450,
  "receipts": [
    {
      "receiptNumber": "RCP-2026-03-001234",
      "academicYear": "2025-2026",
      "amountPaid": 2150,
      "paymentDate": "2026-03-15",
      "paymentMode": "BANK_TRANSFER",
      "pdfUrl": "/receipts/RCP-2026-03-001234.pdf"
    }
  ]
}
```

### 4. Send Receipt

**Endpoint**: `POST /fees/receipts/:receiptNumber/send?method=EMAIL`

**Role**: SCHOOL_ADMIN, ACCOUNTS_TEAM

**Query Parameters**:
- `method` (optional, default: EMAIL): EMAIL or SMS

**Response** (200):
```json
{
  "success": true,
  "message": "Receipt sent via EMAIL",
  "receiptNumber": "RCP-2026-03-001234",
  "sentDate": "2026-03-19T10:00:00Z"
}
```

### 5. Bulk Generate Receipts

**Endpoint**: `POST /fees/receipts/bulk-generate`

**Role**: SCHOOL_ADMIN, ACCOUNTS_TEAM

**Request Body**:
```json
{
  "classSection": "A",
  "academicYear": "2025-2026"
}
```

**Response** (201):
```json
{
  "classSection": "A",
  "academicYear": "2025-2026",
  "totalRecordsProcessed": 35,
  "successfullyGenerated": 35,
  "failed": 0,
  "generatedReceipts": [
    {
      "receiptNumber": "RCP-2026-03-001234",
      "studentName": "John Doe",
      "enrollmentNo": "E001",
      "amountPaid": 2150
    }
  ],
  "timestamp": "2026-03-19T10:00:00Z"
}
```

### 6. Get Receipt Statistics

**Endpoint**: `GET /fees/receipts/stats/overview`

**Role**: SCHOOL_ADMIN, ACCOUNTS_TEAM

**Response** (200):
```json
{
  "totalReceiptsGenerated": 450,
  "totalAmountCollected": 450000,
  "averageReceiptAmount": 1000,
  "paymentModeBreakdown": {
    "CASH": 50,
    "CHEQUE": 30,
    "BANK_TRANSFER": 180
  },
  "monthlyReceiptCount": {
    "2026-01": 150,
    "2026-02": 170,
    "2026-03": 130
  }
}
```

---

## Complete Workflow Examples

### Workflow 1: New Academic Year Setup

```
1. Create Course
   POST /fees/courses
   → Returns: course_123

2. Create Fee Structure for Course
   POST /fees/structures
   → Returns: structure_123

3. Create Installment Plan
   POST /fees/installments
   → Specifies: Term 1 (50%), Term 2 (30%), Term 3 (20%)

4. Generate Fee Records
   POST /fees/installments/structure_123/generate-records
   → Creates 105 fee records (35 students × 3 terms)

5. Students can now see due fees
```

### Workflow 2: Student Payment & Receipt

```
1. Record Payment
   POST /fees/payments
   → Marks fee as PARTIAL or PAID

2. Generate Receipt
   POST /fees/receipts/generate
   → Returns: receipt_number and PDF URL

3. Send Receipt
   POST /fees/receipts/:receiptNumber/send
   → Sends via EMAIL or SMS

4. Parent receives receipt
```

### Workflow 3: Monthly Reminders

```
1. Query due reminders
   GET /fees/payments/reminders/due?daysBefore=3

2. Get reminder details
   → Student info, parent contact, amount due

3. Send via Communication Service
   → SMS/Email to parents

4. Update status after payment
```

---

## Error Responses

### 400 Bad Request

```json
{
  "statusCode": 400,
  "message": "Invalid input data",
  "error": "BadRequestException"
}
```

### 404 Not Found

```json
{
  "statusCode": 404,
  "message": "Fee record 'record_123' not found",
  "error": "NotFoundException"
}
```

### 401 Unauthorized

```json
{
  "statusCode": 401,
  "message": "Unauthorized access",
  "error": "UnauthorizedException"
}
```

### 403 Forbidden

```json
{
  "statusCode": 403,
  "message": "Insufficient permissions",
  "error": "ForbiddenException"
}
```

---

## Payment Modes

| Mode | Code |
|------|------|
| Cash | CASH |
| Cheque | CHEQUE |
| Bank Transfer | BANK_TRANSFER |
| Debit Card | DEBIT_CARD |
| Credit Card | CREDIT_CARD |
| UPI | UPI |

## Fee Status

| Status | Description |
|--------|-------------|
| PENDING | No payment made |
| PARTIAL | Partial payment made |
| PAID | Full payment received |
| OVERDUE | Payment overdue |
| CANCELLED | Fee cancelled |

## Frequency Types

| Type | Description |
|------|-------------|
| MONTHLY | Monthly payment |
| QUARTERLY | Quarterly payment |
| HALF_YEARLY | Half-yearly payment |
| YEARLY | Annual payment |

---

## Implementation Notes

1. **Multi-tenant**: All endpoints are tenant-isolated using tenantId
2. **School-specific**: All data is school-specific using schoolId
3. **Audit trail**: Payment transactions are logged in Communication table
4. **PDF Generation**: Uses PDFKit library for receipt generation
5. **Validation**: All inputs validated using class-validator decorators
6. **Authorization**: Role-based access control on all endpoints

---

## Integration Points

- **Admission Module**: Assign default fee structure on student enrollment
- **Communication Module**: Send reminders and receipts via SMS/Email
- **Notification Module**: Real-time payment notifications
- **Report Module**: Fee collection reports and analysis
