import { Module } from '@nestjs/common';
import { SchoolController } from './controllers/school.controller';
import { SchoolService } from './services/school.service';
import { PrismaService } from '@config/prisma.service';

@Module({
  controllers: [SchoolController],
  providers: [SchoolService, PrismaService],
  exports: [SchoolService],
})
export class SchoolModule {}
