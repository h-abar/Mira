import { z } from 'zod';

const roleEnum = z.enum(['ADMIN', 'RECEPTIONIST', 'STYLIST']);

export const userCreateSchema = z.object({
  username: z.string().min(1, 'اسم المستخدم مطلوب'),
  password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
  role: roleEnum,
  employeeId: z.coerce.number().positive().nullable().optional(),
  permissions: z.array(z.string()).optional().default([]),
  isActive: z.boolean().optional().default(true),
});

export const userUpdateSchema = z.object({
  username: z.string().min(1, 'اسم المستخدم مطلوب').optional(),
  password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل').optional(),
  role: roleEnum.optional(),
  employeeId: z.coerce.number().positive().nullable().optional(),
  permissions: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});