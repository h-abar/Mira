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
    .trim()
    .min(1, 'Arabic name is required')
    .refine(isArabicText, 'Arabic name must be written in Arabic letters'),
  nameEn: z
    .string()
    .trim()
    .min(1, 'English name is required')
    .refine(isLatinText, 'English name must be written in English letters'),
  discountType: z.enum(['PERCENT', 'FIXED']),
  value: z.coerce.number().positive('Value must be a positive number'),
  validFrom: z.coerce.date().nullable().optional(),
  validTo: z.coerce.date().nullable().optional(),
  minTotal: z.coerce.number().nonnegative().optional().default(0),
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