import { z } from 'zod';

export const planCreateSchema = z.object({
  nameAr: z.string().trim().min(1, 'الاسم العربي مطلوب'),
  nameEn: z.string().trim().min(1, 'الاسم الإنجليزي مطلوب'),
  price: z.number().positive('يجب أن يكون السعر أكبر من صفر'),
  durationDays: z.number().int().positive('يجب أن تكون المدة أياماً صحيحة'),
  serviceIds: z.array(z.number().int()).optional().default([]),
});

export const planUpdateSchema = planCreateSchema.partial();

export const assignSchema = z.object({
  clientId: z.number().int().positive(),
  planId: z.number().int().positive(),
});