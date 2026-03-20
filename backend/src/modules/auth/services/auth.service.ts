import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@config/prisma.service';
import * as bcrypt from 'bcryptjs';
import { LoginDto, RegisterDto, AuthResponseDto } from './dtos/auth.dto';
import { ITokenPayload } from '@common/interfaces/auth.interface';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const { email, password, firstName, lastName, tenantId } = registerDto;

    // Validate tenant exists
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new BadRequestException('Invalid tenant');
    }

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: {
        tenantId_email: {
          tenantId,
          email,
        },
      },
    });

    if (existingUser) {
      throw new ConflictException('User already exists with this email');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        tenantId,
        email,
        passwordHash,
        firstName,
        lastName,
        role: 'SCHOOL_ADMIN', // Default role - can be modified
        status: true,
      },
    });

    const accessToken = this.generateAccessToken(user);

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      tenantId: user.tenantId,
      schoolId: user.schoolId || undefined,
      accessToken,
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { email, password, tenantId } = loginDto;

    // Find user
    const user = await this.prisma.user.findUnique({
      where: {
        tenantId_email: {
          tenantId: tenantId || email.split('@')[0], // Fallback tenant
          email,
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.status) {
      throw new UnauthorizedException('User account is disabled');
    }

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    const accessToken = this.generateAccessToken(user);

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      tenantId: user.tenantId,
      schoolId: user.schoolId || undefined,
      accessToken,
    };
  }

  async validateToken(token: string): Promise<ITokenPayload> {
    try {
      return this.jwtService.verify(token);
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private generateAccessToken(user: any): string {
    const payload: ITokenPayload = {
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId,
      schoolId: user.schoolId,
      role: user.role,
    };

    return this.jwtService.sign(payload, {
      expiresIn: '7d',
    });
  }
}
