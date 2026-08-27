import { z } from 'zod';

export const checkInSchema = z.object({
  employeeId: z.coerce.number().positive('يرجى تحديد الموظفة').optional(),
});

export const checkOutSchema = z.object({
  employeeId: z.coerce.number().positive('يرجى تحديد الموظفة').optional(),
});

export const listAttendanceSchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  employeeId: z.coerce.number().positive().optional(),
  page: z.coerce.number().positive().optional().default(1),
  limit: z.coerce.number().positive().optional().default(20),
});

export const attendanceSummarySchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  employeeId: z.coerce.number().positive().optional(),
});