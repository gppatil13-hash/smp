import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards } from '@nestjs/common';
import { SchoolService } from '../services/school.service';
import { SchoolDto, UpdateSchoolDto } from '../dtos/school.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { RolesGuard } from '@common/guards/roles.guard';
import { GetTenantId } from '@common/decorators/get-tenant-id.decorator';

@Controller('schools')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SchoolController {
  constructor(private schoolService: SchoolService) {}

  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @Get()
  async getSchools(@GetTenantId() tenantId: string) {
    return this.schoolService.findByTenant(tenantId);
  }

  @Roles('SCHOOL_ADMIN')
  @Get(':id')
  async getSchool(@GetTenantId() tenantId: string, @Param('id') schoolId: string) {
    return this.schoolService.findById(tenantId, schoolId);
  }

  @Roles('SUPER_ADMIN')
  @Post()
  async createSchool(@GetTenantId() tenantId: string, @Body() schoolDto: SchoolDto) {
    return this.schoolService.create(tenantId, schoolDto);
  }

  @Roles('SCHOOL_ADMIN')
  @Put(':id')
  async updateSchool(
    @GetTenantId() tenantId: string,
    @Param('id') schoolId: string,
    @Body() updateSchoolDto: UpdateSchoolDto,
  ) {
    return this.schoolService.update(tenantId, schoolId, updateSchoolDto);
  }

  @Roles('SUPER_ADMIN')
  @Delete(':id')
  async deleteSchool(@GetTenantId() tenantId: string, @Param('id') schoolId: string) {
    return this.schoolService.delete(tenantId, schoolId);
  }
}
