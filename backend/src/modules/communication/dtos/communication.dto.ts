export class SendSmsDto {
  recipientPhone: string;
  message: string;
  studentId?: string;
  admissionId?: string;
}

export class SendWhatsAppDto {
  recipientPhone: string;
  message: string;
  studentId?: string;
}

export class SendEmailDto {
  recipientEmail: string;
  subject: string;
  message: string;
  studentId?: string;
}

export class BulkCommunicationDto {
  type: string;
  recipients: string[];
  subject?: string;
  message: string;
  studentIds?: string[];
}

export class CommunicationListDto {
  skip?: number;
  take?: number;
  type?: string;
  status?: string;
}
