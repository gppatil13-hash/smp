import { Injectable } from '@nestjs/common';
import { PrismaService } from '@config/prisma.service';
import { School, Prisma } from '@prisma/client';

@Injectable()
export class SchoolService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, data: Prisma.SchoolCreateInput): Promise<School> {
    return this.prisma.school.create({
      data: {
        ...data,
        tenant: {
          connect: { id: tenantId },
        },
      },
    });
  }

  async findByTenant(tenantId: string): Promise<School[]> {
    return this.prisma.school.findMany({
      where: { tenantId },
    });
  }

  async findById(tenantId: string, schoolId: string): Promise<School | null> {
    return this.prisma.school.findFirst({
      where: {
        id: schoolId,
        tenantId,
      },
    });
  }

  async update(tenantId: string, schoolId: string, data: Prisma.SchoolUpdateInput): Promise<School> {
    return this.prisma.school.update({
      where: { id: schoolId },
      data,
    });
  }

  async delete(tenantId: string, schoolId: string): Promise<School> {
    return this.prisma.school.delete({
      where: { id: schoolId },
    });
  }
}
