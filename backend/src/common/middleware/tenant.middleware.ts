import { Injectable, NestMiddleware, BadRequestException, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { ITenantContext } from '@common/interfaces/auth.interface';

/**
 * TenantMiddleware
 * Extracts and validates tenant context from multiple sources:
 * 1. JWT token (primary source)
 * 2. Request subdomain
 * 3. Query parameter (fallback)
 * 4. Request header (tenant-id)
 */
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  private readonly logger = new Logger(TenantMiddleware.name);

  use(req: Request, res: Response, next: NextFunction) {
    try {
      // Extract tenant context from request
      const tenantContext = this.extractTenantContext(req);

      if (!tenantContext) {
        throw new BadRequestException(
          'Tenant context not found. Please provide valid tenant identification.',
        );
      }

      // Validate tenant ID
      if (!this.isValidTenantId(tenantContext.tenantId)) {
        throw new BadRequestException('Invalid tenant identifier');
      }

      // Attach tenant context to request
      (req as any).tenantId = tenantContext.tenantId;
      (req as any).schoolId = tenantContext.schoolId;
      (req as any).tenantContext = tenantContext;
      (req as any).userId = tenantContext.userId;

      this.logger.debug(
        `Tenant context set: tenantId=${tenantContext.tenantId}, schoolId=${tenantContext.schoolId}`,
      );

      next();
    } catch (error) {
      this.logger.error(`Tenant middleware error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Extract tenant context from request using multiple sources
   * Priority: JWT > Header > Subdomain > Query Parameter
   */
  private extractTenantContext(req: Request): ITenantContext | null {
    // 1. Try to extract from JWT token
    const tenantFromJwt = this.extractTenantFromJwt(req);
    if (tenantFromJwt) {
      return tenantFromJwt;
    }

    // 2. Try to extract from custom header
    const tenantFromHeader = this.extractTenantFromHeader(req);
    if (tenantFromHeader) {
      return tenantFromHeader;
    }

    // 3. Try to extract from subdomain
    const tenantFromSubdomain = this.extractTenantFromSubdomain(req);
    if (tenantFromSubdomain) {
      return tenantFromSubdomain;
    }

    // 4. Try to extract from query parameter
    const tenantFromQuery = this.extractTenantFromQuery(req);
    if (tenantFromQuery) {
      return tenantFromQuery;
    }

    return null;
  }

  /**
   * Extract tenant context from JWT token
   */
  private extractTenantFromJwt(req: Request): ITenantContext | null {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        return null;
      }

      const token = authHeader.substring(7);
      
      // Decode without verification (will be properly verified by JWT guard)
      // We just need to extract tenant info
      const decoded: any = jwt.decode(token);
      
      if (decoded?.tenantId) {
        return {
          tenantId: decoded.tenantId,
          schoolId: decoded.schoolId,
          userId: decoded.sub || decoded.userId,
        };
      }
    } catch (error) {
      this.logger.debug(`Failed to extract tenant from JWT: ${error.message}`);
    }

    return null;
  }

  /**
   * Extract tenant from custom X-Tenant-Id header
   */
  private extractTenantFromHeader(req: Request): ITenantContext | null {
    const tenantId = req.headers['x-tenant-id'] as string;
    const schoolId = req.headers['x-school-id'] as string;

    if (tenantId) {
      return {
        tenantId,
        schoolId: schoolId || undefined,
      };
    }

    return null;
  }

  /**
   * Extract tenant from subdomain
   * Example: tenant-name.example.com
   */
  private extractTenantFromSubdomain(req: Request): ITenantContext | null {
    const host = req.get('host') || '';
    const parts = host.split('.');

    if (parts.length >= 2) {
      const [subdomain] = parts;

      // Skip invalid subdomains
      if (subdomain && !['localhost', 'www', 'api'].includes(subdomain)) {
        return {
          tenantId: subdomain,
        };
      }
    }

    return null;
  }

  /**
   * Extract tenant from query parameter
   */
  private extractTenantFromQuery(req: Request): ITenantContext | null {
    const tenantId = req.query.tenantId as string;
    const schoolId = req.query.schoolId as string;

    if (tenantId) {
      return {
        tenantId,
        schoolId: schoolId || undefined,
      };
    }

    return null;
  }

  /**
   * Validate tenant ID format
   * Should be alphanumeric with hyphens, not reserved keywords
   */
  private isValidTenantId(tenantId: string): boolean {
    if (!tenantId || typeof tenantId !== 'string') {
      return false;
    }

    // Length check (3-50 characters)
    if (tenantId.length < 3 || tenantId.length > 50) {
      return false;
    }

    // Alphanumeric and hyphen only
    if (!/^[a-z0-9\-]+$/i.test(tenantId)) {
      return false;
    }

    // Not a reserved keyword
    const reserved = ['localhost', 'www', 'api', 'admin', 'system', 'root'];
    if (reserved.includes(tenantId.toLowerCase())) {
      return false;
    }

    return true;
  }
}
