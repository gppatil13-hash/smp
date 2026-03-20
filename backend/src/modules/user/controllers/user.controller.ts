import { Controller, Get, Post, Body, Param, Put, Delete, Query, UseGuards } from '@nestjs/common';
import { UserService } from '../services/user.service';
import { CreateUserDto, UpdateUserDto, UserListDto } from '../dtos/user.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { RolesGuard } from '@common/guards/roles.guard';
import { GetTenantId } from '@common/decorators/get-tenant-id.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserController {
  constructor(private userService: UserService) {}

  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @Get()
  async getUsers(@GetTenantId() tenantId: string, @Query() filters: UserListDto) {
    return this.userService.findAll(tenantId, filters);
  }

  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @Get(':id')
  async getUser(@GetTenantId() tenantId: string, @Param('id') userId: string) {
    return this.userService.findById(tenantId, userId);
  }

  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @Post()
  async createUser(@GetTenantId() tenantId: string, @Body() createUserDto: CreateUserDto) {
    return this.userService.create(tenantId, createUserDto);
  }

  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @Put(':id')
  async updateUser(
    @GetTenantId() tenantId: string,
    @Param('id') userId: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.userService.update(tenantId, userId, updateUserDto);
  }

  @Roles('SUPER_ADMIN')
  @Delete(':id')
  async deleteUser(@GetTenantId() tenantId: string, @Param('id') userId: string) {
    return this.userService.delete(tenantId, userId);
  }
}
