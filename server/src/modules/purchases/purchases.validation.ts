import { z } from 'zod';

export const purchaseItemSchema = z.object({
  productId: z.number().int().positive().optional(),
  productName: z.string().trim().optional(),
  quantity: z.number().int().positive('الكمية يجب أن تكون عدداً صحيحاً موجباً'),
  unitCost: z.number().nonnegative('تكلفة الوحدة لا يمكن أن تكون سالبة'),
});

export const purchaseCreateSchema = z
  .object({
    supplierId: z.number().int().positive().optional(),
    items: z.array(purchaseItemSchema).min(1, 'يجب إضافة عنصر واحد على الأقل'),
    discount: z.number().nonnegative().default(0),
    paymentMethod: z.enum(['CASH', 'CARD', 'WALLET']).default('CASH'),
    notes: z.string().trim().optional(),
  })
  .superRefine((data, ctx) => {
    data.items.forEach((item, index) => {
      if (!item.productId && !(item.productName && item.productName.trim().length > 0)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['items', index],
          message: 'كل عنصر يجب أن يحتوي على منتج محدد أو اسم منتج',
        });
      }
    });
  });

export const purchaseListQuerySchema = z.object({
  supplierId: z.coerce.number().int().positive().optional(),
  status: z.enum(['PENDING', 'RECEIVED', 'CANCELLED']).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});