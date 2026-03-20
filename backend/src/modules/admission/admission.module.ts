import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AdmissionController } from './controllers/admission.controller';
import { AdmissionService } from './services/admission.service';
import { AdmissionEnquiryService } from './services/admissionEnquiry.service';
import { AdmissionCommunicationService } from './services/admissionCommunication.service';
import { PrismaService } from '../../config/prisma.service';

@Module({
  imports: [ConfigModule],
  controllers: [AdmissionController],
  providers: [
    AdmissionService,
    AdmissionEnquiryService,
    AdmissionCommunicationService,
    PrismaService,
    ConfigService,
  ],
  exports: [
    AdmissionService,
    AdmissionEnquiryService,
    AdmissionCommunicationService,
  ],
})
export class AdmissionModule {}
