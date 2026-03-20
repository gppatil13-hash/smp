import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtAuthGuard } from '@auth/guards/jwt.guard';
import { GetTenantId } from '@auth/decorators/get-tenant-id.decorator';
import { GetUserId } from '@auth/decorators/get-user-id.decorator';
import { WhatsAppService } from '../services/whatsapp.service';
import { MessageTemplateService } from '../services/message-template.service';
import {
  SendWhatsAppTemplateDto,
  SendWhatsAppTextDto,
  QueueWhatsAppMessageDto,
  RetryMessageDto,
  SendEnquiryAcknowledgementDto,
  SendAdmissionConfirmationDto,
  SendFeeReceiptDto,
  SendFeeDueReminderDto,
  SendSchoolAnnouncementDto,
  WhatsAppWebhookDto,
  WhatsAppMessageResponseDto,
  MessageStatusDto,
  BatchSendResponseDto,
  TemplateListDto,
  TemplatePreviewDto,
} from '../dtos/whatsapp.dto.ts';

@Controller('communication/whatsapp')
export class WhatsAppController {
  private logger = new Logger(WhatsAppController.name);

  constructor(
    private whatsAppService: WhatsAppService,
    private templateService: MessageTemplateService,
  ) {}

  // ============================================================
  // Core WhatsApp Messaging Endpoints
  // ============================================================

  /**
   * Send WhatsApp template message
   * POST /communication/whatsapp/send-template
   */
  @Post('send-template')
  @UseGuards(JwtAuthGuard)
  async sendTemplateMessage(
    @GetTenantId() tenantId: string,
    @Query('schoolId') schoolId: string,
    @Body() dto: SendWhatsAppTemplateDto,
  ): Promise<WhatsAppMessageResponseDto> {
    if (!schoolId) {
      throw new BadRequestException('schoolId query parameter is required');
    }

    try {
      const result = await this.whatsAppService.sendTemplateMessage(
        tenantId,
        schoolId,
        dto.recipientPhone,
        dto.templateName,
        dto.templateVariables,
        dto.studentId,
        dto.admissionId,
      );

      return {
        id: result.id,
        status: result.status as any,
        recipientPhone: result.recipientPhone!,
        externalId: result.externalId || undefined,
        createdAt: result.createdAt,
      };
    } catch (error) {
      this.logger.error(`Failed to send template message: ${error.message}`);
      throw error;
    }
  }

  /**
   * Send WhatsApp text message
   * POST /communication/whatsapp/send-text
   */
  @Post('send-text')
  @UseGuards(JwtAuthGuard)
  async sendTextMessage(
    @GetTenantId() tenantId: string,
    @Query('schoolId') schoolId: string,
    @Body() dto: SendWhatsAppTextDto,
  ): Promise<WhatsAppMessageResponseDto> {
    if (!schoolId) {
      throw new BadRequestException('schoolId query parameter is required');
    }

    try {
      const result = await this.whatsAppService.sendTextMessage(
        tenantId,
        schoolId,
        dto.recipientPhone,
        dto.message,
        dto.studentId,
      );

      return {
        id: result.id,
        status: result.status as any,
        recipientPhone: result.recipientPhone!,
        externalId: result.externalId || undefined,
        createdAt: result.createdAt,
      };
    } catch (error) {
      this.logger.error(`Failed to send text message: ${error.message}`);
      throw error;
    }
  }

  /**
   * Queue message for asynchronous delivery
   * POST /communication/whatsapp/queue
   */
  @Post('queue')
  @UseGuards(JwtAuthGuard)
  async queueMessage(
    @GetTenantId() tenantId: string,
    @Query('schoolId') schoolId: string,
    @Body() dto: QueueWhatsAppMessageDto,
  ): Promise<WhatsAppMessageResponseDto> {
    if (!schoolId) {
      throw new BadRequestException('schoolId query parameter is required');
    }

    try {
      const result = await this.whatsAppService.queueMessage(
        tenantId,
        schoolId,
        dto.recipientPhone,
        dto.templateName,
        dto.templateVariables,
        dto.studentId,
        dto.admissionId,
      );

      return {
        id: result.id,
        status: result.status as any,
        recipientPhone: result.recipientPhone!,
        externalId: result.externalId || undefined,
        createdAt: result.createdAt,
      };
    } catch (error) {
      this.logger.error(`Failed to queue message: ${error.message}`);
      throw error;
    }
  }

