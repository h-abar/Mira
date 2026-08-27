import { NextFunction, Request, Response } from 'express';
import { env } from '../../config/env';
import { ApiError } from '../../utils/ApiError';
import {
  createTenant as createTenantService,
  getTenantList,
  setTenantStatus as updateTenantStatus,
} from './tenants.service';

function requirePlatformAdmin(req: Request, _res: Response, next: NextFunction): void {
  const username = req.headers['x-platform-username'];
  const password = req.headers['x-platform-password'];

  if (
    typeof username !== 'string' ||
    typeof password !== 'string' ||
    username !== env.PLATFORM_ADMIN_USERNAME ||
    password !== env.PLATFORM_ADMIN_PASSWORD
  ) {
    next(new ApiError(401, 'Platform admin authentication required.'));
    return;
  }
  next();
}

export async function createTenant(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await createTenantService(req.body);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function listTenants(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tenants = await getTenantList();
    res.json({ success: true, data: tenants });
  } catch (err) {
    next(err);
  }
}

export async function setTenantStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const status = req.body?.status === 'SUSPENDED' ? 'SUSPENDED' : 'ACTIVE';
    const tenant = await updateTenantStatus(req.params.slug, status);
    res.json({ success: true, data: tenant });
  } catch (err) {
    next(err);
  }
}

export const tenantsController = { createTenant, listTenants, setTenantStatus };
export { requirePlatformAdmin };
