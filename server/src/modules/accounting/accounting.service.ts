import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { ApiError } from '../../utils/ApiError';
import {
  earnPointsForInvoice,
  getLoyaltySettings,
  redeemPointsForInvoice,
} from '../loyalty/loyalty.service';
import { validateOffer } from '../offers/offers.service';
import { computeMembershipDiscount } from '../memberships/membershipDiscount';

type PaymentMethod = 'CASH' | 'CARD' | 'WALLET' | 'ELECTRONIC' | 'BANK_TRANSFER';

export interface AppointmentInvoiceInput {
  appointmentId: number;
  discount: number;
  tax: number;
  tip?: number;
  paymentMethod: PaymentMethod;
  offerCode?: string;
  redeemPoints?: number;
  giftCardCode?: string;
  branchId?: number;
  bankReference?: string;
  bankName?: string;
}

export interface ManualInvoiceItemInput {
  serviceId?: number;
  productId?: number;
  employeeId?: number;
  description?: string;
  quantity: number;
  unitPrice?: number;
}

export interface ManualInvoiceInput {
  clientId: number;
  employeeId: number;
  discount: number;
  tax: number;
  tip?: number;
  paymentMethod: PaymentMethod;
  offerCode?: string;
  redeemPoints?: number;
  giftCardCode?: string;
  branchId?: number;
  bankReference?: string;
  bankName?: string;
  items: ManualInvoiceItemInput[];
}

export interface InvoiceListQuery {
  from?: Date;
  to?: Date;
  page?: number;
  limit?: number;
  clientId?: number;
  branchId?: number;
}

export interface ExpenseCreateInput {
  date?: Date;
  category: string;
  amount: number;
  description?: string;
}

export interface ExpenseListQuery {
  from?: Date;
  to?: Date;
  category?: string;
}

export interface SummaryResult {
  date: string;
  revenue: number;
  expenses: number;
  profit: number;
  invoicesCount: number;
  doneAppointments: number;
  commissions: number;
}

const round2 = (value: number): number => Math.round((value + Number.EPSILON) * 100) / 100;

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function generateInvoiceNo(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `INV-${y}${m}${d}-${rand}`;
}

const invoiceIncludes = {
  client: true,
  employee: true,
  items: { include: { service: true, product: true } },
  membershipPlan: true,
} satisfies Prisma.InvoiceInclude;

async function findActiveShiftSession(employeeId?: number): Promise<number | null> {
  if (employeeId) {
    const shift = await prisma.shiftSession.findFirst({
      where: { employeeId, status: 'OPEN' },
    });
    if (shift) return shift.id;
  }
  const generalShift = await prisma.shiftSession.findFirst({
    where: { status: 'OPEN' },
    orderBy: { startTime: 'desc' },
  });
  return generalShift?.id ?? null;
}

interface OfferAndRedeemResult {
  discount: number;
  total: number;
  offerCode?: string;
  pointsRedeemed: number;
  tip: number;
  giftCardUsed: number;
  giftCardId: number | null;
  membershipDiscount: number;
  membershipPlanId: number | null;
  membershipPlanName: string | null;
}

