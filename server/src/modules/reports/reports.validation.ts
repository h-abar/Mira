import { z } from 'zod';

export const reportQuerySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  branchId: z.coerce.number().int().positive().optional(),
  employeeId: z.coerce.number().int().positive().optional(),
  groupBy: z.enum(['day', 'week', 'month']).optional().default('day'),
  report: z
    .enum([
      'sales',
      'paymentMethods',
      'topServices',
      'topClients',
      'employeePerformance',
      'employeeShiftSales',
      'expenses',
    ])
    .optional(),
  format: z.enum(['excel', 'pdf']).optional().default('excel'),
  lang: z.enum(['ar', 'en']).optional().default('ar'),
});
