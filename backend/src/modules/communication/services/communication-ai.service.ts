import { Injectable, Logger } from '@nestjs/common';
import { AiClientService } from '../../../common/services/ai-client.service';

/**
 * Communication AI Integration Service
 * Orchestrates AI capabilities for personalized communication
 */
@Injectable()
export class CommunicationAiService {
  private readonly logger = new Logger(CommunicationAiService.name);

  constructor(private readonly aiClient: AiClientService) {}

  /**
   * Generate personalized enquiry message
   */
  async generateEnquiryMessage(
    enquiryData: any,
    messageType: string,
    channel: string = 'email',
  ): Promise<any> {
    try {
      this.logger.debug(
        `Generating ${messageType} message for enquiry ${enquiryData.enquiry_id}`,
      );

      const message = await this.aiClient.generateEnquiryMessage(
        enquiryData,
        messageType,
        channel,
      );

      return {
        enquiry_id: message.enquiry_id,
        message_type: message.message_type,
        channel: message.channel,
        tone: message.tone,
        personalization_level: message.personalization_level,
        message: {
          subject: message.message.subject || '',
          greeting: message.message.greeting,
          body: message.message.body,
          closing: message.message.closing,
          cta: message.message.cta,
        },
        preview: message.preview,
        ready_to_send: true,
      };
    } catch (error) {
      this.logger.error(
        `Error generating enquiry message: ${(error as Error).message}`,
      );
      throw error;
    }
  }

