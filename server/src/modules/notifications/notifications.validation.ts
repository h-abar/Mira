import { z } from 'zod';

export const sendWhatsAppSchema = z.object({
  phone: z.string().min(1, 'يرجى إدخال رقم الهاتف'),
  message: z.string().min(1, 'يرجى إدخال نص الرسالة'),
  referenceId: z.string().trim().optional(),
  type: z.string().trim().optional(),
});

export const testWhatsAppSchema = z.object({
  phone: z.string().min(1, 'يرجى إدخال رقم الهاتف'),
});

export const listNotificationsSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  status: z.enum(['PENDING', 'SENT', 'FAILED']).optional(),
  type: z.string().trim().optional(),
});

export const campaignSchema = z.object({
  audience: z.enum(['birthday', 'inactive', 'ids']),
  clientIds: z.array(z.number().int().positive()).optional(),
  inactiveDays: z.number().int().positive().optional(),
  message: z.string().min(1, 'يرجى إدخال نص الرسالة'),
});

export const retryNotificationSchema = z.object({
  id: z.coerce.number().int().positive(),
});