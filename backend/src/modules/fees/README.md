# Fees Management Module - Implementation Guide

## Module Overview

The Fees Management module is a comprehensive system for managing school fees with the following capabilities:

### Core Features

1. **Course Configuration** - Define courses/classes with capacity and duration
2. **Fee Structure** - Create flexible fee structures with multiple components
3. **Installment Planning** - Create term-based payment plans
4. **Student Fee Assignment** - Automatically assign fees and generate payment schedules
5. **Payment Recording** - Track payments with multiple payment modes
6. **Receipt Generation** - Generate PDF receipts for payments
7. **Due Reminders** - Automatic reminders for upcoming due payments
8. **Dashboard Statistics** - Comprehensive fee collection analytics

## Architecture

### Service Layer Structure

```
fees/
├── services/
│   ├── course.service.ts          (6 public methods)
│   ├── feestructure.service.ts    (7 public methods)
│   ├── installment.service.ts     (6 public methods)
│   ├── payment.service.ts         (5 public methods)
│   └── receipt.service.ts         (6 public methods)
├── controllers/
│   └── fees.controller.ts         (30+ endpoints)
├── dtos/
│   └── fees.dto.ts                (55+ DTOs)
├── fees.module.ts                 (5 service providers)
└── FEES_API_DOCUMENTATION.md
```

### Database Schema

**Key Tables**:
- `FeeStructure` - Fee structure master with components
- `FeeRecord` - Student fee records per term
- `Student` - Student records related to fees
- `ClassMaster` - Courses/classes
- `Communication` - Payment transaction logs
- `School` & `Tenant` - Multi-tenant data

**Relations**:
- FeeStructure → ClassMaster (course-wise structures)
- FeeRecord → Student (student fee records)
- FeeRecord → FeeStructure (component details)
- Communication → Student (payment notifications)

## Service Details

### 1. CourseService (course.service.ts)

**Purpose**: Manage courses/classes for fee assignment

**Public Methods**:

```typescript
createCourse(tenantId, schoolId, dto): Promise<CourseResponseDto>
// Create new course with name, section, academic year

getCourses(tenantId, schoolId, academicYear?): Promise<CourseList>
// List all courses with optional academic year filter

getCourseById(tenantId, courseId): Promise<CourseDetail>
// Get course with enrolled students count and details

updateCourse(tenantId, courseId, dto): Promise<CourseResponseDto>
// Update course information

deleteCourse(tenantId, courseId): Promise<DeleteResponse>
// Delete course (validates no enrolled students)

getCourseStatistics(tenantId, schoolId): Promise<CourseStats>
// Get course enrollment metrics and statistics
```

**Key Features**:
- Duplicate course validation
- Enrolled student validation before deletion
- Occupancy percentage calculation
- Academic year filtering

### 2. FeeStructureService (feeStructure.service.ts)

**Purpose**: Define fee structures with configurable components

**Public Methods**:

```typescript
createFeeStructure(tenantId, schoolId, dto): Promise<FeeStructureResponseDto>
// Create structure with components (Tuition, Admission, Transport, Lab, etc.)

getFeeStructures(tenantId, schoolId, academicYear?): Promise<StructureList>
// List structures with record counts

getFeeStructureById(tenantId, structureId): Promise<StructureDetail>
// Get structure with affected students and records

updateFeeStructure(tenantId, structureId, dto): Promise<FeeStructureResponseDto>
// Update structure (prevents component changes if active records exist)

getFeeStructureByClass(tenantId, schoolId, classSection, academicYear): Promise<StructureDetail>
// Get structure for specific class/section

deleteFeeStructure(tenantId, structureId): Promise<DeleteResponse>
// Delete if no active records exist

getFeeStructureStatistics(tenantId, schoolId): Promise<StructureStats>
// Get structure usage and component breakdown statistics
```

**Component Structure**:

```json
{
  "components": [
    {
      "componentName": "Tuition Fee",
      "amount": 3000,
      "description": "Monthly tuition fee"
    },
    {
      "componentName": "Lab Fee",
      "amount": 500
    }
  ]
}
```

