import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { CommunicationController } from './controllers/communication.controller';
import { CommunicationService } from './services/communication.service';
import { WhatsAppController } from './controllers/whatsapp.controller';
import { WhatsAppService } from './services/whatsapp.service';
import { MessageTemplateService } from './services/message-template.service';
import { WhatsAppRetryProcessor } from './services/whatsapp-retry.processor';
import { PrismaService } from '@config/prisma.service';

@Module({
  imports: [ConfigModule, ScheduleModule.forRoot()],
  controllers: [CommunicationController, WhatsAppController],
  providers: [
    CommunicationService,
    WhatsAppService,
    MessageTemplateService,
    WhatsAppRetryProcessor,
    PrismaService,
  ],
  exports: [CommunicationService, WhatsAppService, MessageTemplateService],
})
export class CommunicationModule {}
