import { IsString, IsNumber, IsOptional, IsEnum, IsArray, ValidateNested, IsDecimal, IsDate, IsDateString, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ========== COURSE CONFIGURATION ==========

export class CreateCourseDto {
  @ApiProperty({ example: 'Class X-A' })
  @IsString()
  courseName: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @Min(1)
  duration: number; // in years

  @ApiProperty({ example: '2025-2026' })
  @IsString()
  academicYear: string;

  @ApiPropertyOptional({ example: 'CBSE Board Class X' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateCourseDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  courseName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  duration?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}

export class CourseResponseDto {
  id: string;
  courseName: string;
  duration: number;
  academicYear: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ========== FEE STRUCTURE ==========

export class FeeComponentDto {
  @ApiProperty({ example: 'Tuition Fee' })
  @IsString()
  componentName: string;

  @ApiProperty({ example: '5000' })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiPropertyOptional({ example: 'Monthly tuition charge' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateFeeStructureDto {
  @ApiProperty({ example: 'CLASS_10_A' })
  @IsString()
  classSection: string;

  @ApiProperty({ example: '2025-2026' })
  @IsString()
  academicYear: string;

  @ApiProperty({
    example: [
      { componentName: 'Tuition Fee', amount: 5000 },
      { componentName: 'Admission Fee', amount: 2000 },
      { componentName: 'Transport Fee', amount: 1000 },
      { componentName: 'Lab Fee', amount: 500 },
    ],
    type: [FeeComponentDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FeeComponentDto)
  feeComponents: FeeComponentDto[];

  @ApiProperty({ example: 'MONTHLY', enum: ['MONTHLY', 'QUARTERLY', 'HALF_YEARLY', 'YEARLY'] })
  @IsEnum(['MONTHLY', 'QUARTERLY', 'HALF_YEARLY', 'YEARLY'])
  frequency: string;

  @ApiProperty({ example: 15 })
  @IsNumber()
  @Min(1)
  @Max(31)
  dueDate: number;

  @ApiPropertyOptional({ example: 'Annual fee for 2025-2026' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateFeeStructureDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FeeComponentDto)
  feeComponents?: FeeComponentDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(['MONTHLY', 'QUARTERLY', 'HALF_YEARLY', 'YEARLY'])
  frequency?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  dueDate?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}

export class FeeStructureResponseDto {
  id: string;
  classSection: string;
  academicYear: string;
  feeComponents: FeeComponentDto[];
  totalFeeAmount: number;
  frequency: string;
  dueDate: number;
  description?: string;
  status: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ========== INSTALLMENT PLANNING ==========

export class TermInstallmentDto {
  @ApiProperty({ example: 'Term 1' })
  @IsString()
  termName: string;

  @ApiProperty({ example: '2025-04-01' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2025-06-30' })
  @IsDateString()
  endDate: string;

  @ApiProperty({ example: 50 })
  @IsNumber()
  @Min(1)
  @Max(100)
  percentageAmount: number; // Percentage of total fee

  @ApiPropertyOptional({ example: '2025-06-15' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;
}

export class CreateInstallmentPlanDto {
  @ApiProperty({ example: 'feeStructureId' })
  @IsString()
  feeStructureId: string;

  @ApiProperty({
    example: [
      { termName: 'Term 1', startDate: '2025-04-01', endDate: '2025-06-30', percentageAmount: 50, dueDate: '2025-06-15' },
      { termName: 'Term 2', startDate: '2025-07-01', endDate: '2025-10-31', percentageAmount: 30, dueDate: '2025-10-15' },
      { termName: 'Term 3', startDate: '2025-11-01', endDate: '2026-03-31', percentageAmount: 20, dueDate: '2026-03-15' },
    ],
    type: [TermInstallmentDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TermInstallmentDto)
  terms: TermInstallmentDto[];
}

export class InstallmentResponseDto {
  id: string;
  feeStructureId: string;
  termName: string;
  startDate: Date;
  endDate: Date;
  percentageAmount: number;
  dueDate: Date;
  createdAt: Date;
}

// ========== STUDENT FEE ASSIGNMENT ==========

export class AssignFeeStructureDto {
  @ApiProperty({ example: 'studentId' })
  @IsString()
  studentId: string;

  @ApiProperty({ example: 'feeStructureId' })
  @IsString()
  feeStructureId: string;

  @ApiProperty({ example: '2025-2026' })
  @IsString()
  academicYear: string;

  @ApiPropertyOptional({ example: 'Special concession - scholarship' })
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class StudentFeeAssignmentResponseDto {
  id: string;
  studentId: string;
  studentName: string;
  feeStructureId: string;
  totalFeeAmount: number;
  academicYear: string;
  generatedInstallments: number;
  remarks?: string;
  status: string;
  assignedDate: Date;
}

// ========== PAYMENT RECORDING ==========

export class RecordPaymentDto {
  @ApiProperty({ example: 'feeRecordId' })
  @IsString()
  feeRecordId: string;

  @ApiProperty({ example: '5000' })
  @IsNumber()
  @Min(0.01)
  amountPaid: number;

  @ApiProperty({ example: 'BANK_TRANSFER', enum: ['CASH', 'CHEQUE', 'BANK_TRANSFER', 'DEBIT_CARD', 'CREDIT_CARD', 'UPI'] })
  @IsEnum(['CASH', 'CHEQUE', 'BANK_TRANSFER', 'DEBIT_CARD', 'CREDIT_CARD', 'UPI'])
  paymentMode: string;

  @ApiPropertyOptional({ example: 'TXN123456' })
  @IsOptional()
  @IsString()
  transactionReference?: string;

  @ApiPropertyOptional({ example: 'Payment via bank transfer' })
  @IsOptional()
  @IsString()
  remarks?: string;

  @ApiPropertyOptional({ example: '2025-04-10' })
  @IsOptional()
  @IsDateString()
  paymentDate?: string;
}

export class PaymentResponseDto {
  id: string;
  feeRecordId: string;
  studentId: string;
  studentName: string;
  amountPaid: number;
  paymentMode: string;
  transactionReference?: string;
  paymentDate: Date;
  receiptGenerated: boolean;
  receiptId?: string;
  remarks?: string;
  createdAt: Date;
}

// ========== RECEIPT GENERATION ==========

export class Receipt {
  receiptNumber: string;
  studentName: string;
  enrollmentNo: string;
  className: string;
  academicYear: string;
  feeType: string;
  termName?: string;
  totalAmount: number;
  amountPaid: number;
  paymentDate: Date;
  paymentMode: string;
  transactionReference?: string;
  balance: number;
  schoolName: string;
  schoolAddress: string;
  generatedDate: Date;
}

export class GenerateReceiptDto {
  @ApiProperty({ example: 'paymentRecordId' })
  @IsString()
  paymentRecordId: string;

  @ApiPropertyOptional({ example: 'FORMAT_PDF' })
  @IsOptional()
  @IsEnum(['FORMAT_PDF', 'FORMAT_EMAIL', 'FORMAT_SMS'])
  format?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  sendToParent?: boolean;
}

export class ReceiptResponseDto {
  id: string;
  receiptNumber: string;
  paymentId: string;
  studentId: string;
  totalAmount: number;
  amountPaid: number;
  receiptUrl: string;
  generatedDate: Date;
  sentToParent: boolean;
}

// ========== LIST AND FILTER DTOs ==========

export class FeeRecordListDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  skip?: number;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  take?: number;

  @ApiPropertyOptional({ example: 'PENDING' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ example: 'studentId' })
  @IsOptional()
  @IsString()
  studentId?: string;

  @ApiPropertyOptional({ example: '2025-2026' })
  @IsOptional()
  @IsString()
  academicYear?: string;

  @ApiPropertyOptional({ example: 'ASC' })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: string;
}

export class FeeRecordResponseDto {
  id: string;
  studentId: string;
  studentName: string;
  feeStructureId: string;
  academicYear: string;
  totalAmount: number;
  paidAmount: number;
  balance: number;
  status: string;
  dueDate: Date;
  paidDate?: Date;
  remarks?: string;
  createdAt: Date;
}

// ========== REMINDERS ==========

export class ScheduleDueReminderDto {
  @ApiPropertyOptional({ example: 'studentId' })
  @IsOptional()
  @IsString()
  studentId?: string;

  @ApiPropertyOptional({ example: 'CLASS_10_A' })
  @IsOptional()
  @IsString()
  classSection?: string;

  @ApiPropertyOptional({ example: 3 })
  @IsOptional()
  @IsNumber()
  daysBeforeDue?: number; // Send reminder N days before due date
}

export class DueReminderResponseDto {
  message: string;
  totalReminders: number;
  remindersSent: number;
  failedCount: number;
  sentAt: Date;
}

// ========== DASHBOARD STATISTICS ==========

export class FeeStatisticsDto {
  totalStudents: number;
  feeStructures: number;
  totalFeeAmount: number;
  totalCollected: number;
  totalPending: number;
  totalOverdue: number;
  collectionPercentage: number;
  statusBreakdown: {
    pending: number;
    partial: number;
    paid: number;
    overdue: number;
    cancelled: number;
  };
  academicYearWise: Array<{
    academicYear: string;
    totalFee: number;
    collected: number;
    pending: number;
  }>;
}

export class StudentFeeStatisticsDto {
  studentId: string;
  studentName: string;
  enrollmentNo: string;
  className: string;
  totalFeeDue: number;
  totalFeePaid: number;
  balance: number;
  status: string;
  overdueDays: number;
  installments: Array<{
    termName: string;
    dueDate: Date;
    amount: number;
    paid: number;
    status: string;
  }>;
}
