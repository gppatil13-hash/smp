import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@config/prisma.service';
import { GenerateReceiptDto, Receipt, ReceiptResponseDto } from '../dtos/fees.dto';

/**
 * Receipt Service
 * Generates and manages fee payment receipts
 * - Generate PDF receipts
 * - Send receipts to parents via email/SMS
 * - Store receipt records
 * - Retrieve receipt history
 */
@Injectable()
export class ReceiptService {
  constructor(private prisma: PrismaService) {}

  /**
   * Generate receipt for a payment
   * @param tenantId - Tenant identifier
   * @param schoolId - School identifier
   * @param paymentRecordId - Fee record identifier
   * @returns Receipt details and PDF URL
   */
  async generateReceipt(tenantId: string, schoolId: string, paymentRecordId: string) {
    // Get fee record with related data
    const feeRecord = await this.prisma.feeRecord.findFirst({
      where: { id: paymentRecordId, tenantId, schoolId },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            enrollmentNo: true,
            class: {
              select: { name: true },
            },
          },
        },
        feeStructure: true,
        school: {
          select: { name: true, address: true, city: true, state: true, pinCode: true },
        },
      },
    });

    if (!feeRecord) {
      throw new NotFoundException(`Fee record '${paymentRecordId}' not found`);
    }

    if (!feeRecord.paidDate || feeRecord.paidAmount === 0) {
      throw new BadRequestException('No payment found for this fee record');
    }

    // Generate receipt number
    const receiptNumber = this.generateReceiptNumber(feeRecord);

    // Build receipt object
    const receipt: Receipt = {
      receiptNumber,
      studentName: `${feeRecord.student.firstName} ${feeRecord.student.lastName}`,
      enrollmentNo: feeRecord.student.enrollmentNo,
      className: feeRecord.student.class?.name || 'N/A',
      academicYear: feeRecord.academicYear,
      feeType: feeRecord.feeStructure?.feeType || 'TUITION',
      termName: this.getTermName(feeRecord.month),
      totalAmount: Number(feeRecord.totalAmount),
      amountPaid: Number(feeRecord.paidAmount),
      paymentDate: feeRecord.paidDate,
      paymentMode: feeRecord.paymentMode,
      transactionReference: feeRecord.transactionId,
      balance: Number(feeRecord.totalAmount) - Number(feeRecord.paidAmount),
      schoolName: feeRecord.school.name,
      schoolAddress: `${feeRecord.school.address}, ${feeRecord.school.city}, ${feeRecord.school.state} ${feeRecord.school.pinCode}`,
      generatedDate: new Date(),
    };

    // Generate PDF (in real implementation, use PDFKit or similar)
    const pdfUrl = await this.generatePDF(receipt, tenantId);

    // Save receipt record
    await this.saveReceiptRecord(tenantId, schoolId, feeRecord, receiptNumber, pdfUrl);

    return {
      receiptNumber,
      studentName: receipt.studentName,
      enrollmentNo: receipt.enrollmentNo,
      amountPaid: receipt.amountPaid,
      paymentDate: receipt.paymentDate,
      pdfUrl,
      generatedDate: receipt.generatedDate,
    };
  }

  /**
   * Get receipt by receipt number
   * @param tenantId - Tenant identifier
   * @param receiptNumber - Receipt number
   * @returns Receipt details
   */
  async getReceiptByNumber(tenantId: string, receiptNumber: string) {
    // In real implementation, fetch from ReceiptLog table
    // For now, return sample data
    const receipt = {
      receiptNumber,
      studentName: 'Sample Student',
      enrollmentNo: 'E001',
      amountPaid: 5000,
      paymentDate: new Date(),
      pdfUrl: `/receipts/${receiptNumber}.pdf`,
      generatedDate: new Date(),
    };

    return receipt;
  }

  /**
   * Get receipt history for a student
   * @param tenantId - Tenant identifier
   * @param studentId - Student identifier
   * @returns Receipt history
   */
  async getReceiptHistory(tenantId: string, studentId: string) {
    const feeRecords = await this.prisma.feeRecord.findMany({
      where: {
        tenantId,
        studentId,
        status: 'PAID',
      },
      include: {
        student: {
          select: { firstName: true, lastName: true, enrollmentNo: true },
        },
        feeStructure: true,
      },
      orderBy: { paidDate: 'desc' },
    });

    if (feeRecords.length === 0) {
      throw new NotFoundException(`No receipts found for student '${studentId}'`);
    }

    const receipts = feeRecords.map(record => ({
      receiptNumber: this.generateReceiptNumber(record),
      studentName: `${record.student.firstName} ${record.student.lastName}`,
      enrollmentNo: record.student.enrollmentNo,
      academicYear: record.academicYear,
      amountPaid: Number(record.paidAmount),
      paymentDate: record.paidDate,
      paymentMode: record.paymentMode,
      transactionReference: record.transactionId,
      pdfUrl: `/receipts/${this.generateReceiptNumber(record)}.pdf`,
    }));

    return {
      studentName: receipts[0].studentName,
      enrollmentNo: receipts[0].enrollmentNo,
      totalReceipts: receipts.length,
      totalAmountPaid: receipts.reduce((sum, r) => sum + r.amountPaid, 0),
      receipts,
    };
  }

  /**
   * Send receipt to parent
   * @param tenantId - Tenant identifier
   * @param schoolId - School identifier
   * @param receiptNumber - Receipt number
   * @param sendMethod - Email or SMS
   * @returns Send status
   */
  async sendReceipt(
    tenantId: string,
    schoolId: string,
    receiptNumber: string,
    sendMethod: 'EMAIL' | 'SMS' = 'EMAIL',
  ) {
    // Get receipt details
    const receipt = await this.getReceiptByNumber(tenantId, receiptNumber);

    if (!receipt) {
      throw new NotFoundException(`Receipt '${receiptNumber}' not found`);
    }

    // In real implementation, send via email/SMS service
    // For now, create communication log entry
    try {
      await this.prisma.communication.create({
        data: {
          tenantId,
          schoolId,
          recipientName: receipt.studentName,
          type: sendMethod === 'EMAIL' ? 'EMAIL' : 'SMS',
          subject: `Payment Receipt #${receiptNumber}`,
          message: `Your payment receipt has been generated. Amount: ${receipt.amountPaid}. Reference: ${receiptNumber}`,
          status: 'PENDING',
        },
      });

      return {
        success: true,
        message: `Receipt sent via ${sendMethod}`,
        receiptNumber,
        sentDate: new Date(),
      };
    } catch (error) {
      throw new BadRequestException(`Failed to send receipt: ${error.message}`);
    }
  }

  /**
   * Bulk generate receipts for class section
   * @param tenantId - Tenant identifier
   * @param schoolId - School identifier
   * @param classSection - Class section
   * @param academicYear - Academic year
   * @returns Generation summary
   */
  async bulkGenerateReceipts(
    tenantId: string,
    schoolId: string,
    classSection: string,
    academicYear: string,
  ) {
    // Get all paid fee records for the class
    const feeRecords = await this.prisma.feeRecord.findMany({
      where: {
        tenantId,
        schoolId,
        status: 'PAID',
        academicYear: academicYear as any,
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            enrollmentNo: true,
            class: { select: { name: true } },
          },
        },
        feeStructure: true,
      },
    });

    if (feeRecords.length === 0) {
      throw new NotFoundException(`No paid fee records found for ${classSection} in ${academicYear}`);
    }

    let successCount = 0;
    let failureCount = 0;
    const generatedReceipts = [];

    for (const record of feeRecords) {
      try {
        const receiptNumber = this.generateReceiptNumber(record);
        const pdfUrl = await this.generatePDF(
          this.buildReceiptObject(record),
          tenantId,
        );

        await this.saveReceiptRecord(tenantId, schoolId, record, receiptNumber, pdfUrl);

        generatedReceipts.push({
          receiptNumber,
          studentName: `${record.student.firstName} ${record.student.lastName}`,
          enrollmentNo: record.student.enrollmentNo,
          amountPaid: Number(record.paidAmount),
        });

        successCount++;
      } catch (error) {
        failureCount++;
        console.error(`Failed to generate receipt for student ${record.studentId}`, error);
      }
    }

    return {
      classSection,
      academicYear,
      totalRecordsProcessed: feeRecords.length,
      successfullyGenerated: successCount,
      failed: failureCount,
      generatedReceipts,
      timestamp: new Date(),
    };
  }

  /**
   * Get receipt statistics
   * @param tenantId - Tenant identifier
   * @param schoolId - School identifier
   * @returns Receipt statistics
   */
  async getReceiptStatistics(tenantId: string, schoolId: string) {
    const paidRecords = await this.prisma.feeRecord.findMany({
      where: {
        tenantId,
        schoolId,
        status: 'PAID',
      },
    });

    return {
      totalReceiptsGenerated: paidRecords.length,
      totalAmountCollected: paidRecords.reduce((sum, r) => sum + Number(r.paidAmount), 0),
      averageReceiptAmount:
        paidRecords.length > 0
          ? paidRecords.reduce((sum, r) => sum + Number(r.paidAmount), 0) / paidRecords.length
          : 0,
      paymentModeBreakdown: this.getPaymentModeBreakdown(paidRecords),
      monthlyReceiptCount: this.getMonthlyReceiptCount(paidRecords),
    };
  }

  /**
   * Helper: Generate receipt number
   */
  private generateReceiptNumber(feeRecord: any): string {
    const date = new Date();
    const timestamp = Math.floor(Date.now() / 1000);
    return `RCP-${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(timestamp).slice(-6)}`;
  }

  /**
   * Helper: Get term name from month
   */
  private getTermName(month: number): string {
    if (month >= 4 && month <= 6) return 'Term 1';
    if (month >= 7 && month <= 10) return 'Term 2';
    return 'Term 3';
  }

  /**
   * Helper: Build receipt object
   */
  private buildReceiptObject(feeRecord: any): Receipt {
    return {
      receiptNumber: this.generateReceiptNumber(feeRecord),
      studentName: `${feeRecord.student.firstName} ${feeRecord.student.lastName}`,
      enrollmentNo: feeRecord.student.enrollmentNo,
      className: feeRecord.student.class?.name || 'N/A',
      academicYear: feeRecord.academicYear,
      feeType: feeRecord.feeStructure?.feeType || 'TUITION',
      termName: this.getTermName(feeRecord.month),
      totalAmount: Number(feeRecord.totalAmount),
      amountPaid: Number(feeRecord.paidAmount),
      paymentDate: feeRecord.paidDate,
      paymentMode: feeRecord.paymentMode,
      transactionReference: feeRecord.transactionId,
      balance: Number(feeRecord.totalAmount) - Number(feeRecord.paidAmount),
      schoolName: 'School Name',
      schoolAddress: 'School Address',
      generatedDate: new Date(),
    };
  }

  /**
   * Helper: Generate PDF (implementation using PDFKit or similar)
   */
  private async generatePDF(receipt: Receipt, tenantId: string): Promise<string> {
    // In real implementation, use PDFKit library
    // For now, return a placeholder URL
    const receiptPath = `/receipts/${receipt.receiptNumber}.pdf`;
    return receiptPath;
  }

  /**
   * Helper: Save receipt record
   */
  private async saveReceiptRecord(
    tenantId: string,
    schoolId: string,
    feeRecord: any,
    receiptNumber: string,
    pdfUrl: string,
  ): Promise<void> {
    // In real implementation, save to ReceiptLog table
    // For now, just create a communication log entry
    try {
      await this.prisma.communication.create({
        data: {
          tenantId,
          schoolId,
          studentId: feeRecord.studentId,
          recipientName: `${feeRecord.student.firstName} ${feeRecord.student.lastName}`,
          type: 'EMAIL',
          subject: `Payment Receipt Generated #${receiptNumber}`,
          message: `Receipt ${receiptNumber} has been generated for payment of ${feeRecord.paidAmount}`,
          status: 'SENT',
        },
      });
    } catch (error) {
      console.error('Failed to save receipt record:', error);
    }
  }

  /**
   * Helper: Get payment mode breakdown
   */
  private getPaymentModeBreakdown(records: any[]) {
    return records.reduce(
      (acc, record) => {
        if (record.paymentMode) {
          acc[record.paymentMode] = (acc[record.paymentMode] || 0) + 1;
        }
        return acc;
      },
      {} as Record<string, number>,
    );
  }

  /**
   * Helper: Get monthly receipt count
   */
  private getMonthlyReceiptCount(records: any[]) {
    return records.reduce(
      (acc, record) => {
        if (record.paidDate) {
          const month = record.paidDate.toISOString().substring(0, 7);
          acc[month] = (acc[month] || 0) + 1;
        }
        return acc;
      },
      {} as Record<string, number>,
    );
  }
}
