import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../config/prisma.service';
import {
  CreateAdmissionEnquiryDto,
  UpdateAdmissionEnquiryDto,
  CreateFollowUpDto,
  ListAdmissionEnquiryDto,
  AdmissionEnquiryResponseDto,
  EnquiryStatus,
  FollowUpHistoryResponseDto,
  PendingFollowUpsResponseDto,
} from '../dtos/admissionEnquiry.dto';
import { v4 as uuid } from 'uuid';

@Injectable()
export class AdmissionEnquiryService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new admission enquiry
   */
  async createEnquiry(
    tenantId: string,
    dto: CreateAdmissionEnquiryDto,
  ): Promise<AdmissionEnquiryResponseDto> {
    // Generate unique enquiry number
    const enquiryNo = await this.generateEnquiryNumber(tenantId);

    const enquiry = await this.prisma.admissionEnquiry.create({
      data: {
        tenantId,
        schoolId: dto.schoolId,
        enquiryNo,
        enquiryDate: new Date(),
        studentName: dto.studentName,
        gender: dto.gender,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : null,
        parentName: dto.parentName,
        parentEmail: dto.parentEmail,
        parentPhone: dto.parentPhone,
        interestedClass: dto.interestedClass,
        address: dto.address,
        city: dto.city,
        state: dto.state,
        pincode: dto.pincode,
        source: dto.source,
        notes: dto.notes,
        status: EnquiryStatus.NEW,
        isConverted: false,
      },
    });

    return this.formatEnquiryResponse(enquiry);
  }

  /**
   * Update an enquiry
   */
  async updateEnquiry(
    tenantId: string,
    enquiryId: string,
    dto: UpdateAdmissionEnquiryDto,
  ): Promise<AdmissionEnquiryResponseDto> {
    const enquiry = await this.getEnquiryById(tenantId, enquiryId);

    const updated = await this.prisma.admissionEnquiry.update({
      where: { id: enquiryId },
      data: {
        parentEmail: dto.parentEmail || enquiry.parentEmail,
        parentPhone: dto.parentPhone || enquiry.parentPhone,
        address: dto.address || enquiry.address,
        status: dto.status || enquiry.status,
        notes: dto.notes || enquiry.notes,
      },
    });

    return this.formatEnquiryResponse(updated);
  }

  /**
   * Get enquiry by ID
   */
  async getEnquiryById(tenantId: string, enquiryId: string): Promise<any> {
    const enquiry = await this.prisma.admissionEnquiry.findFirst({
      where: {
        id: enquiryId,
        tenantId,
      },
    });

    if (!enquiry) {
      throw new NotFoundException('Enquiry not found');
    }

    return enquiry;
  }

  /**
   * List enquiries with filters and pagination
   */
  async listEnquiries(
    tenantId: string,
    dto: ListAdmissionEnquiryDto,
  ): Promise<{
    data: AdmissionEnquiryResponseDto[];
    total: number;
    page: number;
    pages: number;
  }> {
    const page = dto.page || 1;
    const limit = dto.limit || 20;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = { tenantId };

    if (dto.status) {
      where.status = dto.status;
    }

    if (dto.source) {
      where.source = dto.source;
    }

    if (dto.search) {
      where.OR = [
        { studentName: { contains: dto.search, mode: 'insensitive' } },
        { parentName: { contains: dto.search, mode: 'insensitive' } },
        { parentEmail: { contains: dto.search, mode: 'insensitive' } },
        { parentPhone: { contains: dto.search, mode: 'insensitive' } },
      ];
    }

    // Build order by
    const orderBy: any = {};
    if (dto.sortBy) {
      orderBy[dto.sortBy] = dto.sortOrder || 'DESC';
    } else {
      orderBy.enquiryDate = 'DESC';
    }

    // Execute queries
    const [enquiries, total] = await Promise.all([
      this.prisma.admissionEnquiry.findMany({
        where,
        skip,
        take: limit,
        orderBy,
      }),
      this.prisma.admissionEnquiry.count({ where }),
    ]);

    const pages = Math.ceil(total / limit);

    return {
      data: enquiries.map((e) => this.formatEnquiryResponse(e)),
      total,
      page,
      pages,
    };
  }

  /**
   * Add follow-up to an enquiry
   */
  async addFollowUp(
    tenantId: string,
    enquiryId: string,
    dto: CreateFollowUpDto,
  ): Promise<{
    enquiry: AdmissionEnquiryResponseDto;
    message: string;
  }> {
    const enquiry = await this.getEnquiryById(tenantId, enquiryId);

    // Create a log of the follow-up (can be stored in CommunicationLog)
    await this.prisma.communicationLog.create({
      data: {
        tenantId,
        admissionEnquiryId: enquiryId,
        type: 'IN_APP',
        recipientType: 'STUDENT',
        message: `Follow-up: ${dto.remarks}`,
        status: 'PENDING',
        createdAt: new Date(),
      },
    });

    // Update enquiry with follow-up date and status
    const updated = await this.prisma.admissionEnquiry.update({
      where: { id: enquiryId },
      data: {
        followUpDate: new Date(dto.followUpDate),
        status: dto.status || enquiry.status,
        notes: dto.remarks,
      },
    });

    return {
      enquiry: this.formatEnquiryResponse(updated),
      message: `Follow-up scheduled for ${dto.followUpDate}`,
    };
  }

  /**
   * Get pending follow-ups
   */
  async getPendingFollowUps(
    tenantId: string,
  ): Promise<PendingFollowUpsResponseDto> {
    const now = new Date();
    const futureDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days out

    const enquiries = await this.prisma.admissionEnquiry.findMany({
      where: {
        tenantId,
        followUpDate: { not: null },
        isConverted: false,
      },
    });

    const overdue = enquiries
      .filter((e) => e.followUpDate < now)
      .map((e) => this.formatFollowUpHistory(e));

    const due = enquiries
      .filter((e) => e.followUpDate >= now && e.followUpDate <= futureDate)
      .map((e) => this.formatFollowUpHistory(e));

    const upcoming = enquiries
      .filter((e) => e.followUpDate > futureDate)
      .map((e) => this.formatFollowUpHistory(e));

    return {
      overdue,
      due,
      upcoming,
      total: enquiries.length,
    };
  }

  /**
   * Get enquiry analytics/statistics
   */
  async getEnquiryStatistics(tenantId: string): Promise<{
    totalEnquiries: number;
    statusBreakdown: { status: string; count: number }[];
    sourceBreakdown: { source: string; count: number }[];
    conversionRate: number;
  }> {
    const [total, byStatus, bySources] = await Promise.all([
      this.prisma.admissionEnquiry.count({ where: { tenantId } }),
      this.prisma.admissionEnquiry.groupBy({
        by: ['status'],
        where: { tenantId },
        _count: true,
      }),
      this.prisma.admissionEnquiry.groupBy({
        by: ['source'],
        where: { tenantId },
        _count: true,
      }),
    ]);

    const converted = await this.prisma.admissionEnquiry.count({
      where: { tenantId, isConverted: true },
    });

    const conversionRate = total > 0 ? (converted / total) * 100 : 0;

    return {
      totalEnquiries: total,
      statusBreakdown: byStatus.map((s) => ({
        status: s.status,
        count: s._count,
      })),
      sourceBreakdown: bySources.map((s) => ({
        source: s.source || 'Unknown',
        count: s._count,
      })),
      conversionRate: Math.round(conversionRate * 100) / 100,
    };
  }

  /**
   * Update enquiry status to mark as converted to admission
   */
  async markAsConverted(
    tenantId: string,
    enquiryId: string,
    admissionId: string,
  ): Promise<void> {
    await this.getEnquiryById(tenantId, enquiryId);

    await this.prisma.admissionEnquiry.update({
      where: { id: enquiryId },
      data: {
        isConverted: true,
        convertedToAdmissionId: admissionId,
      },
    });
  }

  /**
   * Delete an enquiry (soft delete)
   */
  async deleteEnquiry(tenantId: string, enquiryId: string): Promise<void> {
    await this.getEnquiryById(tenantId, enquiryId);

    // Soft delete by marking as not converted and archived
    // Or actually delete if no relations
    await this.prisma.admissionEnquiry.delete({
      where: { id: enquiryId },
    });
  }

  // ========== PRIVATE HELPER METHODS ==========

  /**
   * Generate unique enquiry number
   */
  private async generateEnquiryNumber(tenantId: string): Promise<string> {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');

    // Count enquiries in this month
    const count = await this.prisma.admissionEnquiry.count({
      where: {
        tenantId,
        enquiryDate: {
          gte: new Date(year, date.getMonth(), 1),
          lt: new Date(year, date.getMonth() + 1, 1),
        },
      },
    });

    const sequence = String(count + 1).padStart(4, '0');
    return `ENQ-${year}-${month}-${sequence}`;
  }

  /**
   * Format enquiry response
   */
  private formatEnquiryResponse(enquiry: any): AdmissionEnquiryResponseDto {
    return {
      id: enquiry.id,
      enquiryNo: enquiry.enquiryNo,
      studentName: enquiry.studentName,
      parentName: enquiry.parentName,
      parentEmail: enquiry.parentEmail,
      parentPhone: enquiry.parentPhone,
      interestedClass: enquiry.interestedClass,
      address: enquiry.address,
      city: enquiry.city,
      state: enquiry.state,
      pincode: enquiry.pincode,
      status: enquiry.status,
      source: enquiry.source,
      notes: enquiry.notes,
      followUpDate: enquiry.followUpDate,
      isConverted: enquiry.isConverted,
      createdAt: enquiry.createdAt,
      updatedAt: enquiry.updatedAt,
    };
  }

  /**
   * Format follow-up history response
   */
  private formatFollowUpHistory(enquiry: any): FollowUpHistoryResponseDto {
    return {
      enquiryId: enquiry.id,
      enquiryNo: enquiry.enquiryNo,
      studentName: enquiry.studentName,
      lastFollowUpDate: enquiry.updatedAt,
      nextFollowUpDate: enquiry.followUpDate,
      status: enquiry.status,
      lastRemarks: enquiry.notes,
      interactionCount: 1, // Should count actual interactions
    };
  }
}
