import { z } from 'zod';

export const supplierCreateSchema = z.object({
  name: z.string().trim().min(1, 'اسم المورد مطلوب').max(200),
  phone: z.string().trim().optional(),
  email: z.string().trim().email('بريد إلكتروني غير صالح').optional().or(z.literal('')),
  address: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  isActive: z.boolean().default(true),
});

export const supplierUpdateSchema = supplierCreateSchema.partial();

export const supplierListQuerySchema = z.object({
  q: z.string().optional(),
  active: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});