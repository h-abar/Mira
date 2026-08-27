import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { ApiError } from '../../utils/ApiError';

export interface BranchListQuery {
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface BranchCreateData {
  nameAr: string;
  nameEn: string;
  address?: string;
  phone?: string;
  isActive?: boolean;
}

const branchInclude = {
  _count: {
    select: {
      products: true,
      invoices: true,
      shiftSessions: true,
      users: true,
    },
  },
} satisfies Prisma.BranchInclude;

async function listBranches(query: BranchListQuery = {}) {
  const page = query.page && query.page > 0 ? query.page : 1;
  const limit = query.limit && query.limit > 0 ? Math.min(query.limit, 100) : 20;

  const where: Prisma.BranchWhereInput = {};
  if (query.isActive !== undefined) {
    where.isActive = query.isActive;
  }

  const [total, items] = await prisma.$transaction([
    prisma.branch.count({ where }),
    prisma.branch.findMany({
      where,
      include: branchInclude,
      orderBy: { id: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return { items, total, page, limit };
}

async function createBranch(data: BranchCreateData) {
  return prisma.branch.create({
    data: {
      nameAr: data.nameAr,
      nameEn: data.nameEn,
      address: data.address || null,
      phone: data.phone || null,
      isActive: data.isActive ?? true,
    },
    include: branchInclude,
  });
}

async function updateBranch(id: number, data: Partial<BranchCreateData>) {
  const existing = await prisma.branch.findUnique({ where: { id } });
  if (!existing) {
    throw new ApiError(404, 'الفرع غير موجود');
  }

  return prisma.branch.update({
    where: { id },
    data: {
      ...(data.nameAr !== undefined ? { nameAr: data.nameAr } : {}),
      ...(data.nameEn !== undefined ? { nameEn: data.nameEn } : {}),
      ...(data.address !== undefined ? { address: data.address || null } : {}),
      ...(data.phone !== undefined ? { phone: data.phone || null } : {}),
      ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
    },
    include: branchInclude,
  });
}

async function removeBranch(id: number) {
  const existing = await prisma.branch.findUnique({ where: { id } });
  if (!existing) {
    throw new ApiError(404, 'الفرع غير موجود');
  }
  if (!existing.isActive) {
    throw new ApiError(400, 'الفرع معطّل بالفعل');
  }

  await prisma.branch.update({
    where: { id },
    data: { isActive: false },
  });

  return {
    id,
    isActive: false,
    message: 'تم تعطيل الفرع بدلاً من الحذف للحفاظ على السجلات المرتبطة',
  };
}

async function getBranch(id: number) {
  const branch = await prisma.branch.findUnique({
    where: { id },
    include: branchInclude,
  });
  if (!branch) {
    throw new ApiError(404, 'الفرع غير موجود');
  }
  return branch;
}

export const branchesService = {
  listBranches,
  createBranch,
  updateBranch,
  removeBranch,
  getBranch,
};