async function applyOfferAndRedeem(input: {
  clientId: number;
  subtotal: number;
  discount: number;
  tax: number;
  tip?: number;
  offerCode?: string;
  redeemPoints?: number;
  giftCardCode?: string;
  serviceIds?: number[];
  servicePrices?: Map<number, number>;
}): Promise<OfferAndRedeemResult> {
  let { discount } = input;
  let offerCode: string | undefined;

  // Apply membership discount first (on subtotal before other discounts)
  const membershipResult = await computeMembershipDiscount(
    input.clientId,
    input.subtotal,
    input.serviceIds ?? [],
    input.servicePrices ?? new Map(),
  );
  if (membershipResult.discount > 0) {
    discount = round2(discount + membershipResult.discount);
  }

  if (input.offerCode) {
    const offerResult = await validateOffer(input.offerCode, input.subtotal);
    if (!offerResult.valid || !offerResult.offer) {
      throw new ApiError(400, offerResult.message ?? 'Offer is not valid.');
    }
    offerCode = offerResult.offer.code;
    discount = round2(discount + (offerResult.discount ?? 0));
  }

  const tip = round2(Number(input.tip) || 0);
  let total = round2(input.subtotal - discount + input.tax + tip);
  let pointsRedeemed = 0;

  const redeemPoints = Number(input.redeemPoints) || 0;
  if (redeemPoints > 0) {
    const client = await prisma.client.findUnique({
      where: { id: input.clientId },
      select: { loyaltyPoints: true },
    });
    if (!client || client.loyaltyPoints < redeemPoints) {
      throw new ApiError(400, 'Insufficient loyalty points.');
    }
    const settings = await getLoyaltySettings();
    const redeemValue = round2(Math.min(redeemPoints * settings.pointValue, total));
    total = round2(total - redeemValue);
    pointsRedeemed = redeemPoints;
  }

  let giftCardUsed = 0;
  let giftCardId: number | null = null;
  if (input.giftCardCode) {
    const card = await prisma.giftCard.findFirst({
      where: { code: { equals: input.giftCardCode, mode: 'insensitive' } },
    });
    if (!card) {
      throw new ApiError(404, 'Gift card not found.');
    }
    if (card.status !== 'ACTIVE' || Number(card.balance) <= 0) {
      throw new ApiError(400, 'Gift card is not active or has no balance.');
    }
    giftCardUsed = round2(Math.min(Number(card.balance), total));
    total = round2(total - giftCardUsed);
    giftCardId = card.id;
  }

  if (total < 0) {
    total = 0;
  }

  return {
    discount,
    total,
    offerCode,
    pointsRedeemed,
    tip,
    giftCardUsed,
    giftCardId,
    membershipDiscount: membershipResult.discount,
    membershipPlanId: membershipResult.membershipPlanId,
    membershipPlanName: membershipResult.membershipPlanName,
  };
}

async function createInvoiceFromAppointment(input: AppointmentInvoiceInput) {
  const appointment = await prisma.appointment.findUnique({
    where: { id: input.appointmentId },
    include: { service: true, employee: true, client: true },
  });

  if (!appointment) {
    throw new ApiError(404, 'Appointment not found.');
  }
  if (appointment.status === 'CANCELLED') {
    throw new ApiError(400, 'Cannot create an invoice for a cancelled appointment.');
  }

  const unitPrice = round2(Number(appointment.service.price));
  const subtotal = round2(unitPrice);
  const tax = round2(Number(input.tax) || 0);
  const offerAndRedeem = await applyOfferAndRedeem({
    clientId: appointment.clientId,
    subtotal,
    discount: round2(Number(input.discount) || 0),
    tax,
    tip: input.tip,
    offerCode: input.offerCode,
    redeemPoints: input.redeemPoints,
    giftCardCode: input.giftCardCode,
    serviceIds: [appointment.serviceId],
    servicePrices: new Map([[appointment.serviceId, unitPrice]]),
  });
  const invoiceNo = generateInvoiceNo(new Date());
  const shiftSessionId = await findActiveShiftSession(appointment.employeeId);

  const invoice = await prisma.$transaction(async (tx) => {
    const created = await tx.invoice.create({
      data: {
        invoiceNo,
        clientId: appointment.clientId,
        employeeId: appointment.employeeId,
        shiftSessionId,
        branchId: input.branchId ?? null,
        subtotal,
        discount: offerAndRedeem.discount,
        tax,
        tip: offerAndRedeem.tip,
        giftCardId: offerAndRedeem.giftCardId,
        giftCardAmount: offerAndRedeem.giftCardUsed,
        total: offerAndRedeem.total,
        offerCode: offerAndRedeem.offerCode,
        pointsRedeemed: offerAndRedeem.pointsRedeemed,
        paymentMethod: input.paymentMethod,
        bankReference: input.bankReference ?? null,
        bankName: input.bankName ?? null,
        membershipPlanId: offerAndRedeem.membershipPlanId,
        membershipDiscount: offerAndRedeem.membershipDiscount,
        status: 'PAID',
        items: {
          create: [
            {
              serviceId: appointment.serviceId,
              description: `${appointment.service.nameAr} / ${appointment.service.nameEn}`,
              quantity: 1,
              unitPrice,
              lineTotal: subtotal,
            },
          ],
        },
      },
      include: invoiceIncludes,
    });

    await tx.client.update({
      where: { id: appointment.clientId },
      data: { totalSpent: { increment: offerAndRedeem.total } },
    });

    if (offerAndRedeem.giftCardId) {
      await tx.giftCard.update({
        where: { id: offerAndRedeem.giftCardId },
        data: { balance: { decrement: offerAndRedeem.giftCardUsed } },
      });
    }

    await tx.appointment.update({
      where: { id: appointment.id },
      data: { status: 'DONE' },
    });

    let pointsEarned = 0;
    if (offerAndRedeem.pointsRedeemed > 0) {
      await redeemPointsForInvoice(
        appointment.clientId,
        offerAndRedeem.pointsRedeemed,
        invoiceNo,
        tx,
      );
    }
    pointsEarned = await earnPointsForInvoice(appointment.clientId, offerAndRedeem.total, invoiceNo, tx);
    if (pointsEarned > 0) {
      await tx.invoice.update({
        where: { id: created.id },
        data: { pointsEarned },
      });
    }

    return { ...created, pointsEarned };
  });

  return invoice;
}

