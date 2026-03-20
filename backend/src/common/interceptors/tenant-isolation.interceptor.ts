import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { Request } from 'express';
import { TenantContextService } from '@common/services/tenant-context.service';

/**
 * TenantIsolationInterceptor
 * Validates tenant isolation for each request
 * Ensures tenant context is properly set and validated
 */
@Injectable()
export class TenantIsolationInterceptor implements NestInterceptor {
  private readonly logger = new Logger(TenantIsolationInterceptor.name);

  constructor(private tenantContextService: TenantContextService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();

    try {
      // Validate tenant context is set
      const tenantContext = this.tenantContextService.getTenantContext();

      if (!tenantContext?.tenantId) {
        this.logger.warn('Request processed without tenant context');
        throw new ForbiddenException(
          'Tenant context not found. Request cannot be processed.',
        );
      }

      // Log the request with tenant context
      this.logger.debug(
        `[${request.method} ${request.path}] Tenant: ${tenantContext.tenantId}, User: ${tenantContext.userId}`,
      );

      // Validate route parameter tenant ID if present
      const routeTenantId = (request.params as any)?.tenantId;
      if (routeTenantId && routeTenantId !== tenantContext.tenantId) {
        this.logger.warn(
          `Tenant mismatch in route: route=${routeTenantId}, context=${tenantContext.tenantId}`,
        );
        throw new ForbiddenException('Access denied: tenant mismatch');
      }

      // Validate query parameter tenant ID if present
      const queryTenantId = (request.query as any)?.tenantId;
      if (queryTenantId && queryTenantId !== tenantContext.tenantId) {
        this.logger.warn(
          `Tenant mismatch in query: query=${queryTenantId}, context=${tenantContext.tenantId}`,
        );
        throw new ForbiddenException('Access denied: tenant mismatch');
      }

      // Validate body tenant ID if present
      const bodyTenantId = (request.body as any)?.tenantId;
      if (bodyTenantId && bodyTenantId !== tenantContext.tenantId) {
        this.logger.warn(
          `Tenant mismatch in body: body=${bodyTenantId}, context=${tenantContext.tenantId}`,
        );
        throw new ForbiddenException('Access denied: tenant mismatch');
      }

      return next.handle();
    } catch (error) {
      this.logger.error(`Tenant isolation validation error: ${error.message}`);
      throw error;
    }
  }
}
