import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { TenantContextService } from '@common/services/tenant-context.service';

/**
 * TenantQueryBuilderService
 * Provides utility methods for building tenant-safe queries
 * Ensures all queries include proper tenant filtering
 */
@Injectable()
export class TenantQueryBuilderService {
  private readonly logger = new Logger(TenantQueryBuilderService.name);

  constructor(private tenantContextService: TenantContextService) {}

  /**
   * Build a tenant-filtered where clause
   * Automatically includes tenantId from current context
   */
  buildWhere(filters?: Record<string, any>): Record<string, any> {
    const context = this.tenantContextService.getTenantContext();

    if (!context?.tenantId) {
      throw new ForbiddenException(
        'Tenant context not initialized. Cannot build tenant-filtered query.',
      );
    }

    const where: Record<string, any> = {
      tenantId: context.tenantId,
    };

    // Add schoolId filter if in context
    if (context.schoolId) {
      where.schoolId = context.schoolId;
    }

    // Merge with provided filters
    if (filters) {
      // Validate no tenant/school override attempts
      if (filters.tenantId && filters.tenantId !== context.tenantId) {
        throw new ForbiddenException(
          'Cannot query for different tenant data',
        );
      }

      if (
        context.schoolId &&
        filters.schoolId &&
        filters.schoolId !== context.schoolId
      ) {
        throw new ForbiddenException(
          'Cannot query for different school data',
        );
      }

      return {
        ...where,
        ...filters,
      };
    }

    return where;
  }

  /**
   * Build create data with tenant context
   */
  buildCreateData(data: Record<string, any>): Record<string, any> {
    const context = this.tenantContextService.getTenantContext();

    if (!context?.tenantId) {
      throw new ForbiddenException(
        'Tenant context not initialized. Cannot create tenant-scoped data.',
      );
    }

    // Validate no tenant override
    if (data.tenantId && data.tenantId !== context.tenantId) {
      throw new ForbiddenException(
        'Cannot create data for different tenant',
      );
    }

    // Ensure tenantId is always set
    const createData = {
      tenantId: context.tenantId,
      ...data,
    };

    // Add schoolId if in context and not already in data
    if (context.schoolId && !createData.schoolId) {
      createData.schoolId = context.schoolId;
    }

    return createData;
  }

  /**
   * Build update data with validation
   */
  buildUpdateData(data: Record<string, any>): Record<string, any> {
    const context = this.tenantContextService.getTenantContext();

    if (!context?.tenantId) {
      throw new ForbiddenException(
        'Tenant context not initialized. Cannot update tenant-scoped data.',
      );
    }

    // Prevent tenantId updates
    if (data.tenantId && data.tenantId !== context.tenantId) {
      throw new ForbiddenException(
        'Cannot update data for different tenant',
      );
    }

    // Remove tenantId if trying to update it
    const updateData = { ...data };
    delete updateData.tenantId;

    // Prevent schoolId updates if it would change context
    if (data.schoolId && context.schoolId && data.schoolId !== context.schoolId) {
      throw new ForbiddenException(
        'Cannot update data to different school',
      );
    }

    return updateData;
  }

  /**
   * Build find options with tenant isolation
   */
  buildFindOptions(options?: {
    where?: Record<string, any>;
    skip?: number;
    take?: number;
    select?: Record<string, any>;
    include?: Record<string, any>;
    orderBy?: Record<string, any> | Record<string, any>[];
  }): Omit<typeof options, ''> {
    const context = this.tenantContextService.getTenantContext();

    if (!context?.tenantId) {
      throw new ForbiddenException(
        'Tenant context not initialized. Cannot build tenant-filtered query.',
      );
    }

    const tenantWhere = this.buildWhere(options?.where);

    return {
      ...options,
      where: tenantWhere,
    };
  }

  /**
   * Validate that resource belongs to current tenant
   */
  validateTenantOwnership(
    resource: Record<string, any>,
    fieldName: string = 'tenantId',
  ): boolean {
    const context = this.tenantContextService.getTenantContext();

    if (!context?.tenantId) {
      throw new ForbiddenException('Tenant context not initialized');
    }

    const resourceTenantId = resource?.[fieldName];

    if (resourceTenantId !== context.tenantId) {
      this.logger.warn(
        `Tenant ownership validation failed: resource=${resourceTenantId}, context=${context.tenantId}`,
      );
      throw new ForbiddenException(
        'Resource does not belong to your tenant',
      );
    }

    return true;
  }

  /**
   * Validate that resource belongs to current school (if schoolId in context)
   */
  validateSchoolOwnership(
    resource: Record<string, any>,
    fieldName: string = 'schoolId',
  ): boolean {
    const context = this.tenantContextService.getTenantContext();

    if (!context?.schoolId) {
      // No school restriction
      return true;
    }

    const resourceSchoolId = resource?.[fieldName];

    if (resourceSchoolId && resourceSchoolId !== context.schoolId) {
      this.logger.warn(
        `School ownership validation failed: resource=${resourceSchoolId}, context=${context.schoolId}`,
      );
      throw new ForbiddenException(
        'Resource does not belong to your school',
      );
    }

    return true;
  }

  /**
   * Build AND filter combining tenant context with additional conditions
   */
  buildAndFilter(conditions: Record<string, any>[]): Record<string, any> {
    const tenantWhere = this.buildWhere();

    return {
      AND: [tenantWhere, ...conditions],
    };
  }

  /**
   * Build OR filter with tenant context
   */
  buildOrFilter(conditions: Record<string, any>[]): Record<string, any> {
    const tenantWhere = this.buildWhere();

    return {
      AND: [
        tenantWhere,
        {
          OR: conditions,
        },
      ],
    };
  }

  /**
   * Get current tenant context
   */
  getCurrentTenantContext() {
    return this.tenantContextService.getTenantContext();
  }

  /**
   * Check if user has access to resource
   */
  hasAccessToResource(
    resource: Record<string, any>,
    tenantField: string = 'tenantId',
    schoolField: string = 'schoolId',
  ): boolean {
    try {
      this.validateTenantOwnership(resource, tenantField);
      this.validateSchoolOwnership(resource, schoolField);
      return true;
    } catch {
      return false;
    }
  }
}
