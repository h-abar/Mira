import { describe, it, expect } from 'vitest';
import { reportQuerySchema } from './reports.validation';

describe('reportQuerySchema', () => {
  it('coerces branchId string to a number', () => {
    const result = reportQuerySchema.safeParse({ branchId: '1' });
    expect(result.success).toBe(true);
    expect(result.data?.branchId).toBe(1);
  });

  it('rejects non-numeric branchId', () => {
    const result = reportQuerySchema.safeParse({ branchId: 'abc' });
    expect(result.success).toBe(false);
  });

  it('rejects zero and negative branchId', () => {
    expect(reportQuerySchema.safeParse({ branchId: '0' }).success).toBe(false);
    expect(reportQuerySchema.safeParse({ branchId: '-3' }).success).toBe(false);
  });

  it('leaves branchId undefined when missing', () => {
    const result = reportQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    expect(result.data?.branchId).toBeUndefined();
  });

  it('applies defaults for groupBy and format', () => {
    const result = reportQuerySchema.safeParse({});
    expect(result.data?.groupBy).toBe('day');
    expect(result.data?.format).toBe('excel');
  });

  it('coerces from/to to Date objects', () => {
    const result = reportQuerySchema.safeParse({ from: '2026-08-01', to: '2026-08-31' });
    expect(result.success).toBe(true);
    expect(result.data?.from).toBeInstanceOf(Date);
    expect(result.data?.to).toBeInstanceOf(Date);
  });

  it('rejects invalid groupBy and format values', () => {
    expect(reportQuerySchema.safeParse({ groupBy: 'year' }).success).toBe(false);
    expect(reportQuerySchema.safeParse({ format: 'csv' }).success).toBe(false);
    expect(reportQuerySchema.safeParse({ report: 'nonsense' }).success).toBe(false);
  });
});