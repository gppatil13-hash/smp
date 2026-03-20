import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@config/prisma.service';
import { WhatsAppService } from './whatsapp.service';
import { MessageTemplateService } from './message-template.service';
import { Admission, FeeRecord, Student } from '@prisma/client';

/**
 * Integration helper for WhatsApp messaging with school workflows
 * Automatically triggers WhatsApp messages during key events
 */
@Injectable()
export class WhatsAppIntegrationService {
  private logger = new Logger(WhatsAppIntegrationService.name);

  constructor(
    private prisma: PrismaService,
    private whatsAppService: WhatsAppService,
    private templateService: MessageTemplateService,
  ) {}

  /**
   * Send enquiry acknowledgement when new admission/enquiry is created
   */
  async sendEnquiryAcknowledgement(
    tenantId: string,
    schoolId: string,
    admission: Admission,
    schoolName: string,
    counsellorName?: string,
    counsellorPhone?: string,
  ): Promise<void> {
    try {
      this.logger.log(`Sending enquiry acknowledgement for admission: ${admission.id}`);

      await this.whatsAppService.sendTemplateMessage(
        tenantId,
        schoolId,
        admission.candidatePhone,
        'enquiry_acknowledgement',
        [
          admission.candidateName,
          schoolName || 'Our School',
          counsellorName || 'Our Admission Team',
          counsellorPhone || 'contact us',
        ],
        undefined,
        admission.id,
      );
    } catch (error) {
      this.logger.error(`Failed to send enquiry acknowledgement: ${error.message}`);
      // Don't throw - this is an optional notification
    }
  }

  /**
   * Send admission confirmation when admission status is updated to ADMITTED
   */
  async sendAdmissionConfirmation(
    tenantId: string,
    schoolId: string,
    admission: Admission,
    className: string,
    reportingDate?: string,
  ): Promise<void> {
    try {
      if (admission.status !== 'ADMITTED') {
        return;
      }

      this.logger.log(`Sending admission confirmation for admission: ${admission.id}`);

      await this.whatsAppService.sendTemplateMessage(
        tenantId,
        schoolId,
        admission.fatherPhone || admission.motherPhone || admission.candidatePhone,
        'admission_confirmation',
        [
          admission.candidateName,
          className,
          '',
          reportingDate || new Date().toLocaleDateString(),
        ],
        undefined,
        admission.id,
      );
    } catch (error) {
      this.logger.error(`Failed to send admission confirmation: ${error.message}`);
    }
  }

  /**
   * Send fee receipt when payment is recorded
   */
  async sendFeeReceipt(
    tenantId: string,
    schoolId: string,
    feeRecord: FeeRecord,
    student: Student,
    parentPhone: string,
    transactionId?: string,
  ): Promise<void> {
    try {
      this.logger.log(`Sending fee receipt for student: ${student.id}`);

      // Get student name from student record
      const studentName = `${student.firstName || ''} ${student.lastName || ''}`.trim();

      await this.whatsAppService.sendTemplateMessage(
        tenantId,
        schoolId,
        parentPhone,
        'fee_receipt',
        [
          studentName,
          feeRecord.paidAmount.toString(),
          new Date(feeRecord.paidDate!).toLocaleDateString('en-IN', {
            month: 'long',
            year: 'numeric',
          }),
          transactionId || feeRecord.transactionId || 'N/A',
          'Receipt sent via email',
        ],
        feeRecord.studentId,
      );
    } catch (error) {
      this.logger.error(`Failed to send fee receipt: ${error.message}`);
    }
  }

  /**
   * Send fee due reminder for upcoming dues
   */
  async sendFeeDueReminder(
    tenantId: string,
    schoolId: string,
    student: Student,
    parentPhone: string,
    amount: string,
    dueDate: Date,
  ): Promise<void> {
    try {
      this.logger.log(`Sending fee due reminder for student: ${student.id}`);

      const studentName = `${student.firstName || ''} ${student.lastName || ''}`.trim();
      const dueDateStr = dueDate.toLocaleDateString('en-IN');

      await this.whatsAppService.sendTemplateMessage(
        tenantId,
        schoolId,
        parentPhone,
        'fee_due_reminder',
        [
          studentName,
          amount,
          dueDateStr,
          'Contact the school office for payment details',
        ],
        student.id,
      );
    } catch (error) {
      this.logger.error(`Failed to send fee due reminder: ${error.message}`);
    }
  }

  /**
   * Send overdue fee notice
   */
  async sendFeeOverdueNotice(
    tenantId: string,
    schoolId: string,
    student: Student,
    parentPhone: string,
    amount: string,
    daysOverdue: number,
  ): Promise<void> {
    try {
      this.logger.log(`Sending overdue fee notice for student: ${student.id}`);

      const studentName = `${student.firstName || ''} ${student.lastName || ''}`.trim();

      await this.whatsAppService.sendTemplateMessage(
        tenantId,
        schoolId,
        parentPhone,
        'fee_overdue_notice',
        [
          studentName,
          amount,
          daysOverdue.toString(),
          'Contact school office for payment details',
        ],
        student.id,
      );
    } catch (error) {
      this.logger.error(`Failed to send overdue fee notice: ${error.message}`);
    }
  }

