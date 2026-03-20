import { Injectable, Logger } from '@nestjs/common';
import { SchedulerRegistry, Cron } from '@nestjs/schedule';
import { PrismaService } from '@config/prisma.service';
import { WhatsAppService } from './whatsapp.service';

/**
 * Processes failed WhatsApp messages for retry
 * Runs periodically to retry messages that failed to send
 */
@Injectable()
export class WhatsAppRetryProcessor {
  private logger = new Logger(WhatsAppRetryProcessor.name);

  constructor(
    private prisma: PrismaService,
    private whatsAppService: WhatsAppService,
    private schedulerRegistry: SchedulerRegistry,
  ) {}

  /**
   * Process failed messages every 5 minutes
   * Retries failed messages up to 3 times
   */
  @Cron('*/5 * * * *') // Every 5 minutes
  async processFailedMessages(): Promise<void> {
    try {
      this.logger.debug('Starting WhatsApp failed message retry processing');

      // Get all failed messages across all tenants/schools
      const failedMessages = await this.prisma.communication.findMany({
        where: {
          type: 'WHATSAPP',
          status: 'FAILED',
          retryCount: {
            lt: 3, // Less than max retries
          },
        },
        take: 50, // Process up to 50 messages per run
        orderBy: {
          updatedAt: 'asc', // Process oldest first
        },
      });

      if (failedMessages.length === 0) {
        return;
      }

      this.logger.log(`Processing ${failedMessages.length} failed WhatsApp messages`);

      let successCount = 0;
      let retryCount = 0;
      let permanentFailureCount = 0;

      for (const message of failedMessages) {
        try {
          await this.whatsAppService.retryMessage(message.id);
          successCount++;

          this.logger.log(
            `Message ${message.id} retried successfully (Attempt: ${message.retryCount + 1})`,
          );
        } catch (error) {
          retryCount++;

          const updatedMessage = await this.prisma.communication.findUnique({
            where: { id: message.id },
          });

          if (updatedMessage?.retryCount! >= updatedMessage?.maxRetries!) {
            permanentFailureCount++;

            this.logger.warn(
              `Message ${message.id} permanently failed after ${updatedMessage?.retryCount} retries`,
            );

            // Could send notification to admin here if needed
            // await this.notificationService.notifyAdminMessageFailure(message);
          }
        }
      }

      this.logger.log(
        `Retry processing completed. Success: ${successCount}, Retrying: ${retryCount}, Permanent Failures: ${permanentFailureCount}`,
      );
    } catch (error) {
      this.logger.error(`Error during retry processing: ${error.message}`, error.stack);
    }
  }

  /**
   * Process pending messages every 2 minutes
   * Sends messages that were queued for delivery
   */
  @Cron('*/2 * * * *') // Every 2 minutes
  async processPendingMessages(): Promise<void> {
    try {
      this.logger.debug('Starting WhatsApp pending message processing');

      const pendingMessages = await this.prisma.communication.findMany({
        where: {
          type: 'WHATSAPP',
          status: 'PENDING',
        },
        take: 100,
        orderBy: {
          createdAt: 'asc',
        },
      });

      if (pendingMessages.length === 0) {
        return;
      }

      this.logger.log(`Processing ${pendingMessages.length} pending WhatsApp messages`);

      let successCount = 0;
      let failureCount = 0;

      for (const message of pendingMessages) {
        try {
          // Extract template name from message subject
          const templateName = message.subject.replace('WhatsApp Template: ', '');

          if (templateName && templateName !== message.subject) {
            // This is a template message
            await this.whatsAppService.sendTemplateMessage(
              message.tenantId,
              message.schoolId,
              message.recipientPhone!,
              templateName,
              [],
              message.studentId || undefined,
              message.admissionId || undefined,
            );

            successCount++;
          } else {
            // This is a text message
            await this.whatsAppService.sendTextMessage(
              message.tenantId,
              message.schoolId,
              message.recipientPhone!,
              message.message,
              message.studentId || undefined,
            );

            successCount++;
          }

          this.logger.log(`Message ${message.id} sent successfully`);
        } catch (error) {
          failureCount++;

          this.logger.error(
            `Failed to send message ${message.id}: ${error.message}`,
            error.stack,
          );
        }
      }

      this.logger.log(
        `Pending message processing completed. Sent: ${successCount}, Failed: ${failureCount}`,
      );
    } catch (error) {
      this.logger.error(`Error during pending message processing: ${error.message}`, error.stack);
    }
  }

  /**
   * Cleanup old delivered messages (older than 30 days)
   * Runs daily at 2 AM
   */
  @Cron('0 2 * * *') // Daily at 2 AM
  async cleanupOldMessages(): Promise<void> {
    try {
      this.logger.debug('Starting cleanup of old WhatsApp messages');

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Archive delivered messages (can be kept in a separate archive table)
      const deleteResult = await this.prisma.communication.deleteMany({
        where: {
          type: 'WHATSAPP',
          status: 'DELIVERED',
          createdAt: {
            lt: thirtyDaysAgo,
          },
        },
      });

      this.logger.log(`Cleaned up ${deleteResult.count} old WhatsApp messages`);
    } catch (error) {
      this.logger.error(`Error during cleanup: ${error.message}`, error.stack);
    }
  }

  /**
   * Generate daily report of WhatsApp messaging
   * Runs daily at 6 AM
   */
  @Cron('0 6 * * *') // Daily at 6 AM
  async generateDailyReport(): Promise<void> {
    try {
      this.logger.log('Generating WhatsApp daily report');

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const statistics = await this.prisma.communication.groupBy({
        by: ['status'],
        where: {
          type: 'WHATSAPP',
          createdAt: {
            gte: today,
          },
        },
        _count: true,
      });

      const report = {
        date: today,
        totalMessages: statistics.reduce((sum, stat) => sum + stat._count, 0),
        byStatus: statistics.reduce(
          (acc, stat) => {
            acc[stat.status] = stat._count;
            return acc;
          },
          {} as Record<string, number>,
        ),
      };

      this.logger.log(`Daily WhatsApp Report: ${JSON.stringify(report)}`);

      // Could store report in database or send to admin dashboard
      // await this.reportService.saveReport(report);
    } catch (error) {
      this.logger.error(`Error generating report: ${error.message}`, error.stack);
    }
  }

  /**
   * Check and alert on high failure rate
   * Runs every 30 minutes
   */
  @Cron('*/30 * * * *') // Every 30 minutes
  async checkFailureRate(): Promise<void> {
    try {
      const lastHour = new Date(Date.now() - 60 * 60 * 1000);

      const stats = await this.prisma.communication.groupBy({
        by: ['status'],
        where: {
          type: 'WHATSAPP',
          createdAt: {
            gte: lastHour,
          },
        },
        _count: true,
      });

      const totalMessages = stats.reduce((sum, stat) => sum + stat._count, 0);
      const failedMessages =
        stats.find(stat => stat.status === 'FAILED')?._count || 0;

      const failureRate = totalMessages > 0 ? (failedMessages / totalMessages) * 100 : 0;

      if (failureRate > 10) {
        // More than 10% failure rate
        this.logger.warn(
          `High WhatsApp failure rate detected: ${failureRate.toFixed(2)}% (${failedMessages}/${totalMessages})`,
        );

        // Could trigger alert to admin
        // await this.alertService.notifyAdmins(`High WhatsApp failure rate: ${failureRate}%`);
      }
    } catch (error) {
      this.logger.error(`Error checking failure rate: ${error.message}`, error.stack);
    }
  }
}
