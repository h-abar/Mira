import { describe, it, expect } from 'vitest';
import { appointmentCreateSchema, appointmentIdSchema } from './appointments.validation';

describe('appointmentCreateSchema', () => {
  const base = {
    clientId: 1,
    employeeId: 2,
    serviceId: 3,
    date: '2026-08-20',
    startTime: '09:30',
  };

  it('accepts a valid appointment', () => {
    const result = appointmentCreateSchema.safeParse(base);
    expect(result.success).toBe(true);
    expect(result.data?.date).toBeInstanceOf(Date);
  });

  it('accepts HH:mm times only', () => {
    expect(appointmentCreateSchema.safeParse({ ...base, startTime: '09:30' }).success).toBe(true);
    expect(appointmentCreateSchema.safeParse({ ...base, endTime: '11:00' }).success).toBe(true);
  });

  it('rejects malformed time strings', () => {
    expect(appointmentCreateSchema.safeParse({ ...base, startTime: '9:30' }).success).toBe(false);
    expect(appointmentCreateSchema.safeParse({ ...base, startTime: '0930' }).success).toBe(false);
    expect(appointmentCreateSchema.safeParse({ ...base, startTime: '09:3' }).success).toBe(false);
    expect(appointmentCreateSchema.safeParse({ ...base, startTime: '09:3a' }).success).toBe(false);
    expect(appointmentCreateSchema.safeParse({ ...base, startTime: '' }).success).toBe(false);
  });

  it('requires clientId, employeeId, serviceId and date', () => {
    const { clientId: _c, ...withoutClient } = base;
    expect(appointmentCreateSchema.safeParse(withoutClient).success).toBe(false);
    const { date: _d, ...withoutDate } = base;
    expect(appointmentCreateSchema.safeParse(withoutDate).success).toBe(false);
  });

  it('rejects non-positive ids', () => {
    expect(appointmentCreateSchema.safeParse({ ...base, clientId: 0 }).success).toBe(false);
    expect(appointmentCreateSchema.safeParse({ ...base, serviceId: -1 }).success).toBe(false);
  });
});

describe('appointmentIdSchema', () => {
  it('coerces a numeric string', () => {
    const result = appointmentIdSchema.safeParse('7');
    expect(result.success).toBe(true);
    expect(result.data).toBe(7);
  });

  it('rejects zero and non-numeric input', () => {
    expect(appointmentIdSchema.safeParse('0').success).toBe(false);
    expect(appointmentIdSchema.safeParse('abc').success).toBe(false);
  });
});