**Supported Component Types**:
- Tuition Fee
- Admission Fee
- Transport Fee
- Lab Fee
- Library Fee
- Sports Fee
- Uniform Fee
- Computer Fee
- Examination Fee
- Development Fee

**Total Calculation**:
```
totalAmount = sum of all component.amount values
```

### 3. InstallmentService (installment.service.ts)

**Purpose**: Create and manage term-based installment plans

**Public Methods**:

```typescript
createInstallmentPlan(tenantId, schoolId, dto): Promise<InstallmentResponseDto>
// Create term-based plan with percentage distribution

getInstallmentPlan(tenantId, feeStructureId): Promise<TermArray>
// Get all terms for a fee structure

getInstallmentByTerm(tenantId, feeStructureId, termName): Promise<TermDetail>
// Get specific term with affected students

updateInstallmentPlan(tenantId, feeStructureId, newTerms): Promise<UpdateResponse>
// Update terms (validates percentage sum and no paid records)

generateFeeRecordsFromInstallments(tenantId, schoolId, feeStructureId): Promise<GenerationStats>
// Create fee records for all students in the course (one per term)

getInstallmentStatistics(tenantId, schoolId): Promise<InstallmentStats>
// Get term-wise collection statistics
```

**Term Structure**:

```typescript
interface Term {
  termName: string;              // "Term 1"
  startDate: Date;               // "2025-04-01"
  endDate: Date;                 // "2025-06-30"
  percentageAmount: number;      // 50 (out of 100)
  dueDate: Date;                 // "2025-06-15"
  amountDue?: number;            // Calculated: (totalAmount × percentage) / 100
}
```

**Default Installment Structure**:
```
Term 1: 50% (Apr-Jun)
Term 2: 30% (Jul-Oct)
Term 3: 20% (Nov-Mar)
Total: 100%
```

**Validation Rules**:
1. Percentage sum must equal exactly 100%
2. Term date ranges cannot overlap
3. startDate must be before endDate
4. Cannot update if records have PARTIAL or PAID status

**Fee Record Generation**:
- Creates 1 record per student per term
- Sets status: PENDING
- Calculates dueDate from term.dueDate
- Calculates totalAmount: (structure.totalAmount × percentage) / 100

### 4. PaymentService (payment.service.ts)

**Purpose**: Record and track student fee payments

**Public Methods**:

```typescript
recordPayment(tenantId, schoolId, dto): Promise<PaymentResponseDto>
// Record payment with validation

getPaymentHistory(tenantId, schoolId, studentId): Promise<PaymentHistory>
// Get all payments for a student with balance calculation

getPaymentDetails(tenantId, feeRecordId): Promise<PaymentDetail>
// Get single fee record payment status

getPaymentStatistics(tenantId, schoolId): Promise<PaymentStats>
// Get school-wide payment statistics

generatePaymentReminders(tenantId, schoolId, daysBefore): Promise<ReminderList>
// Get students with dues in next N days
```

**Payment Recording Logic**:

```typescript
Input: { amount: 2150, paymentMode: "BANK_TRANSFER", ... }

Validation:
- amount > 0
- amount ≤ (totalAmount - paidAmount)

Update Logic:
- newPaidAmount = paidAmount + amount
- if (newPaidAmount === totalAmount) then status = "PAID"
- else status = "PARTIAL"

Create Audit:
- Log to Communication table with payment details
```

**Status Transitions**:
```
PENDING → PARTIAL (when first payment made)
PENDING → PAID (if full payment)
PARTIAL → PAID (when remaining paid)
```

**Payment Modes** (from PaymentMode enum):
- CASH
- CHEQUE
- BANK_TRANSFER
- DEBIT_CARD
- CREDIT_CARD
- UPI

**Statistics Breakdown**:
```json
{
  "statusBreakdown": {
    "PENDING": 150,      // No payment
    "PARTIAL": 200,      // Some payment
    "PAID": 100,         // Full payment
    "OVERDUE": 0,        // Past due date
    "CANCELLED": 0       // Cancelled records
  },
  "paymentModeBreakdown": {
    "CASH": 50,
    "BANK_TRANSFER": 200
  },
  "monthlyCollection": {
    "2026-01": 150000,
    "2026-02": 170000
  },
  "collectionPercentage": 93.75
}
```

