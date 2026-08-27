import { Prisma, PrismaClient } from '@prisma/client';
import { prisma } from '../../config/database';
import { ApiError } from '../../utils/ApiError';

const round2 = (val: number): number => Math.round((val + Number.EPSILON) * 100) / 100;

const DEFAULT_POINTS_PER_CURRENCY = 1;
const DEFAULT_POINT_VALUE = 0.1;

type DbClient = Prisma.TransactionClient | PrismaClient;

async function readSettingValue(key: string, fallback: number): Promise<number> {
  const setting = await prisma.setting.findUnique({ where: { key } });
  if (!setting) {
    return fallback;
  }
  const value = Number(setting.value);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

export interface LoyaltySettings {
  pointsPerCurrency: number;
  pointValue: number;
}

export async function getLoyaltySettings(): Promise<LoyaltySettings> {
  const [pointsPerCurrency, pointValue] = await Promise.all([
    readSettingValue('LOYALTY_POINTS_PER_CURRENCY', DEFAULT_POINTS_PER_CURRENCY),
    readSettingValue('LOYALTY_POINT_VALUE', DEFAULT_POINT_VALUE),
  ]);
  return { pointsPerCurrency, pointValue };
}

export async function earnPointsForInvoice(
  clientId: number,
  total: number,
  invoiceNo?: string,
  client: DbClient = prisma,
): Promise<number> {
  const found = await client.client.findUnique({
    where: { id: clientId },
    select: { loyaltyPoints: true },
  });
  if (!found) {
    throw new ApiError(404, 'Client not found.');
  }

  const settings = await getLoyaltySettings();
  const points = Math.floor(total * settings.pointsPerCurrency);
  if (points <= 0) {
    return 0;
  }

  const balanceAfter = found.loyaltyPoints + points;
  await client.client.update({
    where: { id: clientId },
    data: { loyaltyPoints: { increment: points } },
  });
  await client.loyaltyTransaction.create({
    data: {
      clientId,
      points,
      type: 'EARN',
      balanceAfter,
      referenceId: invoiceNo,
    },
  });

  return points;
}

export async function redeemPointsForInvoice(
  clientId: number,
  points: number,
  invoiceNo?: string,
  client: DbClient = prisma,
): Promise<number> {
  const found = await client.client.findUnique({
    where: { id: clientId },
    select: { loyaltyPoints: true },
  });
  if (!found) {
    throw new ApiError(404, 'Client not found.');
  }
  if (found.loyaltyPoints < points) {
    throw new ApiError(400, 'Insufficient loyalty points.');
  }

  const settings = await getLoyaltySettings();
  const balanceAfter = found.loyaltyPoints - points;
  await client.client.update({
    where: { id: clientId },
    data: { loyaltyPoints: { decrement: points } },
  });
  await client.loyaltyTransaction.create({
    data: {
      clientId,
      points,
      type: 'REDEEM',
      balanceAfter,
      referenceId: invoiceNo,
    },
  });

  return round2(points * settings.pointValue);
}

export interface AdjustPointsInput {
  type: 'EARN' | 'REDEEM';
  points: number;
  note?: string;
}

async function adjustClientPoints(clientId: number, input: AdjustPointsInput) {
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { loyaltyPoints: true },
  });
  if (!client) {
    throw new ApiError(404, 'Client not found.');
  }
  if (input.type === 'REDEEM' && client.loyaltyPoints < input.points) {
    throw new ApiError(400, 'Insufficient loyalty points.');
  }

  const balanceAfter =
    input.type === 'EARN'
      ? client.loyaltyPoints + input.points
      : client.loyaltyPoints - input.points;

  const [, transaction] = await prisma.$transaction([
    prisma.client.update({
      where: { id: clientId },
      data: { loyaltyPoints: balanceAfter },
    }),
    prisma.loyaltyTransaction.create({
      data: {
        clientId,
        points: input.points,
        type: input.type,
        balanceAfter,
        note: input.note,
      },
    }),
  ]);

  return transaction;
}

async function listClientTransactions(clientId: number, page: number, limit: number) {
  const where: Prisma.LoyaltyTransactionWhereInput = { clientId };

  const [total, items] = await prisma.$transaction([
    prisma.loyaltyTransaction.count({ where }),
    prisma.loyaltyTransaction.findMany({
      where,
      include: {
        client: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return { items, total, page, limit };
}

export const loyaltyService = {
  getLoyaltySettings,
  earnPointsForInvoice,
  redeemPointsForInvoice,
  adjustClientPoints,
  listClientTransactions,
};