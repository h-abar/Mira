import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { ApiError } from '../../utils/ApiError';

export interface ListProductsParams {
  q?: string;
  lowStock?: boolean;
  category?: string;
  branchId?: number;
}

export interface ProductCreateData {
  nameAr: string;
  nameEn: string;
  barcode?: string;
  category: string;
  quantity?: number;
  unit?: string;
  costPrice?: number;
  salePrice?: number;
  minStock?: number;
  supplier?: string;
  branchId?: number | null;
}

export interface MovementCreateData {
  productId: number;
  type: 'IN' | 'SALE' | 'USAGE' | 'LOSS';
  quantity: number;
  date?: Date;
  referenceId?: string;
}

async function listProducts(params: ListProductsParams = {}) {
  const { q, lowStock, category, branchId } = params;

  const where: Prisma.ProductWhereInput = {};

  if (q) {
    where.OR = [
      { nameAr: { contains: q, mode: 'insensitive' } },
      { nameEn: { contains: q, mode: 'insensitive' } },
      { barcode: { contains: q, mode: 'insensitive' } },
    ];
  }

  if (category) {
    where.category = category;
  }

  if (branchId) {
    where.branchId = branchId;
  }

  const products = await prisma.product.findMany({
    where,
    include: {
      _count: { select: { movements: true } },
    },
    orderBy: { id: 'desc' },
  });

  if (lowStock) {
    return products.filter((product) => product.quantity <= product.minStock);
  }

  return products;
}

async function createProduct(data: ProductCreateData) {
  return prisma.product.create({ data });
}

async function updateProduct(id: number, data: Prisma.ProductUncheckedUpdateInput) {
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) {
    throw new ApiError(404, 'Product not found.');
  }

  return prisma.product.update({ where: { id }, data });
}

async function removeProduct(id: number) {
  const existing = await prisma.product.findUnique({
    where: { id },
    include: {
      _count: { select: { movements: true, invoiceItems: true } },
    },
  });

  if (!existing) {
    throw new ApiError(404, 'Product not found.');
  }

  if (existing._count.movements > 0 || existing._count.invoiceItems > 0) {
    throw new ApiError(400, 'Cannot delete product: it has related movements or invoices.');
  }

  return prisma.product.delete({ where: { id } });
}

async function addMovement(data: MovementCreateData) {
  const { productId, type, quantity, date, referenceId } = data;

  return prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({ where: { id: productId } });
    if (!product) {
      throw new ApiError(404, 'Product not found.');
    }

    const delta = type === 'IN' ? quantity : -quantity;
    const newQuantity = product.quantity + delta;

    if (newQuantity < 0) {
      throw new ApiError(400, 'Insufficient stock.');
    }

    await tx.product.update({
      where: { id: productId },
      data: { quantity: newQuantity },
    });

    return tx.stockMovement.create({
      data: {
        productId,
        type,
        quantity,
        date,
        referenceId,
      },
      include: { product: true },
    });
  });
}

async function listMovements(params: { productId?: number } = {}) {
  const { productId } = params;

  return prisma.stockMovement.findMany({
    where: productId ? { productId } : undefined,
    include: { product: true },
    orderBy: { date: 'desc' },
  });
}

export const inventoryService = {
  listProducts,
  createProduct,
  updateProduct,
  removeProduct,
  addMovement,
  listMovements,

  /**
   * Rename a category across every product that uses it, cascade to child
   * paths (`Parent > Child`), and keep INVENTORY_CATEGORIES in sync.
   */
  async renameCategory(from: string, to: string) {
    const f = from.trim();
    const t = to.trim();
    if (!f || !t || f === t) {
      throw new ApiError(400, 'Provide different "from" and "to" category names.');
    }

    let count = (await prisma.product.updateMany({
      where: { category: f },
      data: { category: t },
    })).count;

    const children = await prisma.product.findMany({
      where: { category: { startsWith: `${f} > ` } },
      select: { id: true, category: true },
    });
    for (const child of children) {
      await prisma.product.update({
        where: { id: child.id },
        data: { category: `${t}${child.category.slice(f.length)}` },
      });
      count += 1;
    }

    const setting = await prisma.setting.findUnique({ where: { key: 'INVENTORY_CATEGORIES' } });
    if (setting) {
      const mapPath = (c: string) =>
        c === f ? t : c.startsWith(`${f} > `) ? `${t}${c.slice(f.length)}` : c;
      const list = setting.value.split(',').map((c) => c.trim()).filter(Boolean);
      const next = Array.from(new Set(list.map(mapPath)));
      await prisma.setting.update({
        where: { key: 'INVENTORY_CATEGORIES' },
        data: { value: next.join(',') },
      });
    }
    return { renamedProducts: count };
  },

  async listCategories(): Promise<string[]> {
    const rows = await prisma.product.findMany({
      select: { category: true },
      distinct: ['category'],
    });
    return rows.map((r) => r.category).filter(Boolean).sort();
  },
};