### 5. ReceiptService (receipt.service.ts)

**Purpose**: Generate and manage payment receipts

**Public Methods**:

```typescript
generateReceipt(tenantId, schoolId, paymentRecordId): Promise<ReceiptResponseDto>
// Generate receipt for a payment

getReceiptByNumber(tenantId, receiptNumber): Promise<ReceiptDetail>
// Retrieve receipt details

getReceiptHistory(tenantId, studentId): Promise<ReceiptHistory>
// Get all receipts for a student

sendReceipt(tenantId, schoolId, receiptNumber, method): Promise<SendResponse>
// Send receipt via EMAIL or SMS

bulkGenerateReceipts(tenantId, schoolId, classSection, academicYear): Promise<BulkStats>
// Generate receipts for entire class

getReceiptStatistics(tenantId, schoolId): Promise<ReceiptStats>
// Get receipt generation statistics
```

**Receipt Number Format**:
```
RCP-{YEAR}-{MONTH}-{RANDOM_6_DIGITS}
Example: RCP-2026-03-001234
```

**Receipt Content**:
```
School Name & Address
Student Name, Enrollment No
Class & Academic Year
Fee Type & Term
Amount Paid, Payment Date
Payment Mode, Transaction Reference
Receipt Number & Generation Date
```

**PDF Generation** (uses PDFKit):
```typescript
// Placeholder: Actual implementation would use pdfkit library
// generatePDF(receipt) returns path to generated PDF
// File stored: /receipts/{receiptNumber}.pdf
```

**Communication Integration**:
- Creates Communication log entry for each receipt
- Supports EMAIL and SMS sending methods
- Uses parent contact info from Student model

## DTO Validation

All DTOs use class-validator decorators:

```typescript
@IsString()
@IsNotEmpty()
@MinLength(3)
name: string;

@IsNumber()
@Min(0)
@Max(100)
percentageAmount: number;

@IsEnum(PaymentMode)
paymentMode: PaymentMode;

@ValidateNested()
@Type(() => FeeComponentDto)
components: FeeComponentDto[];
```

## Multi-tenant Implementation

All services ensure multi-tenant isolation:

```typescript
// Every query includes tenantId filter
const feeRecords = await this.prisma.feeRecord.findMany({
  where: {
    tenantId,        // CRITICAL: Tenant isolation
    schoolId,        // School-specific data
    studentId
  }
});
```

## Error Handling

Service methods throw specific errors:

```typescript
// NotFoundException
if (!feeStructure) {
  throw new NotFoundException(`Fee structure '${structureId}' not found`);
}

// BadRequestException
if (percentageSum !== 100) {
  throw new BadRequestException('Installment percentages must sum to 100%');
}
```

## Audit & Logging

Payment audit trail via Communication table:

```json
{
  "tenantId": "tenant_1",
  "schoolId": "school_1",
  "studentId": "student_1",
  "type": "EMAIL",
  "subject": "Payment Recorded",
  "message": "Payment of 2150 recorded. Balance: 2150",
  "status": "SENT"
}
```

## Integration Points

### With Admission Module
```typescript
// When student admitted:
await feeStructureService.assignStructure(student.classId, academicYear);
await installmentService.generateFeeRecordsFromInstallments();
```

### With Communication Module
```typescript
// Send reminders:
const reminders = await paymentService.generatePaymentReminders();
for (const reminder of reminders) {
  await communicationService.sendSMS(reminder.parentPhone, template);
  await communicationService.sendEmail(reminder.parentEmail, template);
}
```

### With Report Module
```typescript
// Get statistics for reports:
const stats = await paymentService.getPaymentStatistics();
const receipt_stats = await receiptService.getReceiptStatistics();
// Use for dashboard and reports
```

## Database Transactions

### Atomic Operations

Critical operations use transactions:

