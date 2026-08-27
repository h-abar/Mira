import { prisma } from '../../config/database';
import { ApiError } from '../../utils/ApiError';

export interface GiftCardCreateInput {
  initialValue: number;
  clientId?: number;
  expiresAt?: Date;
}

export interface GiftCardUpdateInput {
  balance?: number;
  status?: 'ACTIVE' | 'REDEEMED' | 'CANCELLED';
}

function generateCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 12; i += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
    if (i === 3 || i === 7) code += '-';
  }
  return code;
}

async function list(query: { q?: string; page?: number; limit?: number }) {
  const page = query.page && query.page > 0 ? query.page : 1;
  const limit = query.limit && query.limit > 0 ? Math.min(query.limit, 100) : 20;
  const q = query.q?.trim();

  const where = q
    ? {
        OR: [
          { code: { contains: q, mode: 'insensitive' as const } },
          { client: { name: { contains: q, mode: 'insensitive' as const } } },
        ],
      }
    : {};

  const [items, total] = await Promise.all([
    prisma.giftCard.findMany({
      where,
      include: { client: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.giftCard.count({ where }),
  ]);

  return { items, total, page, limit };
}

async function create(data: GiftCardCreateInput) {
  if (data.clientId) {
    const client = await prisma.client.findUnique({ where: { id: data.clientId } });
    if (!client) {
      throw new ApiError(404, 'Client not found.');
    }
  }
  return prisma.giftCard.create({
    data: {
      code: generateCode(),
      balance: data.initialValue,
      initialValue: data.initialValue,
      clientId: data.clientId ?? null,
      expiresAt: data.expiresAt ?? null,
      status: 'ACTIVE',
    },
    include: { client: { select: { id: true, name: true } } },
  });
}

async function update(id: number, data: GiftCardUpdateInput) {
  const exists = await prisma.giftCard.findUnique({ where: { id } });
  if (!exists) {
    throw new ApiError(404, 'Gift card not found.');
  }
  return prisma.giftCard.update({
    where: { id },
    data: {
      ...(data.balance !== undefined ? { balance: data.balance } : {}),
      ...(data.status !== undefined ? { status: data.status } : {}),
    },
    include: { client: { select: { id: true, name: true } } },
  });
}

async function remove(id: number) {
  const exists = await prisma.giftCard.findUnique({ where: { id } });
  if (!exists) {
    throw new ApiError(404, 'Gift card not found.');
  }
  await prisma.giftCard.delete({ where: { id } });
  return { id };
}

async function findByCode(code: string) {
  const card = await prisma.giftCard.findFirst({
    where: { code: { equals: code, mode: 'insensitive' } },
  });
  if (!card) {
    throw new ApiError(404, 'Gift card not found.');
  }
  return card;
}

export const giftCardsService = {
  list,
  create,
  update,
  remove,
  findByCode,
};