  /**
   * Retry failed message
   * POST /communication/whatsapp/retry/:communicationId
   */
  @Post('retry/:communicationId')
  @UseGuards(JwtAuthGuard)
  async retryMessage(
    @Param('communicationId') communicationId: string,
  ): Promise<MessageStatusDto> {
    try {
      const result = await this.whatsAppService.retryMessage(communicationId);

      return {
        id: result.id,
        status: result.status as any,
        externalId: result.externalId || undefined,
        failureReason: result.failureReason || undefined,
        sentAt: result.sentAt || undefined,
        deliveredAt: result.deliveredAt || undefined,
        retryCount: result.retryCount,
      };
    } catch (error) {
      this.logger.error(`Failed to retry message: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get message status
   * GET /communication/whatsapp/status/:communicationId
   */
  @Get('status/:communicationId')
  @UseGuards(JwtAuthGuard)
  async getMessageStatus(
    @Param('communicationId') communicationId: string,
  ): Promise<MessageStatusDto> {
    const result = await this.whatsAppService.getMessageStatus(communicationId);

    if (!result) {
      throw new BadRequestException('Message not found');
    }

    return {
      id: result.id,
      status: result.status as any,
      externalId: result.externalId || undefined,
      failureReason: result.failureReason || undefined,
      sentAt: result.sentAt || undefined,
      deliveredAt: result.deliveredAt || undefined,
      retryCount: result.retryCount,
    };
  }

  // ============================================================
  // Specific Use Case Endpoints
  // ============================================================

  /**
   * Send enquiry acknowledgement
   * POST /communication/whatsapp/send-enquiry-acknowledgement
   */
  @Post('send-enquiry-acknowledgement')
  @UseGuards(JwtAuthGuard)
  async sendEnquiryAcknowledgement(
    @GetTenantId() tenantId: string,
    @Query('schoolId') schoolId: string,
    @Body() dto: SendEnquiryAcknowledgementDto,
  ): Promise<WhatsAppMessageResponseDto> {
    if (!schoolId) {
      throw new BadRequestException('schoolId query parameter is required');
    }

    try {
      const result = await this.whatsAppService.sendTemplateMessage(
        tenantId,
        schoolId,
        dto.parentPhone,
        'enquiry_acknowledgement',
        [
          dto.parentName,
          dto.schoolName || 'Our School',
          dto.counsellorName || 'Our Counselor',
          dto.counsellorPhone || 'contact us',
        ],
        undefined,
        dto.admissionId,
      );

      return {
        id: result.id,
        status: result.status as any,
        recipientPhone: result.recipientPhone!,
        externalId: result.externalId || undefined,
        createdAt: result.createdAt,
      };
    } catch (error) {
      this.logger.error(`Failed to send enquiry acknowledgement: ${error.message}`);
      throw error;
    }
  }

  /**
   * Send admission confirmation
   * POST /communication/whatsapp/send-admission-confirmation
   */
  @Post('send-admission-confirmation')
  @UseGuards(JwtAuthGuard)
  async sendAdmissionConfirmation(
    @GetTenantId() tenantId: string,
    @Query('schoolId') schoolId: string,
    @Body() dto: SendAdmissionConfirmationDto,
  ): Promise<WhatsAppMessageResponseDto> {
    if (!schoolId) {
      throw new BadRequestException('schoolId query parameter is required');
    }

    try {
      const result = await this.whatsAppService.sendTemplateMessage(
        tenantId,
        schoolId,
        dto.parentPhone,
        'admission_confirmation',
        [
          dto.studentName,
          dto.className,
          dto.additionalInfo || '',
          dto.reportingDate || 'upcoming',
        ],
        undefined,
        dto.admissionId,
      );

      return {
        id: result.id,
        status: result.status as any,
        recipientPhone: result.recipientPhone!,
        externalId: result.externalId || undefined,
        createdAt: result.createdAt,
      };
    } catch (error) {
      this.logger.error(`Failed to send admission confirmation: ${error.message}`);
      throw error;
    }
  }

  /**
   * Send fee receipt
   * POST /communication/whatsapp/send-fee-receipt
   */
  @Post('send-fee-receipt')
  @UseGuards(JwtAuthGuard)
  async sendFeeReceipt(
    @GetTenantId() tenantId: string,
    @Query('schoolId') schoolId: string,
    @Body() dto: SendFeeReceiptDto,
  ): Promise<WhatsAppMessageResponseDto> {
    if (!schoolId) {
      throw new BadRequestException('schoolId query parameter is required');
    }

    try {
      const result = await this.whatsAppService.sendTemplateMessage(
        tenantId,
        schoolId,
        dto.parentPhone,
        'fee_receipt',
        [
          dto.studentName,
          dto.amount,
          dto.month,
          dto.transactionId || 'N/A',
          dto.receiptUrl || 'Contact office for receipt',
        ],
        dto.studentId,
      );

      return {
        id: result.id,
        status: result.status as any,
        recipientPhone: result.recipientPhone!,
        externalId: result.externalId || undefined,
        createdAt: result.createdAt,
      };
    } catch (error) {
      this.logger.error(`Failed to send fee receipt: ${error.message}`);
      throw error;
    }
  }

  /**
   * Send fee due reminder
   * POST /communication/whatsapp/send-fee-reminder
   */
  @Post('send-fee-reminder')
  @UseGuards(JwtAuthGuard)
  async sendFeeDueReminder(
    @GetTenantId() tenantId: string,
    @Query('schoolId') schoolId: string,
    @Body() dto: SendFeeDueReminderDto,
  ): Promise<WhatsAppMessageResponseDto> {
    if (!schoolId) {
      throw new BadRequestException('schoolId query parameter is required');
    }

    try {
      const result = await this.whatsAppService.sendTemplateMessage(
        tenantId,
        schoolId,
        dto.parentPhone,
        'fee_due_reminder',
        [
          dto.studentName,
          dto.amount,
          dto.dueDate,
          dto.feePortalLink || 'Contact office for payment details',
        ],
        dto.studentId,
      );

      return {
        id: result.id,
        status: result.status as any,
        recipientPhone: result.recipientPhone!,
        externalId: result.externalId || undefined,
        createdAt: result.createdAt,
      };
    } catch (error) {
      this.logger.error(`Failed to send fee reminder: ${error.message}`);
      throw error;
    }
  }

  /**
   * Send school announcement
   * POST /communication/whatsapp/send-announcement
   */
  @Post('send-announcement')
  @UseGuards(JwtAuthGuard)
  async sendAnnouncement(
    @GetTenantId() tenantId: string,
    @Query('schoolId') schoolId: string,
    @Body() dto: SendSchoolAnnouncementDto,
  ): Promise<BatchSendResponseDto> {
    if (!schoolId) {
      throw new BadRequestException('schoolId query parameter is required');
    }

    try {
      const results: WhatsAppMessageResponseDto[] = [];
      let successCount = 0;
      let failureCount = 0;

      for (const phone of dto.recipientPhones) {
        try {
          const result = await this.whatsAppService.sendTemplateMessage(
            tenantId,
            schoolId,
            phone,
            'school_announcement',
            [dto.announcement, dto.detailsLink || 'N/A'],
          );

          results.push({
            id: result.id,
            status: result.status as any,
            recipientPhone: result.recipientPhone!,
            externalId: result.externalId || undefined,
            createdAt: result.createdAt,
          });

          successCount++;
        } catch (error) {
          failureCount++;
          this.logger.error(`Failed to send announcement to ${phone}: ${error.message}`);
        }
      }

      return {
        totalMessages: dto.recipientPhones.length,
        successCount,
        failureCount,
        messages: results,
      };
    } catch (error) {
      this.logger.error(`Failed to send announcements: ${error.message}`);
      throw error;
    }
  }

  // ============================================================
  // Template Management Endpoints
  // ============================================================

  /**
   * Get all available templates
   * GET /communication/whatsapp/templates
   */
  @Get('templates')
  async getTemplates(): Promise<TemplateListDto[]> {
    const templates = this.templateService.getAllTemplates();

    return templates.map(t => ({
      id: t.name,
      name: t.name,
      displayName: t.displayName,
      category: t.category,
      variables: t.variables,
      description: t.description,
    }));
  }

  /**
   * Get templates by category
   * GET /communication/whatsapp/templates?category=fees
   */
  @Get('templates/category/:category')
  async getTemplatesByCategory(
    @Param('category') category: 'enquiry' | 'admission' | 'fees' | 'announcement',
  ): Promise<TemplateListDto[]> {
    const templates = this.templateService.getTemplatesByCategory(category);

    return templates.map(t => ({
      id: t.name,
      name: t.name,
      displayName: t.displayName,
      category: t.category,
      variables: t.variables,
      description: t.description,
    }));
  }

  /**
   * Get template preview
   * POST /communication/whatsapp/templates/preview
   */
  @Post('templates/preview')
  async getTemplatePreview(
    @Body()
    body: {
      templateName: string;
      variables: Record<string, string>;
    },
  ): Promise<TemplatePreviewDto> {
    const preview = this.templateService.interpolateTemplate(
      body.templateName,
      body.variables,
    );

    return {
      templateName: body.templateName,
      preview,
    };
  }

  // ============================================================
  // Webhook & Status Endpoints
  // ============================================================

  /**
   * WhatsApp webhook for status updates
   * POST /communication/whatsapp/webhook
   */
  @Post('webhook')
  async handleWebhook(@Body() payload: WhatsAppWebhookDto): Promise<{ status: string }> {
    this.logger.debug(`Webhook received: ${JSON.stringify(payload)}`);

    try {
      await this.whatsAppService.processWebhookUpdate(payload);
      return { status: 'received' };
    } catch (error) {
      this.logger.error(`Webhook processing failed: ${error.message}`);
      return { status: 'received' }; // Always return 200 to WhatsApp
    }
  }

  /**
   * Verify WhatsApp webhook (GET request for WhatsApp verification)
   * GET /communication/whatsapp/webhook
   */
  @Get('webhook')
  async verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.challenge') challenge: string,
    @Query('hub.verify_token') verifyToken: string,
  ): Promise<any> {
    const token = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'test_token';

    if (mode === 'subscribe' && verifyToken === token) {
      this.logger.log('Webhook verified successfully');
      return parseInt(challenge, 10);
    }

    throw new BadRequestException('Webhook verification failed');
  }

  /**
   * Get failed messages for retry
   * GET /communication/whatsapp/failed-messages
   */
  @Get('failed-messages')
  @UseGuards(JwtAuthGuard)
  async getFailedMessages(
    @GetTenantId() tenantId: string,
    @Query('schoolId') schoolId: string,
  ) {
    if (!schoolId) {
      throw new BadRequestException('schoolId query parameter is required');
    }

    const messages = await this.whatsAppService.getFailedMessages(tenantId, schoolId);

    return {
      total: messages.length,
      messages: messages.map(m => ({
        id: m.id,
        recipientPhone: m.recipientPhone,
        message: m.message,
        failureReason: m.failureReason,
        retryCount: m.retryCount,
        createdAt: m.createdAt,
      })),
    };
  }

  /**
   * Verify WhatsApp credentials
   * GET /communication/whatsapp/health
   */
  @Get('health')
  async healthCheck(): Promise<{ status: string; message: string }> {
    const isValid = await this.whatsAppService.verifyCredentials();

    return {
      status: isValid ? 'ok' : 'error',
      message: isValid ? 'WhatsApp service is configured correctly' : 'WhatsApp credentials are invalid',
    };
  }
}
