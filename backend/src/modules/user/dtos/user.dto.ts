export class CreateUserDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: string;
  schoolId?: string;
}

export class UpdateUserDto {
  firstName?: string;
  lastName?: string;
  phone?: string;
  status?: boolean;
}

export class UserListDto {
  skip?: number;
  take?: number;
  role?: string;
  status?: boolean;
}
