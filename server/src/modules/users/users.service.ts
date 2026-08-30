import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { ApiError } from '../../utils/ApiError';

export type UserRole = 'ADMIN' | 'RECEPTIONIST' | 'STYLIST';

export interface PermissionDef {
  key: string;
  ar: string;
  en: string;
}

export const PERMISSION_DEFS: PermissionDef[] = [
  { key: 'services.read', ar: 'عرض الخدمات', en: 'View services' },
  { key: 'services.write', ar: 'إدارة الخدمات', en: 'Manage services' },
  { key: 'clients.read', ar: 'عرض العملاء', en: 'View clients' },
  { key: 'clients.write', ar: 'إدارة العملاء', en: 'Manage clients' },
  { key: 'appointments.read', ar: 'عرض المواعيد', en: 'View appointments' },
  { key: 'appointments.write', ar: 'إدارة المواعيد', en: 'Manage appointments' },
  { key: 'employees.read', ar: 'عرض الموظفات', en: 'View employees' },
  { key: 'employees.write', ar: 'إدارة الموظفات', en: 'Manage employees' },
  { key: 'inventory.read', ar: 'عرض المخزون', en: 'View inventory' },
  { key: 'inventory.write', ar: 'إدارة المخزون', en: 'Manage inventory' },
  { key: 'accounting.read', ar: 'عرض المحاسبة', en: 'View accounting' },
  { key: 'accounting.write', ar: 'إدارة المحاسبة', en: 'Manage accounting' },
  { key: 'reports.read', ar: 'عرض التقارير', en: 'View reports' },
  { key: 'pos', ar: 'نقطة البيع', en: 'Point of sale' },
  { key: 'loyalty', ar: 'برنامج الولاء', en: 'Loyalty' },
  { key: 'offers', ar: 'العروض', en: 'Offers' },
  { key: 'attendance', ar: 'الحضور والانصراف', en: 'Attendance' },
  { key: 'purchases', ar: 'المشتريات', en: 'Purchases' },
  { key: 'suppliers', ar: 'الموردون', en: 'Suppliers' },
  { key: 'shifts.read', ar: 'عرض الورديات', en: 'View shifts' },
  { key: 'shifts.write', ar: 'إدارة الورديات', en: 'Manage shifts' },
  { key: 'notifications', ar: 'الإشعارات', en: 'Notifications' },
  { key: 'memberships', ar: 'العضويات والباقات', en: 'Memberships' },
  { key: 'giftcards', ar: 'بطاقات الهدايا', en: 'Gift cards' },
  { key: 'campaigns', ar: 'الحملات التسويقية', en: 'Marketing campaigns' },
  { key: 'users', ar: 'إدارة المستخدمين', en: 'Manage users' },
  { key: 'settings', ar: 'الإعدادات', en: 'Settings' },
  { key: 'backup', ar: 'النسخ الاحتياطي', en: 'Backup' },
  { key: 'cost.view', ar: 'عرض التكاليف والعمولات', en: 'View costs & commissions' },
];

const userSelect = {
  id: true,
  username: true,
  role: true,
  permissions: true,
  employeeId: true,
  isActive: true,
  createdAt: true,
  employee: {
    select: {
      id: true,
      nameAr: true,
      nameEn: true,
    },
  },
} satisfies Prisma.UserSelect;

export interface UserCreateData {
  username: string;
  password: string;
  role: UserRole;
  employeeId?: number | null;
  permissions?: string[];
  isActive?: boolean;
}

export interface UserUpdateData {
  username?: string;
  password?: string;
  role?: UserRole;
  employeeId?: number | null;
  permissions?: string[];
  isActive?: boolean;
}

async function list() {
  return prisma.user.findMany({
    select: userSelect,
    orderBy: { id: 'asc' },
  });
}

async function create(data: UserCreateData) {
  const existing = await prisma.user.findUnique({ where: { username: data.username } });
  if (existing) {
    throw new ApiError(400, 'اسم المستخدم مستخدم مسبقاً');
  }

  if (data.employeeId) {
    const employee = await prisma.employee.findUnique({ where: { id: data.employeeId } });
    if (!employee) {
      throw new ApiError(404, 'الموظفة غير موجودة');
    }
  }

  const passwordHash = await bcrypt.hash(data.password, 10);

  // Cashier shift control is core to these roles — grant it by default so
  // receptionists/stylists can open & close their own drawer shifts.
  const roleDefaults =
    data.role === 'RECEPTIONIST' || data.role === 'STYLIST'
      ? ['shifts.read', 'shifts.write']
      : [];
  const permissions = Array.from(new Set([...roleDefaults, ...(data.permissions ?? [])]));

  return prisma.user.create({
    data: {
      username: data.username,
      passwordHash,
      role: data.role,
      employeeId: data.employeeId ?? null,
      permissions,
      isActive: data.isActive ?? true,
    },
    select: userSelect,
  });
}

async function update(id: number, data: UserUpdateData, selfUserId?: number) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new ApiError(404, 'المستخدم غير موجود');
  }

  if (data.username !== undefined) {
    const duplicate = await prisma.user.findUnique({ where: { username: data.username } });
    if (duplicate && duplicate.id !== id) {
      throw new ApiError(400, 'اسم المستخدم مستخدم مسبقاً');
    }
  }

  if (data.employeeId !== undefined && data.employeeId !== null) {
    const employee = await prisma.employee.findUnique({ where: { id: data.employeeId } });
    if (!employee) {
      throw new ApiError(404, 'الموظفة غير موجودة');
    }
  }

  if (selfUserId === id && data.isActive === false) {
    throw new ApiError(400, 'لا يمكنك تعطيل حسابك الحالي');
  }

  const passwordHash = data.password ? await bcrypt.hash(data.password, 10) : undefined;

  return prisma.user.update({
    where: { id },
    data: {
      username: data.username,
      passwordHash,
      role: data.role,
      employeeId: data.employeeId !== undefined ? data.employeeId : undefined,
      permissions: data.permissions,
      isActive: data.isActive,
    },
    select: userSelect,
  });
}

export const usersService = { list, create, update, getPermissionDefs: () => PERMISSION_DEFS };