import { PrismaClient } from '@prisma/client';
import { env } from './env';
import { findTenantBySlug } from './master';
import { getTenantSlug } from '../multi-tenancy/tenantContext';

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  tenantClients?: Map<string, PrismaClient>;
};

const baseClient: PrismaClient = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = baseClient;
}

const tenantClients = globalForPrisma.tenantClients ?? new Map<string, PrismaClient>();
globalForPrisma.tenantClients = tenantClients;

function tenantDbUrl(dbName: string): string {
  try {
    const url = new URL(env.DATABASE_URL);
    url.pathname = `/${dbName}`;
    return url.toString();
  } catch {
    return env.DATABASE_URL;
  }
}

export function buildTenantDbName(slug: string): string {
  return `${env.TENANT_DB_PREFIX}${slug}`.replace(/[^a-zA-Z0-9_]/g, '_');
}

export async function getTenantClient(slug: string): Promise<PrismaClient> {
  const cached = tenantClients.get(slug);
  if (cached) return cached;

  const record = await findTenantBySlug(slug);
  const dbName = record?.db_name ?? buildTenantDbName(slug);

  const client = new PrismaClient({
    datasources: { db: { url: tenantDbUrl(dbName) } },
  });
  tenantClients.set(slug, client);
  return client;
}

export function closeTenantClients(): void {
  for (const client of tenantClients.values()) {
    void client.$disconnect();
  }
  tenantClients.clear();
}

function activeClient(): PrismaClient {
  const slug = getTenantSlug();
  if (!slug || slug === env.DEFAULT_TENANT) return baseClient;

  // The tenant middleware warms the client before dispatching to routes,
  // so within a request context it is always already cached.
  return tenantClients.get(slug) ?? baseClient;
}

/**
 * Dynamic proxy so every existing module keeps importing `prisma` unchanged,
 * while all model access is delegated to the current tenant's database client.
 */
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = activeClient();
    const value = Reflect.get(client as object, prop, client);
    return typeof value === 'function' ? value.bind(client) : value;
  },
});
