import { z } from 'zod';

export const paymentCreateSchema = z
  .object({
    invoiceId: z.number().int().positive().optional(),
    appointmentId: z.number().int().positive().optional(),
    amount: z.number().positive(),
    method: z.string().trim().min(1, 'Payment method is required').transform((v) => v.toUpperCase()),
  })
  .refine((data) => data.invoiceId || data.appointmentId, {
    message: 'Either invoiceId or appointmentId is required.',
    path: ['invoiceId'],
  });

export const paymentListQuerySchema = z.object({
  status: z.enum(['PENDING', 'PAID', 'FAILED', 'REFUNDED']).optional(),
  invoiceId: z.coerce.number().int().positive().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});

export const paymentIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});