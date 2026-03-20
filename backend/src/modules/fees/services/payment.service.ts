import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@config/prisma.service';
import { RecordPaymentDto, PaymentResponseDto } from '../dtos/fees.dto';

/**
 * Payment Service
 * Handles fee payment recording and status tracking
 * - Record partial and full payments
 * - Update payment status
 * - Generate payment receipts
 * - Track payment history
 * - Validate payment amounts
 */
@Injectable()
export class PaymentService {
  constructor(private prisma: PrismaService) {}

  /**
   * Record a fee payment
   * @param tenantId - Tenant identifier
   * @param schoolId - School identifier
   * @param dto - Payment record data
   * @returns Payment confirmation
   */
  async recordPayment(tenantId: string, schoolId: string, dto: RecordPaymentDto) {
    // Get fee record
    const feeRecord = await this.prisma.feeRecord.findFirst({
      where: { id: dto.feeRecordId, tenantId, schoolId },
      include: {
        student: {
          select: { id: true, firstName: true, lastName: true, enrollmentNo: true, fatherEmail: true, motherEmail: true, fatherPhone: true, motherPhone: true },
        },
        feeStructure: true,
      },
    });

    if (!feeRecord) {
      throw new NotFoundException(`Fee record '${dto.feeRecordId}' not found`);
    }

    // Validate payment amount
    const totalDue = Number(feeRecord.totalAmount);
    const alreadyPaid = Number(feeRecord.paidAmount);
    const remainingAmount = totalDue - alreadyPaid;

    if (dto.amountPaid <= 0) {
      throw new BadRequestException('Payment amount must be greater than 0');
    }

    if (dto.amountPaid > remainingAmount) {
      throw new BadRequestException(
        `Payment amount (${dto.amountPaid}) exceeds remaining amount (${remainingAmount})`,
      );
    }

    // Calculate new payment status
    const newPaidAmount = alreadyPaid + dto.amountPaid;
    const newStatus = newPaidAmount === totalDue ? 'PAID' : 'PARTIAL';
    const paymentDate = dto.paymentDate ? new Date(dto.paymentDate) : new Date();

    // Update fee record
    const updatedRecord = await this.prisma.feeRecord.update({
      where: { id: dto.feeRecordId },
      data: {
        paidAmount: newPaidAmount,
        paymentMode: dto.paymentMode,
        transactionId: dto.transactionReference,
        paidDate: newStatus === 'PAID' ? paymentDate : feeRecord.paidDate,
        status: newStatus,
        remarks: dto.remarks || feeRecord.remarks,
        updatedAt: new Date(),
      },
      include: {
        student: true,
        feeStructure: true,
      },
    });

    // Create payment log in communication table for audit trail
    await this.createPaymentLog(tenantId, schoolId, updatedRecord, dto.paymentMode);

    return this.formatPaymentResponse(updatedRecord);
  }

