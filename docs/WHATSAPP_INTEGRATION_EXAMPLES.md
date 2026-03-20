/**
 * WhatsApp Integration Examples
 * 
 * This file contains examples of how to integrate WhatsApp messaging
 * with different School ERP modules
 */

// ============================================================
// ADMISSION MODULE EXAMPLE
// ============================================================

import { Injectable } from '@nestjs/common';
import { Admission } from '@prisma/client';
import { WhatsAppIntegrationService } from '@modules/communication/services/whatsapp-integration.service';

@Injectable()
export class AdmissionExampleService {
  constructor(private whatsAppIntegration: WhatsAppIntegrationService) {}

  /**
   * Example: Send enquiry acknowledgement when new admission is created
   */
  async createAdmission(
    tenantId: string,
    schoolId: string,
    admissionData: any,
  ): Promise<Admission> {
    // Create admission in database
    const admission = await this.admissionService.create(tenantId, schoolId, admissionData);

    /**
     * Send WhatsApp acknowledgement asynchronously
     * This runs in background and doesn't block the response
     */
    this.whatsAppIntegration
      .sendEnquiryAcknowledgement(
        tenantId,
        schoolId,
        admission,
        'ABC School', // School name
        'Mr. Sharma', // Counselor name
        '+919876543210', // Counselor phone
      )
      .catch(error => {
        // Log error but don't throw - message notification is optional
        console.error('Failed to send acknowledgement:', error);
      });

    return admission;
  }

  /**
   * Example: Send admission confirmation when status changes to ADMITTED
   */
  async confirmAdmission(
    tenantId: string,
    schoolId: string,
    admissionId: string,
    className: string,
  ): Promise<Admission> {
    // Update admission status to ADMITTED
    const admission = await this.admissionService.updateStatus(
      admissionId,
      'ADMITTED',
    );

    // Send WhatsApp confirmation
    this.whatsAppIntegration
      .sendAdmissionConfirmation(
        tenantId,
        schoolId,
        admission,
        className, // e.g., "Class X-A"
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(), // Reporting date 30 days from now
      )
      .catch(error => {
        console.error('Failed to send confirmation:', error);
      });

    return admission;
  }
}

// ============================================================
// FEE MODULE EXAMPLE
// ============================================================

@Injectable()
export class FeeExampleService {
  constructor(private whatsAppIntegration: WhatsAppIntegrationService) {}

  /**
   * Example: Send receipt when fee payment is recorded
   */
  async recordFeePayment(
    tenantId: string,
    schoolId: string,
    feeRecordId: string,
    paymentData: any,
  ): Promise<void> {
    // Record payment in database
    const feeRecord = await this.feeService.recordPayment(
      feeRecordId,
      paymentData,
    );

    // Get student details
    const student = await this.studentService.getById(feeRecord.studentId);
    const parentContact = await this.getParentPhone(student.id);

    // Send WhatsApp receipt
    this.whatsAppIntegration
      .sendFeeReceipt(
        tenantId,
        schoolId,
        feeRecord,
        student,
        parentContact.phone,
        paymentData.transactionId,
      )
      .catch(error => {
        console.error('Failed to send receipt:', error);
      });
  }

  /**
   * Example: Send due reminder for upcoming fees
   */
  async sendFeeDueReminders(
    tenantId: string,
    schoolId: string,
  ): Promise<void> {
    // Get all pending fees due in next 7 days
    const upcomingFees = await this.feeService.getUpcomingFees(
      schoolId,
      7, // days
    );

    for (const fee of upcomingFees) {
      const student = await this.studentService.getById(fee.studentId);
      const parentContact = await this.getParentPhone(student.id);

      // Send reminder
      this.whatsAppIntegration
        .sendFeeDueReminder(
          tenantId,
          schoolId,
          student,
          parentContact.phone,
          fee.totalAmount.toString(),
          fee.dueDate,
        )
        .catch(error => {
          console.error(`Failed to send reminder for student ${student.id}:`, error);
        });
    }
  }

