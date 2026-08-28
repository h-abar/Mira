import { z } from 'zod';

export const invoiceItemSchema = z.object({
  serviceId: z.coerce.number().int().positive().nullable().optional(),
  productId: z.coerce.number().int().positive().nullable().optional(),
  employeeId: z.coerce.number().int().positive().nullable().optional(),
  description: z.string().nullable().optional(),
  quantity: z.coerce.number().int().positive().default(1),
  unitPrice: z.coerce.number().nonnegative().optional(),
});

export const invoiceCreateSchema = z
  .object({
    appointmentId: z.coerce.number().int().positive().optional(),
    clientId: z.coerce.number().int().positive().optional(),
    employeeId: z.coerce.number().int().positive().optional(),
    discount: z.coerce.number().nonnegative().default(0),
    tax: z.coerce.number().nonnegative().default(0),
    tip: z.coerce.number().nonnegative().optional(),
    paymentMethod: z.enum(['CASH', 'CARD', 'WALLET', 'ELECTRONIC']).default('CASH'),
    branchId: z.coerce.number().int().positive().optional(),
    offerCode: z.string().trim().optional(),
    redeemPoints: z.coerce.number().int().nonnegative().optional(),
    giftCardCode: z.string().trim().optional(),
    items: z.array(invoiceItemSchema).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.appointmentId) {
      return;
    }
    if (!data.clientId || !data.employeeId || !data.items || data.items.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['invoice'],
        message:
          'Either appointmentId or manual invoice data (clientId, employeeId and items) is required.',
      });
    }
  });

export const invoiceListQuerySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  clientId: z.coerce.number().int().positive().optional(),
  branchId: z.coerce.number().int().positive().optional(),
});

export const expenseCreateSchema = z.object({
  date: z.coerce.date().nullable().optional(),
  category: z.string().trim().min(1, 'Category is required'),
  amount: z.coerce.number().positive(),
  description: z.string().nullable().optional(),
});

export const expenseUpdateSchema = expenseCreateSchema.partial();

export const expenseListQuerySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  category: z.string().optional(),
});