async function createInvoiceManual(input: ManualInvoiceInput) {
  const serviceIds = input.items
    .filter((item) => item.serviceId)
    .map((item) => item.serviceId as number);
  const productIds = input.items
    .filter((item) => item.productId)
    .map((item) => item.productId as number);

  const [services, products, client, employee] = await Promise.all([
    serviceIds.length > 0
      ? prisma.service.findMany({ where: { id: { in: serviceIds } } })
      : Promise.resolve([]),
    productIds.length > 0
      ? prisma.product.findMany({ where: { id: { in: productIds } } })
      : Promise.resolve([]),
    prisma.client.findUnique({ where: { id: input.clientId } }),
    prisma.employee.findUnique({ where: { id: input.employeeId } }),
  ]);

  if (!client) {
    throw new ApiError(404, 'Client not found.');
  }
  if (!employee) {
    throw new ApiError(404, 'Employee not found.');
  }

  const serviceMap = new Map(services.map((service) => [service.id, service]));
  const productMap = new Map(products.map((product) => [product.id, product]));

  // Validate per-item employees (a service can be performed by one person
  // for the whole invoice or by different people per item).
  const itemEmployeeIds = [
    ...new Set(input.items.filter((it) => it.employeeId).map((it) => it.employeeId as number)),
  ];
  if (itemEmployeeIds.length > 0) {
    const found = await prisma.employee.findMany({
      where: { id: { in: itemEmployeeIds } },
      select: { id: true },
    });
    const foundIds = new Set(found.map((e) => e.id));
    for (const id of itemEmployeeIds) {
      if (!foundIds.has(id)) {
        throw new ApiError(400, `Employee with id ${id} not found.`);
      }
    }
  }

  const itemRows: {
    service?: { connect: { id: number } };
    product?: { connect: { id: number } };
    employee?: { connect: { id: number } };
    description: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }[] = [];
  const productDeductions: { productId: number; quantity: number }[] = [];
  let subtotal = 0;

  for (const raw of input.items) {
    const quantity = Number(raw.quantity);
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new ApiError(400, 'Item quantity must be a positive integer.');
    }

    if (raw.serviceId) {
      const service = serviceMap.get(raw.serviceId);
      if (!service) {
        throw new ApiError(400, `Service with id ${raw.serviceId} not found.`);
      }
      const unitPrice = round2(Number(raw.unitPrice ?? service.price));
      const lineTotal = round2(unitPrice * quantity);
      subtotal += lineTotal;
      itemRows.push({
        service: { connect: { id: service.id } },
        ...(raw.employeeId ? { employee: { connect: { id: raw.employeeId } } } : {}),
        description: raw.description || `${service.nameAr} / ${service.nameEn}`,
        quantity,
        unitPrice,
        lineTotal,
      });
    } else if (raw.productId) {
      const product = productMap.get(raw.productId);
      if (!product) {
        throw new ApiError(400, `Product with id ${raw.productId} not found.`);
      }
      if (product.quantity < quantity) {
        throw new ApiError(
          400,
          `Insufficient stock for ${product.nameAr} / ${product.nameEn}. Available: ${product.quantity}.`,
        );
      }
      const unitPrice = round2(Number(raw.unitPrice ?? product.salePrice));
      const lineTotal = round2(unitPrice * quantity);
      subtotal += lineTotal;
      itemRows.push({
        product: { connect: { id: product.id } },
        ...(raw.employeeId ? { employee: { connect: { id: raw.employeeId } } } : {}),
        description: raw.description || `${product.nameAr} / ${product.nameEn}`,
        quantity,
        unitPrice,
        lineTotal,
      });
      productDeductions.push({ productId: product.id, quantity });
    } else {
      const unitPrice = round2(Number(raw.unitPrice ?? 0));
      const lineTotal = round2(unitPrice * quantity);
      subtotal += lineTotal;
      itemRows.push({
        ...(raw.employeeId ? { employee: { connect: { id: raw.employeeId } } } : {}),
        description: raw.description || 'Item',
        quantity,
        unitPrice,
        lineTotal,
      });
    }
  }

  if (itemRows.length === 0) {
    throw new ApiError(400, 'Invoice must contain at least one item.');
  }

  const subtotalValue = round2(subtotal);
  const tax = round2(Number(input.tax) || 0);

  // Build serviceIds and servicePrices for membership discount calculation
  const membershipServiceIds: number[] = [];
  const membershipServicePrices = new Map<number, number>();
  for (const raw of input.items) {
    if (raw.serviceId) {
      const service = serviceMap.get(raw.serviceId);
      if (service) {
        const unitPrice = round2(Number(raw.unitPrice ?? service.price));
        const lineTotal = round2(unitPrice * Number(raw.quantity));
        membershipServiceIds.push(raw.serviceId);
        membershipServicePrices.set(raw.serviceId, (membershipServicePrices.get(raw.serviceId) ?? 0) + lineTotal);
      }
    }
  }

  const offerAndRedeem = await applyOfferAndRedeem({
    clientId: input.clientId,
    subtotal: subtotalValue,
    discount: round2(Number(input.discount) || 0),
    tax,
    tip: input.tip,
    offerCode: input.offerCode,
    redeemPoints: input.redeemPoints,
    giftCardCode: input.giftCardCode,
    serviceIds: membershipServiceIds,
    servicePrices: membershipServicePrices,
  });
  const invoiceNo = generateInvoiceNo(new Date());
  const shiftSessionId = await findActiveShiftSession(input.employeeId);

  const invoice = await prisma.$transaction(async (tx) => {
    const created = await tx.invoice.create({
      data: {
        invoiceNo,
        clientId: input.clientId,
        employeeId: input.employeeId,
        shiftSessionId,
        branchId: input.branchId ?? null,
        subtotal: subtotalValue,
        discount: offerAndRedeem.discount,
        tax,
        tip: offerAndRedeem.tip,
        giftCardId: offerAndRedeem.giftCardId,
        giftCardAmount: offerAndRedeem.giftCardUsed,
        total: offerAndRedeem.total,
        offerCode: offerAndRedeem.offerCode,
        pointsRedeemed: offerAndRedeem.pointsRedeemed,
        paymentMethod: input.paymentMethod,
        bankReference: input.bankReference ?? null,
        bankName: input.bankName ?? null,
        membershipPlanId: offerAndRedeem.membershipPlanId,
        membershipDiscount: offerAndRedeem.membershipDiscount,
        status: 'PAID',
        items: { create: itemRows },
      },
      include: invoiceIncludes,
    });

    await tx.client.update({
      where: { id: input.clientId },
      data: { totalSpent: { increment: offerAndRedeem.total } },
    });

    if (offerAndRedeem.giftCardId) {
      await tx.giftCard.update({
        where: { id: offerAndRedeem.giftCardId },
        data: { balance: { decrement: offerAndRedeem.giftCardUsed } },
      });
    }

    for (const deduction of productDeductions) {
      await tx.product.update({
        where: { id: deduction.productId },
        data: { quantity: { decrement: deduction.quantity } },
      });
      await tx.stockMovement.create({
        data: {
          productId: deduction.productId,
          type: 'SALE',
          quantity: deduction.quantity,
          referenceId: invoiceNo,
        },
      });
    }

    let pointsEarned = 0;
    if (offerAndRedeem.pointsRedeemed > 0) {
      await redeemPointsForInvoice(
        input.clientId,
        offerAndRedeem.pointsRedeemed,
        invoiceNo,
        tx,
      );
    }
    pointsEarned = await earnPointsForInvoice(input.clientId, offerAndRedeem.total, invoiceNo, tx);
    if (pointsEarned > 0) {
      await tx.invoice.update({
        where: { id: created.id },
        data: { pointsEarned },
      });
    }

    return { ...created, pointsEarned };
  });

  return invoice;
}

