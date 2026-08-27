import { z } from 'zod';
import { isArabicText, isLatinText } from '../../utils/languageValidation';

const timeField = (label: string) =>
  z
    .string()
    .regex(/^\d{2}:\d{2}$/, `${label} must be HH:mm`)
    .optional();

export const employeeCreateSchema = z.object({
  nameAr: z
    .string()
    .min(1, 'Arabic name is required')
    .refine(isArabicText, 'Arabic name must be written in Arabic letters'),
  nameEn: z
    .string()
    .min(1, 'English name is required')
    .refine(isLatinText, 'English name must be written in English letters'),
  phone: z.string().optional(),
  role: z.enum(['STYLIST', 'BEAUTICIAN', 'RECEPTIONIST']),
  commissionRate: z.number().min(0).max(100).default(0),
  hireDate: z.coerce.date(),
  isActive: z.boolean().default(true),
  morningStart: timeField('morningStart'),
  morningEnd: timeField('morningEnd'),
  eveningStart: timeField('eveningStart'),
  eveningEnd: timeField('eveningEnd'),
});

export const employeeUpdateSchema = employeeCreateSchema.partial();