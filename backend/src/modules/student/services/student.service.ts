import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@config/prisma.service';
import { Student, Prisma } from '@prisma/client';

@Injectable()
export class StudentService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, schoolId: string, data: Prisma.StudentCreateInput): Promise<Student> {
    return this.prisma.student.create({
      data: {
        ...data,
        tenantId,
        schoolId,
      },
      include: {
        class: true,
      },
    });
  }

  async findAll(tenantId: string, schoolId: string, filters?: any): Promise<Student[]> {
    const where: Prisma.StudentWhereInput = {
      tenantId,
      schoolId,
      ...(filters?.classId && { classId: filters.classId }),
      ...(filters?.academicYear && { academicYear: filters.academicYear }),
      ...(filters?.status && { status: filters.status }),
    };

    return this.prisma.student.findMany({
      where,
      include: {
        class: true,
        feeRecords: true,
      },
      skip: filters?.skip || 0,
      take: filters?.take || 100,
    });
  }

  async findById(tenantId: string, schoolId: string, studentId: string): Promise<Student | null> {
    return this.prisma.student.findFirst({
      where: {
        id: studentId,
        tenantId,
        schoolId,
      },
      include: {
        class: true,
        feeRecords: {
          include: {
            feeStructure: true,
          },
        },
      },
    });
  }

  async update(tenantId: string, schoolId: string, studentId: string, data: Prisma.StudentUpdateInput): Promise<Student> {
    return this.prisma.student.update({
      where: { id: studentId },
      data,
      include: {
        class: true,
      },
    });
  }

  async delete(tenantId: string, schoolId: string, studentId: string): Promise<Student> {
    return this.prisma.student.delete({
      where: { id: studentId },
      include: {
        class: true,
      },
    });
  }

  async getStudentsByClass(tenantId: string, schoolId: string, classId: string): Promise<Student[]> {
    return this.prisma.student.findMany({
      where: {
        tenantId,
        schoolId,
        classId,
      },
      include: {
        class: true,
      },
      orderBy: {
        rollNumber: 'asc',
      },
    });
  }
}
