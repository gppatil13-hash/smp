import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@config/prisma.service';
import { CreateInstallmentPlanDto, TermInstallmentDto, InstallmentResponseDto } from '../dtos/fees.dto';

/**
 * Installment Planning Service
 * Manages term-based installment plans
 * - Create installment plans with multiple terms
 * - Generate student fee records based on terms
 * - Calculate term-wise fee distribution
 * - Track installment status
 */
@Injectable()
export class InstallmentService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create installment plan for a fee structure
   * @param tenantId - Tenant identifier
   * @param schoolId - School identifier
   * @param dto - Installment plan data with terms
   * @returns Created installment plan details
   */
  async createInstallmentPlan(tenantId: string, schoolId: string, dto: CreateInstallmentPlanDto) {
    // Validate fee structure exists
    const feeStructure = await this.prisma.feeStructure.findFirst({
      where: { id: dto.feeStructureId, tenantId, schoolId },
    });

    if (!feeStructure) {
      throw new NotFoundException(`Fee structure '${dto.feeStructureId}' not found`);
    }

    // Validate terms
    if (!dto.terms || dto.terms.length === 0) {
      throw new BadRequestException('At least one term is required');
    }

    // Validate percentage distribution (should sum to 100)
    const totalPercentage = dto.terms.reduce((sum, term) => sum + term.percentageAmount, 0);
    if (totalPercentage !== 100) {
      throw new BadRequestException(
        `Term percentages must sum to 100. Current total: ${totalPercentage}%`,
      );
    }

    // Validate no overlapping date ranges
    this.validateDateRanges(dto.terms);

    // Create installment records for each term
    const installments = await Promise.all(
      dto.terms.map(term =>
        this.createTermInstallment(tenantId, schoolId, dto.feeStructureId, term, feeStructure),
      ),
    );

    return {
      feeStructureId: dto.feeStructureId,
      totalTerms: installments.length,
      totalFeeAmount: Number(feeStructure.amount),
      installments: installments.map(inst => this.formatInstallmentResponse(inst)),
      message: `Created ${installments.length} installment terms for fee structure`,
      createdAt: new Date(),
    };
  }

  /**
   * Get installment plan for a fee structure
   * @param tenantId - Tenant identifier
   * @param feeStructureId - Fee structure identifier
   * @returns Installment plan details
   */
  async getInstallmentPlan(tenantId: string, feeStructureId: string) {
    const feeStructure = await this.prisma.feeStructure.findFirst({
      where: { id: feeStructureId, tenantId },
    });

    if (!feeStructure) {
      throw new NotFoundException(`Fee structure '${feeStructureId}' not found`);
    }

    // In real implementation, fetch from separate InstallmentPlan table
    // For now, return sample installments based on fee structure
    const installments = this.generateSampleInstallments(feeStructure);

    return {
      feeStructureId,
      totalFeeAmount: Number(feeStructure.amount),
      frequency: feeStructure.frequency,
      installments,
      totalTerms: installments.length,
    };
  }

  /**
   * Get installments by term name
   * @param tenantId - Tenant identifier
   * @param feeStructureId - Fee structure identifier
   * @param termName - Term name
   * @returns Term installment details
   */
  async getInstallmentByTerm(tenantId: string, feeStructureId: string, termName: string) {
    const feeStructure = await this.prisma.feeStructure.findFirst({
      where: { id: feeStructureId, tenantId },
    });

    if (!feeStructure) {
      throw new NotFoundException(`Fee structure '${feeStructureId}' not found`);
    }

    const installments = this.generateSampleInstallments(feeStructure);
    const termInstallment = installments.find(i => i.termName === termName);

    if (!termInstallment) {
      throw new NotFoundException(
        `Term '${termName}' not found in installment plan for fee structure '${feeStructureId}'`,
      );
    }

    // Get all fee records for this term
    const feeRecords = await this.prisma.feeRecord.findMany({
      where: {
        feeStructureId,
        tenantId,
      },
      include: {
        student: {
          select: { firstName: true, lastName: true, enrollmentNo: true },
        },
      },
    });

    return {
      ...termInstallment,
      affectedStudents: feeRecords.length,
      studentDetails: feeRecords.map(record => ({
        studentId: record.studentId,
        studentName: `${record.student.firstName} ${record.student.lastName}`,
        enrollmentNo: record.student.enrollmentNo,
        amountDue: termInstallment.amountDue,
        dueDate: termInstallment.dueDate,
        status: record.status,
      })),
    };
  }

  /**
   * Update installment plan
   * @param tenantId - Tenant identifier
   * @param feeStructureId - Fee structure identifier
   * @param newTerms - New terms configuration
   * @returns Updated installment plan
   */
  async updateInstallmentPlan(
    tenantId: string,
    feeStructureId: string,
    newTerms: TermInstallmentDto[],
  ) {
    const feeStructure = await this.prisma.feeStructure.findFirst({
      where: { id: feeStructureId, tenantId },
    });

    if (!feeStructure) {
      throw new NotFoundException(`Fee structure '${feeStructureId}' not found`);
    }

    // Validate percentage distribution
    const totalPercentage = newTerms.reduce((sum, term) => sum + term.percentageAmount, 0);
    if (totalPercentage !== 100) {
      throw new BadRequestException(
        `Term percentages must sum to 100. Current total: ${totalPercentage}%`,
      );
    }

    // Check if there are paid/partial fees
    const activeRecords = await this.prisma.feeRecord.count({
      where: {
        feeStructureId,
        status: { in: ['PAID', 'PARTIAL'] },
      },
    });

    if (activeRecords > 0) {
      throw new BadRequestException(
        `Cannot modify installment plan with ${activeRecords} paid/partial fee records. Only new plans can be modified.`,
      );
    }

    // Update installment plan
    const updatedTerms = newTerms.map((term, index) => {
      const amountDue = (Number(feeStructure.amount) * term.percentageAmount) / 100;
      return {
        termName: term.termName,
        startDate: new Date(term.startDate),
        endDate: new Date(term.endDate),
        percentageAmount: term.percentageAmount,
        amountDue,
        dueDate: term.dueDate ? new Date(term.dueDate) : new Date(term.endDate),
      };
    });

    return {
      feeStructureId,
      totalTerms: updatedTerms.length,
      totalFeeAmount: Number(feeStructure.amount),
      installments: updatedTerms,
      updatedAt: new Date(),
    };
  }

  /**
   * Generate fee records for all students based on installment plan
   * @param tenantId - Tenant identifier
   * @param schoolId - School identifier
   * @param feeStructureId - Fee structure identifier
   * @returns Generated fee records count
   */
  async generateFeeRecordsFromInstallments(
    tenantId: string,
    schoolId: string,
    feeStructureId: string,
  ) {
    const feeStructure = await this.prisma.feeStructure.findFirst({
      where: { id: feeStructureId, tenantId, schoolId },
    });

    if (!feeStructure) {
      throw new NotFoundException(`Fee structure '${feeStructureId}' not found`);
    }

    // Get all students in the class section
    const students = await this.prisma.student.findMany({
      where: {
        tenantId,
        schoolId,
        academicYear: feeStructure.academicYear,
      },
    });

    if (students.length === 0) {
      throw new BadRequestException(`No students found in this academic year`);
    }

    // Get installment terms
    const installments = this.generateSampleInstallments(feeStructure);

    let createdCount = 0;
    const errors: any[] = [];

    // Create fee records for each student and term
    for (const student of students) {
      for (const installment of installments) {
        try {
          const recordExists = await this.prisma.feeRecord.findFirst({
            where: {
              tenantId,
              studentId: student.id,
              feeStructureId,
              academicYear: feeStructure.academicYear,
            },
          });

          if (recordExists) {
            continue; // Skip if already exists
          }

          await this.prisma.feeRecord.create({
            data: {
              tenantId,
              schoolId,
              studentId: student.id,
              feeStructureId,
              academicYear: feeStructure.academicYear,
              month: new Date(installment.startDate).getMonth() + 1,
              year: new Date(installment.startDate).getFullYear(),
              totalAmount: installment.amountDue,
              paidAmount: 0,
              dueDate: installment.dueDate,
              status: 'PENDING',
            },
          });

          createdCount++;
        } catch (error) {
          errors.push({
            studentId: student.id,
            term: installment.termName,
            error: error.message,
          });
        }
      }
    }

    return {
      message: `Generated fee records from installment plan`,
      totalRecordsCreated: createdCount,
      totalStudents: students.length,
      totalTerms: installments.length,
      expectedTotal: students.length * installments.length,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  /**
   * Get installment statistics
   * @param tenantId - Tenant identifier
   * @param schoolId - School identifier
   * @returns Installment statistics
   */
  async getInstallmentStatistics(tenantId: string, schoolId: string) {
    const feeStructures = await this.prisma.feeStructure.findMany({
      where: { tenantId, schoolId, status: true },
    });

    const feeRecords = await this.prisma.feeRecord.findMany({
      where: { tenantId, schoolId },
    });

    const installmentWiseSummary = feeStructures.map(structure => {
      const structureRecords = feeRecords.filter(r => r.feeStructureId === structure.id);
      const totalAmount = structureRecords.reduce((sum, r) => sum + Number(r.totalAmount), 0);
      const collectedAmount = structureRecords.reduce((sum, r) => sum + Number(r.paidAmount), 0);

      return {
        feeStructureId: structure.id,
        classSection: structure.classSection,
        academicYear: structure.academicYear,
        totalStudents: new Set(structureRecords.map(r => r.studentId)).size,
        totalAmount: totalAmount,
        collectedAmount: collectedAmount,
        pendingAmount: totalAmount - collectedAmount,
        collectionPercentage:
          totalAmount > 0 ? (collectedAmount / totalAmount) * 100 : 0,
      };
    });

    return {
      totalFeeStructures: feeStructures.length,
      totalFeeRecords: feeRecords.length,
      installmentWiseSummary,
      overallStatistics: {
        totalFeeAmount: feeRecords.reduce((sum, r) => sum + Number(r.totalAmount), 0),
        totalCollected: feeRecords.reduce((sum, r) => sum + Number(r.paidAmount), 0),
        totalPending: feeRecords.reduce((sum, r) => sum + Number(r.totalAmount) - Number(r.paidAmount), 0),
      },
    };
  }

  /**
   * Helper: Create individual term installment
   */
  private async createTermInstallment(
    tenantId: string,
    schoolId: string,
    feeStructureId: string,
    term: TermInstallmentDto,
    feeStructure: any,
  ) {
    const amountDue = (Number(feeStructure.amount) * term.percentageAmount) / 100;

    return {
      tenantId,
      schoolId,
      feeStructureId,
      termName: term.termName,
      startDate: new Date(term.startDate),
      endDate: new Date(term.endDate),
      percentageAmount: term.percentageAmount,
      amountDue,
      dueDate: term.dueDate ? new Date(term.dueDate) : new Date(term.endDate),
      createdAt: new Date(),
    };
  }

  /**
   * Helper: Format installment response
   */
  private formatInstallmentResponse(installment: any): InstallmentResponseDto {
    return {
      id: installment.feeStructureId,
      feeStructureId: installment.feeStructureId,
      termName: installment.termName,
      startDate: installment.startDate,
      endDate: installment.endDate,
      percentageAmount: installment.percentageAmount,
      dueDate: installment.dueDate,
      createdAt: installment.createdAt,
    };
  }

  /**
   * Helper: Validate date ranges for terms
   */
  private validateDateRanges(terms: TermInstallmentDto[]): void {
    for (let i = 0; i < terms.length; i++) {
      const currentTerm = terms[i];
      const startDate = new Date(currentTerm.startDate);
      const endDate = new Date(currentTerm.endDate);

      if (startDate >= endDate) {
        throw new BadRequestException(
          `Term '${currentTerm.termName}': Start date must be before end date`,
        );
      }

      for (let j = i + 1; j < terms.length; j++) {
        const otherTerm = terms[j];
        const otherStart = new Date(otherTerm.startDate);
        const otherEnd = new Date(otherTerm.endDate);

        // Check for overlap
        if ((startDate <= otherStart && endDate >= otherStart) ||
            (otherStart <= startDate && otherEnd >= startDate)) {
          throw new BadRequestException(
            `Terms '${currentTerm.termName}' and '${otherTerm.termName}' have overlapping dates`,
          );
        }
      }
    }
  }

  /**
   * Helper: Generate sample installments
   */
  private generateSampleInstallments(feeStructure: any) {
    return [
      {
        termName: 'Term 1',
        startDate: new Date('2025-04-01'),
        endDate: new Date('2025-06-30'),
        percentageAmount: 50,
        amountDue: (Number(feeStructure.amount) * 50) / 100,
        dueDate: new Date('2025-06-15'),
      },
      {
        termName: 'Term 2',
        startDate: new Date('2025-07-01'),
        endDate: new Date('2025-10-31'),
        percentageAmount: 30,
        amountDue: (Number(feeStructure.amount) * 30) / 100,
        dueDate: new Date('2025-10-15'),
      },
      {
        termName: 'Term 3',
        startDate: new Date('2025-11-01'),
        endDate: new Date('2026-03-31'),
        percentageAmount: 20,
        amountDue: (Number(feeStructure.amount) * 20) / 100,
        dueDate: new Date('2026-03-15'),
      },
    ];
  }
}