  /**
   * Send partial payment received notification
   */
  async sendPartialPaymentReceived(
    tenantId: string,
    schoolId: string,
    student: Student,
    parentPhone: string,
    amountReceived: string,
    remainingAmount: string,
    dueDate: Date,
  ): Promise<void> {
    try {
      this.logger.log(`Sending partial payment notification for student: ${student.id}`);

      const studentName = `${student.firstName || ''} ${student.lastName || ''}`.trim();
      const dueDateStr = dueDate.toLocaleDateString('en-IN');

      await this.whatsAppService.sendTemplateMessage(
        tenantId,
        schoolId,
        parentPhone,
        'partial_payment_received',
        [studentName, amountReceived, remainingAmount, dueDateStr],
        student.id,
      );
    } catch (error) {
      this.logger.error(`Failed to send partial payment notification: ${error.message}`);
    }
  }

  /**
   * Send school announcement to multiple recipients
   */
  async sendSchoolAnnouncement(
    tenantId: string,
    schoolId: string,
    recipientPhones: string[],
    announcement: string,
    detailsLink?: string,
  ): Promise<{ successCount: number; failureCount: number }> {
    try {
      this.logger.log(`Sending school announcement to ${recipientPhones.length} recipients`);

      let successCount = 0;
      let failureCount = 0;

      for (const phone of recipientPhones) {
        try {
          await this.whatsAppService.sendTemplateMessage(
            tenantId,
            schoolId,
            phone,
            'school_announcement',
            [announcement, detailsLink || 'Check school portal for details'],
          );

          successCount++;
        } catch (error) {
          failureCount++;
          this.logger.error(`Failed to send announcement to ${phone}: ${error.message}`);
        }
      }

      return { successCount, failureCount };
    } catch (error) {
      this.logger.error(`Failed to send school announcements: ${error.message}`);
      return { successCount: 0, failureCount: recipientPhones.length };
    }
  }

  /**
   * Send holiday notification
   */
  async sendHolidayNotification(
    tenantId: string,
    schoolId: string,
    recipientPhones: string[],
    holidayName: string,
    startDate: Date,
    endDate: Date,
    reopeningDate: Date,
  ): Promise<{ successCount: number; failureCount: number }> {
    try {
      let successCount = 0;
      let failureCount = 0;

      const startStr = startDate.toLocaleDateString('en-IN');
      const endStr = endDate.toLocaleDateString('en-IN');
      const reopenStr = reopeningDate.toLocaleDateString('en-IN');

      for (const phone of recipientPhones) {
        try {
          await this.whatsAppService.sendTemplateMessage(
            tenantId,
            schoolId,
            phone,
            'holiday_notification',
            [holidayName, startStr, endStr, reopenStr],
          );

          successCount++;
        } catch (error) {
          failureCount++;
          this.logger.error(`Failed to send holiday notification to ${phone}: ${error.message}`);
        }
      }

      return { successCount, failureCount };
    } catch (error) {
      this.logger.error(`Failed to send holiday notifications: ${error.message}`);
      return { successCount: 0, failureCount: recipientPhones.length };
    }
  }

  /**
   * Send event invitation
   */
  async sendEventInvitation(
    tenantId: string,
    schoolId: string,
    recipientPhones: string[],
    eventName: string,
    eventDate: Date,
    eventTime: string,
    venue: string,
    rsvpLink?: string,
  ): Promise<{ successCount: number; failureCount: number }> {
    try {
      let successCount = 0;
      let failureCount = 0;

      const dateStr = eventDate.toLocaleDateString('en-IN');

      for (const phone of recipientPhones) {
        try {
          await this.whatsAppService.sendTemplateMessage(
            tenantId,
            schoolId,
            phone,
            'event_invitation',
            [eventName, dateStr, eventTime, venue, rsvpLink || 'Contact school office'],
          );

          successCount++;
        } catch (error) {
          failureCount++;
          this.logger.error(`Failed to send event invitation to ${phone}: ${error.message}`);
        }
      }

      return { successCount, failureCount };
    } catch (error) {
      this.logger.error(`Failed to send event invitations: ${error.message}`);
      return { successCount: 0, failureCount: recipientPhones.length };
    }
  }

  /**
   * Get communication statistics for a school
   */
  async getCommunicationStats(
    tenantId: string,
    schoolId: string,
  ): Promise<{
    total: number;
    sent: number;
    delivered: number;
    failed: number;
    pending: number;
  }> {
    const communications = await this.prisma.communication.groupBy({
      by: ['status'],
      where: {
        tenantId,
        schoolId,
        type: 'WHATSAPP',
      },
      _count: true,
    });

    const stats = {
      total: 0,
      sent: 0,
      delivered: 0,
      failed: 0,
      pending: 0,
    };

    for (const comm of communications) {
      stats.total += comm._count;
      if (comm.status === 'SENT') stats.sent += comm._count;
      if (comm.status === 'DELIVERED') stats.delivered += comm._count;
      if (comm.status === 'FAILED') stats.failed += comm._count;
      if (comm.status === 'PENDING') stats.pending += comm._count;
    }

    return stats;
  }
}
