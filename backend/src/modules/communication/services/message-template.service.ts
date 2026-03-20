import { Injectable, Logger } from '@nestjs/common';

export interface MessageTemplate {
  name: string; // WhatsApp template name (e.g., 'inquiry_acknowledgement')
  displayName: string;
  category: 'enquiry' | 'admission' | 'fees' | 'announcement';
  description: string;
  variables: string[]; // Variable placeholders like {{studentName}}, {{amount}}
  previewText: string;
}

@Injectable()
export class MessageTemplateService {
  private logger = new Logger(MessageTemplateService.name);

  /**
   * All available message templates
   * Templates must be pre-created and approved in WhatsApp Business Account
   */
  private templates: Record<string, MessageTemplate> = {
    // Enquiry templates
    enquiry_acknowledgement: {
      name: 'enquiry_acknowledgement',
      displayName: 'Enquiry Acknowledgement',
      category: 'enquiry',
      description: 'Acknowledgement message sent to parents who submit an enquiry',
      variables: ['parentName', 'schoolName', 'counsellorName', 'counsellorPhone'],
      previewText:
        'Dear {{parentName}}, Thank you for your interest in {{schoolName}}. Our counselor {{counsellorName}} will contact you soon at {{counsellorPhone}}.',
    },

    // Admission templates
    admission_confirmation: {
      name: 'admission_confirmation',
      displayName: 'Admission Confirmation',
      category: 'admission',
      description: 'Sent when student admission is confirmed',
      variables: ['studentName', 'className', 'additionalInfo', 'reportingDate'],
      previewText:
        'Dear Parent, {{studentName}} has been successfully admitted to {{className}}. Please report on {{reportingDate}}. Additional info: {{additionalInfo}}',
    },

    admission_offer: {
      name: 'admission_offer',
      displayName: 'Admission Offer',
      category: 'admission',
      description: 'Sent when admission is offered to a candidate',
      variables: ['studentName', 'className', 'schoolName', 'offerValidUntil'],
      previewText:
        'Congratulations {{studentName}}! You have received an offer for admission to {{className}} at {{schoolName}}. Offer valid until {{offerValidUntil}}.',
    },

    // Fee templates
    fee_receipt: {
      name: 'fee_receipt',
      displayName: 'Fee Receipt',
      category: 'fees',
      description: 'Sent when fee payment is received',
      variables: ['studentName', 'amount', 'month', 'transactionId', 'receiptUrl'],
      previewText:
        'Dear Parent, Fee of {{amount}} for {{month}} has been received successfully. Reference: {{transactionId}}. Receipt: {{receiptUrl}}',
    },

    fee_due_reminder: {
      name: 'fee_due_reminder',
      displayName: 'Fee Due Reminder',
      category: 'fees',
      description: 'Reminder for due fees',
      variables: ['studentName', 'amount', 'dueDate', 'feePortalLink'],
      previewText:
        'Reminder: Fee of {{amount}} for {{studentName}} is due on {{dueDate}}. Pay now at {{feePortalLink}}',
    },

    fee_overdue_notice: {
      name: 'fee_overdue_notice',
      displayName: 'Fee Overdue Notice',
      category: 'fees',
      description: 'Notice for overdue fees',
      variables: ['studentName', 'amount', 'daysOverdue', 'paymentLink'],
      previewText:
        'Your fee of {{amount}} is {{daysOverdue}} days overdue. Kindly pay immediately at {{paymentLink}} to avoid late fees.',
    },

    partial_payment_received: {
      name: 'partial_payment_received',
      displayName: 'Partial Payment Received',
      category: 'fees',
      description: 'Sent when partial fee payment is received',
      variables: ['studentName', 'amountReceived', 'remainingAmount', 'dueDate'],
      previewText:
        'Dear Parent, Partial payment of {{amountReceived}} received. Remaining amount {{remainingAmount}} is due on {{dueDate}}.',
    },

    // Announcement templates
    school_announcement: {
      name: 'school_announcement',
      displayName: 'School Announcement',
      category: 'announcement',
      description: 'General school announcements',
      variables: ['announcement', 'detailsLink'],
      previewText: '📢 {{announcement}} \n\nDetails: {{detailsLink}}',
    },

    holiday_notification: {
      name: 'holiday_notification',
      displayName: 'Holiday Notification',
      category: 'announcement',
      description: 'Holiday and school closure notifications',
      variables: ['holidayName', 'startDate', 'endDate', 'reopeningDate'],
      previewText:
        'School will remain closed from {{startDate}} to {{endDate}} for {{holidayName}}. Classes resume on {{reopeningDate}}.',
    },

    event_invitation: {
      name: 'event_invitation',
      displayName: 'Event Invitation',
      category: 'announcement',
      description: 'Invitations to school events',
      variables: ['eventName', 'eventDate', 'eventTime', 'venue', 'rsvpLink'],
      previewText:
        'You are invited to {{eventName}} on {{eventDate}} at {{eventTime}} at {{venue}}. RSVP: {{rsvpLink}}',
    },

    exam_schedule: {
      name: 'exam_schedule',
      displayName: 'Exam Schedule Notification',
      category: 'announcement',
      description: 'Exam schedule notifications',
      variables: ['examName', 'startDate', 'endDate', 'scheduleLink'],
      previewText:
        '📋 {{examName}} will be conducted from {{startDate}} to {{endDate}}. Schedule: {{scheduleLink}}',
    },
  };

