import { z } from 'zod';
import { isArabicText, isLatinText } from '../../utils/languageValidation';

export const offerCreateSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, 'Code is required')
    .transform((code) => code.toUpperCase()),
  nameAr: z
    .string()
    .min(1, 'Arabic name is required')
    .refine(isArabicText, 'Arabic name must be written in Arabic letters'),
  nameEn: z
    .string()
    .min(1, 'English name is required')
    .refine(isLatinText, 'English name must be written in English letters'),
  discountType: z.enum(['PERCENT', 'FIXED']),
  value: z.number().positive('Value must be a positive number'),
  validFrom: z.coerce.date().optional(),
  validTo: z.coerce.date().optional(),
  minTotal: z.number().nonnegative().optional().default(0),
  isActive: z.boolean().optional().default(true),
});

export const offerUpdateSchema = offerCreateSchema.partial();

export const offerListQuerySchema = z.object({
  active: z.enum(['true', 'false']).optional(),
});

export const offerValidateSchema = z.object({
  code: z.string().trim().min(1, 'Code is required'),
  subtotal: z.number().nonnegative('Subtotal must be a non-negative number'),
});