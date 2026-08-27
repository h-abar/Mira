import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../config/database';
import { env } from '../../config/env';
import { findTenantBySlug } from '../../config/master';
import { getTenantSlug } from '../../multi-tenancy/tenantContext';
import { ApiError } from '../../utils/ApiError';

interface LoginResult {
  token: string;
  user: {
    id: number;
    username: string;
    role: string;
    employeeId: number | null;
    permissions: string[];
    name: string | null;
  };
}

interface MeResult {
  id: number;
  username: string;
  role: string;
  employeeId: number | null;
  permissions: string[];
  employee: {
    id: number;
    nameAr: string;
    nameEn: string;
    role: string;
  } | null;
}

async function login(username: string, password: string): Promise<LoginResult> {
  const tenantSlug = getTenantSlug() ?? env.DEFAULT_TENANT;

  if (tenantSlug !== env.DEFAULT_TENANT) {
    const tenant = await findTenantBySlug(tenantSlug);
    if (!tenant) {
      throw new ApiError(404, `Workspace '${tenantSlug}' not found.`);
    }
    if (tenant.status !== 'ACTIVE') {
      throw new ApiError(403, `Workspace '${tenantSlug}' is suspended. Contact support.`);
    }
  }

  const user = await prisma.user.findFirst({
    where: { username, isActive: true },
    include: { employee: true },
  });

  if (!user || !user.isActive) {
    throw new ApiError(401, 'Invalid username or password.');
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    throw new ApiError(401, 'Invalid username or password.');
  }

  const token = jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role,
      employeeId: user.employeeId,
      permissions: user.permissions,
      tenant: tenantSlug,
    },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] },
  );

  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      employeeId: user.employeeId,
      permissions: user.permissions,
      name: user.employee ? user.employee.nameEn : null,
    },
  };
}

async function getMe(userId: number): Promise<MeResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { employee: true },
  });

  if (!user) {
    throw new ApiError(404, 'User not found.');
  }

  return {
    id: user.id,
    username: user.username,
    role: user.role,
    employeeId: user.employeeId,
    permissions: user.permissions,
    employee: user.employee
      ? {
          id: user.employee.id,
          nameAr: user.employee.nameAr,
          nameEn: user.employee.nameEn,
          role: user.employee.role,
        }
      : null,
  };
}

export const authService = { login, getMe };