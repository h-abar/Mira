import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { ApiError } from '../../utils/ApiError';

export interface ServiceListParams {
  active?: string;
}

export const servicesService = {
  async list(params: ServiceListParams) {
    const where: Prisma.ServiceWhereInput = {};
    if (params.active === 'true') {
      where.isActive = true;
    } else if (params.active === 'false') {
      where.isActive = false;
    }
    return prisma.service.findMany({
      where,
      orderBy: { id: 'desc' },
    });
  },

  async getById(id: number) {
    const service = await prisma.service.findUnique({
      where: { id },
      include: {
        _count: { select: { appointments: true, invoiceItems: true } },
      },
    });
    if (!service) {
      throw new ApiError(404, 'Service not found.');
    }
    return service;
  },

  async create(data: Prisma.ServiceCreateInput) {
    return prisma.service.create({ data });
  },

  async update(id: number, data: Prisma.ServiceUpdateInput) {
    const exists = await prisma.service.findUnique({ where: { id } });
    if (!exists) {
      throw new ApiError(404, 'Service not found.');
    }
    return prisma.service.update({ where: { id }, data });
  },

  async remove(id: number) {
    const service = await prisma.service.findUnique({
      where: { id },
      include: {
        _count: { select: { appointments: true, invoiceItems: true } },
      },
    });
    if (!service) {
      throw new ApiError(404, 'Service not found.');
    }
    if (service._count.appointments > 0 || service._count.invoiceItems > 0) {
      throw new ApiError(400, 'Cannot delete service in use');
    }
    return prisma.service.delete({ where: { id } });
  },

  /**
   * Rename a category across every service that uses it, cascade to its
   * children paths (`Parent > Child`), and update SERVICES_CATEGORIES.
   */
  async renameCategory(from: string, to: string) {
    const f = from.trim();
    const t = to.trim();
    if (!f || !t || f === t) {
      throw new ApiError(400, 'Provide different "from" and "to" category names.');
    }

    // Exact matches
    let count = (await prisma.service.updateMany({
      where: { category: f },
      data: { category: t },
    })).count;

    // Cascade to descendant paths: "f > x" -> "t > x"
    const children = await prisma.service.findMany({
      where: { category: { startsWith: `${f} > ` } },
      select: { id: true, category: true },
    });
    for (const child of children) {
      await prisma.service.update({
        where: { id: child.id },
        data: { category: `${t}${child.category.slice(f.length)}` },
      });
      count += 1;
    }

    const setting = await prisma.setting.findUnique({ where: { key: 'SERVICES_CATEGORIES' } });
    if (setting) {
      const mapPath = (c: string) =>
        c === f ? t : c.startsWith(`${f} > `) ? `${t}${c.slice(f.length)}` : c;
      const list = setting.value.split(',').map((c) => c.trim()).filter(Boolean);
      const next = Array.from(new Set(list.map(mapPath)));
      await prisma.setting.update({
        where: { key: 'SERVICES_CATEGORIES' },
        data: { value: next.join(',') },
      });
    }
    return { renamedServices: count };
  },

  async listCategories(): Promise<string[]> {
    const rows = await prisma.service.findMany({
      select: { category: true },
      distinct: ['category'],
    });
    return rows.map((r) => r.category).filter(Boolean).sort();
  },
};