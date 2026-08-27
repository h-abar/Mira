import { describe, it, expect } from 'vitest';
import {
  invoiceItemSchema,
  invoiceCreateSchema,
  invoiceListQuerySchema,
  expenseCreateSchema,
} from './accounting.validation';

describe('invoiceItemSchema', () => {
  it('defaults quantity to 1', () => {
    const result = invoiceItemSchema.safeParse({ serviceId: 5 });
    expect(result.success).toBe(true);
    expect(result.data?.quantity).toBe(1);
  });

  it('rejects zero or negative quantity', () => {
    expect(invoiceItemSchema.safeParse({ serviceId: 1, quantity: 0 }).success).toBe(false);
    expect(invoiceItemSchema.safeParse({ serviceId: 1, quantity: -2 }).success).toBe(false);
  });

  it('rejects a negative unitPrice', () => {
    expect(invoiceItemSchema.safeParse({ serviceId: 1, unitPrice: -1 }).success).toBe(false);
  });
});

describe('invoiceCreateSchema', () => {
  it('accepts appointmentId alone without manual data', () => {
    const result = invoiceCreateSchema.safeParse({ appointmentId: 10 });
    expect(result.success).toBe(true);
    expect(result.data?.paymentMethod).toBe('CASH');
    expect(result.data?.discount).toBe(0);
  });

  it('requires clientId, employeeId and items for manual invoices', () => {
    expect(invoiceCreateSchema.safeParse({ clientId: 1 }).success).toBe(false);
    expect(invoiceCreateSchema.safeParse({ clientId: 1, employeeId: 2 }).success).toBe(false);
    const withItems = invoiceCreateSchema.safeParse({
      clientId: 1,
      employeeId: 2,
      items: [{ serviceId: 3 }],
    });
    expect(withItems.success).toBe(true);
  });

  it('rejects negative discount, tax and tip', () => {
    expect(invoiceCreateSchema.safeParse({ appointmentId: 1, discount: -5 }).success).toBe(false);
    expect(invoiceCreateSchema.safeParse({ appointmentId: 1, tax: -1 }).success).toBe(false);
    expect(invoiceCreateSchema.safeParse({ appointmentId: 1, tip: -0.5 }).success).toBe(false);
  });

  it('rejects invalid paymentMethod', () => {
    expect(invoiceCreateSchema.safeParse({ appointmentId: 1, paymentMethod: 'BITCOIN' }).success).toBe(false);
  });

  it('rejects negative redeemPoints and non-integer values', () => {
    expect(invoiceCreateSchema.safeParse({ appointmentId: 1, redeemPoints: -1 }).success).toBe(false);
    expect(invoiceCreateSchema.safeParse({ appointmentId: 1, redeemPoints: 1.5 }).success).toBe(false);
  });

  it('rejects null and zero branchId', () => {
    expect(invoiceCreateSchema.safeParse({ appointmentId: 1, branchId: null }).success).toBe(false);
    expect(invoiceCreateSchema.safeParse({ appointmentId: 1, branchId: 0 }).success).toBe(false);
  });
});

describe('invoiceListQuerySchema', () => {
  it('coerces pagination params and clamps limit to 100', () => {
    const ok = invoiceListQuerySchema.safeParse({ page: '2', limit: '50' });
    expect(ok.success).toBe(true);
    expect(ok.data?.page).toBe(2);
    expect(ok.data?.limit).toBe(50);
    expect(invoiceListQuerySchema.safeParse({ limit: '101' }).success).toBe(false);
  });

  it('rejects non-numeric and zero pagination values', () => {
    expect(invoiceListQuerySchema.safeParse({ page: 'abc' }).success).toBe(false);
    expect(invoiceListQuerySchema.safeParse({ page: '0' }).success).toBe(false);
    expect(invoiceListQuerySchema.safeParse({ branchId: '-1' }).success).toBe(false);
  });
});

describe('expenseCreateSchema', () => {
  it('accepts a positive amount', () => {
    const result = expenseCreateSchema.safeParse({ category: 'Supplies', amount: 12.5 });
    expect(result.success).toBe(true);
  });

  it('rejects zero or negative amount', () => {
    expect(expenseCreateSchema.safeParse({ category: 'Supplies', amount: 0 }).success).toBe(false);
    expect(expenseCreateSchema.safeParse({ category: 'Supplies', amount: -3 }).success).toBe(false);
  });

  it('rejects an empty category', () => {
    expect(expenseCreateSchema.safeParse({ category: '', amount: 1 }).success).toBe(false);
    expect(expenseCreateSchema.safeParse({ amount: 1 }).success).toBe(false);
  });
});