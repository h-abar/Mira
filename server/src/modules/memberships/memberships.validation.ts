import { z } from 'zod';

export const planCreateSchema = z.object({
  nameAr: z
    .string()
    .min(1, 'الاسم العربي مطلوب')
    .regex(/^[\u0600-\u06FF\s]+$/, 'يجب أن يكون الاسم العربي بالحروف العربية'),
  nameEn: z
    .string()
    .min(1, 'الاسم الإنجليزي مطلوب')
    .regex(/^[A-Za-z\s]+$/, 'يجب أن يكون الاسم الإنجليزي بالحروف الإنجليزية'),
  price: z.number().positive('يجب أن يكون السعر أكبر من صفر'),
  durationDays: z.number().int().positive('يجب أن تكون المدة أياماً صحيحة'),
  serviceIds: z.array(z.number().int()).optional().default([]),
});

export const planUpdateSchema = planCreateSchema.partial();

export const assignSchema = z.object({
  clientId: z.number().int().positive(),
  planId: z.number().int().positive(),
});