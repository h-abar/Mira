import { z } from 'zod';

export const giftCardCreateSchema = z.object({
  initialValue: z.number().positive('يجب أن تكون قيمة البطاقة أكبر من صفر'),
  clientId: z.number().int().positive().optional(),
  expiresAt: z.string().optional(),
});

export const giftCardUpdateSchema = z.object({
  balance: z.number().nonnegative('لا يمكن أن يكون الرصيد سالباً').optional(),
  status: z.enum(['ACTIVE', 'REDEEMED', 'CANCELLED']).optional(),
});

export const giftCardListQuerySchema = z.object({
  q: z.string().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});