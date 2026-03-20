import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import { CommunicationService } from '../services/communication.service';
import { SendSmsDto, SendWhatsAppDto, SendEmailDto, CommunicationListDto } from '../dtos/communication.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { RolesGuard } from '@common/guards/roles.guard';
import { GetTenantId } from '@common/decorators/get-tenant-id.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';

@Controller('communications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CommunicationController {
  constructor(private communicationService: CommunicationService) {}

  @Roles('SCHOOL_ADMIN', 'ADMISSION_COUNSELLOR')
  @Post('sms')
  async sendSMS(
    @GetTenantId() tenantId: string,
    @CurrentUser() user: any,
    @Body() sendSmsDto: SendSmsDto,
  ) {
    return this.communicationService.sendSMS(
      tenantId,
      user.schoolId,
      sendSmsDto.recipientPhone,
      sendSmsDto.message,
      sendSmsDto.studentId,
      sendSmsDto.admissionId,
    );
  }

  @Roles('SCHOOL_ADMIN', 'ADMISSION_COUNSELLOR')
  @Post('whatsapp')
  async sendWhatsApp(
    @GetTenantId() tenantId: string,
    @CurrentUser() user: any,
    @Body() sendWhatsAppDto: SendWhatsAppDto,
  ) {
    return this.communicationService.sendWhatsApp(
      tenantId,
      user.schoolId,
      sendWhatsAppDto.recipientPhone,
      sendWhatsAppDto.message,
      sendWhatsAppDto.studentId,
    );
  }

  @Roles('SCHOOL_ADMIN', 'ADMISSION_COUNSELLOR')
  @Post('email')
  async sendEmail(
    @GetTenantId() tenantId: string,
    @CurrentUser() user: any,
    @Body() sendEmailDto: SendEmailDto,
  ) {
    return this.communicationService.sendEmail(
      tenantId,
      user.schoolId,
      sendEmailDto.recipientEmail,
      sendEmailDto.subject,
      sendEmailDto.message,
      sendEmailDto.studentId,
    );
  }

  @Roles('SCHOOL_ADMIN', 'ADMISSION_COUNSELLOR')
  @Get()
  async getCommunications(
    @GetTenantId() tenantId: string,
    @CurrentUser() user: any,
    @Query() filters: CommunicationListDto,
  ) {
    return this.communicationService.getCommunications(tenantId, user.schoolId, filters);
  }

  @Roles('SCHOOL_ADMIN', 'ADMISSION_COUNSELLOR')
  @Get('student/:studentId')
  async getStudentCommunications(
    @GetTenantId() tenantId: string,
    @CurrentUser() user: any,
  ) {
    // Extracted from route params in actual implementation
    return { message: 'Endpoint for student communications' };
  }
}