  /**
   * Generate message variants for A/B testing
   */
  async generateEnquiryMessageVariants(
    enquiryData: any,
    messageType: string,
    channel: string = 'email',
  ): Promise<any> {
    try {
      this.logger.debug(
        `Generating message variants for enquiry ${enquiryData.enquiry_id}`,
      );

      const variants = await this.aiClient.generateEnquiryMessageVariants(
        enquiryData,
        messageType,
        channel,
      );

      return {
        enquiry_id: variants.enquiry_id,
        message_type: variants.message_type,
        channel: variants.channel,
        variants: variants.variants.map((v: any, index: number) => ({
          variant_id: `v${index + 1}_${v.variant_id}`,
          tone: v.tone,
          description: v.description,
          message: v.message,
          recommended: variants.recommendation === v.variant_id,
        })),
        recommendation: `Use variant with ${variants.recommendation} tone`,
        ab_testing_note: 'Send different variants to different segments for optimal response',
      };
    } catch (error) {
      this.logger.error(`Error generating variants: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Generate personalized fee message
   */
  async generateFeeMessage(
    studentData: any,
    messageType: string,
    channel: string = 'whatsapp',
  ): Promise<any> {
    try {
      this.logger.debug(
        `Generating ${messageType} message for student ${studentData.student_id}`,
      );

      const message = await this.aiClient.generateFeeMessage(
        studentData,
        messageType,
        channel,
      );

      return {
        student_id: message.student_id,
        message_type: message.message_type,
        channel: message.channel,
        tone: message.tone,
        urgency_level: message.urgency_level,
        message: {
          subject: message.message.subject || '',
          greeting: message.message.greeting,
          body: message.message.body,
          closing: message.message.closing,
          cta: message.message.cta,
        },
        preview: message.preview,
        ready_to_send: true,
        follow_up_recommended: !['fee_critical'].includes(messageType),
      };
    } catch (error) {
      this.logger.error(`Error generating fee message: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Batch generate enquiry messages
   */
  async batchGenerateEnquiryMessages(
    enquiries: any[],
    messageType: string,
    channel: string = 'email',
  ): Promise<any> {
    try {
      this.logger.debug(
        `Batch generating ${messageType} messages for ${enquiries.length} enquiries`,
      );

      const enrichedEnquiries = enquiries.map((e) => ({
        ...e,
        message_type: messageType,
        channel,
      }));

      const results = await this.aiClient.batchGenerateEnquiryMessages(
        enrichedEnquiries,
      );

      return {
        total_requested: results.total_requested,
        generated: results.generated,
        failed: results.failed,
        message_type: messageType,
        channel,
        coverage_percentage:
          ((results.generated / results.total_requested) * 100).toFixed(1),
        results: results.results.map((r: any) => ({
          enquiry_id: r.enquiry_id,
          status: results.generated > 0 ? 'ready' : 'failed',
          message_type: r.message_type,
          channel: r.channel,
        })),
        next_step: 'Review messages before sending',
      };
    } catch (error) {
      this.logger.error(`Error in batch generation: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Batch generate fee messages
   */
  async batchGenerateFeeMessages(
    students: any[],
    messageType: string,
    channel: string = 'whatsapp',
  ): Promise<any> {
    try {
      this.logger.debug(
        `Batch generating ${messageType} messages for ${students.length} students`,
      );

      const enrichedStudents = students.map((s) => ({
        ...s,
        message_type: messageType,
        channel,
      }));

      const results = await this.aiClient.batchGenerateFeeMessages(
        enrichedStudents,
      );

      return {
        total_requested: results.total_requested,
        generated: results.generated,
        failed: results.failed,
        message_type: messageType,
        channel,
        coverage_percentage:
          ((results.generated / results.total_requested) * 100).toFixed(1),
        results: results.results.map((r: any) => ({
          student_id: r.student_id,
          status: results.generated > 0 ? 'ready' : 'failed',
          message_type: r.message_type,
          urgency: r.urgency,
        })),
        urgency_breakdown: {
          critical: results.results.filter((r: any) => r.urgency === 'critical').length,
          high: results.results.filter((r: any) => r.urgency === 'high').length,
          medium: results.results.filter((r: any) => r.urgency === 'medium').length,
          low: results.results.filter((r: any) => r.urgency === 'low').length,
        },
        next_step: 'Review messages and schedule sends based on urgency',
      };
    } catch (error) {
      this.logger.error(`Error in batch fee generation: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Get available communication templates
   */
  async getAvailableTemplates(): Promise<any> {
    try {
      this.logger.debug('Fetching available templates');

      const templates = await this.aiClient.getAvailableTemplates();

      return {
        enquiry_templates: templates.enquiry_templates.map((t: any) => ({
          id: t.id,
          name: t.name,
          description: t.description,
          available_channels: t.channels,
        })),
        fee_templates: templates.fee_templates.map((t: any) => ({
          id: t.id,
          name: t.name,
          description: t.description,
          available_channels: t.channels,
        })),
        total_templates: templates.enquiry_templates.length + templates.fee_templates.length,
      };
    } catch (error) {
      this.logger.error(`Error fetching templates: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Create message campaign
   */
  async createMessageCampaign(
    recipients: any[],
    campaignConfig: any,
  ): Promise<any> {
    try {
      this.logger.debug(`Creating message campaign for ${recipients.length} recipients`);

      const campaignId = this._generateCampaignId();
      const schedules = this._calculateSchedule(recipients, campaignConfig);

      return {
        campaign_id: campaignId,
        total_recipients: recipients.length,
        message_type: campaignConfig.message_type,
        channel: campaignConfig.channel,
        schedule: {
          start_date: schedules.start_date,
          end_date: schedules.end_date,
          batches: schedules.batches,
        },
        status: 'ready_for_approval',
        preview_samples: recipients.slice(0, 3).map((r: any) => ({
          recipient_id: r.enquiry_id || r.student_id,
          recipient_type: r.enquiry_id ? 'enquiry' : 'student',
        })),
        approval_required: true,
        next_step: 'Submit campaign for approval',
      };
    } catch (error) {
      this.logger.error(`Error creating campaign: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Get message performance metrics
   */
  async getPerformanceMetrics(campaignId: string): Promise<any> {
    try {
      this.logger.debug(`Getting performance metrics for campaign ${campaignId}`);

      // This would typically fetch from a database
      // For now, return template structure
      return {
        campaign_id: campaignId,
        total_sent: 100,
        delivered: 98,
        opened: 65,
        clicked: 32,
        responded: 28,
        metrics: {
          delivery_rate: '98%',
          open_rate: '65%',
          click_rate: '32%',
          response_rate: '28%',
        },
        recommendations: [
          'Consider A/B testing subject lines for higher open rates',
          'Response rate is good, follow up with responders',
        ],
      };
    } catch (error) {
      this.logger.error(
        `Error getting performance metrics: ${(error as Error).message}`,
      );
      throw error;
    }
  }

  // ==================== PRIVATE HELPERS ====================

  private _generateCampaignId(): string {
    return `CAMP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private _calculateSchedule(recipients: any[], config: any): any {
    const batchSize = config.batch_size || 50;
    const batches = Math.ceil(recipients.length / batchSize);
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + batches * 24 * 60 * 60 * 1000);

    return {
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      batches: Array.from({ length: batches }, (_, i) => ({
        batch_number: i + 1,
        scheduled_date: new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
        recipient_count: Math.min(batchSize, recipients.length - i * batchSize),
      })),
    };
  }
}
