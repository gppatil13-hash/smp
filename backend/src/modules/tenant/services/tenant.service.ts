import { Injectable } from '@nestjs/common';
import { PrismaService } from '@config/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class TenantService {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.TenantCreateInput) {
    return this.prisma.tenant.create({
      data,
    });
  }

  async findAll() {
    return this.prisma.tenant.findMany({
      where: { status: true },
    });
  }

  async findById(id: string) {
    return this.prisma.tenant.findUnique({
      where: { id },
      include: {
        schools: true,
      },
    });
  }

  async findBySubdomain(subdomain: string) {
    return this.prisma.tenant.findUnique({
      where: { subdomain },
      include: {
        schools: true,
      },
    });
  }

  async update(id: string, data: Prisma.TenantUpdateInput) {
    return this.prisma.tenant.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return this.prisma.tenant.delete({
      where: { id },
    });
  }

  async getTenantStats(tenantId: string) {
    const schools = await this.prisma.school.count({
      where: { tenantId },
    });

    const students = await this.prisma.student.count({
      where: { tenantId },
    });

    const users = await this.prisma.user.count({
      where: { tenantId },
    });

    return {
      schools,
      students,
      users,
    };
  }
}
