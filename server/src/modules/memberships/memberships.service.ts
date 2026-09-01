import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { ApiError } from '../../utils/ApiError';

export interface PlanCreateInput {
  nameAr: string;
  nameEn: string;
  price: number;
  durationDays: number;
  serviceIds: number[];
  discountPercent?: number;
}

export interface AssignInput {
  clientId: number;
  planId: number;
}

export interface MembershipListFilters {
  planId?: number;
  status?: string;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

async function listPlans() {
  const plans = await prisma.membershipPlan.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { memberships: true } } },
  });
  return plans.map((plan) => ({ ...plan, membersCount: plan._count.memberships }));
}

async function createPlan(data: PlanCreateInput) {
  return prisma.membershipPlan.create({
    data: {
      nameAr: data.nameAr,
      nameEn: data.nameEn,
      price: data.price,
      durationDays: data.durationDays,
      serviceIds: data.serviceIds ?? [],
      discountPercent: data.discountPercent ?? 0,
    },
  });
}

async function updatePlan(id: number, data: Partial<PlanCreateInput>) {
  const exists = await prisma.membershipPlan.findUnique({ where: { id } });
  if (!exists) {
    throw new ApiError(404, 'Membership plan not found.');
  }
  return prisma.membershipPlan.update({
    where: { id },
    data: {
      ...(data.nameAr !== undefined ? { nameAr: data.nameAr } : {}),
      ...(data.nameEn !== undefined ? { nameEn: data.nameEn } : {}),
      ...(data.price !== undefined ? { price: data.price } : {}),
      ...(data.durationDays !== undefined ? { durationDays: data.durationDays } : {}),
      ...(data.serviceIds !== undefined ? { serviceIds: data.serviceIds } : {}),
      ...(data.discountPercent !== undefined ? { discountPercent: data.discountPercent } : {}),
    },
  });
}

async function removePlan(id: number) {
  const exists = await prisma.membershipPlan.findUnique({ where: { id } });
  if (!exists) {
    throw new ApiError(404, 'Membership plan not found.');
  }
  await prisma.membershipPlan.delete({ where: { id } });
  return { id };
}

async function assign(data: AssignInput) {
  const [client, plan] = await Promise.all([
    prisma.client.findUnique({ where: { id: data.clientId } }),
    prisma.membershipPlan.findUnique({ where: { id: data.planId } }),
  ]);
  if (!client) {
    throw new ApiError(404, 'Client not found.');
  }
  if (!plan) {
    throw new ApiError(404, 'Membership plan not found.');
  }

  if (!plan.isActive) {
    throw new ApiError(400, 'الباقة غير نشطة.');
  }

  const now = new Date();
  const active = await prisma.clientMembership.findFirst({
    where: {
      clientId: data.clientId,
      status: 'ACTIVE',
      endDate: { gte: now },
    },
  });
  if (active) {
    throw new ApiError(400, 'العميلة لديها عضوية نشطة بالفعل. ألغِ العضوية الحالية أو انتظر انتهاءها.');
  }

  return prisma.clientMembership.create({
    data: {
      clientId: data.clientId,
      planId: data.planId,
      startDate: now,
      endDate: addDays(now, plan.durationDays),
      status: 'ACTIVE',
    },
    include: { client: true, plan: true },
  });
}

async function listMemberships(filters: MembershipListFilters = {}) {
  const where: Prisma.ClientMembershipWhereInput = {};
  if (filters.planId !== undefined && Number.isInteger(filters.planId)) {
    where.planId = filters.planId;
  }
  if (filters.status) {
    where.status = filters.status as Prisma.EnumMembershipStatusFilter['equals'];
  }

  const memberships = await prisma.clientMembership.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: { client: true, plan: true },
  });

  const now = new Date();
  const updated: typeof memberships = [];
  for (const membership of memberships) {
    if (membership.status === 'ACTIVE' && now > new Date(membership.endDate)) {
      const expired = await prisma.clientMembership.update({
        where: { id: membership.id },
        data: { status: 'EXPIRED' },
        include: { client: true, plan: true },
      });
      updated.push(expired);
    } else {
      updated.push(membership);
    }
  }

  return updated.map((m) => ({ ...m, remainingDays: m.status === 'ACTIVE' ? Math.max(0, Math.ceil((new Date(m.endDate).getTime() - now.getTime()) / 86400000)) : 0 }));
}

async function cancelMembership(id: number) {
  const exists = await prisma.clientMembership.findUnique({ where: { id } });
  if (!exists) {
    throw new ApiError(404, 'Membership not found.');
  }
  return prisma.clientMembership.update({
    where: { id },
    data: { status: 'CANCELLED' },
    include: { client: true, plan: true },
  });
}

export const membershipsService = {
  listPlans,
  createPlan,
  updatePlan,
  removePlan,
  assign,
  listMemberships,
  cancelMembership,
};