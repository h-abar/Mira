import { describe, it, expect } from 'vitest';
import {
  productCreateSchema,
  movementCreateSchema,
  idParamSchema,
} from './inventory.validation';

describe('productCreateSchema', () => {
  it('accepts a valid bilingual product', () => {
    const result = productCreateSchema.safeParse({
      nameAr: 'شامبو',
      nameEn: 'Shampoo',
      category: 'Hair Care',
      quantity: 10,
      salePrice: 25,
    });
    expect(result.success).toBe(true);
    expect(result.data?.quantity).toBe(10);
    expect(result.data?.unit).toBe('pcs');
    expect(result.data?.costPrice).toBe(0);
    expect(result.data?.minStock).toBe(0);
  });

  it('defaults quantity to 0 when omitted', () => {
    const result = productCreateSchema.safeParse({
      nameAr: 'كريم',
      nameEn: 'Cream',
      category: 'Skin',
    });
    expect(result.success).toBe(true);
    expect(result.data?.quantity).toBe(0);
  });

  it('rejects Arabic name that is not Arabic text', () => {
    expect(
      productCreateSchema.safeParse({ nameAr: 'Shampoo', nameEn: 'Shampoo', category: 'C' }).success,
    ).toBe(false);
    expect(
      productCreateSchema.safeParse({ nameAr: 'شامبو Shampoo', nameEn: 'Shampoo', category: 'C' }).success,
    ).toBe(false);
  });

  it('rejects English name that is not Latin text', () => {
    expect(
      productCreateSchema.safeParse({ nameAr: 'شامبو', nameEn: 'شامبو', category: 'C' }).success,
    ).toBe(false);
  });

  it('rejects negative quantity and prices', () => {
    const base = { nameAr: 'شامبو', nameEn: 'Shampoo', category: 'C' };
    expect(productCreateSchema.safeParse({ ...base, quantity: -1 }).success).toBe(false);
    expect(productCreateSchema.safeParse({ ...base, salePrice: -5 }).success).toBe(false);
    expect(productCreateSchema.safeParse({ ...base, costPrice: -1 }).success).toBe(false);
  });

  it('allows null or omitted branchId but rejects zero and negative', () => {
    const base = { nameAr: 'شامبو', nameEn: 'Shampoo', category: 'C' };
    expect(productCreateSchema.safeParse({ ...base, branchId: null }).success).toBe(true);
    expect(productCreateSchema.safeParse({ ...base }).data?.branchId).toBeUndefined();
    expect(productCreateSchema.safeParse({ ...base, branchId: 0 }).success).toBe(false);
    expect(productCreateSchema.safeParse({ ...base, branchId: -2 }).success).toBe(false);
  });
});

describe('movementCreateSchema', () => {
  it('accepts a valid stock movement', () => {
    const result = movementCreateSchema.safeParse({ productId: 3, type: 'IN', quantity: 5 });
    expect(result.success).toBe(true);
  });

  it('rejects unknown movement types', () => {
    expect(movementCreateSchema.safeParse({ productId: 3, type: 'DELETE', quantity: 1 }).success).toBe(false);
  });

  it('rejects zero or non-integer quantity', () => {
    expect(movementCreateSchema.safeParse({ productId: 3, type: 'IN', quantity: 0 }).success).toBe(false);
    expect(movementCreateSchema.safeParse({ productId: 3, type: 'IN', quantity: 1.5 }).success).toBe(false);
  });
});

describe('idParamSchema', () => {
  it('coerces a string id to a number', () => {
    const result = idParamSchema.safeParse({ id: '42' });
    expect(result.success).toBe(true);
    expect(result.data?.id).toBe(42);
  });

  it('rejects zero, negative and non-numeric ids', () => {
    expect(idParamSchema.safeParse({ id: '0' }).success).toBe(false);
    expect(idParamSchema.safeParse({ id: '-1' }).success).toBe(false);
    expect(idParamSchema.safeParse({ id: 'x' }).success).toBe(false);
  });
});