```typescript
// Fee record generation with rollback on error
async generateFeeRecordsFromInstallments() {
  return await this.prisma.$transaction(async (tx) => {
    // All DB operations within transaction
    for (const student of students) {
      for (const term of terms) {
        await tx.feeRecord.create({ ... });
      }
    }
  });
}
```

## Performance Considerations

1. **Indexing**: tenantId, schoolId, studentId, academicYear
2. **Pagination**: Use skip/take for large result sets
3. **Eager Loading**: Include related data to avoid N+1 queries
4. **Caching**: Cache fee structures and installments by academicYear

## Testing Strategy

### Unit Tests
- Service method isolation
- DTO validation
- Error scenarios
- Calculation logic

### Integration Tests
- Database operations
- Multi-tenant isolation
- Transactional integrity
- Related entity interactions

### E2E Tests
- Complete workflows (course → fee → payment → receipt)
- API endpoint validation
- Authorization checks
- Error responses

## Deployment Checklist

- [ ] Database migrations applied
- [ ] Prisma schema synchronized
- [ ] Service providers added to module
- [ ] Controller endpoints documented
- [ ] DTOs validated
- [ ] Error handling tested
- [ ] Multi-tenant isolation verified
- [ ] Authorization rules configured
- [ ] Receipt PDF library installed (pdfkit)
- [ ] Communication service integrated

## Future Enhancements

1. **Automated Reminders**: Implement scheduled reminders using Bull queue
2. **Payment Plans**: Support irregular payment schedules
3. **Late Fee**: Add automatic late fee calculation
4. **Refunds**: Implement refund processing workflow
5. **Financial Reports**: Generate detailed financial statements
6. **Parent Portal**: Self-service payment and receipt download
7. **Payment Gateway**: Integration with payment processors
8. **Advance Payments**: Handle advance/prepayment scenarios

## Code Examples

### Example 1: Create Fee Structure

```typescript
const feeStructure = await feeStructureService.createFeeStructure(
  tenantId,
  schoolId,
  {
    name: 'Class 10 - 2025-26',
    academicYear: '2025-2026',
    classSection: 'A',
    feeType: 'TUITION',
    frequency: 'MONTHLY',
    dueDate: 10,
    components: [
      { componentName: 'Tuition Fee', amount: 3000 },
      { componentName: 'Lab Fee', amount: 500 }
    ]
  }
);
// Returns structure_id: "structure_123"
```

### Example 2: Create Installment Plan

```typescript
const installment = await installmentService.createInstallmentPlan(
  tenantId,
  schoolId,
  {
    feeStructureId: 'structure_123',
    terms: [
      {
        termName: 'Term 1',
        startDate: '2025-04-01',
        endDate: '2025-06-30',
        percentageAmount: 50,
        dueDate: '2025-06-15'
      },
      // ... more terms
    ]
  }
);
// Total fee: 3500, Term 1 amount: 1750 (50%)
```

### Example 3: Record Payment

```typescript
const payment = await paymentService.recordPayment(
  tenantId,
  schoolId,
  {
    feeRecordId: 'record_123',
    amount: 1750,
    paymentMode: 'BANK_TRANSFER',
    transactionId: 'TXN-001'
  }
);
// Status: PAID (full payment), Balance: 0
```

### Example 4: Generate Receipt

```typescript
const receipt = await receiptService.generateReceipt(
  tenantId,
  schoolId,
  'record_123'
);
// Receipt: RCP-2026-03-001234.pdf
```

## Troubleshooting

### Issue: "Installment percentages must sum to 100%"
**Solution**: Verify all term percentages add up to exactly 100

### Issue: "Cannot update active fee structure"
**Solution**: Delete existing installments first, then update structure components

### Issue: "Fee record not found"
**Solution**: Ensure generateFeeRecordsFromInstallments was called after creating installment plan

### Issue: "No permission to record payment"
**Solution**: User must have SCHOOL_ADMIN or ACCOUNTS_TEAM role

---

## Contact & Support

For questions or issues with the Fees Management module, contact the development team.
