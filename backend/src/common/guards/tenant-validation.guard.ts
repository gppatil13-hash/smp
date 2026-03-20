import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Request } from 'express';

/**
 * TenantValidationGuard
 * Ensures that the tenant in the request matches the tenant in the JWT token
 * Prevents unauthorized cross-tenant access
 */
@Injectable()
export class TenantValidationGuard implements CanActivate {
  private readonly logger = new Logger(TenantValidationGuard.name);

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    const tokenTenantId = request.user?.tenantId;
    const requestTenantId = (request as any).tenantId;

    // Validate that tenant context exists
    if (!tokenTenantId || !requestTenantId) {
      this.logger.warn('Missing tenant context in request validation');
      throw new ForbiddenException('Tenant context not found');
    }

    // Validate that tenant IDs match
    if (tokenTenantId !== requestTenantId) {
      this.logger.warn(
        `Tenant mismatch: token=${tokenTenantId}, request=${requestTenantId}`,
      );
      throw new ForbiddenException('Access denied: tenant mismatch');
    }

    // Optional: Validate school access if schoolId is present
    if (request.user?.schoolId && (request as any).schoolId) {
      if (request.user.schoolId !== (request as any).schoolId) {
        this.logger.warn(
          `School mismatch: token=${request.user.schoolId}, request=${(request as any).schoolId}`,
        );
        throw new ForbiddenException('Access denied: school mismatch');
      }
    }

    return true;
  }
}
