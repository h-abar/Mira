import { z } from 'zod';

const roleEnum = z.enum(['ADMIN', 'RECEPTIONIST', 'STYLIST']);

export const userCreateSchema = z.object({
  username: z.string().trim().min(1, 'اسم المستخدم مطلوب').max(50, 'اسم المستخدم طويل جداً'),
  password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل').max(200, 'كلمة المرور طويلة جداً'),
  role: roleEnum,
  employeeId: z.coerce.number().positive().nullable().optional(),
  permissions: z.array(z.string().max(50)).max(100).optional().default([]),
  isActive: z.boolean().optional().default(true),
});

export const userUpdateSchema = z.object({
  username: z.string().trim().min(1, 'اسم المستخدم مطلوب').max(50, 'اسم المستخدم طويل جداً').optional(),
  password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل').max(200, 'كلمة المرور طويلة جداً').optional(),
  role: roleEnum.optional(),
  employeeId: z.coerce.number().positive().nullable().optional(),
  permissions: z.array(z.string().max(50)).max(100).optional(),
  isActive: z.boolean().optional(),
});