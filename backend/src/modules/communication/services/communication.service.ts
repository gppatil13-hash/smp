import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@config/prisma.service';
import { ConfigService } from '@nestjs/config';
import { Communication, Prisma } from '@prisma/client';

@Injectable()
export class CommunicationService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  async sendSMS(
    tenantId: string,
    schoolId: string,
    recipientPhone: string,
    message: string,
    studentId?: string,
    admissionId?: string,
  ): Promise<Communication> {
    // Create communication record
    const communication = await this.prisma.communication.create({
      data: {
        tenantId,
        schoolId,
        type: 'SMS',
        recipientPhone,
        recipientName: recipientPhone,
        message,
        subject: 'SMS Message',
        status: 'PENDING',
        studentId,
        admissionId,
      },
    });

    // Call Twilio API
    try {
      const result = await this.sendViaTwilio(recipientPhone, message);
      await this.prisma.communication.update({
        where: { id: communication.id },
        data: {
          status: 'SENT',
          externalId: result,
          sentAt: new Date(),
        },
      });
    } catch (error) {
      await this.prisma.communication.update({
        where: { id: communication.id },
        data: {
          status: 'FAILED',
          failureReason: error.message,
        },
      });
    }

    return communication;
  }

  async sendWhatsApp(
    tenantId: string,
    schoolId: string,
    recipientPhone: string,
    message: string,
    studentId?: string,
  ): Promise<Communication> {
    const communication = await this.prisma.communication.create({
      data: {
        tenantId,
        schoolId,
        type: 'WHATSAPP',
        recipientPhone,
        recipientName: recipientPhone,
        message,
        subject: 'WhatsApp Message',
        status: 'PENDING',
        studentId,
      },
    });

    // Call WhatsApp API
    try {
      const result = await this.sendViaWhatsApp(recipientPhone, message);
      await this.prisma.communication.update({
        where: { id: communication.id },
        data: {
          status: 'SENT',
          externalId: result,
          sentAt: new Date(),
        },
      });
    } catch (error) {
      await this.prisma.communication.update({
        where: { id: communication.id },
        data: {
          status: 'FAILED',
          failureReason: error.message,
        },
      });
    }

    return communication;
  }

  async sendEmail(
    tenantId: string,
    schoolId: string,
    recipientEmail: string,
    subject: string,
    message: string,
    studentId?: string,
  ): Promise<Communication> {
    const communication = await this.prisma.communication.create({
      data: {
        tenantId,
        schoolId,
        type: 'EMAIL',
        recipientEmail,
        recipientName: recipientEmail,
        message,
        subject,
        status: 'PENDING',
        studentId,
      },
    });

    // Call Email Service
    try {
      await this.sendViaEmail(recipientEmail, subject, message);
      await this.prisma.communication.update({
        where: { id: communication.id },
        data: {
          status: 'SENT',
          sentAt: new Date(),
        },
      });
    } catch (error) {
      await this.prisma.communication.update({
        where: { id: communication.id },
        data: {
          status: 'FAILED',
          failureReason: error.message,
        },
      });
    }

    return communication;
  }

  async getCommunications(tenantId: string, schoolId: string, filters?: any): Promise<Communication[]> {
    const where: Prisma.CommunicationWhereInput = {
      tenantId,
      schoolId,
      ...(filters?.type && { type: filters.type }),
      ...(filters?.status && { status: filters.status }),
    };

    return this.prisma.communication.findMany({
      where,
      skip: filters?.skip || 0,
      take: filters?.take || 100,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getStudentCommunications(tenantId: string, schoolId: string, studentId: string): Promise<Communication[]> {
    return this.prisma.communication.findMany({
      where: {
        tenantId,
        schoolId,
        studentId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // Private methods for integrations
  private async sendViaTwilio(phoneNumber: string, message: string): Promise<string> {
    // Twilio integration
    // const twilio = require('twilio');
    // const client = twilio(accountSid, authToken);
    // const result = await client.messages.create({...});
    // return result.sid;

    // For now, return mock SID
    return `SM_${Date.now()}`;
  }

  private async sendViaWhatsApp(phoneNumber: string, message: string): Promise<string> {
    // WhatsApp Business API integration
    // Make API call to WhatsApp Business Account
    // return messageId;

    // For now, return mock ID
    return `WA_${Date.now()}`;
  }

  private async sendViaEmail(email: string, subject: string, message: string): Promise<void> {
    // Email service integration (Gmail, SendGrid, etc.)
    // await emailService.send({...});

    // For now, just mock
    console.log(`Email sent to ${email}: ${subject}`);
  }
}
