import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './services/auth.service';
import { LoginDto, RegisterDto, AuthResponseDto } from './dtos/auth.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(registerDto);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(loginDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req: any) {
    return {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role,
      tenantId: req.user.tenantId,
      schoolId: req.user.schoolId,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Request() req: any) {
    return {
      message: 'Logged out successfully',
    };
  }
}
