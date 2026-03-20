import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from '@config/configuration';
import { AuthModule } from '@modules/auth/auth.module';
import { SchoolModule } from '@modules/school/school.module';
import { StudentModule } from '@modules/student/student.module';
import { AdmissionModule } from '@modules/admission/admission.module';
import { FeesModule } from '@modules/fees/fees.module';
import { CommunicationModule } from '@modules/communication/communication.module';
import { UserModule } from '@modules/user/user.module';
import { TenantModule } from '@modules/tenant/tenant.module';
import { TenantIsolationModule } from '@modules/tenant/tenant-isolation.module';
import { DashboardModule } from '@modules/dashboard/dashboard.module';
import { TenantMiddleware } from '@common/middleware/tenant.middleware';
import { TenantContextMiddleware } from '@common/middleware/tenant-context.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: ['.env', '.env.local', '.env.production'],
    }),
    // Core tenant isolation infrastructure
    TenantIsolationModule,
    
    // Business modules
    AuthModule,
    SchoolModule,
    StudentModule,
    AdmissionModule,
    FeesModule,
    CommunicationModule,
    UserModule,
    TenantModule,
    DashboardModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply middleware in order:
    // 1. TenantMiddleware - Extract tenant context from various sources
    // 2. TenantContextMiddleware - Set context in Prisma and services
    consumer
      .apply(TenantMiddleware, TenantContextMiddleware)
      .forRoutes('*');
  }
}