  /**
   * Example: Send overdue notice
   */
  async sendOverdueNotices(
    tenantId: string,
    schoolId: string,
  ): Promise<void> {
    // Get all overdue fees
    const overdueRecords = await this.feeService.getOverdueFees(schoolId);

    for (const fee of overdueRecords) {
      const student = await this.studentService.getById(fee.studentId);
      const parentContact = await this.getParentPhone(student.id);

      // Calculate days overdue
      const daysOverdue = Math.floor(
        (Date.now() - fee.dueDate.getTime()) / (1000 * 60 * 60 * 24),
      );

      // Send notice
      this.whatsAppIntegration
        .sendFeeOverdueNotice(
          tenantId,
          schoolId,
          student,
          parentContact.phone,
          fee.totalAmount.toString(),
          daysOverdue,
        )
        .catch(error => {
          console.error(`Failed to send overdue notice for student ${student.id}:`, error);
        });
    }
  }

  /**
   * Example: Send partial payment notification
   */
  async recordPartialPayment(
    tenantId: string,
    schoolId: string,
    feeRecordId: string,
    partialAmount: number,
  ): Promise<void> {
    const feeRecord = await this.feeService.updatePartialPayment(
      feeRecordId,
      partialAmount,
    );

    const student = await this.studentService.getById(feeRecord.studentId);
    const parentContact = await this.getParentPhone(student.id);

    const remainingAmount = feeRecord.totalAmount - feeRecord.paidAmount;

    this.whatsAppIntegration
      .sendPartialPaymentReceived(
        tenantId,
        schoolId,
        student,
        parentContact.phone,
        partialAmount.toString(),
        remainingAmount.toString(),
        feeRecord.dueDate,
      )
      .catch(error => {
        console.error('Failed to send partial payment notification:', error);
      });
  }
}

// ============================================================
// ANNOUNCEMENT MODULE EXAMPLE
// ============================================================

@Injectable()
export class AnnouncementExampleService {
  constructor(private whatsAppIntegration: WhatsAppIntegrationService) {}

  /**
   * Example: Broadcast announcement to all parents
   */
  async broadcastAnnouncement(
    tenantId: string,
    schoolId: string,
    announcementText: string,
    detailsLink?: string,
  ): Promise<void> {
    // Get all parent phone numbers from the school
    const parentPhones = await this.getParentPhones(schoolId);

    const result = await this.whatsAppIntegration.sendSchoolAnnouncement(
      tenantId,
      schoolId,
      parentPhones,
      announcementText,
      detailsLink,
    );

    console.log(
      `Announcement sent to ${result.successCount} parents. Failed: ${result.failureCount}`,
    );
  }

  /**
   * Example: Send holiday notification
   */
  async notifyHoliday(
    tenantId: string,
    schoolId: string,
    holidayName: string,
    startDate: Date,
    endDate: Date,
    reopeningDate: Date,
  ): Promise<void> {
    const parentPhones = await this.getParentPhones(schoolId);

    const result = await this.whatsAppIntegration.sendHolidayNotification(
      tenantId,
      schoolId,
      parentPhones,
      holidayName,
      startDate,
      endDate,
      reopeningDate,
    );

    console.log(
      `Holiday notification sent to ${result.successCount} parents. Failed: ${result.failureCount}`,
    );
  }

  /**
   * Example: Send event invitation
   */
  async inviteToEvent(
    tenantId: string,
    schoolId: string,
    eventName: string,
    eventDate: Date,
    eventTime: string,
    venue: string,
    rsvpLink?: string,
  ): Promise<void> {
    const parentPhones = await this.getParentPhones(schoolId);

    const result = await this.whatsAppIntegration.sendEventInvitation(
      tenantId,
      schoolId,
      parentPhones,
      eventName,
      eventDate,
      eventTime,
      venue,
      rsvpLink,
    );

    console.log(
      `Event invitation sent to ${result.successCount} parents. Failed: ${result.failureCount}`,
    );
  }
}

// ============================================================
// SCHEDULED JOBS EXAMPLE
// ============================================================

import { Cron } from '@nestjs/schedule';

