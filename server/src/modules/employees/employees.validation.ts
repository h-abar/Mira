import { z } from 'zod';
import { isArabicText, isLatinText } from '../../utils/languageValidation';

const timeField = (label: string) =>
  z
    .string()
    .regex(/^\d{2}:\d{2}$/, `${label} must be HH:mm`)
    .nullable()
    .optional()
    .or(z.literal(''))
    .transform((val) => (val === '' ? null : val));

export const employeeCreateSchema = z.object({
  nameAr: z
    .string()
    .trim()
    .min(1, 'Arabic name is required')
    .refine(isArabicText, 'Arabic name must be written in Arabic letters'),
  nameEn: z
    .string()
    .trim()
    .min(1, 'English name is required')
    .refine(isLatinText, 'English name must be written in English letters'),
  phone: z.string().nullable().optional().or(z.literal('')),
  role: z.enum(['STYLIST', 'BEAUTICIAN', 'RECEPTIONIST']),
  commissionRate: z.coerce.number().min(0).max(100).default(0),
  hireDate: z.coerce.date(),
  isActive: z.boolean().default(true),
  shiftName: z.string().nullable().optional(),
  shiftStart: timeField('shiftStart'),
  shiftEnd: timeField('shiftEnd'),
  workDays: z.string().nullable().optional(),
  morningStart: timeField('morningStart'),
  morningEnd: timeField('morningEnd'),
  eveningStart: timeField('eveningStart'),
  eveningEnd: timeField('eveningEnd'),
});

export const employeeUpdateSchema = employeeCreateSchema.partial();