import { z } from 'zod';
import { isArabicText, isLatinText } from '../../utils/languageValidation';

export const serviceCreateSchema = z.object({
  nameAr: z
    .string()
    .trim()
    .min(1, 'Arabic name is required')
    .refine(isArabicText, 'Arabic name must be written in Arabic letters'),
  nameEn: z
    .string()
    .trim()
    .min(1, 'English name is required')
    .refine(isLatinText, 'English name must be written in English letters'),
  category: z.string().trim().min(1, 'Category is required'),
  price: z.coerce.number().positive('Price must be a positive number'),
  durationMinutes: z.coerce.number().int().positive('Duration must be a positive integer'),
  cost: z.coerce.number().nonnegative().default(0),
  isActive: z.boolean().default(true),
});

export const serviceUpdateSchema = serviceCreateSchema.partial();

export const serviceListSchema = z.object({
  active: z.enum(['true', 'false']).optional(),
});