@Injectable()
export class ScheduledMessagesExample {
  constructor(
    private feeService: FeeExampleService,
    private announcementService: AnnouncementExampleService,
  ) {}

  /**
   * Example: Send fee reminders daily at 9 AM
   */
  @Cron('0 9 * * *') // Daily at 9 AM
  async dailyFeeReminders(): Promise<void> {
    console.log('Sending daily fee reminders...');

    const schools = await this.getActiveSchools();

    for (const school of schools) {
      await this.feeService.sendFeeDueReminders(school.tenantId, school.id);
    }
  }

  /**
   * Example: Check for overdue fees and send notices
   */
  @Cron('0 17 * * *') // Daily at 5 PM
  async overdueCheckJob(): Promise<void> {
    console.log('Checking for overdue fees...');

    const schools = await this.getActiveSchools();

    for (const school of schools) {
      await this.feeService.sendOverdueNotices(school.tenantId, school.id);
    }
  }

  /**
   * Example: Send weekly school updates
   */
  @Cron('0 8 * * 1') // Every Monday at 8 AM
  async weeklyUpdateJob(): Promise<void> {
    console.log('Sending weekly updates...');

    const schools = await this.getActiveSchools();

    for (const school of schools) {
      await this.announcementService.broadcastAnnouncement(
        school.tenantId,
        school.id,
        'Weekly school update: All systems running smoothly. View full updates on the parent portal.',
        'https://school.com/updates',
      );
    }
  }
}

// ============================================================
// COMMUNICATION STATS EXAMPLE
// ============================================================

@Injectable()
export class CommunicationStatsExample {
  constructor(private whatsAppIntegration: WhatsAppIntegrationService) {}

  /**
   * Example: Get messaging statistics
   */
  async getMessagingStats(
    tenantId: string,
    schoolId: string,
  ): Promise<any> {
    const stats = await this.whatsAppIntegration.getCommunicationStats(
      tenantId,
      schoolId,
    );

    return {
      totalMessages: stats.total,
      delivered: stats.delivered,
      pending: stats.pending,
      failed: stats.failed,
      successRate: stats.total > 0 ? ((stats.delivered / stats.total) * 100).toFixed(2) + '%' : '0%',
      failureRate: stats.total > 0 ? ((stats.failed / stats.total) * 100).toFixed(2) + '%' : '0%',
    };
  }
}

// ============================================================
// CONTROLLER ENDPOINT EXAMPLE
// ============================================================

import { Controller, Post, Get, Body, UseGuards, Query } from '@nestjs/common';
import { JwtAuthGuard } from '@auth/guards/jwt.guard';

@Controller('school/messages')
export class SchoolMessagesExampleController {
  constructor(private announcementService: AnnouncementExampleService) {}

  /**
   * Example endpoint: Broadcast announcement
   * POST /school/messages/announce
   */
  @Post('announce')
  @UseGuards(JwtAuthGuard)
  async announce(
    @Query('schoolId') schoolId: string,
    @Body()
    body: {
      message: string;
      detailsLink?: string;
    },
  ): Promise<any> {
    const tenantId = 'extracted_from_jwt';

    await this.announcementService.broadcastAnnouncement(
      tenantId,
      schoolId,
      body.message,
      body.detailsLink,
    );

    return { status: 'announcement sent' };
  }

  /**
   * Example endpoint: Send holiday notification
   * POST /school/messages/holiday
   */
  @Post('holiday')
  @UseGuards(JwtAuthGuard)
  async notifyHoliday(
    @Query('schoolId') schoolId: string,
    @Body()
    body: {
      holidayName: string;
      startDate: string;
      endDate: string;
      reopeningDate: string;
    },
  ): Promise<any> {
    const tenantId = 'extracted_from_jwt';

    await this.announcementService.notifyHoliday(
      tenantId,
      schoolId,
      body.holidayName,
      new Date(body.startDate),
      new Date(body.endDate),
      new Date(body.reopeningDate),
    );

    return { status: 'holiday notification sent' };
  }
}
