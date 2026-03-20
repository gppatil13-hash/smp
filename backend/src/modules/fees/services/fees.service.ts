import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@config/prisma.service';
import { FeeRecord, FeeStructure, Prisma } from '@prisma/client';

@Injectable()
export class FeesService {
  constructor(private prisma: PrismaService) {}

  async createFeeStructure(
    tenantId: string,
    schoolId: string,
    data: Prisma.FeeStructureCreateInput,
  ): Promise<FeeStructure> {
    return this.prisma.feeStructure.create({
      data: {
        ...data,
        tenantId,
        schoolId,
      },
    });
  }

  async getFeeStructures(tenantId: string, schoolId: string): Promise<FeeStructure[]> {
    return this.prisma.feeStructure.findMany({
      where: {
        tenantId,
        schoolId,
        status: true,
      },
    });
  }

  async createFeeRecord(
    tenantId: string,
    schoolId: string,
    studentId: string,
    data: Prisma.FeeRecordCreateInput,
  ): Promise<FeeRecord> {
    return this.prisma.feeRecord.create({
      data: {
        ...data,
        tenantId,
        schoolId,
        studentId,
      },
      include: {
        student: true,
        feeStructure: true,
      },
    });
  }

  async getFeeRecords(tenantId: string, schoolId: string, filters?: any): Promise<FeeRecord[]> {
    const where: Prisma.FeeRecordWhereInput = {
      tenantId,
      schoolId,
      ...(filters?.studentId && { studentId: filters.studentId }),
      ...(filters?.status && { status: filters.status }),
      ...(filters?.academicYear && { academicYear: filters.academicYear }),
    };

    return this.prisma.feeRecord.findMany({
      where,
      include: {
        student: true,
        feeStructure: true,
      },
      skip: filters?.skip || 0,
      take: filters?.take || 100,
    });
  }

  async getStudentFeeBalance(tenantId: string, schoolId: string, studentId: string): Promise<any> {
    const feeRecords = await this.prisma.feeRecord.findMany({
      where: {
        tenantId,
        schoolId,
        studentId,
      },
      include: {
        feeStructure: true,
      },
    });

    const totalDue = feeRecords.reduce((sum, record) => sum + Number(record.totalAmount), 0);
    const totalPaid = feeRecords.reduce((sum, record) => sum + Number(record.paidAmount), 0);
    const balance = totalDue - totalPaid;

    return {
      totalDue,
      totalPaid,
      balance,
      records: feeRecords,
    };
  }

  async recordPayment(
    tenantId: string,
    schoolId: string,
    feeRecordId: string,
    amount: number,
    paymentMode: string,
    transactionId?: string,
  ): Promise<FeeRecord> {
    const feeRecord = await this.prisma.feeRecord.findFirst({
      where: { id: feeRecordId, tenantId, schoolId },
    });

    if (!feeRecord) {
      throw new BadRequestException('Fee record not found');
    }

    const newPaidAmount = Number(feeRecord.paidAmount) + amount;
    if (newPaidAmount > Number(feeRecord.totalAmount)) {
      throw new BadRequestException('Payment exceeds total amount due');
    }

    const status = newPaidAmount === Number(feeRecord.totalAmount) ? 'PAID' : 'PARTIAL';

    return this.prisma.feeRecord.update({
      where: { id: feeRecordId },
      data: {
        paidAmount: newPaidAmount,
        paidDate: new Date(),
        paymentMode,
        transactionId,
        status,
      },
      include: {
        student: true,
        feeStructure: true,
      },
    });
  }

  async getDashboardStats(tenantId: string, schoolId: string): Promise<any> {
    const stats = await this.prisma.feeRecord.groupBy({
      by: ['status'],
      where: {
        tenantId,
        schoolId,
      },
      _count: true,
      _sum: {
        totalAmount: true,
        paidAmount: true,
      },
    });

    return stats;
  }
}
