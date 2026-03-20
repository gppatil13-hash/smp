import {
  Injectable,
  NestMiddleware,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '@config/prisma.service';
import { TenantContextService } from '@common/services/tenant-context.service';
import { ITenantContext } from '@common/interfaces/auth.interface';

/**
 * TenantContextMiddleware
 * Integrates tenant extraction with Prisma Service
 * Sets the tenant context for automatic database query filtering
 */
@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  private readonly logger = new Logger(TenantContextMiddleware.name);

  constructor(
    private prismaService: PrismaService,
    private tenantContextService: TenantContextService,
  ) {}

  use(req: Request, res: Response, next: NextFunction) {
    try {
      // Get tenant context from request (set by TenantMiddleware)
      const tenantContext = (req as any).tenantContext as ITenantContext | undefined;
      const tenantId = (req as any).tenantId;
      const schoolId = (req as any).schoolId;
      const userId = (req as any).userId || req.user?.id;

      if (!tenantId) {
        throw new BadRequestException('Tenant context must be set by TenantMiddleware');
      }

      // Build or use existing tenant context
      const context: ITenantContext = tenantContext || {
        tenantId,
        schoolId,
        userId,
      };

      // Set context in Prisma Service
      this.prismaService.setTenantContext(context);

      // Set context in TenantContextService
      this.tenantContextService.setTenantContext(context);

      // Store in request for access in handlers
      (req as any).tenantContext = context;

      this.logger.debug(
        `Tenant context middleware: tenantId=${context.tenantId}, schoolId=${context.schoolId}`,
      );

      next();
    } catch (error) {
      this.logger.error(`Tenant context middleware error: ${error.message}`);
      throw error;
    }
  }
}
