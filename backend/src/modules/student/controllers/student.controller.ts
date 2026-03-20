import { Controller, Get, Post, Body, Param, Put, Delete, Query, UseGuards } from '@nestjs/common';
import { StudentService } from '../services/student.service';
import { CreateStudentDto, UpdateStudentDto, StudentListDto } from '../dtos/student.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { RolesGuard } from '@common/guards/roles.guard';
import { GetTenantId } from '@common/decorators/get-tenant-id.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';

@Controller('students')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StudentController {
  constructor(private studentService: StudentService) {}

  @Roles('SCHOOL_ADMIN', 'TEACHER')
  @Get()
  async getStudents(
    @GetTenantId() tenantId: string,
    @CurrentUser() user: any,
    @Query() filters: StudentListDto,
  ) {
    const schoolId = user.schoolId;
    return this.studentService.findAll(tenantId, schoolId, filters);
  }

  @Roles('SCHOOL_ADMIN', 'TEACHER')
  @Get(':id')
  async getStudent(
    @GetTenantId() tenantId: string,
    @CurrentUser() user: any,
    @Param('id') studentId: string,
  ) {
    return this.studentService.findById(tenantId, user.schoolId, studentId);
  }

  @Roles('SCHOOL_ADMIN', 'ADMISSION_COUNSELLOR')
  @Post()
  async createStudent(
    @GetTenantId() tenantId: string,
    @CurrentUser() user: any,
    @Body() createStudentDto: CreateStudentDto,
  ) {
    return this.studentService.create(tenantId, user.schoolId, createStudentDto);
  }

  @Roles('SCHOOL_ADMIN')
  @Put(':id')
  async updateStudent(
    @GetTenantId() tenantId: string,
    @CurrentUser() user: any,
    @Param('id') studentId: string,
    @Body() updateStudentDto: UpdateStudentDto,
  ) {
    return this.studentService.update(tenantId, user.schoolId, studentId, updateStudentDto);
  }

  @Roles('SCHOOL_ADMIN')
  @Delete(':id')
  async deleteStudent(
    @GetTenantId() tenantId: string,
    @CurrentUser() user: any,
    @Param('id') studentId: string,
  ) {
    return this.studentService.delete(tenantId, user.schoolId, studentId);
  }

  @Roles('SCHOOL_ADMIN', 'TEACHER')
  @Get('class/:classId')
  async getStudentsByClass(
    @GetTenantId() tenantId: string,
    @CurrentUser() user: any,
    @Param('classId') classId: string,
  ) {
    return this.studentService.getStudentsByClass(tenantId, user.schoolId, classId);
  }
}
