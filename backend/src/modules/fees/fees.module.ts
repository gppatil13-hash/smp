import { Module } from '@nestjs/common';
import { FeesController } from './controllers/fees.controller';
import { FeesService } from './services/fees.service';
import { CourseService } from './services/course.service';
import { FeeStructureService } from './services/feeStructure.service';
import { InstallmentService } from './services/installment.service';
import { PaymentService } from './services/payment.service';
import { ReceiptService } from './services/receipt.service';
import { PrismaService } from '@config/prisma.service';

@Module({
  controllers: [FeesController],
  providers: [
    FeesService,
    CourseService,
    FeeStructureService,
    InstallmentService,
    PaymentService,
    ReceiptService,
    PrismaService,
  ],
  exports: [
    FeesService,
    CourseService,
    FeeStructureService,
    InstallmentService,
    PaymentService,
    ReceiptService,
  ],
})
export class FeesModule {}
