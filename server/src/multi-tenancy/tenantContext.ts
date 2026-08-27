import { AsyncLocalStorage } from 'async_hooks';

export interface TenantContext {
  slug: string;
}

const globalForTenant = globalThis as unknown as { tenantAls?: AsyncLocalStorage<TenantContext> };

export const tenantStorage =
  globalForTenant.tenantAls ?? new AsyncLocalStorage<TenantContext>();

if (process.env.NODE_ENV !== 'production') {
  globalForTenant.tenantAls = tenantStorage;
}

export function getTenantSlug(): string | undefined {
  return tenantStorage.getStore()?.slug;
}
