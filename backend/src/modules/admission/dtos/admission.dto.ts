import {
  IsString,
  IsEmail,
  IsOptional,
  IsEnum,
  IsUUID,
  IsDateString,
  IsPhoneNumber,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum DocumentType {
  AADHAR = 'AADHAR',
  BIRTH_CERTIFICATE = 'BIRTH_CERTIFICATE',
  TRANSFER_CERTIFICATE = 'TRANSFER_CERTIFICATE',
  VACCINATION_CERTIFICATE = 'VACCINATION_CERTIFICATE',
  CHARACTER_CERTIFICATE = 'CHARACTER_CERTIFICATE',
  PASSPORT = 'PASSPORT',
  PHOTOGRAPH = 'PHOTOGRAPH',
  PARENT_ID_PROOF = 'PARENT_ID_PROOF',
  ADDRESS_PROOF = 'ADDRESS_PROOF',
  INCOME_CERTIFICATE = 'INCOME_CERTIFICATE',
  MEDICAL_CERTIFICATE = 'MEDICAL_CERTIFICATE',
  OTHER = 'OTHER',
}

export enum DocumentStatus {
  PENDING = 'PENDING',
  UPLOADED = 'UPLOADED',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
}

// ========== CONVERT ENQUIRY TO ADMISSION DTO ==========

export class ConvertEnquiryToAdmissionDto {
  @ApiProperty({
    description: 'Student first name',
    example: 'John',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  firstName: string;

  @ApiProperty({
    description: 'Student last name',
    example: 'Doe',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  lastName: string;

  @ApiProperty({
    description: 'Student gender',
    enum: ['Male', 'Female', 'Other'],
  })
  @IsString()
  gender: string;

  @ApiProperty({
    description: 'Date of birth (YYYY-MM-DD)',
    example: '2010-05-15',
  })
  @IsDateString()
  dateOfBirth: string;

  @ApiPropertyOptional({
    description: 'Class assigned to',
    example: 'Class X-A',
  })
  @IsOptional()
  @IsString()
  assignedClass?: string;

  @ApiPropertyOptional({
    description: 'Assigned class ID',
  })
  @IsOptional()
  @IsUUID()
  classId?: string;

  @ApiPropertyOptional({
    description: 'Father name',
  })
  @IsOptional()
  @IsString()
  fatherName?: string;

  @ApiPropertyOptional({
    description: 'Father phone',
  })
  @IsOptional()
  @IsString()
  fatherPhone?: string;

  @ApiPropertyOptional({
    description: 'Father email',
  })
  @IsOptional()
  @IsEmail()
  fatherEmail?: string;

  @ApiPropertyOptional({
    description: 'Mother name',
  })
  @IsOptional()
  @IsString()
  motherName?: string;

  @ApiPropertyOptional({
    description: 'Mother phone',
  })
  @IsOptional()
  @IsString()
  motherPhone?: string;

  @ApiPropertyOptional({
    description: 'Mother email',
  })
  @IsOptional()
  @IsEmail()
  motherEmail?: string;

  @ApiPropertyOptional({
    description: 'Blood group',
    example: 'O+',
  })
  @IsOptional()
  @IsString()
  bloodGroup?: string;

  @ApiPropertyOptional({
    description: 'Aadhar number',
  })
  @IsOptional()
  @IsString()
  aadharNo?: string;

  @ApiPropertyOptional({
    description: 'Special needs',
  })
  @IsOptional()
  @IsString()
  specialNeeds?: string;

  @ApiPropertyOptional({
    description: 'Medical conditions',
  })
  @IsOptional()
  @IsString()
  medicalConditions?: string;
}

// ========== CREATE ADMISSION DTO ==========

export class CreateAdmissionDto {
  @ApiProperty({
    description: 'Student ID',
  })
  @IsUUID()
  studentId: string;

  @ApiProperty({
    description: 'Academic year',
    example: '2024-25',
  })
  @IsString()
  academicYear: string;

  @ApiPropertyOptional({
    description: 'Class applied for',
    example: 'Class X',
  })
  @IsOptional()
  @IsString()
  classAppliedFor?: string;

  @ApiPropertyOptional({
    description: 'Section',
    example: 'A',
  })
  @IsOptional()
  @IsString()
  section?: string;

  @ApiPropertyOptional({
    description: 'Previous school name',
  })
  @IsOptional()
  @IsString()
  previousSchool?: string;

  @ApiPropertyOptional({
    description: 'Previous class passed',
  })
  @IsOptional()
  @IsString()
  previousClassPassed?: string;

  @ApiPropertyOptional({
    description: 'Previous percentage',
    example: 85.5,
  })
  @IsOptional()
  previousPercentage?: number;

  @ApiPropertyOptional({
    description: 'Transfer certificate number',
  })
  @IsOptional()
  @IsString()
  transferCertificateNo?: string;

  @ApiPropertyOptional({
    description: 'Admission notes',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

// ========== UPDATE ADMISSION DTO ==========

export class UpdateAdmissionDto {
  @ApiPropertyOptional({
    description: 'Admission status',
    enum: ['INQUIRY', 'APPLIED', 'SHORTLISTED', 'ADMITTED', 'ENROLLED', 'REJECTED'],
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({
    description: 'Assigned class',
  })
  @IsOptional()
  @IsUUID()
  classId?: string;

  @ApiPropertyOptional({
    description: 'Approval notes',
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Rejection reason',
  })
  @IsOptional()
  @IsString()
  rejectionReason?: string;
}

// ========== DOCUMENT UPLOAD DTO ==========

export class DocumentUploadDto {
  @ApiProperty({
    description: 'Document type',
    enum: DocumentType,
  })
  @IsEnum(DocumentType)
  documentType: DocumentType;

  @ApiPropertyOptional({
    description: 'File URL or S3 path',
  })
  @IsOptional()
  @IsString()
  fileUrl?: string;

  @ApiPropertyOptional({
    description: 'Document remarks',
  })
  @IsOptional()
  @IsString()
  remarks?: string;

  @ApiPropertyOptional({
    description: 'Expiry date if applicable',
    example: '2026-12-31',
  })
  @IsOptional()
  @IsDateString()
  expiryDate?: string;
}

// ========== BULK DOCUMENT UPLOAD DTO ==========

export class BulkDocumentUploadDto {
  @ApiProperty({
    description: 'Array of documents to upload',
    type: [DocumentUploadDto],
  })
  documents: DocumentUploadDto[];
}

// ========== ADMISSION RESPONSE DTO ==========

export class AdmissionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  applicationNo: string;

  @ApiProperty()
  studentId: string;

  @ApiProperty()
  studentName?: string;

  @ApiProperty()
  enrollmentNo?: string;

  @ApiProperty()
  academicYear: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  classAppliedFor?: string;

  @ApiProperty()
  section?: string;

  @ApiProperty()
  applicationDate: Date;

  @ApiProperty()
  admissionDate?: Date;

  @ApiProperty()
  previousSchool?: string;

  @ApiProperty()
  previousPercentage?: number;

  @ApiProperty()
  medicalCheckupDone: boolean;

  @ApiProperty()
  notes?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

// ========== DOCUMENT RESPONSE DTO ==========

export class DocumentResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  documentType: DocumentType;

  @ApiProperty()
  fileName: string;

  @ApiProperty()
  fileUrl: string;

  @ApiProperty()
  status: DocumentStatus;

  @ApiProperty()
  remarks?: string;

  @ApiProperty()
  expiryDate?: Date;

  @ApiProperty()
  verificationDate?: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

// ========== ADMISSION SUMMARY RESPONSE DTO ==========

export class AdmissionSummaryResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  studentName: string;

  @ApiProperty()
  enrollmentNo: string;

  @ApiProperty()
  parentName: string;

  @ApiProperty()
  parentEmail: string;

  @ApiProperty()
  parentPhone: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  academicYear: string;

  @ApiProperty({ type: [DocumentResponseDto] })
  documents: DocumentResponseDto[];

  @ApiProperty()
  documentsUploaded: number;

  @ApiProperty()
  documentsVerified: number;

  @ApiProperty()
  documentsPending: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

// ========== STATISTICS DTO ==========

export class AdmissionStatisticsResponseDto {
  @ApiProperty()
  totalEnquiries: number;

  @ApiProperty()
  newEnquiries: number;

  @ApiProperty()
  interested: number;

  @ApiProperty()
  qualified: number;

  @ApiProperty()
  rejectedEnquiries: number;

  @ApiProperty()
  totalAdmissions: number;

  @ApiProperty()
  appliedAdmissions: number;

  @ApiProperty()
  admittedCount: number;

  @ApiProperty()
  enrolledCount: number;

  @ApiProperty()
  rejectedAdmissions: number;

  @ApiProperty()
  conversionRate: number;

  @ApiProperty()
  academicYear: string;
}

// ========== FOLLOW-UP RESPONSE DTO ==========

export class FollowUpHistoryResponseDto {
  @ApiProperty()
  enquiryId: string;

  @ApiProperty()
  enquiryNo: string;

  @ApiProperty()
  studentName: string;

  @ApiProperty()
  lastFollowUpDate: Date;

  @ApiProperty()
  nextFollowUpDate: Date;

  @ApiProperty()
  status: string;

  @ApiProperty()
  lastRemarks: string;

  @ApiProperty()
  interactionCount: number;
}

// ========== PENDING FOLLOW-UPS DTO ==========

export class PendingFollowUpsResponseDto {
  @ApiProperty()
  overdue: FollowUpHistoryResponseDto[];

  @ApiProperty()
  due: FollowUpHistoryResponseDto[];

  @ApiProperty()
  upcoming: FollowUpHistoryResponseDto[];

  @ApiProperty()
  total: number;
}

// ========== LIST DTOSFOR QUERIES ==========

export class AdmissionListDto {
  skip?: number;
  take?: number;
  status?: string;
  appliedDateFrom?: Date;
  appliedDateTo?: Date;
}