async function listInvoices(query: InvoiceListQuery) {
  const page = query.page && query.page > 0 ? query.page : 1;
  const limit = query.limit && query.limit > 0 ? Math.min(query.limit, 100) : 20;

  const where: Prisma.InvoiceWhereInput = {};
  const dateFilter: Prisma.DateTimeFilter = {};
  if (query.from) {
    dateFilter.gte = startOfDay(query.from);
  }
  if (query.to) {
    dateFilter.lte = endOfDay(query.to);
  }
  if (query.from || query.to) {
    where.date = dateFilter;
  }
  if (query.clientId) {
    where.clientId = query.clientId;
  }
  if (query.branchId) {
    where.branchId = query.branchId;
  }

  const [total, items] = await prisma.$transaction([
    prisma.invoice.count({ where }),
    prisma.invoice.findMany({
      where,
      include: invoiceIncludes,
      orderBy: { date: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return { items, total, page, limit };
}

async function getInvoice(id: number) {
  const invoice = await prisma.invoice.findUnique({ where: { id }, include: invoiceIncludes });
  if (!invoice) {
    throw new ApiError(404, 'Invoice not found.');
  }
  return invoice;
}

async function createExpense(data: ExpenseCreateInput, userId: number) {
  const shiftSessionId = await findActiveShiftSession();

  return prisma.expense.create({
    data: {
      date: data.date ?? new Date(),
      category: data.category,
      amount: data.amount,
      description: data.description,
      createdBy: userId,
      shiftSessionId,
    },
    include: { creator: true },
  });
}

async function listExpenses(query: ExpenseListQuery) {
  const where: Prisma.ExpenseWhereInput = {};
  const dateFilter: Prisma.DateTimeFilter = {};
  if (query.from) {
    dateFilter.gte = startOfDay(query.from);
  }
  if (query.to) {
    dateFilter.lte = endOfDay(query.to);
  }
  if (query.from || query.to) {
    where.date = dateFilter;
  }
  if (query.category) {
    where.category = query.category;
  }

  return prisma.expense.findMany({
    where,
    include: { creator: true },
    orderBy: { date: 'desc' },
  });
}

async function updateExpense(id: number, data: Partial<ExpenseCreateInput>) {
  const exists = await prisma.expense.findUnique({ where: { id } });
  if (!exists) {
    throw new ApiError(404, 'Expense not found.');
  }
  return prisma.expense.update({ where: { id }, data });
}

async function removeExpense(id: number) {
  const exists = await prisma.expense.findUnique({ where: { id } });
  if (!exists) {
    throw new ApiError(404, 'Expense not found.');
  }
  await prisma.expense.delete({ where: { id } });
  return { id };
}

async function summary(date: Date): Promise<SummaryResult> {
  const from = startOfDay(date);
  const to = endOfDay(date);

  const [revenueAgg, expensesAgg, invoicesCount, doneAppointments, invoices] = await Promise.all([
    prisma.invoice.aggregate({
      _sum: { total: true },
      where: { date: { gte: from, lte: to }, status: 'PAID' },
    }),
    prisma.expense.aggregate({
      _sum: { amount: true },
      where: { date: { gte: from, lte: to } },
    }),
    prisma.invoice.count({ where: { date: { gte: from, lte: to } } }),
    prisma.appointment.count({ where: { status: 'DONE', date: { gte: from, lte: to } } }),
    prisma.invoice.findMany({
      where: { date: { gte: from, lte: to } },
      select: { subtotal: true, employee: { select: { commissionRate: true } } },
    }),
  ]);

  const revenue = round2(Number(revenueAgg._sum.total ?? 0));
  const expenses = round2(Number(expensesAgg._sum.amount ?? 0));
  const commissions = round2(
    invoices.reduce(
      (sum, invoice) => sum + Number(invoice.subtotal) * (Number(invoice.employee.commissionRate) / 100),
      0,
    ),
  );

  return {
    date: toDateString(date),
    revenue,
    expenses,
    profit: round2(revenue - expenses),
    invoicesCount,
    doneAppointments,
    commissions,
  };
}

async function cancelInvoice(id: number, reason?: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: { items: true, payments: true },
  });
  if (!invoice) {
    throw new ApiError(404, 'Invoice not found.');
  }
  if (invoice.status === 'CANCELLED') {
    throw new ApiError(400, 'Invoice is already cancelled.');
  }

  return prisma.$transaction(async (tx) => {
    // 1) Mark invoice as cancelled
    const updated = await tx.invoice.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: invoiceIncludes,
    });

    // 2) Reverse client totalSpent
    await tx.client.update({
      where: { id: invoice.clientId },
      data: { totalSpent: { decrement: Number(invoice.total) } },
    });

    // 3) Refund gift card balance if used
    if (invoice.giftCardId && Number(invoice.giftCardAmount) > 0) {
      await tx.giftCard.update({
        where: { id: invoice.giftCardId },
        data: { balance: { increment: Number(invoice.giftCardAmount) } },
      });
    }

    // 4) Restore redeemed loyalty points
    if (invoice.pointsRedeemed > 0) {
      await tx.client.update({
        where: { id: invoice.clientId },
        data: { loyaltyPoints: { increment: invoice.pointsRedeemed } },
      });
    }

    // 5) Deduct earned points
    if (invoice.pointsEarned > 0) {
      const client = await tx.client.findUnique({
        where: { id: invoice.clientId },
        select: { loyaltyPoints: true },
      });
      if (client) {
        const newPoints = Math.max(0, client.loyaltyPoints - invoice.pointsEarned);
        await tx.client.update({
          where: { id: invoice.clientId },
          data: { loyaltyPoints: newPoints },
        });
      }
    }

    // 6) Restore product stock for sold products
    for (const item of invoice.items) {
      if (item.productId) {
        await tx.product.update({
          where: { id: item.productId },
          data: { quantity: { increment: item.quantity } },
        });
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            type: 'IN',
            quantity: item.quantity,
            referenceId: `CANCEL-${invoice.invoiceNo}`,
          },
        });
      }
    }

    // 7) Refund all associated payments
    for (const payment of invoice.payments) {
      if (payment.status !== 'REFUNDED') {
        await tx.payment.update({
          where: { id: payment.id },
          data: { status: 'REFUNDED' },
        });
      }
    }

    return { ...updated, cancelReason: reason ?? null };
  });
}

export const accountingService = {
  createInvoiceFromAppointment,
  createInvoiceManual,
  listInvoices,
  getInvoice,
  cancelInvoice,
  createExpense,
  listExpenses,
  updateExpense,
  removeExpense,
  summary,
};