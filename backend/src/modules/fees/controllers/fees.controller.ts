import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Patch,
  Put,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { FeesService } from '../services/fees.service';
import { CourseService } from '../services/course.service';
import { FeeStructureService } from '../services/feeStructure.service';
import { InstallmentService } from '../services/installment.service';
import { PaymentService } from '../services/payment.service';
import { ReceiptService } from '../services/receipt.service';
import {
  CreateFeeStructureDto,
  CreateFeeRecordDto,
  PayFeeDto,
  FeeListDto,
  CreateCourseDto,
  UpdateCourseDto,
  CreateFeeStructureDto as FeeStructureDto,
  UpdateFeeStructureDto,
  CreateInstallmentPlanDto,
  RecordPaymentDto,
  GenerateReceiptDto,
} from '../dtos/fees.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { RolesGuard } from '@common/guards/roles.guard';
import { GetTenantId } from '@common/decorators/get-tenant-id.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';

@ApiTags('Fees Management')
@ApiBearerAuth()
@Controller('fees')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FeesController {
  constructor(
    private feesService: FeesService,
    private courseService: CourseService,
    private feeStructureService: FeeStructureService,
    private installmentService: InstallmentService,
    private paymentService: PaymentService,
    private receiptService: ReceiptService,
  ) {}

  // ============ COURSE ENDPOINTS ============

  @ApiOperation({ summary: 'Create a new course/class' })
  @ApiResponse({ status: 201, description: 'Course created successfully' })
  @Roles('SCHOOL_ADMIN')
  @Post('courses')
  async createCourse(
    @GetTenantId() tenantId: string,
    @CurrentUser() user: any,
    @Body() createCourseDto: CreateCourseDto,
  ) {
    return this.courseService.createCourse(tenantId, user.schoolId, createCourseDto);
  }

  @ApiOperation({ summary: 'Get all courses for a school' })
  @ApiResponse({ status: 200, description: 'List of courses' })
  @Roles('SCHOOL_ADMIN', 'ACCOUNTS_TEAM', 'TEACHER')
  @Get('courses')
  async getCourses(
    @GetTenantId() tenantId: string,
    @CurrentUser() user: any,
    @Query('academicYear') academicYear?: string,
  ) {
    return this.courseService.getCourses(tenantId, user.schoolId, academicYear);
  }

  @ApiOperation({ summary: 'Get course by ID' })
  @ApiResponse({ status: 200, description: 'Course details' })
  @Roles('SCHOOL_ADMIN', 'ACCOUNTS_TEAM', 'TEACHER')
  @Get('courses/:courseId')
  async getCourseById(
    @GetTenantId() tenantId: string,
    @Param('courseId') courseId: string,
  ) {
    return this.courseService.getCourseById(tenantId, courseId);
  }

  @ApiOperation({ summary: 'Update course details' })
  @ApiResponse({ status: 200, description: 'Course updated' })
  @Roles('SCHOOL_ADMIN')
  @Put('courses/:courseId')
  async updateCourse(
    @GetTenantId() tenantId: string,
    @Param('courseId') courseId: string,
    @Body() updateCourseDto: UpdateCourseDto,
  ) {
    return this.courseService.updateCourse(tenantId, courseId, updateCourseDto);
  }

  @ApiOperation({ summary: 'Delete a course' })
  @ApiResponse({ status: 200, description: 'Course deleted' })
  @Roles('SCHOOL_ADMIN')
  @Patch('courses/:courseId/delete')
  async deleteCourse(
    @GetTenantId() tenantId: string,
    @Param('courseId') courseId: string,
  ) {
    return this.courseService.deleteCourse(tenantId, courseId);
  }

  @ApiOperation({ summary: 'Get course statistics' })
  @ApiResponse({ status: 200, description: 'Course statistics' })
  @Roles('SCHOOL_ADMIN', 'ACCOUNTS_TEAM')
  @Get('courses/stats/overview')
  async getCourseStatistics(
    @GetTenantId() tenantId: string,
    @CurrentUser() user: any,
  ) {
    return this.courseService.getCourseStatistics(tenantId, user.schoolId);
  }

  // ============ FEE STRUCTURE ENDPOINTS ============

  @ApiOperation({ summary: 'Create a new fee structure with components' })
  @ApiResponse({ status: 201, description: 'Fee structure created' })
  @Roles('SCHOOL_ADMIN', 'ACCOUNTS_TEAM')
  @Post('structures')
  async createFeeStructure(
    @GetTenantId() tenantId: string,
    @CurrentUser() user: any,
    @Body() createFeeStructureDto: FeeStructureDto,
  ) {
    return this.feeStructureService.createFeeStructure(
      tenantId,
      user.schoolId,
      createFeeStructureDto,
    );
  }

  @ApiOperation({ summary: 'Get all fee structures' })
  @ApiResponse({ status: 200, description: 'List of fee structures' })
  @Roles('SCHOOL_ADMIN', 'ACCOUNTS_TEAM', 'TEACHER')
  @Get('structures')
  async getFeeStructures(
    @GetTenantId() tenantId: string,
    @CurrentUser() user: any,
    @Query('academicYear') academicYear?: string,
  ) {
    return this.feeStructureService.getFeeStructures(tenantId, user.schoolId, academicYear);
  }

  @ApiOperation({ summary: 'Get fee structure by ID' })
  @ApiResponse({ status: 200, description: 'Fee structure details' })
  @Roles('SCHOOL_ADMIN', 'ACCOUNTS_TEAM', 'TEACHER')
  @Get('structures/:structureId')
  async getFeeStructureById(
    @GetTenantId() tenantId: string,
    @Param('structureId') structureId: string,
  ) {
    return this.feeStructureService.getFeeStructureById(tenantId, structureId);
  }

  @ApiOperation({ summary: 'Update fee structure' })
  @ApiResponse({ status: 200, description: 'Fee structure updated' })
  @Roles('SCHOOL_ADMIN', 'ACCOUNTS_TEAM')
  @Put('structures/:structureId')
  async updateFeeStructure(
    @GetTenantId() tenantId: string,
    @Param('structureId') structureId: string,
    @Body() updateFeeStructureDto: UpdateFeeStructureDto,
  ) {
    return this.feeStructureService.updateFeeStructure(
      tenantId,
      structureId,
      updateFeeStructureDto,
    );
  }

  @ApiOperation({ summary: 'Get fee structure for a class' })
  @ApiResponse({ status: 200, description: 'Class fee structure' })
  @Roles('SCHOOL_ADMIN', 'ACCOUNTS_TEAM', 'TEACHER')
  @Get('structures/class/:classSection')
  async getFeeStructureByClass(
    @GetTenantId() tenantId: string,
    @CurrentUser() user: any,
    @Param('classSection') classSection: string,
    @Query('academicYear') academicYear: string,
  ) {
    return this.feeStructureService.getFeeStructureByClass(
      tenantId,
      user.schoolId,
      classSection,
      academicYear,
    );
  }

  @ApiOperation({ summary: 'Delete fee structure' })
  @ApiResponse({ status: 200, description: 'Fee structure deleted' })
  @Roles('SCHOOL_ADMIN', 'ACCOUNTS_TEAM')
  @Patch('structures/:structureId/delete')
  async deleteFeeStructure(
    @GetTenantId() tenantId: string,
    @Param('structureId') structureId: string,
  ) {
    return this.feeStructureService.deleteFeeStructure(tenantId, structureId);
  }

  @ApiOperation({ summary: 'Get fee structure statistics' })
  @ApiResponse({ status: 200, description: 'Fee structure statistics' })
  @Roles('SCHOOL_ADMIN', 'ACCOUNTS_TEAM')
  @Get('structures/stats/overview')
  async getFeeStructureStatistics(
    @GetTenantId() tenantId: string,
    @CurrentUser() user: any,
  ) {
    return this.feeStructureService.getFeeStructureStatistics(tenantId, user.schoolId);
  }

  // ============ INSTALLMENT ENDPOINTS ============

  @ApiOperation({ summary: 'Create installment plan for fee structure' })
  @ApiResponse({ status: 201, description: 'Installment plan created' })
  @Roles('SCHOOL_ADMIN', 'ACCOUNTS_TEAM')
  @Post('installments')
  async createInstallmentPlan(
    @GetTenantId() tenantId: string,
    @CurrentUser() user: any,
    @Body() createInstallmentPlanDto: CreateInstallmentPlanDto,
  ) {
    return this.installmentService.createInstallmentPlan(
      tenantId,
      user.schoolId,
      createInstallmentPlanDto,
    );
  }

  @ApiOperation({ summary: 'Get installment plan' })
  @ApiResponse({ status: 200, description: 'Installment plan details' })
  @Roles('SCHOOL_ADMIN', 'ACCOUNTS_TEAM', 'TEACHER')
  @Get('installments/:feeStructureId')
  async getInstallmentPlan(
    @GetTenantId() tenantId: string,
    @Param('feeStructureId') feeStructureId: string,
  ) {
    return this.installmentService.getInstallmentPlan(tenantId, feeStructureId);
  }

  @ApiOperation({ summary: 'Get specific term installment' })
  @ApiResponse({ status: 200, description: 'Term installment details' })
  @Roles('SCHOOL_ADMIN', 'ACCOUNTS_TEAM', 'TEACHER')
  @Get('installments/:feeStructureId/term/:termName')
  async getInstallmentByTerm(
    @GetTenantId() tenantId: string,
    @Param('feeStructureId') feeStructureId: string,
    @Param('termName') termName: string,
  ) {
    return this.installmentService.getInstallmentByTerm(tenantId, feeStructureId, termName);
  }

  @ApiOperation({ summary: 'Update installment plan' })
  @ApiResponse({ status: 200, description: 'Installment plan updated' })
  @Roles('SCHOOL_ADMIN', 'ACCOUNTS_TEAM')
  @Put('installments/:feeStructureId')
  async updateInstallmentPlan(
    @GetTenantId() tenantId: string,
    @Param('feeStructureId') feeStructureId: string,
    @Body() newTerms: any,
  ) {
    return this.installmentService.updateInstallmentPlan(
      tenantId,
      feeStructureId,
      newTerms,
    );
  }

  @ApiOperation({ summary: 'Generate fee records from installments' })
  @ApiResponse({ status: 201, description: 'Fee records generated' })
  @Roles('SCHOOL_ADMIN', 'ACCOUNTS_TEAM')
  @Post('installments/:feeStructureId/generate-records')
  async generateFeeRecordsFromInstallments(
    @GetTenantId() tenantId: string,
    @CurrentUser() user: any,
    @Param('feeStructureId') feeStructureId: string,
  ) {
    return this.installmentService.generateFeeRecordsFromInstallments(
      tenantId,
      user.schoolId,
      feeStructureId,
    );
  }

  @ApiOperation({ summary: 'Get installment statistics' })
  @ApiResponse({ status: 200, description: 'Installment statistics' })
  @Roles('SCHOOL_ADMIN', 'ACCOUNTS_TEAM')
  @Get('installments/stats/overview')
  async getInstallmentStatistics(
    @GetTenantId() tenantId: string,
    @CurrentUser() user: any,
  ) {
    return this.installmentService.getInstallmentStatistics(tenantId, user.schoolId);
  }

  // ============ PAYMENT ENDPOINTS ============

  @ApiOperation({ summary: 'Record a payment' })
  @ApiResponse({ status: 200, description: 'Payment recorded' })
  @Roles('SCHOOL_ADMIN', 'ACCOUNTS_TEAM')
  @Post('payments')
  async recordPayment(
    @GetTenantId() tenantId: string,
    @CurrentUser() user: any,
    @Body() recordPaymentDto: RecordPaymentDto,
  ) {
    return this.paymentService.recordPayment(tenantId, user.schoolId, recordPaymentDto);
  }

  @ApiOperation({ summary: 'Get payment history for student' })
  @ApiResponse({ status: 200, description: 'Payment history' })
  @Roles('SCHOOL_ADMIN', 'ACCOUNTS_TEAM', 'PARENT')
  @Get('payments/student/:studentId')
  async getPaymentHistory(
    @GetTenantId() tenantId: string,
    @CurrentUser() user: any,
    @Param('studentId') studentId: string,
  ) {
    return this.paymentService.getPaymentHistory(tenantId, user.schoolId, studentId);
  }

  @ApiOperation({ summary: 'Get payment details' })
  @ApiResponse({ status: 200, description: 'Payment details' })
  @Roles('SCHOOL_ADMIN', 'ACCOUNTS_TEAM')
  @Get('payments/:feeRecordId')
  async getPaymentDetails(
    @GetTenantId() tenantId: string,
    @Param('feeRecordId') feeRecordId: string,
  ) {
    return this.paymentService.getPaymentDetails(tenantId, feeRecordId);
  }

  @ApiOperation({ summary: 'Get payment statistics' })
  @ApiResponse({ status: 200, description: 'Payment statistics' })
  @Roles('SCHOOL_ADMIN', 'ACCOUNTS_TEAM')
  @Get('payments/stats/overview')
  async getPaymentStatistics(
    @GetTenantId() tenantId: string,
    @CurrentUser() user: any,
  ) {
    return this.paymentService.getPaymentStatistics(tenantId, user.schoolId);
  }

  @ApiOperation({ summary: 'Get payment reminders' })
  @ApiResponse({ status: 200, description: 'Due payment reminders' })
  @Roles('SCHOOL_ADMIN', 'ACCOUNTS_TEAM')
  @Get('payments/reminders/due')
  async generatePaymentReminders(
    @GetTenantId() tenantId: string,
    @CurrentUser() user: any,
    @Query('daysBefore') daysBefore: number = 3,
  ) {
    return this.paymentService.generatePaymentReminders(tenantId, user.schoolId, daysBefore);
  }

  // ============ RECEIPT ENDPOINTS ============

  @ApiOperation({ summary: 'Generate receipt for payment' })
  @ApiResponse({ status: 201, description: 'Receipt generated' })
  @Roles('SCHOOL_ADMIN', 'ACCOUNTS_TEAM')
  @Post('receipts/generate')
  async generateReceipt(
    @GetTenantId() tenantId: string,
    @CurrentUser() user: any,
    @Body() generateReceiptDto: GenerateReceiptDto,
  ) {
    return this.receiptService.generateReceipt(
      tenantId,
      user.schoolId,
      generateReceiptDto.paymentRecordId,
    );
  }

  @ApiOperation({ summary: 'Get receipt by number' })
  @ApiResponse({ status: 200, description: 'Receipt details' })
  @Roles('SCHOOL_ADMIN', 'ACCOUNTS_TEAM', 'PARENT')
  @Get('receipts/:receiptNumber')
  async getReceiptByNumber(
    @GetTenantId() tenantId: string,
    @Param('receiptNumber') receiptNumber: string,
  ) {
    return this.receiptService.getReceiptByNumber(tenantId, receiptNumber);
  }

  @ApiOperation({ summary: 'Get receipt history for student' })
  @ApiResponse({ status: 200, description: 'Receipt history' })
  @Roles('SCHOOL_ADMIN', 'ACCOUNTS_TEAM', 'PARENT')
  @Get('receipts/student/:studentId')
  async getReceiptHistory(
    @GetTenantId() tenantId: string,
    @Param('studentId') studentId: string,
  ) {
    return this.receiptService.getReceiptHistory(tenantId, studentId);
  }

  @ApiOperation({ summary: 'Send receipt to parent' })
  @ApiResponse({ status: 200, description: 'Receipt sent' })
  @Roles('SCHOOL_ADMIN', 'ACCOUNTS_TEAM')
  @Post('receipts/:receiptNumber/send')
  async sendReceipt(
    @GetTenantId() tenantId: string,
    @CurrentUser() user: any,
    @Param('receiptNumber') receiptNumber: string,
    @Query('method') method: 'EMAIL' | 'SMS' = 'EMAIL',
  ) {
    return this.receiptService.sendReceipt(tenantId, user.schoolId, receiptNumber, method);
  }

  @ApiOperation({ summary: 'Bulk generate receipts for class' })
  @ApiResponse({ status: 201, description: 'Receipts generated' })
  @Roles('SCHOOL_ADMIN', 'ACCOUNTS_TEAM')
  @Post('receipts/bulk-generate')
  async bulkGenerateReceipts(
    @GetTenantId() tenantId: string,
    @CurrentUser() user: any,
    @Body() bulkGenerateDto: any,
  ) {
    return this.receiptService.bulkGenerateReceipts(
      tenantId,
      user.schoolId,
      bulkGenerateDto.classSection,
      bulkGenerateDto.academicYear,
    );
  }

  @ApiOperation({ summary: 'Get receipt statistics' })
  @ApiResponse({ status: 200, description: 'Receipt statistics' })
  @Roles('SCHOOL_ADMIN', 'ACCOUNTS_TEAM')
  @Get('receipts/stats/overview')
  async getReceiptStatistics(
    @GetTenantId() tenantId: string,
    @CurrentUser() user: any,
  ) {
    return this.receiptService.getReceiptStatistics(tenantId, user.schoolId);
  }

  // ============ LEGACY ENDPOINTS (Backward Compatibility) ============

  @ApiOperation({ summary: 'Create fee record (legacy)' })
  @Roles('SCHOOL_ADMIN', 'ACCOUNTS_TEAM')
  @Post('record')
  async createFeeRecord(
    @GetTenantId() tenantId: string,
    @CurrentUser() user: any,
    @Body() createFeeRecordDto: CreateFeeRecordDto,
  ) {
    return this.feesService.createFeeRecord(
      tenantId,
      user.schoolId,
      createFeeRecordDto.studentId,
      {
        feeStructureId: createFeeRecordDto.feeStructureId,
        month: createFeeRecordDto.month,
        year: createFeeRecordDto.year,
      } as any,
    );
  }

  @ApiOperation({ summary: 'Get fee records (legacy)' })
  @Roles('SCHOOL_ADMIN', 'ACCOUNTS_TEAM')
  @Get('records')
  async getFeeRecords(
    @GetTenantId() tenantId: string,
    @CurrentUser() user: any,
    @Query() filters: FeeListDto,
  ) {
    return this.feesService.getFeeRecords(tenantId, user.schoolId, filters);
  }

  @ApiOperation({ summary: 'Get student fee balance (legacy)' })
  @Roles('SCHOOL_ADMIN', 'ACCOUNTS_TEAM')
  @Get('student/:studentId/balance')
  async getStudentFeeBalance(
    @GetTenantId() tenantId: string,
    @CurrentUser() user: any,
    @Param('studentId') studentId: string,
  ) {
    return this.feesService.getStudentFeeBalance(tenantId, user.schoolId, studentId);
  }

  @ApiOperation({ summary: 'Record payment (legacy)' })
  @Roles('SCHOOL_ADMIN', 'ACCOUNTS_TEAM')
  @Patch('record/:feeRecordId/payment')
  async recordPaymentLegacy(
    @GetTenantId() tenantId: string,
    @CurrentUser() user: any,
    @Param('feeRecordId') feeRecordId: string,
    @Body() payFeeDto: PayFeeDto,
  ) {
    return this.feesService.recordPayment(
      tenantId,
      user.schoolId,
      feeRecordId,
      payFeeDto.amount,
      payFeeDto.paymentMode,
      payFeeDto.transactionId,
    );
  }

  @ApiOperation({ summary: 'Get dashboard stats (legacy)' })
  @Roles('SCHOOL_ADMIN', 'ACCOUNTS_TEAM')
  @Get('dashboard/stats')
  async getDashboardStats(
    @GetTenantId() tenantId: string,
    @CurrentUser() user: any,
  ) {
    return this.feesService.getDashboardStats(tenantId, user.schoolId);
  }
}
