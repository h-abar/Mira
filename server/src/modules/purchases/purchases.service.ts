import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { ApiError } from '../../utils/ApiError';

type PaymentMethod = 'CASH' | 'CARD' | 'WALLET';
type PurchaseStatus = 'PENDING' | 'RECEIVED' | 'CANCELLED';

export interface PurchaseItemInput {
  productId?: number;
  productName?: string;
  quantity: number;
  unitCost: number;
}

export interface PurchaseCreateInput {
  supplierId?: number;
  items: PurchaseItemInput[];
  discount?: number;
  paymentMethod?: PaymentMethod;
  notes?: string;
}

export interface PurchaseListQuery {
  supplierId?: number;
  status?: PurchaseStatus;
  from?: Date;
  to?: Date;
  page?: number;
  limit?: number;
}

const round2 = (value: number): number => Math.round((value + Number.EPSILON) * 100) / 100;

// Mirrors the invoice number generator in accounting.service.ts.
function generateOrderNo(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `PO-${y}${m}${d}-${rand}`;
}

const purchaseIncludes = {
  supplier: {
    select: { id: true, name: true, phone: true },
  },
  creator: {
    select: { id: true, username: true },
  },
  items: {
    include: {
      product: { select: { id: true, nameAr: true, nameEn: true, barcode: true } },
    },
  },
  _count: {
    select: { items: true },
  },
} satisfies Prisma.PurchaseOrderInclude;

async function createPurchase(input: PurchaseCreateInput, userId: number) {
  if (input.supplierId) {
    const supplier = await prisma.supplier.findUnique({
      where: { id: input.supplierId },
    });
    if (!supplier) {
      throw new ApiError(404, 'المورد غير موجود');
    }
  }

  const productIds = input.items
    .filter((item) => item.productId)
    .map((item) => item.productId as number);
  const products =
    productIds.length > 0
      ? await prisma.product.findMany({ where: { id: { in: productIds } } })
      : [];
  const productMap = new Map(products.map((product) => [product.id, product]));

  const itemRows: Prisma.PurchaseOrderItemCreateWithoutPurchaseOrderInput[] = [];
  let subtotal = 0;

  for (const raw of input.items) {
    const quantity = Number(raw.quantity);
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new ApiError(400, 'الكمية يجب أن تكون عدداً صحيحاً موجباً');
    }
    const unitCost = round2(Number(raw.unitCost) || 0);
    const lineTotal = round2(unitCost * quantity);
    subtotal += lineTotal;

    const fallbackName = (raw.productName || '').trim();
    if (raw.productId) {
      const product = productMap.get(raw.productId);
      if (!product) {
        throw new ApiError(400, `المنتج بالمعرّف ${raw.productId} غير موجود`);
      }
      itemRows.push({
        product: { connect: { id: product.id } },
        productName: fallbackName || `${product.nameAr} / ${product.nameEn}`,
        quantity,
        unitCost,
        lineTotal,
      });
    } else {
      if (!fallbackName) {
        throw new ApiError(400, 'اسم المنتج مطلوب للعناصر الحرة');
      }
      itemRows.push({
        productName: fallbackName,
        quantity,
        unitCost,
        lineTotal,
      });
    }
  }

  const subtotalValue = round2(subtotal);
  const discount = round2(Number(input.discount) || 0);
  if (discount > subtotalValue) {
    throw new ApiError(400, 'الخصم لا يمكن أن يتجاوز الإجمالي الفرعي');
  }
  const total = round2(subtotalValue - discount);
  const orderNo = generateOrderNo(new Date());

  return prisma.purchaseOrder.create({
    data: {
      orderNo,
      supplierId: input.supplierId,
      date: new Date(),
      status: 'PENDING',
      subtotal: subtotalValue,
      discount,
      total,
      paymentMethod: input.paymentMethod ?? 'CASH',
      notes: input.notes || null,
      createdBy: userId,
      items: { create: itemRows },
    },
    include: purchaseIncludes,
  });
}

async function listPurchases(query: PurchaseListQuery) {
  const page = query.page && query.page > 0 ? query.page : 1;
  const limit = query.limit && query.limit > 0 ? Math.min(query.limit, 100) : 20;

  const where: Prisma.PurchaseOrderWhereInput = {};

  if (query.supplierId) {
    where.supplierId = query.supplierId;
  }
  if (query.status) {
    where.status = query.status;
  }
  if (query.from || query.to) {
    const dateFilter: Prisma.DateTimeFilter = {};
    if (query.from) {
      const d = new Date(query.from);
      d.setHours(0, 0, 0, 0);
      dateFilter.gte = d;
    }
    if (query.to) {
      const d = new Date(query.to);
      d.setHours(23, 59, 59, 999);
      dateFilter.lte = d;
    }
    where.date = dateFilter;
  }

  const [total, items] = await prisma.$transaction([
    prisma.purchaseOrder.count({ where }),
    prisma.purchaseOrder.findMany({
      where,
      include: purchaseIncludes,
      orderBy: { date: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return { items, total, page, limit };
}

async function getPurchase(id: number) {
  const order = await prisma.purchaseOrder.findUnique({
    where: { id },
    include: purchaseIncludes,
  });
  if (!order) {
    throw new ApiError(404, 'أمر الشراء غير موجود');
  }
  return order;
}

async function receivePurchase(id: number, userId: number) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.purchaseOrder.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!order) {
      throw new ApiError(404, 'أمر الشراء غير موجود');
    }
    if (order.status === 'RECEIVED') {
      throw new ApiError(400, 'تم استلام أمر الشراء بالفعل');
    }
    if (order.status === 'CANCELLED') {
      throw new ApiError(400, 'لا يمكن استلام أمر شراء ملغي');
    }

    // Increase stock + record movements for every linked product.
    for (const item of order.items) {
      if (!item.productId) {
        continue;
      }
      await tx.product.update({
        where: { id: item.productId },
        data: { quantity: { increment: item.quantity } },
      });
      await tx.stockMovement.create({
        data: {
          productId: item.productId,
          type: 'IN',
          quantity: item.quantity,
          date: order.date,
          referenceId: order.orderNo,
        },
      });
    }

    // Purchases flow into accounting as an expense row.
    await tx.expense.create({
      data: {
        date: order.date,
        category: 'مشتريات',
        amount: Number(order.total),
        description: `أمر شراء ${order.orderNo}`,
        createdBy: userId,
        shiftSessionId: null,
      },
    });

    return tx.purchaseOrder.update({
      where: { id },
      data: { status: 'RECEIVED' },
      include: purchaseIncludes,
    });
  });
}

async function cancelPurchase(id: number) {
  const order = await prisma.purchaseOrder.findUnique({ where: { id } });
  if (!order) {
    throw new ApiError(404, 'أمر الشراء غير موجود');
  }
  if (order.status !== 'PENDING') {
    throw new ApiError(400, 'يمكن إلغاء أمر الشراء فقط عندما يكون معلقاً');
  }

  return prisma.purchaseOrder.update({
    where: { id },
    data: { status: 'CANCELLED' },
    include: purchaseIncludes,
  });
}

export const purchasesService = {
  createPurchase,
  listPurchases,
  getPurchase,
  receivePurchase,
  cancelPurchase,
};