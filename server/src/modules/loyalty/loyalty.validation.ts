import { z } from 'zod';

export const adjustPointsSchema = z.object({
  type: z.enum(['EARN', 'REDEEM']),
  points: z.number().int().positive('Points must be a positive integer'),
  note: z.string().optional(),
});

export const loyaltyListQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});