  /**
   * Get all available templates
   */
  getAllTemplates(): MessageTemplate[] {
    return Object.values(this.templates);
  }

  /**
   * Get templates by category
   */
  getTemplatesByCategory(
    category: 'enquiry' | 'admission' | 'fees' | 'announcement',
  ): MessageTemplate[] {
    return Object.values(this.templates).filter(t => t.category === category);
  }

  /**
   * Get specific template
   */
  getTemplate(templateName: string): MessageTemplate | null {
    return this.templates[templateName] || null;
  }

  /**
   * Replace variables in template preview
   */
  interpolateTemplate(templateName: string, variables: Record<string, string>): string {
    const template = this.templates[templateName];
    if (!template) {
      throw new Error(`Template '${templateName}' not found`);
    }

    let message = template.previewText;
    for (const [key, value] of Object.entries(variables)) {
      message = message.replace(`{{${key}}}`, value);
    }

    return message;
  }

  /**
   * Validate template variables
   */
  validateTemplateVariables(
    templateName: string,
    variables: Record<string, string>,
  ): { valid: boolean; missing: string[] } {
    const template = this.templates[templateName];
    if (!template) {
      return { valid: false, missing: [] };
    }

    const missing = template.variables.filter(v => !variables[v]);
    return { valid: missing.length === 0, missing };
  }

  /**
   * Get templates for enquiry acknowledgement
   */
  getEnquiryAcknowledgementTemplate(): MessageTemplate | null {
    return this.getTemplate('enquiry_acknowledgement');
  }

  /**
   * Get templates for admission confirmation
   */
  getAdmissionConfirmationTemplate(): MessageTemplate | null {
    return this.getTemplate('admission_confirmation');
  }

  /**
   * Get templates for fee receipt
   */
  getFeeReceiptTemplate(): MessageTemplate | null {
    return this.getTemplate('fee_receipt');
  }

  /**
   * Get templates for fee due reminder
   */
  getFeeDueReminderTemplate(): MessageTemplate | null {
    return this.getTemplate('fee_due_reminder');
  }

  /**
   * Get templates for fee overdue notice
   */
  getFeeOverdueTemplate(): MessageTemplate | null {
    return this.getTemplate('fee_overdue_notice');
  }

  /**
   * Get templates for school announcements
   */
  getAnnouncementTemplate(): MessageTemplate | null {
    return this.getTemplate('school_announcement');
  }
}
