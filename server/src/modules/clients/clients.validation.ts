import { z } from 'zod';

export const clientCreateSchema = z.object({
  name: z.string().trim().min(1, 'Client name is required'),
  phone: z.string().nullable().optional().or(z.literal('')),
  whatsapp: z.string().nullable().optional().or(z.literal('')),
  email: z.string().email('Invalid email').nullable().optional().or(z.literal('')),
  birthdate: z.coerce.date().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const clientUpdateSchema = clientCreateSchema.partial();

export const clientSearchSchema = z.object({
  q: z.string().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});