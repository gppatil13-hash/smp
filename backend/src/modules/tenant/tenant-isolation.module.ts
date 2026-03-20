import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

// Services
import { TenantContextService } from '@common/services/tenant-context.service';
import { TenantQueryBuilderService } from '@common/services/tenant-query-builder.service';

// Guards
import { TenantValidationGuard } from '@common/guards/tenant-validation.guard';

// Strategies
import { JwtStrategy } from '@common/strategies/jwt.strategy';

// Middleware
import { TenantMiddleware } from '@common/middleware/tenant.middleware';
import { TenantContextMiddleware } from '@common/middleware/tenant-context.middleware';

// Interceptors
import { TenantIsolationInterceptor } from '@common/interceptors/tenant-isolation.interceptor';

/**
 * TenantModule
 * Centralizes all tenant isolation infrastructure
 * Includes:
 * - Tenant context management
 * - JWT strategy with tenant extraction
 * - Guards for tenant validation
 * - Middleware for tenant context setup
 * - Interceptors for isolation verification
 * - Query builder utilities
 */
@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'your-secret-key',
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN') || '24h',
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [
    // Services
    TenantContextService,
    TenantQueryBuilderService,
    
    // Guards
    TenantValidationGuard,
    
    // Strategies
    JwtStrategy,
    
    // Middleware
    TenantMiddleware,
    TenantContextMiddleware,
    
    // Interceptors
    TenantIsolationInterceptor,
  ],
  exports: [
    // Core Services
    TenantContextService,
    TenantQueryBuilderService,
    
    // Guards
    TenantValidationGuard,
    
    // Middleware
    TenantMiddleware,
    TenantContextMiddleware,
    
    // Interceptors
    TenantIsolationInterceptor,
    
    // Passport & JWT modules (for auth features)
    PassportModule,
    JwtModule,
  ],
})
export class TenantIsolationModule {}
