import {
  IsString,
  IsEmail,
  IsPhone,
  IsOptional,
  IsDateString,
  IsEnum,
  IsUUID,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum EnquirySource {
  WEBSITE = 'WEBSITE',
  REFERRAL = 'REFERRAL',
  WALKIN = 'WALKIN',
  PHONECALL = 'PHONECALL',
  SOCIALMED = 'SOCIALMED',
  ADVERTISEMENT = 'ADVERTISEMENT',
  OTHER = 'OTHER',
}

export enum EnquiryStatus {
  NEW = 'NEW',
  INTERESTED = 'INTERESTED',
  AWAITING_INFO = 'AWAITING_INFO',
  QUALIFIED = 'QUALIFIED',
  NOT_INTERESTED = 'NOT_INTERESTED',
  REJECTED = 'REJECTED',
}

// ========== CREATE ENQUIRY DTO ==========

export class CreateAdmissionEnquiryDto {
  @ApiProperty({
    description: 'Student name',
    example: 'John Doe',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  studentName: string;

  @ApiPropertyOptional({
    description: 'Student gender',
    example: 'Male',
    enum: ['Male', 'Female', 'Other'],
  })
  @IsOptional()
  @IsString()
  gender?: string;

  @ApiPropertyOptional({
    description: 'Date of birth',
    example: '2010-05-15',
  })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiProperty({
    description: 'Parent/Guardian name',
    example: 'Jane Doe',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  parentName: string;

  @ApiProperty({
    description: 'Parent email address',
    example: 'parent@example.com',
  })
  @IsEmail()
  parentEmail: string;

  @ApiProperty({
    description: 'Parent phone number',
    example: '+919876543210',
  })
  @IsString()
  @MinLength(10)
  @MaxLength(20)
  parentPhone: string;

  @ApiPropertyOptional({
    description: 'Class interested in',
    example: 'Class X',
  })
  @IsOptional()
  @IsString()
  interestedClass?: string;

  @ApiPropertyOptional({
    description: 'Address',
    example: '123 Main Street',
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({
    description: 'City',
    example: 'Mumbai',
  })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({
    description: 'State',
    example: 'Maharashtra',
  })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({
    description: 'Pincode',
    example: '400001',
  })
  @IsOptional()
  @IsString()
  pincode?: string;

  @ApiPropertyOptional({
    description: 'How did you know about us?',
    enum: EnquirySource,
    example: EnquirySource.WEBSITE,
  })
  @IsOptional()
  @IsEnum(EnquirySource)
  source?: EnquirySource;

  @ApiPropertyOptional({
    description: 'Additional remarks',
    example: 'Looking for scholarship',
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    description: 'School ID (if multiple schools)',
  })
  @IsOptional()
  @IsUUID()
  schoolId?: string;
}

// ========== UPDATE ENQUIRY DTO ==========

export class UpdateAdmissionEnquiryDto {
  @ApiPropertyOptional({
    description: 'Update parent email',
  })
  @IsOptional()
  @IsEmail()
  parentEmail?: string;

  @ApiPropertyOptional({
    description: 'Update parent phone',
  })
  @IsOptional()
  @IsString()
  parentPhone?: string;

  @ApiPropertyOptional({
    description: 'Update address details',
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({
    description: 'Update status',
    enum: EnquiryStatus,
  })
  @IsOptional()
  @IsEnum(EnquiryStatus)
  status?: EnquiryStatus;

  @ApiPropertyOptional({
    description: 'Update remarks',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

// ========== FOLLOW-UP DTO ==========

export class CreateFollowUpDto {
  @ApiProperty({
    description: 'Next follow-up date',
    example: '2024-04-20',
  })
  @IsDateString()
  followUpDate: string;

  @ApiProperty({
    description: 'Interaction remarks',
    example: 'Parent interested, need to send prospectus',
  })
  @IsString()
  @MinLength(5)
  remarks: string;

  @ApiPropertyOptional({
    description: 'Update current status',
    enum: EnquiryStatus,
  })
  @IsOptional()
  @IsEnum(EnquiryStatus)
  status?: EnquiryStatus;
}

// ========== LIST ENQUIRY DTO ==========

export class ListAdmissionEnquiryDto {
  @ApiPropertyOptional({
    description: 'Filter by status',
    enum: EnquiryStatus,
  })
  @IsOptional()
  @IsEnum(EnquiryStatus)
  status?: EnquiryStatus;

  @ApiPropertyOptional({
    description: 'Filter by source',
    enum: EnquirySource,
  })
  @IsOptional()
  @IsEnum(EnquirySource)
  source?: EnquirySource;

  @ApiPropertyOptional({
    description: 'Search by student name or parent name',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Page number',
    example: 1,
  })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({
    description: 'Records per page',
    example: 20,
  })
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({
    description: 'Sort by field',
    example: 'enquiryDate',
  })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['ASC', 'DESC'],
  })
  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC';
}

// ========== RESPONSE DTO ==========

export class AdmissionEnquiryResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  enquiryNo: string;

  @ApiProperty()
  studentName: string;

  @ApiProperty()
  parentName: string;

  @ApiProperty()
  parentEmail: string;

  @ApiProperty()
  parentPhone: string;

  @ApiProperty()
  interestedClass?: string;

  @ApiProperty()
  address?: string;

  @ApiProperty()
  city?: string;

  @ApiProperty()
  state?: string;

  @ApiProperty()
  pincode?: string;

  @ApiProperty({ enum: EnquiryStatus })
  status: EnquiryStatus;

  @ApiProperty({ enum: EnquirySource })
  source?: EnquirySource;

  @ApiProperty()
  notes?: string;

  @ApiProperty()
  followUpDate?: Date;

  @ApiProperty()
  isConverted: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class AdmissionEnquiryListResponseDto {
  @ApiProperty({ type: [AdmissionEnquiryResponseDto] })
  data: AdmissionEnquiryResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  pages: number;
}
