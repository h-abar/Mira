import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { ApiError } from '../../utils/ApiError';

export interface SupplierListQuery {
  q?: string;
  active?: boolean;
  page?: number;
  limit?: number;
}

export interface SupplierCreateData {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  isActive?: boolean;
}

const supplierInclude = {
  _count: {
    select: {
      products: true,
      purchaseOrders: true,
    },
  },
} satisfies Prisma.SupplierInclude;

async function listSuppliers(query: SupplierListQuery) {
  const page = query.page && query.page > 0 ? query.page : 1;
  const limit = query.limit && query.limit > 0 ? Math.min(query.limit, 100) : 20;

  const where: Prisma.SupplierWhereInput = {};

  if (query.q) {
    where.OR = [
      { name: { contains: query.q, mode: 'insensitive' } },
      { phone: { contains: query.q, mode: 'insensitive' } },
    ];
  }
  if (query.active !== undefined) {
    where.isActive = query.active;
  }

  const [total, items] = await prisma.$transaction([
    prisma.supplier.count({ where }),
    prisma.supplier.findMany({
      where,
      include: supplierInclude,
      orderBy: { id: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return { items, total, page, limit };
}

async function createSupplier(data: SupplierCreateData) {
  return prisma.supplier.create({
    data: {
      name: data.name,
      phone: data.phone || null,
      email: data.email || null,
      address: data.address || null,
      notes: data.notes || null,
      isActive: data.isActive ?? true,
    },
    include: supplierInclude,
  });
}

async function updateSupplier(id: number, data: Partial<SupplierCreateData>) {
  const existing = await prisma.supplier.findUnique({ where: { id } });
  if (!existing) {
    throw new ApiError(404, 'المورد غير موجود');
  }

  return prisma.supplier.update({
    where: { id },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.phone !== undefined ? { phone: data.phone || null } : {}),
      ...(data.email !== undefined ? { email: data.email || null } : {}),
      ...(data.address !== undefined ? { address: data.address || null } : {}),
      ...(data.notes !== undefined ? { notes: data.notes || null } : {}),
      ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
    },
    include: supplierInclude,
  });
}

// Soft delete: suppliers referenced by products / purchase orders must be kept
// for historical integrity, so we deactivate instead of physically removing them.
async function removeSupplier(id: number) {
  const existing = await prisma.supplier.findUnique({
    where: { id },
    include: {
      _count: {
        select: { products: true, purchaseOrders: true },
      },
    },
  });
  if (!existing) {
    throw new ApiError(404, 'المورد غير موجود');
  }
  if (!existing.isActive) {
    throw new ApiError(400, 'المورد معطّل بالفعل');
  }

  await prisma.supplier.update({
    where: { id },
    data: { isActive: false },
  });

  return {
    id,
    isActive: false,
    message:
      existing._count.products > 0 || existing._count.purchaseOrders > 0
        ? 'تم تعطيل المورد بدلاً من الحذف لأنه مرتبط بمنتجات أو أوامر شراء'
        : 'تم تعطيل المورد',
  };
}

async function getSupplier(id: number) {
  const supplier = await prisma.supplier.findUnique({
    where: { id },
    include: supplierInclude,
  });
  if (!supplier) {
    throw new ApiError(404, 'المورد غير موجود');
  }
  return supplier;
}

export const suppliersService = {
  listSuppliers,
  createSupplier,
  updateSupplier,
  removeSupplier,
  getSupplier,
};