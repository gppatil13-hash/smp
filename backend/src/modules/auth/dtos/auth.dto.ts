export class LoginDto {
  email: string;
  password: string;
  tenantId?: string;
}

export class RegisterDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  tenantId?: string;
  schoolId?: string;
}

export class AuthResponseDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  tenantId: string;
  schoolId?: string;
  accessToken: string;
  refreshToken?: string;
}

export class ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

export class ResetPasswordDto {
  email: string;
  resetToken: string;
  newPassword: string;
}
