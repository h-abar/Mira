import { z } from 'zod';
import { isArabicText, isLatinText } from '../../utils/languageValidation';

export const productCreateSchema = z.object({
  nameAr: z
    .string()
    .min(1, 'Arabic name is required')
    .refine(isArabicText, 'Arabic name must be written in Arabic letters'),
  nameEn: z
    .string()
    .min(1, 'English name is required')
    .refine(isLatinText, 'English name must be written in English letters'),
  barcode: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  quantity: z.number().int().nonnegative().default(0),
  unit: z.string().default('pcs'),
  costPrice: z.number().nonnegative().default(0),
  salePrice: z.number().nonnegative().default(0),
  minStock: z.number().int().nonnegative().default(0),
  supplier: z.string().optional(),
  branchId: z.number().int().positive().nullable().optional(),
  isActive: z.boolean().optional(),
});

export const productUpdateSchema = productCreateSchema.partial();

export const movementCreateSchema = z.object({
  productId: z.number().int().positive(),
  type: z.enum(['IN', 'SALE', 'USAGE', 'LOSS']),
  quantity: z.number().int().positive(),
  date: z.coerce.date().optional(),
  referenceId: z.string().optional(),
});

export const listProductsQuerySchema = z.object({
  q: z.string().optional(),
  branchId: z.coerce.number().int().positive().optional(),
  lowStock: z.preprocess(
    (value) => {
      if (value === 'true' || value === true) return true;
      if (value === 'false' || value === false) return false;
      return undefined;
    },
    z.boolean().optional(),
  ),
  category: z.string().optional(),
});

export const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});
