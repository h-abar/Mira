import { NextFunction, Request, Response } from 'express';
import { env } from '../config/env';
import { findTenantBySlug } from '../config/master';
import { getTenantClient } from '../config/database';
import { ApiError } from '../utils/ApiError';
import { tenantStorage } from '../multi-tenancy/tenantContext';

const RESERVED_SUBDOMAINS = new Set(['www', 'api', 'admin', 'app', 'localhost']);

function extractSlug(req: Request): string | null {
  const host = (req.headers.host ?? '').split(':')[0].toLowerCase();
  if (host.endsWith('.up.railway.app')) return null;

  const header = req.headers['x-tenant'];
  if (typeof header === 'string' && header.trim() !== '') {
    return header.trim().toLowerCase();
  }

  const parts = host.split('.');
  // salon-slug.example.com -> ['salon-slug','example','com']
  if (parts.length > 2 && !RESERVED_SUBDOMAINS.has(parts[0]) && parts[0] !== '') {
    return parts[0];
  }
  return null;
}

export function tenantResolver(req: Request, _res: Response, next: NextFunction): void {
  const slug = extractSlug(req) ?? env.DEFAULT_TENANT;

  if (slug === env.DEFAULT_TENANT) {
    tenantStorage.run({ slug }, () => next());
    return;
  }

  void (async () => {
    try {
      const tenant = await findTenantBySlug(slug);
      if (!tenant) {
        throw new ApiError(404, `Workspace '${slug}' not found.`);
      }
      if (tenant.status !== 'ACTIVE') {
        throw new ApiError(403, `Workspace '${slug}' is suspended. Contact support.`);
      }
      // Warm the tenant's Prisma client before any route handler runs,
      // so the synchronous proxy in database.ts can always resolve it.
      await getTenantClient(slug);
      tenantStorage.run({ slug }, () => next());
    } catch (err) {
      next(err);
    }
  })();
}
