import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ITenantContext } from '@common/interfaces/auth.interface';

/**
 * PrismaService with Tenant Isolation Middleware
 * 
 * Automatically filters all queries to include tenant context.
 * This ensures that:
 * 1. Every query is scoped to the current tenant
 * 2. No tenant can access another tenant's data
 * 3. Data isolation is enforced at the database layer
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  // AsyncLocalStorage for managing tenant context
  private tenantContextStorage: AsyncLocalStorage<ITenantContext>;

  constructor() {
    super();
    this.initializeTenantContextStorage();
    this.setupTenantMiddleware();
  }

  /**
   * Initialize AsyncLocalStorage for tenant context
   */
  private initializeTenantContextStorage(): void {
    this.tenantContextStorage = new AsyncLocalStorage();
  }

  /**
   * Setup Prisma middleware for automatic tenant filtering
   */
  private setupTenantMiddleware(): void {
    // Middleware to intercept all Prisma operations
    this.$use(async (params, next) => {
      // Get current tenant context
      const tenantContext = this.tenantContextStorage.getStore();

      // If no tenant context, allow the query (for migrations, etc.)
      if (!tenantContext) {
        return next(params);
      }

      // List of models that require tenant isolation
      const tenantIsolatedModels = [
        'User',
        'School',
        'Student',
        'ClassMaster',
        'Admission',
        'FeeStructure',
        'FeeRecord',
        'Communication',
      ];

      // Only apply filtering to isolated models
      if (!tenantIsolatedModels.includes(params.model)) {
        return next(params);
      }

      // Apply tenant filter to different operations
      const { model, action, args } = params;

      try {
        // Handle different Prisma operations
        switch (action.toLowerCase()) {
          case 'findunique':
          case 'findfirst':
            // Add tenant filter to unique/first operations
            args.where = this.addTenantFilter(args.where, tenantContext);
            break;

          case 'findmany':
            // Add tenant filter to list operations
            args.where = this.addTenantFilter(args.where, tenantContext);
            break;

          case 'create':
            // Ensure created records include tenant ID
            args.data = this.ensureTenantData(args.data, tenantContext);
            this.logger.debug(`Creating ${model} with tenantId: ${tenantContext.tenantId}`);
            break;

          case 'update':
          case 'upsert':
            // Add filter to ensure user can only update their tenant's data
            args.where = this.addTenantFilter(args.where, tenantContext);
            if (action.toLowerCase() === 'upsert') {
              args.create = this.ensureTenantData(args.create, tenantContext);
            }
            break;

          case 'delete':
            // Add filter to ensure user can only delete their tenant's data
            args.where = this.addTenantFilter(args.where, tenantContext);
            this.logger.debug(`Deleting ${model} in tenant: ${tenantContext.tenantId}`);
            break;

          case 'updatemany':
            // Add filter to mass updates
            args.where = this.addTenantFilter(args.where, tenantContext);
            break;

          case 'deletemany':
            // Add filter to mass deletes
            args.where = this.addTenantFilter(args.where, tenantContext);
            this.logger.debug(`Mass delete in ${model} for tenant: ${tenantContext.tenantId}`);
            break;

          case 'count':
            // Add filter to count operations
            args.where = this.addTenantFilter(args.where, tenantContext);
            break;

          case 'aggregate':
            // Add filter to aggregate operations
            args.where = this.addTenantFilter(args.where, tenantContext);
            break;

          default:
            break;
        }

        this.logger.debug(
          `[${model}.${action}] Tenant filter applied: ${tenantContext.tenantId}`,
        );
      } catch (error) {
        this.logger.error(
          `Error applying tenant filter to ${model}.${action}: ${error.message}`,
        );
        throw new Error(
          `Tenant isolation enforcement failed: ${error.message}`,
        );
      }

      return next(params);
    });
  }

  /**
   * Add tenant filter to where clause
   */
  private addTenantFilter(
    where: Record<string, any> = {},
    tenantContext: ITenantContext,
  ): Record<string, any> {
    // If where already has tenant filter, validate it matches
    if (where.tenantId && where.tenantId !== tenantContext.tenantId) {
      throw new Error(
        'Tenant mismatch: attempting to access different tenant data',
      );
    }

    // Add tenant ID to filter
    const updatedWhere = {
      ...where,
      tenantId: tenantContext.tenantId,
    };

    // If schoolId is in context and not already in where, add it
    if (tenantContext.schoolId && !where.schoolId) {
      updatedWhere.schoolId = tenantContext.schoolId;
    }

    return updatedWhere;
  }

  /**
   * Ensure created/updated data includes tenant information
   */
  private ensureTenantData(
    data: Record<string, any>,
    tenantContext: ITenantContext,
  ): Record<string, any> {
    // Always ensure tenantId is set
    if (!data.tenantId) {
      data.tenantId = tenantContext.tenantId;
    } else if (data.tenantId !== tenantContext.tenantId) {
      throw new Error(
        'Tenant mismatch: cannot create data for a different tenant',
      );
    }

    // If schoolId is in context and not in data, add it
    if (tenantContext.schoolId && !data.schoolId) {
      data.schoolId = tenantContext.schoolId;
    }

    return data;
  }

  /**
   * Set the current tenant context for database operations
   * This should be called by middleware to set context for the request
   */
  setTenantContext(tenantContext: ITenantContext): void {
    this.tenantContextStorage.enterWith(tenantContext);
    this.logger.debug(`Tenant context set: ${tenantContext.tenantId}`);
  }

  /**
   * Get the current tenant context
   */
  getTenantContext(): ITenantContext | undefined {
    return this.tenantContextStorage.getStore();
  }

  /**
   * Clear the tenant context (useful for testing)
   */
  clearTenantContext(): void {
    this.tenantContextStorage.exitWith(undefined);
  }

  /**
   * Execute a callback within a specific tenant context
   * Useful for cross-tenant operations that require elevated privileges
   */
  async withTenantContext<T>(
    tenantContext: ITenantContext,
    callback: () => Promise<T>,
  ): Promise<T> {
    return this.tenantContextStorage.run(tenantContext, callback);
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Prisma connected with tenant isolation middleware');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Prisma disconnected');
  }
}

// AsyncLocalStorage implementation
declare global {
  var AsyncLocalStorage: any;
}

if (!globalThis.AsyncLocalStorage) {
  const { AsyncLocalStorage: ALS } = require('async_hooks');
  globalThis.AsyncLocalStorage = ALS;
}
