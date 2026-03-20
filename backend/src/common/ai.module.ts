import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { AiClientService } from './services/ai-client.service';

/**
 * AI Integration Module
 * Provides AI client service for use across the application
 */
@Module({
  imports: [
    HttpModule,
    ConfigModule,
  ],
  providers: [AiClientService],
  exports: [AiClientService],
})
export class AiModule {}
