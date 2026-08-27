import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';
import { prisma } from '../config/database';
import { getTenantSlug } from '../multi-tenancy/tenantContext';

interface JwtPayload {
  id: number;
  username: string;
  role: string;
  employeeId: number | null;
  permissions?: string[];
  tenant?: string;
}

export function auth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return next(new ApiError(401, 'Authentication required. Missing or malformed token.'));
  }

  try {
    const token = header.slice(7);
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

    // Tenant isolation: a token issued for one workspace must never
    // be accepted against another workspace's database.
    if (decoded.tenant && decoded.tenant !== (getTenantSlug() ?? env.DEFAULT_TENANT)) {
      return next(new ApiError(403, 'Token does not belong to this workspace.'));
    }

    req.user = {
      id: decoded.id,
      username: decoded.username,
      role: decoded.role,
      employeeId: decoded.employeeId ?? null,
      permissions: decoded.permissions,
    };
    next();
  } catch {
    next(new ApiError(401, 'Invalid or expired token.'));
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required.'));
    }
    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, `Forbidden. Requires one of roles: ${roles.join(', ')}.`));
    }
    next();
  };
}

export function requirePermission(...keys: string[]) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        return next(new ApiError(401, 'Authentication required.'));
      }

      // ADMIN always has full access.
      if (req.user.role === 'ADMIN') {
        return next();
      }

      // Always read the latest state from the DB so that deactivating a user or
      // revoking a permission takes effect immediately (not only after re-login).
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { role: true, permissions: true, isActive: true },
      });
      if (!user) {
        return next(new ApiError(401, 'Authentication required.'));
      }
      if (!user.isActive) {
        return next(new ApiError(403, 'Account is inactive.'));
      }
      if (user.role === 'ADMIN') {
        return next();
      }

      if (keys.some((key) => user.permissions.includes(key))) {
        return next();
      }

      return next(new ApiError(403, `Forbidden. Requires one of permissions: ${keys.join(', ')}.`));
    } catch (err) {
      next(err);
    }
  };
}