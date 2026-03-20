import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { GetTenantId } from '../../../common/decorators/get-tenant-id.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { AdmissionEnquiryService } from '../services/admissionEnquiry.service';
import { AdmissionService } from '../services/admission.service';
import { AdmissionCommunicationService } from '../services/admissionCommunication.service';
import {
  CreateAdmissionEnquiryDto,
  UpdateAdmissionEnquiryDto,
  CreateFollowUpDto,
  ListAdmissionEnquiryDto,
  AdmissionEnquiryResponseDto,
  AdmissionEnquiryListResponseDto,
} from '../dtos/admissionEnquiry.dto';
import {
  ConvertEnquiryToAdmissionDto,
  CreateAdmissionDto,
  UpdateAdmissionDto,
  DocumentUploadDto,
  BulkDocumentUploadDto,
  AdmissionResponseDto,
  DocumentResponseDto,
  AdmissionSummaryResponseDto,
  AdmissionStatisticsResponseDto,
  PendingFollowUpsResponseDto,
} from '../dtos/admission.dto';
import { SendSmsDto, SendWhatsAppDto, SendEmailDto } from '../services/admissionCommunication.service';

@ApiTags('Admission Management')
@Controller('admissions')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class AdmissionController {
  constructor(
    private admissionEnquiryService: AdmissionEnquiryService,
    private admissionService: AdmissionService,
    private communicationService: AdmissionCommunicationService,
  ) {}

  // ========== ENQUIRY ENDPOINTS ==========

  @Post('enquiry')
  @Roles('ADMISSION_COUNSELLOR', 'RECEPTIONIST', 'SCHOOL_ADMIN')
  @ApiOperation({ summary: 'Create a new admission enquiry' })
  @ApiResponse({
    status: 201,
    description: 'Enquiry created successfully',
    type: AdmissionEnquiryResponseDto,
  })
  async createEnquiry(
    @GetTenantId() tenantId: string,
    @Body() dto: CreateAdmissionEnquiryDto,
  ): Promise<AdmissionEnquiryResponseDto> {
    return this.admissionEnquiryService.createEnquiry(tenantId, dto);
  }

  @Get('enquiries')
  @Roles('ADMISSION_COUNSELLOR', 'SCHOOL_ADMIN', 'PRINCIPAL')
  @ApiOperation({ summary: 'List all admission enquiries' })
  @ApiResponse({
    status: 200,
    description: 'List of enquiries',
    type: AdmissionEnquiryListResponseDto,
  })
  async listEnquiries(
    @GetTenantId() tenantId: string,
    @Query() query: ListAdmissionEnquiryDto,
  ): Promise<AdmissionEnquiryListResponseDto> {
    return this.admissionEnquiryService.listEnquiries(tenantId, query);
  }

  @Get('enquiry/:enquiryId')
  @Roles('ADMISSION_COUNSELLOR', 'SCHOOL_ADMIN')
  @ApiOperation({ summary: 'Get enquiry by ID' })
  @ApiParam({ name: 'enquiryId', description: 'Enquiry ID' })
  @ApiResponse({
    status: 200,
    description: 'Enquiry details',
    type: AdmissionEnquiryResponseDto,
  })
  async getEnquiry(
    @GetTenantId() tenantId: string,
    @Param('enquiryId') enquiryId: string,
  ): Promise<AdmissionEnquiryResponseDto> {
    const enquiry = await this.admissionEnquiryService.getEnquiryById(
      tenantId,
      enquiryId,
    );
    return this.admissionEnquiryService['formatEnquiryResponse'](enquiry);
  }

  @Put('enquiry/:enquiryId')
  @Roles('ADMISSION_COUNSELLOR', 'SCHOOL_ADMIN')
  @ApiOperation({ summary: 'Update enquiry details' })
  @ApiParam({ name: 'enquiryId', description: 'Enquiry ID' })
  @ApiResponse({
    status: 200,
    description: 'Enquiry updated',
    type: AdmissionEnquiryResponseDto,
  })
  async updateEnquiry(
    @GetTenantId() tenantId: string,
    @Param('enquiryId') enquiryId: string,
    @Body() dto: UpdateAdmissionEnquiryDto,
  ): Promise<AdmissionEnquiryResponseDto> {
    return this.admissionEnquiryService.updateEnquiry(tenantId, enquiryId, dto);
  }

  @Post('enquiry/:enquiryId/follow-up')
  @Roles('ADMISSION_COUNSELLOR', 'SCHOOL_ADMIN')
  @ApiOperation({ summary: 'Add follow-up to an enquiry' })
  @ApiParam({ name: 'enquiryId', description: 'Enquiry ID' })
  @ApiResponse({
    status: 200,
    description: 'Follow-up added',
  })
  async addFollowUp(
    @GetTenantId() tenantId: string,
    @Param('enquiryId') enquiryId: string,
    @Body() dto: CreateFollowUpDto,
  ): Promise<any> {
    return this.admissionEnquiryService.addFollowUp(tenantId, enquiryId, dto);
  }

  @Get('enquiry/follow-ups/pending')
  @Roles('ADMISSION_COUNSELLOR', 'SCHOOL_ADMIN')
  @ApiOperation({ summary: 'Get pending follow-ups' })
  @ApiResponse({
    status: 200,
    description: 'Pending follow-ups',
    type: PendingFollowUpsResponseDto,
  })
  async getPendingFollowUps(
    @GetTenantId() tenantId: string,
  ): Promise<PendingFollowUpsResponseDto> {
    return this.admissionEnquiryService.getPendingFollowUps(tenantId);
  }

  @Get('enquiry/statistics')
  @Roles('SCHOOL_ADMIN', 'PRINCIPAL')
  @ApiOperation({ summary: 'Get enquiry statistics' })
  @ApiResponse({
    status: 200,
    description: 'Enquiry statistics',
  })
  async getEnquiryStatistics(
    @GetTenantId() tenantId: string,
  ): Promise<any> {
    return this.admissionEnquiryService.getEnquiryStatistics(tenantId);
  }

  // ========== ADMISSION ENDPOINTS ==========

  @Post('enquiry/:enquiryId/convert')
  @Roles('ADMISSION_COUNSELLOR', 'SCHOOL_ADMIN')
  @ApiOperation({
    summary: 'Convert enquiry to formal admission and create student',
  })
  @ApiParam({ name: 'enquiryId', description: 'Enquiry ID to convert' })
  @ApiResponse({
    status: 201,
    description: 'Converted to admission',
  })
  async convertEnquiryToAdmission(
    @GetTenantId() tenantId: string,
    @Param('enquiryId') enquiryId: string,
    @Body() dto: ConvertEnquiryToAdmissionDto,
  ): Promise<{ student: any; admission: any }> {
    return this.admissionService.convertEnquiryToAdmission(
      tenantId,
      enquiryId,
      dto,
    );
  }

  @Post()
  @Roles('ADMISSION_COUNSELLOR', 'SCHOOL_ADMIN')
  @ApiOperation({ summary: 'Create a new admission' })
  @ApiResponse({
    status: 201,
    description: 'Admission created',
    type: AdmissionResponseDto,
  })
  async createAdmission(
    @GetTenantId() tenantId: string,
    @Body() dto: CreateAdmissionDto,
  ): Promise<AdmissionResponseDto> {
    return this.admissionService.createAdmission(tenantId, dto);
  }

  @Get()
  @Roles('SCHOOL_ADMIN', 'ADMISSION_COUNSELLOR', 'PRINCIPAL')
  @ApiOperation({ summary: 'List all admissions' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  @ApiQuery({
    name: 'academicYear',
    required: false,
    description: 'Filter by academic year',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'List of admissions',
  })
  async listAdmissions(
    @GetTenantId() tenantId: string,
    @Query('status') status?: string,
    @Query('academicYear') academicYear?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
  ): Promise<any> {
    return this.admissionService.listAdmissions(tenantId, {
      status,
      academicYear,
      page,
      limit,
      search,
    });
  }

  @Get(':admissionId')
  @Roles('SCHOOL_ADMIN', 'ADMISSION_COUNSELLOR')
  @ApiOperation({ summary: 'Get admission details' })
  @ApiParam({ name: 'admissionId', description: 'Admission ID' })
  @ApiResponse({
    status: 200,
    description: 'Admission details',
    type: AdmissionSummaryResponseDto,
  })
  async getAdmissionDetails(
    @GetTenantId() tenantId: string,
    @Param('admissionId') admissionId: string,
  ): Promise<AdmissionSummaryResponseDto> {
    return this.admissionService.getAdmissionSummary(tenantId, admissionId);
  }

  @Put(':admissionId')
  @Roles('SCHOOL_ADMIN', 'ADMISSION_COUNSELLOR')
  @ApiOperation({ summary: 'Update admission' })
  @ApiParam({ name: 'admissionId', description: 'Admission ID' })
  @ApiResponse({
    status: 200,
    description: 'Admission updated',
    type: AdmissionResponseDto,
  })
  async updateAdmission(
    @GetTenantId() tenantId: string,
    @Param('admissionId') admissionId: string,
    @Body() dto: UpdateAdmissionDto,
  ): Promise<AdmissionResponseDto> {
    return this.admissionService.updateAdmission(tenantId, admissionId, dto);
  }

  @Get('statistics/:academicYear')
  @Roles('SCHOOL_ADMIN', 'PRINCIPAL')
  @ApiOperation({ summary: 'Get admission statistics' })
  @ApiParam({ name: 'academicYear', description: 'Academic year' })
  @ApiResponse({
    status: 200,
    description: 'Admission statistics',
    type: AdmissionStatisticsResponseDto,
  })
  async getStatistics(
    @GetTenantId() tenantId: string,
    @Param('academicYear') academicYear: string,
  ): Promise<AdmissionStatisticsResponseDto> {
    return this.admissionService.getAdmissionStatistics(tenantId, academicYear);
  }

  // ========== DOCUMENT ENDPOINTS ==========

  @Post(':admissionId/documents')
  @Roles('ADMISSION_COUNSELLOR', 'SCHOOL_ADMIN')
  @ApiOperation({ summary: 'Upload a document for admission' })
  @ApiParam({ name: 'admissionId', description: 'Admission ID' })
  @ApiResponse({
    status: 201,
    description: 'Document uploaded',
    type: DocumentResponseDto,
  })
  async uploadDocument(
    @GetTenantId() tenantId: string,
    @Param('admissionId') admissionId: string,
    @Body() dto: DocumentUploadDto,
  ): Promise<DocumentResponseDto> {
    return this.admissionService.uploadDocument(tenantId, admissionId, dto);
  }

  @Post(':admissionId/documents/bulk')
  @Roles('ADMISSION_COUNSELLOR', 'SCHOOL_ADMIN')
  @ApiOperation({ summary: 'Upload multiple documents' })
  @ApiParam({ name: 'admissionId', description: 'Admission ID' })
  @ApiResponse({
    status: 201,
    description: 'Documents uploaded',
    type: [DocumentResponseDto],
  })
  async uploadDocumentsBulk(
    @GetTenantId() tenantId: string,
    @Param('admissionId') admissionId: string,
    @Body() dto: BulkDocumentUploadDto,
  ): Promise<DocumentResponseDto[]> {
    return this.admissionService.uploadDocumentsBulk(tenantId, admissionId, dto);
  }

  @Put('documents/:documentId/verify')
  @Roles('SCHOOL_ADMIN', 'ACCOUNTANT')
  @ApiOperation({ summary: 'Verify a document' })
  @ApiParam({ name: 'documentId', description: 'Document ID' })
  @ApiResponse({
    status: 200,
    description: 'Document verified',
    type: DocumentResponseDto,
  })
  async verifyDocument(
    @GetTenantId() tenantId: string,
    @Param('documentId') documentId: string,
    @Query('status') status: 'VERIFIED' | 'REJECTED',
  ): Promise<DocumentResponseDto> {
    return this.admissionService.verifyDocument(tenantId, documentId, status);
  }

  // ========== COMMUNICATION ENDPOINTS ==========

  @Post(':admissionId/send-sms')
  @Roles('ADMISSION_COUNSELLOR', 'SCHOOL_ADMIN')
  @ApiOperation({ summary: 'Send SMS to student/parent' })
  @ApiParam({ name: 'admissionId', description: 'Admission ID' })
  @ApiResponse({
    status: 200,
    description: 'SMS sent',
  })
  async sendSms(
    @GetTenantId() tenantId: string,
    @Param('admissionId') admissionId: string,
    @Body('phoneNumber') phoneNumber: string,
    @Body('message') message: string,
  ): Promise<any> {
    const admission = await this.admissionService.getAdmissionById(
      tenantId,
      admissionId,
    );

    return this.communicationService.sendSms(tenantId, {
      phoneNumber,
      message,
      studentId: admission.studentId,
    });
  }

  @Post(':admissionId/send-whatsapp')
  @Roles('ADMISSION_COUNSELLOR', 'SCHOOL_ADMIN')
  @ApiOperation({ summary: 'Send WhatsApp message' })
  @ApiParam({ name: 'admissionId', description: 'Admission ID' })
  @ApiResponse({
    status: 200,
    description: 'WhatsApp message sent',
  })
  async sendWhatsApp(
    @GetTenantId() tenantId: string,
    @Param('admissionId') admissionId: string,
    @Body('phoneNumber') phoneNumber: string,
    @Body('message') message: string,
  ): Promise<any> {
    const admission = await this.admissionService.getAdmissionById(
      tenantId,
      admissionId,
    );

    return this.communicationService.sendWhatsApp(tenantId, {
      phoneNumber,
      message,
      studentId: admission.studentId,
    });
  }

  @Post(':admissionId/send-email')
  @Roles('ADMISSION_COUNSELLOR', 'SCHOOL_ADMIN')
  @ApiOperation({ summary: 'Send email notification' })
  @ApiParam({ name: 'admissionId', description: 'Admission ID' })
  @ApiResponse({
    status: 200,
    description: 'Email sent',
  })
  async sendEmail(
    @GetTenantId() tenantId: string,
    @Param('admissionId') admissionId: string,
    @Body('email') email: string,
    @Body('subject') subject: string,
    @Body('body') body: string,
  ): Promise<any> {
    const admission = await this.admissionService.getAdmissionById(
      tenantId,
      admissionId,
    );

    return this.communicationService.sendEmail(tenantId, {
      email,
      subject,
      body,
      studentId: admission.studentId,
    });
  }

  @Post(':admissionId/notify-status')
  @Roles('SCHOOL_ADMIN', 'ADMISSION_COUNSELLOR')
  @ApiOperation({ summary: 'Send status notification to student/parent' })
  @ApiParam({ name: 'admissionId', description: 'Admission ID' })
  @ApiResponse({
    status: 200,
    description: 'Notification sent',
  })
  async notifyStatus(
    @GetTenantId() tenantId: string,
    @Param('admissionId') admissionId: string,
    @Body('status') status: string,
    @Body('parentPhone') parentPhone: string,
    @Body('parentEmail') parentEmail?: string,
  ): Promise<any> {
    const admission = await this.admissionService.getAdmissionById(
      tenantId,
      admissionId,
    );

    await this.communicationService.sendAdmissionNotification(
      tenantId,
      admission.studentId,
      status,
      parentPhone,
      parentEmail,
    );

    return {
      success: true,
      message: 'Status notification sent',
    };
  }

  @Post('enquiry/:enquiryId/send-reminder')
  @Roles('ADMISSION_COUNSELLOR', 'SCHOOL_ADMIN')
  @ApiOperation({ summary: 'Send follow-up reminder' })
  @ApiParam({ name: 'enquiryId', description: 'Enquiry ID' })
  @ApiResponse({
    status: 200,
    description: 'Reminder sent',
  })
  async sendReminder(
    @GetTenantId() tenantId: string,
    @Param('enquiryId') enquiryId: string,
    @Body('parentPhone') parentPhone: string,
    @Body('parentEmail') parentEmail?: string,
  ): Promise<any> {
    await this.communicationService.sendFollowUpReminder(
      tenantId,
      enquiryId,
      parentPhone,
      parentEmail,
    );

    return {
      success: true,
      message: 'Reminder sent successfully',
    };
  }
}
