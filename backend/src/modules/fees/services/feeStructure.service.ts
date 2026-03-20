import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@config/prisma.service';
import { CreateFeeStructureDto, UpdateFeeStructureDto, FeeStructureResponseDto, FeeComponentDto } from '../dtos/fees.dto';

/**
 * Fee Structure Service
 * Manages configurable fee structures with multiple components
 * - Support for multiple fee headers (Tuition, Admission, Transport, Lab, etc.)
 * - Define fee amounts per component
 * - Calculate total fees
 * - Support different payment frequencies
 */
@Injectable()
export class FeeStructureService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new fee structure with configurable components
   * @param tenantId - Tenant identifier
   * @param schoolId - School identifier
   * @param dto - Fee structure creation data
   * @returns Created fee structure
   */
  async createFeeStructure(tenantId: string, schoolId: string, dto: CreateFeeStructureDto) {
    // Validate fee components
    if (!dto.feeComponents || dto.feeComponents.length === 0) {
      throw new BadRequestException('At least one fee component is required');
    }

    // Check for duplicate components
    const componentNames = dto.feeComponents.map(c => c.componentName);
    const duplicates = componentNames.filter((item, index) => componentNames.indexOf(item) !== index);

    if (duplicates.length > 0) {
      throw new BadRequestException(`Duplicate fee components: ${duplicates.join(', ')}`);
    }

    // Check for duplicate fee structure
    const existingStructure = await this.prisma.feeStructure.findFirst({
      where: {
        schoolId,
        academicYear: dto.academicYear as any,
        classSection: dto.classSection as any,
      },
    });

    if (existingStructure) {
      throw new BadRequestException(
        `Fee structure already exists for ${dto.classSection} in ${dto.academicYear}`,
      );
    }

    // Calculate total fee amount
    const totalFeeAmount = dto.feeComponents.reduce((sum, component) => sum + component.amount, 0);

    // Create fee structure entry (store components as JSON)
    const feeStructure = await this.prisma.feeStructure.create({
      data: {
        tenantId,
        schoolId,
        academicYear: dto.academicYear as any,
        classSection: dto.classSection as any,
        feeType: 'COMPREHENSIVE', // Use composite type
        amount: totalFeeAmount,
        frequency: dto.frequency,
        dueDate: dto.dueDate,
        description: this.generateStructureDescription(dto),
        status: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Store components as metadata (in real implementation, use a separate table)
    return this.formatFeeStructureResponse(feeStructure, dto.feeComponents);
  }

  /**
   * Get all fee structures for a school
   * @param tenantId - Tenant identifier
   * @param schoolId - School identifier
   * @param academicYear - Optional filter by academic year
   * @returns Array of fee structures
   */
  async getFeeStructures(tenantId: string, schoolId: string, academicYear?: string) {
    const where: any = {
      tenantId,
      schoolId,
      status: true,
    };

    if (academicYear) {
      where.academicYear = academicYear as any;
    }

    const feeStructures = await this.prisma.feeStructure.findMany({
      where,
      include: {
        feeRecords: {
          select: { id: true, studentId: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return feeStructures.map(structure => {
      // Parse components from description (in real implementation, fetch from separate table)
      const components = this.parseComponentsFromDescription(structure.description);
      return this.formatFeeStructureResponse(structure, components);
    });
  }

  /**
   * Get fee structure by ID
   * @param tenantId - Tenant identifier
   * @param structureId - Fee structure identifier
   * @returns Fee structure details
   */
  async getFeeStructureById(tenantId: string, structureId: string) {
    const feeStructure = await this.prisma.feeStructure.findFirst({
      where: { id: structureId, tenantId },
      include: {
        feeRecords: {
          where: { status: 'PENDING' },
          select: {
            id: true,
            studentId: true,
            student: {
              select: { firstName: true, lastName: true, enrollmentNo: true },
            },
          },
        },
      },
    });

    if (!feeStructure) {
      throw new NotFoundException(`Fee structure '${structureId}' not found`);
    }

    const components = this.parseComponentsFromDescription(feeStructure.description);
    return {
      ...this.formatFeeStructureResponse(feeStructure, components),
      pendingRecords: feeStructure.feeRecords.length,
      studentsAffected: feeStructure.feeRecords.map(record => ({
        studentId: record.studentId,
        studentName: `${record.student.firstName} ${record.student.lastName}`,
        enrollmentNo: record.student.enrollmentNo,
      })),
    };
  }

  /**
   * Update fee structure
   * @param tenantId - Tenant identifier
   * @param structureId - Fee structure identifier
   * @param dto - Update data
   * @returns Updated fee structure
   */
  async updateFeeStructure(tenantId: string, structureId: string, dto: UpdateFeeStructureDto) {
    const feeStructure = await this.prisma.feeStructure.findFirst({
      where: { id: structureId, tenantId },
    });

    if (!feeStructure) {
      throw new NotFoundException(`Fee structure '${structureId}' not found`);
    }

    // Check if there are active fee records
    const activeRecords = await this.prisma.feeRecord.count({
      where: {
        feeStructureId: structureId,
        status: { in: ['PENDING', 'PARTIAL'] },
      },
    });

    if (activeRecords > 0 && dto.feeComponents) {
      throw new BadRequestException(
        `Cannot modify components for an active fee structure with ${activeRecords} active records. Please use fee waivers or discounts instead.`,
      );
    }

    const totalFeeAmount = dto.feeComponents
      ? dto.feeComponents.reduce((sum, component) => sum + component.amount, 0)
      : Number(feeStructure.amount);

    const updated = await this.prisma.feeStructure.update({
      where: { id: structureId },
      data: {
        frequency: dto.frequency || feeStructure.frequency,
        dueDate: dto.dueDate || feeStructure.dueDate,
        amount: totalFeeAmount,
        description: dto.feeComponents
          ? this.generateStructureDescriptionFromComponents(dto.feeComponents)
          : feeStructure.description,
        updatedAt: new Date(),
      },
    });

    const components = dto.feeComponents || this.parseComponentsFromDescription(feeStructure.description);
    return this.formatFeeStructureResponse(updated, components);
  }

  /**
   * Get fee structure by class section
   * @param tenantId - Tenant identifier
   * @param schoolId - School identifier
   * @param classSection - Class section
   * @param academicYear - Academic year
   * @returns Fee structure for the class
   */
  async getFeeStructureByClass(
    tenantId: string,
    schoolId: string,
    classSection: string,
    academicYear: string,
  ) {
    const feeStructure = await this.prisma.feeStructure.findFirst({
      where: {
        tenantId,
        schoolId,
        classSection: classSection as any,
        academicYear: academicYear as any,
      },
    });

    if (!feeStructure) {
      throw new NotFoundException(
        `No fee structure found for ${classSection} in ${academicYear}`,
      );
    }

    const components = this.parseComponentsFromDescription(feeStructure.description);
    return this.formatFeeStructureResponse(feeStructure, components);
  }

  /**
   * Delete fee structure (only if no active records)
   * @param tenantId - Tenant identifier
   * @param structureId - Fee structure identifier
   */
  async deleteFeeStructure(tenantId: string, structureId: string) {
    const feeStructure = await this.prisma.feeStructure.findFirst({
      where: { id: structureId, tenantId },
    });

    if (!feeStructure) {
      throw new NotFoundException(`Fee structure '${structureId}' not found`);
    }

    // Check for active records
    const activeRecords = await this.prisma.feeRecord.count({
      where: { feeStructureId: structureId },
    });

    if (activeRecords > 0) {
      throw new BadRequestException(
        `Cannot delete fee structure with ${activeRecords} fee records. Archive instead.`,
      );
    }

    await this.prisma.feeStructure.delete({
      where: { id: structureId },
    });

    return { success: true, message: 'Fee structure deleted successfully' };
  }

  /**
   * Get fee structure statistics
   * @param tenantId - Tenant identifier
   * @param schoolId - School identifier
   * @returns Statistics about fee structures
   */
  async getFeeStructureStatistics(tenantId: string, schoolId: string) {
    const structures = await this.prisma.feeStructure.findMany({
      where: { tenantId, schoolId, status: true },
      include: {
        feeRecords: {
          select: { status: true, studentId: true },
        },
      },
    });

    const totalStructures = structures.length;
    const totalStudentsAffected = new Set(structures.flatMap(s => s.feeRecords.map(r => r.studentId))).size;

    const frequencyBreakdown = structures.reduce(
      (acc, struct) => {
        acc[struct.frequency] = (acc[struct.frequency] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      totalStructures,
      totalStudentsAffected,
      frequencyBreakdown,
      averageFeeAmount: structures.length > 0
        ? structures.reduce((sum, s) => sum + Number(s.amount), 0) / structures.length
        : 0,
      structures: structures.map(s => ({
        id: s.id,
        classSection: s.classSection,
        academicYear: s.academicYear,
        totalAmount: Number(s.amount),
        frequency: s.frequency,
        studentsAffected: s.feeRecords.length,
      })),
    };
  }

  /**
   * Helper: Format fee structure response
   */
  private formatFeeStructureResponse(
    structure: any,
    components: FeeComponentDto[],
  ): FeeStructureResponseDto {
    return {
      id: structure.id,
      classSection: structure.classSection,
      academicYear: structure.academicYear,
      feeComponents: components,
      totalFeeAmount: Number(structure.amount),
      frequency: structure.frequency,
      dueDate: structure.dueDate,
      description: structure.description,
      status: structure.status,
      createdAt: structure.createdAt,
      updatedAt: structure.updatedAt,
    };
  }

  /**
   * Helper: Generate structure description from components
   */
  private generateStructureDescription(dto: CreateFeeStructureDto): string {
    const componentsSummary = dto.feeComponents
      .map(c => `${c.componentName}: ${c.amount}`)
      .join(', ');
    return `Fee Structure for ${dto.classSection} (${dto.academicYear}): ${componentsSummary}`;
  }

  /**
   * Helper: Generate description from components
   */
  private generateStructureDescriptionFromComponents(components: FeeComponentDto[]): string {
    return components.map(c => `${c.componentName}: ${c.amount}`).join(', ');
  }

  /**
   * Helper: Parse components from description
   */
  private parseComponentsFromDescription(description: string): FeeComponentDto[] {
    // In real implementation, fetch from separate components table
    // For now, return sample components
    return [
      { componentName: 'Tuition Fee', amount: 5000 },
      { componentName: 'Admission Fee', amount: 2000 },
      { componentName: 'Transport Fee', amount: 1000 },
      { componentName: 'Lab Fee', amount: 500 },
    ];
  }
}
