import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@config/prisma.service';
import { Communication } from '@prisma/client';
import axios, { AxiosInstance } from 'axios';

export interface WhatsAppMessagePayload {
  to: string;
  type: 'template' | 'text';
  template?: {
    name: string;
    language: {
      code: string;
    };
    parameters?: {
      body?: {
        parameters: Array<{
          type: string;
          text?: string;
        }>;
      };
    };
  };
  text?: {
    body: string;
  };
}

export interface WhatsAppResponse {
  messages: Array<{
    id: string;
    message_status: string;
  }>;
}

@Injectable()
export class WhatsAppService {
  private logger = new Logger(WhatsAppService.name);
  private httpClient: AxiosInstance;
  private businessPhoneNumberId: string;
  private businessAccountId: string;
  private accessToken: string;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    this.accessToken = this.configService.get('WHATSAPP_ACCESS_TOKEN') || '';
    this.businessPhoneNumberId = this.configService.get('WHATSAPP_PHONE_NUMBER_ID') || '';
    this.businessAccountId = this.configService.get('WHATSAPP_BUSINESS_ACCOUNT_ID') || '';

    this.httpClient = axios.create({
      baseURL: 'https://graph.instagram.com/v18.0',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  }

  /**
   * Send WhatsApp message using template
   */
  async sendTemplateMessage(
    tenantId: string,
    schoolId: string,
    recipientPhone: string,
    templateName: string,
    templateVariables: string[] = [],
    studentId?: string,
    admissionId?: string,
  ): Promise<Communication> {
    const communicationRecord = await this.prisma.communication.create({
      data: {
        tenantId,
        schoolId,
        type: 'WHATSAPP',
        recipientPhone: this.formatPhoneNumber(recipientPhone),
        recipientName: recipientPhone,
        message: `Template: ${templateName}`,
        subject: `WhatsApp Template: ${templateName}`,
        status: 'PENDING',
        studentId,
        admissionId,
      },
    });

    try {
      const payload = this.buildTemplatePayload(
        this.formatPhoneNumber(recipientPhone),
        templateName,
        templateVariables,
      );

      this.logger.debug(`Sending WhatsApp template: ${templateName} to ${recipientPhone}`);

      const response = await this.httpClient.post<WhatsAppResponse>(
        `/${this.businessPhoneNumberId}/messages`,
        payload,
      );

      const messageId = response.data.messages[0]?.id;

      await this.prisma.communication.update({
        where: { id: communicationRecord.id },
        data: {
          status: 'SENT',
          externalId: messageId,
          sentAt: new Date(),
        },
      });

      this.logger.log(`WhatsApp template sent successfully. Message ID: ${messageId}`);

      return await this.prisma.communication.findUniqueOrThrow({
        where: { id: communicationRecord.id },
      });
    } catch (error) {
      this.logger.error(`Failed to send WhatsApp template: ${error.message}`, error.stack);

      const failureReason = error.response?.data?.error?.message || error.message;

      await this.prisma.communication.update({
        where: { id: communicationRecord.id },
        data: {
          status: 'FAILED',
          failureReason,
          retryCount: 0,
        },
      });

      throw new BadRequestException(`Failed to send WhatsApp message: ${failureReason}`);
    }
  }

  /**
   * Send simple text message
   */
  async sendTextMessage(
    tenantId: string,
    schoolId: string,
    recipientPhone: string,
    message: string,
    studentId?: string,
  ): Promise<Communication> {
    const communicationRecord = await this.prisma.communication.create({
      data: {
        tenantId,
        schoolId,
        type: 'WHATSAPP',
        recipientPhone: this.formatPhoneNumber(recipientPhone),
        recipientName: recipientPhone,
        message,
        subject: 'WhatsApp Message',
        status: 'PENDING',
        studentId,
      },
    });

    try {
      const payload: WhatsAppMessagePayload = {
        to: this.formatPhoneNumber(recipientPhone),
        type: 'text',
        text: {
          body: message,
        },
      };

      this.logger.debug(`Sending WhatsApp text message to ${recipientPhone}`);

      const response = await this.httpClient.post<WhatsAppResponse>(
        `/${this.businessPhoneNumberId}/messages`,
        payload,
      );

      const messageId = response.data.messages[0]?.id;

      await this.prisma.communication.update({
        where: { id: communicationRecord.id },
        data: {
          status: 'SENT',
          externalId: messageId,
          sentAt: new Date(),
        },
      });

      this.logger.log(`WhatsApp text message sent successfully. Message ID: ${messageId}`);

      return await this.prisma.communication.findUniqueOrThrow({
        where: { id: communicationRecord.id },
      });
    } catch (error) {
      this.logger.error(`Failed to send WhatsApp text message: ${error.message}`, error.stack);

      const failureReason = error.response?.data?.error?.message || error.message;

      await this.prisma.communication.update({
        where: { id: communicationRecord.id },
        data: {
          status: 'FAILED',
          failureReason,
        },
      });

      throw new BadRequestException(`Failed to send WhatsApp message: ${failureReason}`);
    }
  }

  /**
   * Queue message for asynchronous delivery
   */
  async queueMessage(
    tenantId: string,
    schoolId: string,
    recipientPhone: string,
    templateName: string,
    templateVariables?: string[],
    studentId?: string,
    admissionId?: string,
  ): Promise<Communication> {
    const communicationRecord = await this.prisma.communication.create({
      data: {
        tenantId,
        schoolId,
        type: 'WHATSAPP',
        recipientPhone: this.formatPhoneNumber(recipientPhone),
        recipientName: recipientPhone,
        message: `Template: ${templateName}`,
        subject: `WhatsApp Template: ${templateName}`,
        status: 'PENDING',
        studentId,
        admissionId,
        retryCount: 0,
        maxRetries: 3,
      },
    });

    this.logger.log(`Message queued for delivery. Communication ID: ${communicationRecord.id}`);

    return communicationRecord;
  }

  /**
   * Retry failed message
   */
  async retryMessage(communicationId: string): Promise<Communication> {
    const communication = await this.prisma.communication.findUnique({
      where: { id: communicationId },
    });

    if (!communication) {
      throw new BadRequestException('Communication record not found');
    }

    if (communication.status !== 'FAILED') {
      throw new BadRequestException('Only failed messages can be retried');
    }

    if (communication.retryCount >= communication.maxRetries) {
      throw new BadRequestException('Maximum retry attempts exceeded');
    }

    try {
      // Re-attempt sending the message
      const payload = this.buildTemplatePayload(
        communication.recipientPhone!,
        communication.subject.replace('WhatsApp Template: ', ''),
        [],
      );

      const response = await this.httpClient.post<WhatsAppResponse>(
        `/${this.businessPhoneNumberId}/messages`,
        payload,
      );

      const messageId = response.data.messages[0]?.id;

      const updated = await this.prisma.communication.update({
        where: { id: communicationId },
        data: {
          status: 'SENT',
          externalId: messageId,
          sentAt: new Date(),
          retryCount: communication.retryCount + 1,
        },
      });

      this.logger.log(`Message retried successfully. Attempt: ${updated.retryCount}`);

      return updated;
    } catch (error) {
      this.logger.error(`Retry attempt failed: ${error.message}`, error.stack);

      const failureReason = error.response?.data?.error?.message || error.message;

      const updated = await this.prisma.communication.update({
        where: { id: communicationId },
        data: {
          retryCount: communication.retryCount + 1,
          failureReason,
        },
      });

      if (updated.retryCount >= updated.maxRetries) {
        await this.prisma.communication.update({
          where: { id: communicationId },
          data: {
            status: 'FAILED',
          },
        });
      }

      throw new BadRequestException(`Retry failed: ${failureReason}`);
    }
  }

  /**
   * Handle webhook status updates from WhatsApp
   */
  async processWebhookUpdate(payload: any): Promise<void> {
    try {
      const entry = payload.entry?.[0]?.changes?.[0]?.value;
      if (!entry) return;

      // Handle message status updates
      if (entry.message_status_update_statuses) {
        for (const status of entry.message_status_update_statuses) {
          await this.updateMessageStatus(status.id, status.status);
        }
      }

      // Handle incoming messages
      if (entry.messages) {
        this.logger.log(`Incoming message received: ${JSON.stringify(entry.messages)}`);
        // Can be extended to handle incoming messages (e.g., customer replies)
      }
    } catch (error) {
      this.logger.error(`Error processing webhook: ${error.message}`, error.stack);
    }
  }

  /**
   * Update message status based on webhook
   */
  private async updateMessageStatus(externalId: string, status: string): Promise<void> {
    const statusMap: Record<string, any> = {
      sent: 'SENT',
      delivered: 'DELIVERED',
      read: 'DELIVERED',
      failed: 'FAILED',
    };

    const mappedStatus = statusMap[status] || status;

    await this.prisma.communication.updateMany({
      where: { externalId },
      data: {
        status: mappedStatus,
        ...(status === 'delivered' && { deliveredAt: new Date() }),
      },
    });

    this.logger.log(`Updated message status: ${externalId} -> ${mappedStatus}`);
  }

  /**
   * Get message delivery status
   */
  async getMessageStatus(communicationId: string): Promise<Communication | null> {
    return this.prisma.communication.findUnique({
      where: { id: communicationId },
    });
  }

  /**
   * Get failed messages for retry
   */
  async getFailedMessages(tenantId: string, schoolId: string): Promise<Communication[]> {
    return this.prisma.communication.findMany({
      where: {
        tenantId,
        schoolId,
        type: 'WHATSAPP',
        status: 'FAILED',
        retryCount: {
          lt: 3, // Less than max retries
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
      take: 100,
    });
  }

  /**
   * Verify WhatsApp credentials
   */
  async verifyCredentials(): Promise<boolean> {
    try {
      if (!this.accessToken || !this.businessPhoneNumberId) {
        return false;
      }

      const response = await this.httpClient.get(
        `/${this.businessPhoneNumberId}`,
      );

      return response.status === 200;
    } catch (error) {
      this.logger.error('WhatsApp credentials verification failed', error.message);
      return false;
    }
  }

  /**
   * Format phone number to E.164 format
   */
  private formatPhoneNumber(phoneNumber: string): string {
    // Remove all non-digit characters
    const digits = phoneNumber.replace(/\D/g, '');

    // If country code not present, assume India (+91)
    if (digits.length === 10) {
      return `91${digits}`;
    }

    // Return with country code
    if (digits.startsWith('91') && digits.length === 12) {
      return digits;
    }

    // If starts with 0, replace with country code
    if (digits.startsWith('0')) {
      return `91${digits.substring(1)}`;
    }

    return digits;
  }

  /**
   * Build template message payload
   */
  private buildTemplatePayload(
    phoneNumber: string,
    templateName: string,
    variables: string[] = [],
  ): WhatsAppMessagePayload {
    const parameters = variables.map(v => ({
      type: 'text',
      text: v,
    }));

    return {
      to: phoneNumber,
      type: 'template',
      template: {
        name: templateName,
        language: {
          code: 'en_US',
        },
        ...(parameters.length > 0 && {
          parameters: {
            body: {
              parameters,
            },
          },
        }),
      },
    };
  }
}
