import { z } from 'zod';

const timeRegex = /^\d{2}:\d{2}$/;

const timeString = (label = 'time') =>
  z.string().regex(timeRegex, `Invalid ${label} format, expected HH:mm`);

export const appointmentCreateSchema = z.object({
  clientId: z.coerce.number().int().positive(),
  employeeId: z.coerce.number().int().positive(),
  serviceId: z.coerce.number().int().positive(),
  date: z.coerce.date(),
  startTime: timeString('startTime'),
  endTime: timeString('endTime').nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const appointmentGroupCreateSchema = z.object({
  clientId: z.coerce.number().int().positive(),
  date: z.coerce.date(),
  startTime: timeString('startTime'),
  notes: z.string().nullable().optional(),
  items: z
    .array(
      z.object({
        serviceId: z.coerce.number().int().positive(),
        employeeId: z.coerce.number().int().positive(),
      }),
    )
    .min(1)
    .max(20),
});

export const appointmentUpdateSchema = z.object({
  clientId: z.coerce.number().int().positive().optional(),
  employeeId: z.coerce.number().int().positive().optional(),
  serviceId: z.coerce.number().int().positive().optional(),
  date: z.coerce.date().optional(),
  startTime: timeString('startTime').optional(),
  endTime: timeString('endTime').nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const statusSchema = z.object({
  status: z.enum(['BOOKED', 'CONFIRMED', 'ARRIVED', 'DONE', 'CANCELLED']),
  cancellationFee: z.number().nonnegative().optional(),
});

export const listQuerySchema = z.object({
  date: z.string().optional(),
  employeeId: z.coerce.number().int().positive().optional(),
  status: z.enum(['BOOKED', 'CONFIRMED', 'ARRIVED', 'DONE', 'CANCELLED']).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

export const appointmentIdSchema = z.coerce.number().int().positive();