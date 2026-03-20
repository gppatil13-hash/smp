import { Injectable } from '@nestjs/common';
import { ITenantContext } from '@common/interfaces/auth.interface';

/**
 * TenantContext Service
 * Provides centralized management of the current tenant context
 * using AsyncLocalStorage for request-scoped storage
 */
@Injectable()
export class TenantContextService {
  private tenantContextAsyncLocalStorage: AsyncLocalStorage<ITenantContext> = 
    new AsyncLocalStorage();

  /**
   * Set the current tenant context for this request
   * @param tenantContext The tenant context to set
   */
  setTenantContext(tenantContext: ITenantContext): void {
    const store = this.tenantContextAsyncLocalStorage.getStore();
    if (!store) {
      this.tenantContextAsyncLocalStorage.run(tenantContext, () => {
        // Context is set and will be available in the async chain
      });
    }
  }

  /**
   * Get the current tenant context
   * @returns The current tenant context or undefined
   */
  getTenantContext(): ITenantContext | undefined {
    return this.tenantContextAsyncLocalStorage.getStore();
  }

  /**
   * Get the current tenant ID
   * @returns The current tenant ID
   * @throws Error if tenant context is not set
   */
  getTenantId(): string {
    const context = this.getTenantContext();
    if (!context?.tenantId) {
      throw new Error('Tenant context not initialized. Make sure TenantMiddleware is applied.');
    }
    return context.tenantId;
  }

  /**
   * Get the current school ID
   * @returns The current school ID or undefined
   */
  getSchoolId(): string | undefined {
    return this.getTenantContext()?.schoolId;
  }

  /**
   * Get the current user ID
   * @returns The current user ID or undefined
   */
  getUserId(): string | undefined {
    return this.getTenantContext()?.userId;
  }

  /**
   * Check if the tenant context is initialized
   * @returns True if tenant context is set
   */
  isInitialized(): boolean {
    return !!this.getTenantContext();
  }

  /**
   * Build query filter for tenant isolation
   * @param additionalFilters Optional additional filters to merge
   * @returns Filter object for Prisma queries
   */
  buildTenantFilter(additionalFilters?: Record<string, any>) {
    const context = this.getTenantContext();
    const filter: Record<string, any> = {
      tenantId: context?.tenantId,
    };

    if (context?.schoolId) {
      filter.schoolId = context.schoolId;
    }

    return {
      ...filter,
      ...additionalFilters,
    };
  }

  /**
   * Validate that the provided tenant ID matches the current context
   * @param tenantId The tenant ID to validate
   * @returns True if the tenant ID matches
   */
  validateTenantAccess(tenantId: string): boolean {
    return this.getTenantId() === tenantId;
  }

  /**
   * Validate that the provided school ID matches the current context
   * @param schoolId The school ID to validate
   * @returns True if the school ID matches or is not set in context
   */
  validateSchoolAccess(schoolId?: string): boolean {
    if (!schoolId) return true;
    return this.getSchoolId() === schoolId;
  }
}

// AsyncLocalStorage polyfill for Node.js versions that don't have it
if (!globalThis.AsyncLocalStorage) {
  const AsyncLocalStorageImpl = require('async_hooks').AsyncLocalStorage;
  (globalThis as any).AsyncLocalStorage = AsyncLocalStorageImpl;
}
