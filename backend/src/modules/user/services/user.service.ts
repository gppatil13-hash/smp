import { Injectable } from '@nestjs/common';
import { PrismaService } from '@config/prisma.service';
import { User, Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, data: Prisma.UserCreateInput): Promise<User> {
    const { password } = data as any;
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    return this.prisma.user.create({
      data: {
        ...data,
        tenantId,
        passwordHash,
      } as any,
    });
  }

  async findAll(tenantId: string, filters?: any): Promise<User[]> {
    const where: Prisma.UserWhereInput = {
      tenantId,
      ...(filters?.role && { role: filters.role }),
      ...(filters?.status !== undefined && { status: filters.status }),
    };

    return this.prisma.user.findMany({
      where,
      skip: filters?.skip || 0,
      take: filters?.take || 100,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findById(tenantId: string, userId: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: {
        id: userId,
        tenantId,
      },
    });
  }

  async update(tenantId: string, userId: string, data: Prisma.UserUpdateInput): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data,
    });
  }

  async delete(tenantId: string, userId: string): Promise<User> {
    return this.prisma.user.delete({
      where: { id: userId },
    });
  }
}
