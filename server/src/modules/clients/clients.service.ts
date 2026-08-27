import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { ApiError } from '../../utils/ApiError';

export interface ClientListParams {
  q?: string;
  page?: number;
  limit?: number;
}

export const clientsService = {
  async list(params: ClientListParams) {
    const q = params.q?.trim();
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;

    const where: Prisma.ClientWhereInput = q
      ? {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { phone: { contains: q, mode: 'insensitive' } },
            { whatsapp: { contains: q, mode: 'insensitive' } },
            { email: { contains: q, mode: 'insensitive' } },
          ],
        }
      : {};

    const [items, total] = await Promise.all([
      prisma.client.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.client.count({ where }),
    ]);

    const ids = items.map((client) => client.id);
    let stats: {
      clientId: number;
      visitCount: number;
      lastVisitAt: Date | null;
    }[] = [];
    if (ids.length > 0) {
      const aggregated = await prisma.invoice.groupBy({
        by: ['clientId'],
        where: { clientId: { in: ids }, status: { not: 'CANCELLED' } },
        _count: { _all: true },
        _max: { date: true },
      });
      stats = aggregated.map((row) => ({
        clientId: row.clientId,
        visitCount: row._count._all,
        lastVisitAt: row._max.date,
      }));
    }
    const statsMap = new Map(stats.map((s) => [s.clientId, s]));

    const enriched = items.map((client) => {
      const stat = statsMap.get(client.id);
      return {
        ...client,
        visitCount: stat?.visitCount ?? 0,
        lastVisitAt: stat?.lastVisitAt ?? null,
      };
    });

    return { items: enriched, total, page, limit };
  },

  async getById(id: number) {
    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        appointments: {
          orderBy: { date: 'desc' },
          include: { service: true },
        },
        invoices: { orderBy: { date: 'desc' } },
      },
    });
    if (!client) {
      throw new ApiError(404, 'Client not found.');
    }

    const [invoiceAgg, serviceAgg] = await Promise.all([
      prisma.invoice.aggregate({
        where: { clientId: id, status: { not: 'CANCELLED' } },
        _count: { _all: true },
        _max: { date: true },
      }),
      prisma.invoiceItem.groupBy({
        by: ['serviceId'],
        where: { serviceId: { not: null }, invoice: { clientId: id, status: { not: 'CANCELLED' } } },
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 1,
      }),
    ]);

    let favoriteService = null;
    if (serviceAgg.length > 0 && serviceAgg[0].serviceId) {
      const service = await prisma.service.findUnique({
        where: { id: serviceAgg[0].serviceId },
        select: { id: true, nameAr: true, nameEn: true },
      });
      favoriteService = service;
    }

    return {
      ...client,
      visitCount: invoiceAgg._count._all,
      lastVisitAt: invoiceAgg._max.date,
      favoriteService,
    };
  },

  async create(data: Prisma.ClientCreateInput) {
    return prisma.client.create({ data });
  },

  async update(id: number, data: Prisma.ClientUpdateInput) {
    const exists = await prisma.client.findUnique({ where: { id } });
    if (!exists) {
      throw new ApiError(404, 'Client not found.');
    }
    return prisma.client.update({ where: { id }, data });
  },

  async remove(id: number) {
    const exists = await prisma.client.findUnique({ where: { id } });
    if (!exists) {
      throw new ApiError(404, 'Client not found.');
    }
    return prisma.client.delete({ where: { id } });
  },
};