import { z } from 'zod';

export const branchCreateSchema = z.object({
  nameAr: z.string().trim().min(1, 'اسم الفرع (عربي) مطلوب').max(200),
  nameEn: z.string().trim().min(1, 'Branch name (English) is required').max(200),
  address: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  isActive: z.boolean().default(true),
});

export const branchUpdateSchema = branchCreateSchema.partial();

export const branchListQuerySchema = z.object({
  isActive: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});