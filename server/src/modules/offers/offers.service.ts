import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { ApiError } from '../../utils/ApiError';

const round2 = (val: number): number => Math.round((val + Number.EPSILON) * 100) / 100;

export interface OfferDateWindow {
  isActive: boolean;
  validFrom: Date | null;
  validTo: Date | null;
}

export function isOfferValid(offer: OfferDateWindow): boolean {
  const now = new Date();
  if (!offer.isActive) return false;
  if (offer.validFrom && now < new Date(offer.validFrom)) return false;
  if (offer.validTo && now > new Date(offer.validTo)) return false;
  return true;
}

export interface OfferValidateResult {
  valid: boolean;
  offer?: Prisma.OfferGetPayload<Record<string, never>>;
  discount?: number;
  message?: string;
}

export async function validateOffer(code: string, subtotal: number): Promise<OfferValidateResult> {
  const offer = await prisma.offer.findFirst({
    where: { code: { equals: code, mode: 'insensitive' } },
  });

  if (!offer) {
    return { valid: false, message: 'Offer code not found.' };
  }
  if (!offer.isActive) {
    return { valid: false, message: 'Offer is not active.' };
  }

  const now = new Date();
  if (offer.validFrom && now < new Date(offer.validFrom)) {
    return { valid: false, message: 'Offer has not started yet.' };
  }
  if (offer.validTo && now > new Date(offer.validTo)) {
    return { valid: false, message: 'Offer has expired.' };
  }

  const minTotal = Number(offer.minTotal);
  if (subtotal < minTotal) {
    return { valid: false, message: `Subtotal is below the minimum required (${minTotal}).` };
  }

  const value = Number(offer.value);
  const discount =
    offer.discountType === 'PERCENT'
      ? round2((subtotal * value) / 100)
      : round2(Math.min(value, subtotal));

  return { valid: true, offer, discount };
}

async function list(active?: string) {
  const where: Prisma.OfferWhereInput = {};
  if (active === 'true') {
    where.isActive = true;
  } else if (active === 'false') {
    where.isActive = false;
  }

  const offers = await prisma.offer.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  return offers.map((offer) => ({ ...offer, isValid: isOfferValid(offer) }));
}

async function create(data: Prisma.OfferCreateInput) {
  return prisma.offer.create({ data });
}

async function update(id: number, data: Prisma.OfferUpdateInput) {
  const exists = await prisma.offer.findUnique({ where: { id } });
  if (!exists) {
    throw new ApiError(404, 'Offer not found.');
  }
  return prisma.offer.update({ where: { id }, data });
}

async function remove(id: number) {
  const exists = await prisma.offer.findUnique({ where: { id } });
  if (!exists) {
    throw new ApiError(404, 'Offer not found.');
  }
  await prisma.offer.delete({ where: { id } });
  return { id };
}

export const offersService = {
  list,
  create,
  update,
  remove,
  validateOffer,
};