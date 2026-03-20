import { IsString, IsPhoneNumber, IsArray, IsOptional, IsEnum } from 'class-validator';

// ============================================================
// WhatsApp Message DTOs
// ============================================================

export class SendWhatsAppTemplateDto {
  @IsString()
  recipientPhone: string;

  @IsString()
  templateName: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  templateVariables?: string[];

  @IsString()
  @IsOptional()
  studentId?: string;

  @IsString()
  @IsOptional()
  admissionId?: string;
}

export class SendWhatsAppTextDto {
  @IsString()
  recipientPhone: string;

  @IsString()
  message: string;

  @IsString()
  @IsOptional()
  studentId?: string;
}

export class QueueWhatsAppMessageDto {
  @IsString()
  recipientPhone: string;

  @IsString()
  templateName: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  templateVariables?: string[];

  @IsString()
  @IsOptional()
  studentId?: string;

  @IsString()
  @IsOptional()
  admissionId?: string;
}

export class RetryMessageDto {
  @IsString()
  communicationId: string;
}

export class SendEnquiryAcknowledgementDto {
  @IsString()
  admissionId: string;

  @IsString()
  parentName: string;

  @IsString()
  parentPhone: string;

  @IsString()
  @IsOptional()
  schoolName?: string;

  @IsString()
  @IsOptional()
  counsellorName?: string;

  @IsString()
  @IsOptional()
  counsellorPhone?: string;
}

export class SendAdmissionConfirmationDto {
  @IsString()
  admissionId: string;

  @IsString()
  parentPhone: string;

  @IsString()
  studentName: string;

  @IsString()
  className: string;

  @IsString()
  @IsOptional()
  reportingDate?: string;

  @IsString()
  @IsOptional()
  additionalInfo?: string;
}

export class SendFeeReceiptDto {
  @IsString()
  studentId: string;

  @IsString()
  parentPhone: string;

  @IsString()
  studentName: string;

  @IsString()
  amount: string;

  @IsString()
  month: string;

  @IsString()
  @IsOptional()
  transactionId?: string;

  @IsString()
  @IsOptional()
  receiptUrl?: string;
}

export class SendFeeDueReminderDto {
  @IsString()
  studentId: string;

  @IsString()
  parentPhone: string;

  @IsString()
  studentName: string;

  @IsString()
  amount: string;

  @IsString()
  dueDate: string;

  @IsString()
  @IsOptional()
  feePortalLink?: string;
}

export class SendSchoolAnnouncementDto {
  @IsArray()
  @IsString({ each: true })
  recipientPhones: string[];

  @IsString()
  announcement: string;

  @IsString()
  @IsOptional()
  detailsLink?: string;

  @IsString()
  @IsOptional()
  announcementTitle?: string;
}

export class WhatsAppWebhookDto {
  entry: Array<{
    changes: Array<{
      value: {
        message_status_update_statuses?: Array<{
          id: string;
          status: string;
          timestamp: string;
        }>;
        messages?: Array<{
          from: string;
          id: string;
          timestamp: string;
          type: string;
          text?: { body: string };
        }>;
      };
    }>;
  }>;
}

// ============================================================
// Response DTOs
// ============================================================

export class WhatsAppMessageResponseDto {
  id: string;
  status: 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED';
  recipientPhone: string;
  externalId?: string;
  createdAt: Date;
}

export class MessageStatusDto {
  id: string;
  status: 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED';
  externalId?: string;
  failureReason?: string;
  sentAt?: Date;
  deliveredAt?: Date;
  retryCount: number;
}

export class BatchSendResponseDto {
  totalMessages: number;
  successCount: number;
  failureCount: number;
  messages: WhatsAppMessageResponseDto[];
}

export class TemplateListDto {
  id: string;
  name: string;
  displayName: string;
  category: string;
  variables: string[];
  description: string;
}

export class TemplatePreviewDto {
  templateName: string;
  preview: string;
}
