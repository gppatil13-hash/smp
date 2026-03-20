import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../config/prisma.service';

export interface SendSmsDto {
  phoneNumber: string;
  message: string;
  studentId?: string;
  admissionEnquiryId?: string;
}

export interface SendWhatsAppDto {
  phoneNumber: string;
  message: string;
  studentId?: string;
  admissionEnquiryId?: string;
}

export interface SendEmailDto {
  email: string;
  subject: string;
  body: string;
  studentId?: string;
  admissionEnquiryId?: string;
}

@Injectable()
export class AdmissionCommunicationService {
  private readonly logger = new Logger(AdmissionCommunicationService.name);
  private twilio: any;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    this.initializeTwilio();
  }

  /**
   * Initialize Twilio (if configured)
   */
  private initializeTwilio(): void {
    const accountSid = this.configService.get('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get('TWILIO_AUTH_TOKEN');

    if (accountSid && authToken) {
      try {
        // const twilio = require('twilio');
        // this.twilio = twilio(accountSid, authToken);
        this.logger.log('Twilio initialized');
      } catch (error) {
        this.logger.warn('Twilio initialization failed, using mock mode');
      }
    }
  }

  /**
   * Send SMS to a student/parent
   */
  async sendSms(
    tenantId: string,
    dto: SendSmsDto,
  ): Promise<{ success: boolean; messageId: string; message: string }> {
    this.logger.log(`Sending SMS to ${dto.phoneNumber}`);

    try {
      // Create communication log entry
      const logEntry = await this.prisma.communicationLog.create({
        data: {
          tenantId,
          type: 'SMS',
          recipientType: 'STUDENT',
          parentPhone: dto.phoneNumber,
          message: dto.message,
          status: 'PENDING',
          studentId: dto.studentId,
          admissionEnquiryId: dto.admissionEnquiryId,
        },
      });

      // Send via Twilio (mock for now)
      const messageId = await this.sendViaTwilio(dto.phoneNumber, dto.message);

      // Update log entry with sent status
      await this.prisma.communicationLog.update({
        where: { id: logEntry.id },
        data: {
          status: 'SENT',
          sentAt: new Date(),
          externalId: messageId,
        },
      });

      return {
        success: true,
        messageId,
        message: 'SMS sent successfully',
      };
    } catch (error) {
      this.logger.error(`Failed to send SMS: ${error.message}`);

      // Log failure
      await this.prisma.communicationLog.create({
        data: {
          tenantId,
          type: 'SMS',
          recipientType: 'STUDENT',
          parentPhone: dto.phoneNumber,
          message: dto.message,
          status: 'FAILED',
          failureReason: error.message,
          studentId: dto.studentId,
          admissionEnquiryId: dto.admissionEnquiryId,
        },
      });

      return {
        success: false,
        messageId: '',
        message: error.message,
      };
    }
  }

  /**
   * Send WhatsApp message
   */
  async sendWhatsApp(
    tenantId: string,
    dto: SendWhatsAppDto,
  ): Promise<{ success: boolean; messageId: string; message: string }> {
    this.logger.log(`Sending WhatsApp to ${dto.phoneNumber}`);

    try {
      // Create communication log entry
      const logEntry = await this.prisma.communicationLog.create({
        data: {
          tenantId,
          type: 'WHATSAPP',
          recipientType: 'STUDENT',
          parentPhone: dto.phoneNumber,
          message: dto.message,
          status: 'PENDING',
          studentId: dto.studentId,
          admissionEnquiryId: dto.admissionEnquiryId,
        },
      });

      // Send via WhatsApp API (mock for now)
      const messageId = await this.sendViaWhatsApp(
        dto.phoneNumber,
        dto.message,
      );

      // Update log entry
      await this.prisma.communicationLog.update({
        where: { id: logEntry.id },
        data: {
          status: 'SENT',
          sentAt: new Date(),
          externalId: messageId,
        },
      });

      return {
        success: true,
        messageId,
        message: 'WhatsApp message sent successfully',
      };
    } catch (error) {
      this.logger.error(`Failed to send WhatsApp: ${error.message}`);

      // Log failure
      await this.prisma.communicationLog.create({
        data: {
          tenantId,
          type: 'WHATSAPP',
          recipientType: 'STUDENT',
          parentPhone: dto.phoneNumber,
          message: dto.message,
          status: 'FAILED',
          failureReason: error.message,
          studentId: dto.studentId,
          admissionEnquiryId: dto.admissionEnquiryId,
        },
      });

      return {
        success: false,
        messageId: '',
        message: error.message,
      };
    }
  }

  /**
   * Send Email
   */
  async sendEmail(
    tenantId: string,
    dto: SendEmailDto,
  ): Promise<{ success: boolean; messageId: string; message: string }> {
    this.logger.log(`Sending Email to ${dto.email}`);

    try {
      // Create communication log entry
      const logEntry = await this.prisma.communicationLog.create({
        data: {
          tenantId,
          type: 'EMAIL',
          recipientType: 'STUDENT',
          parentEmail: dto.email,
          subject: dto.subject,
          message: dto.body,
          status: 'PENDING',
          studentId: dto.studentId,
          admissionEnquiryId: dto.admissionEnquiryId,
        },
      });

      // Send via Email service (mock for now)
      const messageId = await this.sendViaEmail(
        dto.email,
        dto.subject,
        dto.body,
      );

      // Update log entry
      await this.prisma.communicationLog.update({
        where: { id: logEntry.id },
        data: {
          status: 'SENT',
          sentAt: new Date(),
          externalId: messageId,
        },
      });

      return {
        success: true,
        messageId,
        message: 'Email sent successfully',
      };
    } catch (error) {
      this.logger.error(`Failed to send Email: ${error.message}`);

      // Log failure
      await this.prisma.communicationLog.create({
        data: {
          tenantId,
          type: 'EMAIL',
          recipientType: 'STUDENT',
          parentEmail: dto.email,
          subject: dto.subject,
          message: dto.body,
          status: 'FAILED',
          failureReason: error.message,
          studentId: dto.studentId,
          admissionEnquiryId: dto.admissionEnquiryId,
        },
      });

      return {
        success: false,
        messageId: '',
        message: error.message,
      };
    }
  }

  /**
   * Send admission notification
   */
  async sendAdmissionNotification(
    tenantId: string,
    studentId: string,
    status: string,
    parentPhone: string,
    parentEmail?: string,
  ): Promise<void> {
    const messages = {
      ADMITTED: {
        sms: `Congratulations! Your admission is confirmed. Please visit the school office for final enrollment.`,
        email: `<h2>Admission Confirmed</h2><p>Your admission has been confirmed. Please visit the school office to complete the enrollment process.</p>`,
      },
      REJECTED: {
        sms: `We regret to inform you that your admission application has not been approved. For more details, please contact the school.`,
        email: `<h2>Admission Status Update</h2><p>We regret to inform you that your admission application could not be approved at this time.</p>`,
      },
      ENROLLED: {
        sms: `Welcome! Your ward is now enrolled in the school. Please complete the fee payment and submit required documents.`,
        email: `<h2>Enrollment Successful</h2><p>Your ward is now officially enrolled. Please complete fee payment and submit required documents.</p>`,
      },
    };

    const message = messages[status] || {
      sms: `Your admission status has been updated. Please check your admission portal for details.`,
      email: `<h2>Admission Status Update</h2><p>Your admission status has been updated. Please check your admission portal.</p>`,
    };

    // Send SMS if phone is available
    if (parentPhone) {
      await this.sendSms(tenantId, {
        phoneNumber: parentPhone,
        message: message.sms,
        studentId,
      });
    }

    // Send Email if email is available
    if (parentEmail) {
      await this.sendEmail(tenantId, {
        email: parentEmail,
        subject: 'Admission Status Update',
        body: message.email,
        studentId,
      });
    }
  }

  /**
   * Send follow-up reminder
   */
  async sendFollowUpReminder(
    tenantId: string,
    enquiryId: string,
    parentPhone: string,
    parentEmail?: string,
  ): Promise<void> {
    const smsMessage =
      'This is a reminder to proceed with your admission. Contact our admission team for more information.';
    const emailMessage =
      '<h2>Admission Follow-up</h2><p>We would like to remind you to complete your admission process. Please feel free to contact us for any assistance.</p>';

    if (parentPhone) {
      await this.sendSms(tenantId, {
        phoneNumber: parentPhone,
        message: smsMessage,
        admissionEnquiryId: enquiryId,
      });
    }

    if (parentEmail) {
      await this.sendEmail(tenantId, {
        email: parentEmail,
        subject: 'Admission Follow-up',
        body: emailMessage,
        admissionEnquiryId: enquiryId,
      });
    }
  }

  // ========== PRIVATE METHODS ==========

  /**
   * Send via Twilio (mock implementation)
   */
  private async sendViaTwilio(
    phoneNumber: string,
    message: string,
  ): Promise<string> {
    // In production, implement actual Twilio integration
    // const client = this.twilio;
    // const result = await client.messages.create({
    //   body: message,
    //   from: this.configService.get('TWILIO_PHONE_NUMBER'),
    //   to: phoneNumber,
    // });
    // return result.sid;

    // Mock implementation
    this.logger.log(`[MOCK SMS] Sent to ${phoneNumber}: ${message}`);
    return `mock-sms-${Date.now()}`;
  }

  /**
   * Send via WhatsApp API (mock implementation)
   */
  private async sendViaWhatsApp(
    phoneNumber: string,
    message: string,
  ): Promise<string> {
    // In production, implement actual WhatsApp Business API integration
    // Example with Meta WhatsApp Business API:
    // const token = this.configService.get('WHATSAPP_TOKEN');
    // const phoneNumberId = this.configService.get('WHATSAPP_PHONE_NUMBER_ID');
    // const response = await fetch(
    //   `https://graph.instagram.com/v18.0/${phoneNumberId}/messages`,
    //   {
    //     method: 'POST',
    //     headers: { Authorization: `Bearer ${token}` },
    //     body: JSON.stringify({
    //       messaging_product: 'whatsapp',
    //       to: phoneNumber,
    //       type: 'text',
    //       text: { body: message },
    //     }),
    //   }
    // );
    // const result = await response.json();
    // return result.messages[0].id;

    // Mock implementation
    this.logger.log(`[MOCK WHATSAPP] Sent to ${phoneNumber}: ${message}`);
    return `mock-whatsapp-${Date.now()}`;
  }

  /**
   * Send via Email service (mock implementation)
   */
  private async sendViaEmail(
    email: string,
    subject: string,
    body: string,
  ): Promise<string> {
    // In production, implement actual email service integration
    // Example with AWS SES, SendGrid, or Nodemailer
    // const transport = createTransport(...);
    // const result = await transport.sendMail({
    //   from: this.configService.get('EMAIL_FROM'),
    //   to: email,
    //   subject,
    //   html: body,
    // });
    // return result.messageId;

    // Mock implementation
    this.logger.log(`[MOCK EMAIL] Sent to ${email}, Subject: ${subject}`);
    return `mock-email-${Date.now()}`;
  }
}