  /**
   * Get payment history for a student
   * @param tenantId - Tenant identifier
   * @param schoolId - School identifier
   * @param studentId - Student identifier
   * @returns Payment history
   */
  async getPaymentHistory(tenantId: string, schoolId: string, studentId: string) {
    const feeRecords = await this.prisma.feeRecord.findMany({
      where: {
        tenantId,
        schoolId,
        studentId,
      },
      include: {
        student: {
          select: { firstName: true, lastName: true, enrollmentNo: true },
        },
        feeStructure: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (feeRecords.length === 0) {
      throw new NotFoundException(`No fee records found for student '${studentId}'`);
    }

    const totalDue = feeRecords.reduce((sum, r) => sum + Number(r.totalAmount), 0);
    const totalPaid = feeRecords.reduce((sum, r) => sum + Number(r.paidAmount), 0);
    const balance = totalDue - totalPaid;

    return {
      studentId,
      studentName: `${feeRecords[0].student.firstName} ${feeRecords[0].student.lastName}`,
      enrollmentNo: feeRecords[0].student.enrollmentNo,
      totalDue,
      totalPaid,
      balance,
      payments: feeRecords.map(record => ({
        feeRecordId: record.id,
        academicYear: record.academicYear,
        totalAmount: Number(record.totalAmount),
        paidAmount: Number(record.paidAmount),
        balance: Number(record.totalAmount) - Number(record.paidAmount),
        status: record.status,
        paymentMode: record.paymentMode,
        transactionId: record.transactionId,
        paidDate: record.paidDate,
        dueDate: record.dueDate,
        overdueDays: this.calculateOverdueDays(record.dueDate),
      })),
    };
  }

  /**
   * Get payment details by fee record
   * @param tenantId - Tenant identifier
   * @param feeRecordId - Fee record identifier
   * @returns Payment details
   */
  async getPaymentDetails(tenantId: string, feeRecordId: string) {
    const feeRecord = await this.prisma.feeRecord.findFirst({
      where: { id: feeRecordId, tenantId },
      include: {
        student: {
          select: { id: true, firstName: true, lastName: true, enrollmentNo: true, email: true },
        },
        feeStructure: true,
      },
    });

    if (!feeRecord) {
      throw new NotFoundException(`Fee record '${feeRecordId}' not found`);
    }

    return {
      feeRecordId: feeRecord.id,
      studentId: feeRecord.studentId,
      studentName: `${feeRecord.student.firstName} ${feeRecord.student.lastName}`,
      enrollmentNo: feeRecord.student.enrollmentNo,
      studentEmail: feeRecord.student.email,
      academicYear: feeRecord.academicYear,
      totalAmount: Number(feeRecord.totalAmount),
      paidAmount: Number(feeRecord.paidAmount),
      balance: Number(feeRecord.totalAmount) - Number(feeRecord.paidAmount),
      status: feeRecord.status,
      paymentMode: feeRecord.paymentMode,
      transactionId: feeRecord.transactionId,
      dueDate: feeRecord.dueDate,
      paidDate: feeRecord.paidDate,
      overdueDays: this.calculateOverdueDays(feeRecord.dueDate),
      isOverdue: new Date() > feeRecord.dueDate,
      remarks: feeRecord.remarks,
      createdAt: feeRecord.createdAt,
      updatedAt: feeRecord.updatedAt,
    };
  }

  /**
   * Get payment statistics
   * @param tenantId - Tenant identifier
   * @param schoolId - School identifier
   * @returns Payment statistics
   */
  async getPaymentStatistics(tenantId: string, schoolId: string) {
    const feeRecords = await this.prisma.feeRecord.findMany({
      where: { tenantId, schoolId },
      include: {
        student: true,
      },
    });

    const statusBreakdown = {
      pending: 0,
      partial: 0,
      paid: 0,
      overdue: 0,
      cancelled: 0,
    };

    let totalDue = 0;
    let totalCollected = 0;
    let totalOverdue = 0;
    let overdueRecords = 0;

    const now = new Date();

    for (const record of feeRecords) {
      const amount = Number(record.totalAmount);
      totalDue += amount;
      totalCollected += Number(record.paidAmount);

      statusBreakdown[record.status.toLowerCase()] =
        (statusBreakdown[record.status.toLowerCase()] || 0) + 1;

      if (record.status === 'PENDING' || record.status === 'PARTIAL') {
        if (now > record.dueDate) {
          totalOverdue += Number(record.totalAmount) - Number(record.paidAmount);
          overdueRecords++;
        }
      }
    }

    const paymentModeBreakdown = feeRecords.reduce(
      (acc, record) => {
        if (record.paymentMode) {
          acc[record.paymentMode] = (acc[record.paymentMode] || 0) + Number(record.paidAmount);
        }
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      totalFeeRecords: feeRecords.length,
      totalStudents: new Set(feeRecords.map(r => r.studentId)).size,
      totalDue,
      totalCollected,
      totalPending: totalDue - totalCollected,
      totalOverdue,
      collectionPercentage: totalDue > 0 ? (totalCollected / totalDue) * 100 : 0,
      overdueRecords,
      statusBreakdown,
      paymentModeBreakdown,
      monthlyCollection: this.getMonthlyCollection(feeRecords),
    };
  }

  /**
   * Generate Payment Reminder Queue
   * @param tenantId - Tenant identifier
   * @param schoolId - School identifier
   * @param daysBefore - Days before due date (default 3)
   * @returns Reminder list
   */
  async generatePaymentReminders(tenantId: string, schoolId: string, daysBefore: number = 3) {
    const reminderDate = new Date();
    reminderDate.setDate(reminderDate.getDate() + daysBefore);

    const feeRecords = await this.prisma.feeRecord.findMany({
      where: {
        tenantId,
        schoolId,
        status: { in: ['PENDING', 'PARTIAL'] },
        dueDate: {
          gte: new Date(),
          lte: reminderDate,
        },
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            enrollmentNo: true,
            fatherEmail: true,
            motherEmail: true,
            fatherPhone: true,
            motherPhone: true,
          },
        },
        feeStructure: true,
      },
    });

    const reminders = feeRecords.map(record => ({
      studentId: record.studentId,
      studentName: `${record.student.firstName} ${record.student.lastName}`,
      enrollmentNo: record.student.enrollmentNo,
      feeRecordId: record.id,
      amountDue: Number(record.totalAmount) - Number(record.paidAmount),
      dueDate: record.dueDate,
      daysUntilDue: Math.ceil((record.dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
      parentEmail: record.student.fatherEmail || record.student.motherEmail,
      parentPhone: record.student.fatherPhone || record.student.motherPhone,
      status: record.status,
    }));

    return {
      totalReminders: reminders.length,
      reminders,
      generatedAt: new Date(),
    };
  }

  /**
   * Helper: Create payment log in Communications table
   */
  private async createPaymentLog(
    tenantId: string,
    schoolId: string,
    feeRecord: any,
    paymentMode: string,
  ) {
    try {
      await this.prisma.communication.create({
        data: {
          tenantId,
          schoolId,
          studentId: feeRecord.studentId,
          recipientName: `${feeRecord.student.firstName} ${feeRecord.student.lastName}`,
          recipientEmail: feeRecord.student.email,
          recipientPhone: feeRecord.student.phone || feeRecord.student.fatherPhone,
          type: 'EMAIL',
          subject: 'Payment Confirmation',
          message: `Your payment of ${feeRecord.paidAmount} via ${paymentMode} has been recorded. Updated balance: ${Number(feeRecord.totalAmount) - Number(feeRecord.paidAmount)}`,
          status: 'PENDING',
        },
      });
    } catch (error) {
      // Log creation is optional, don't throw
      console.error('Failed to create payment log:', error);
    }
  }

  /**
   * Helper: Format payment response
   */
  private formatPaymentResponse(feeRecord: any): PaymentResponseDto {
    return {
      id: feeRecord.id,
      feeRecordId: feeRecord.id,
      studentId: feeRecord.studentId,
      studentName: `${feeRecord.student.firstName} ${feeRecord.student.lastName}`,
      amountPaid: Number(feeRecord.paidAmount),
      paymentMode: feeRecord.paymentMode,
      transactionReference: feeRecord.transactionId,
      paymentDate: feeRecord.paidDate,
      receiptGenerated: false,
      remarks: feeRecord.remarks,
      createdAt: feeRecord.createdAt,
    };
  }

  /**
   * Helper: Calculate overdue days
   */
  private calculateOverdueDays(dueDate: Date): number {
    const now = new Date();
    if (now <= dueDate) return 0;

    const timeDiff = now.getTime() - dueDate.getTime();
    return Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
  }

  /**
   * Helper: Get monthly collection data
   */
  private getMonthlyCollection(feeRecords: any[]) {
    const monthlyData: Record<string, number> = {};

    for (const record of feeRecords) {
      if (record.paidDate) {
        const month = record.paidDate.toISOString().substring(0, 7); // YYYY-MM format
        monthlyData[month] = (monthlyData[month] || 0) + Number(record.paidAmount);
      }
    }

    return monthlyData;
  }
}
