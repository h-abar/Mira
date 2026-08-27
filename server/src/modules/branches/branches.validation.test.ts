import { describe, it, expect } from 'vitest';
import { branchListQuerySchema } from './branches.validation';
import { supplierListQuerySchema } from '../suppliers/suppliers.validation';

describe('branchListQuerySchema', () => {
  it('coerces isActive=true string to boolean true', () => {
    const r = branchListQuerySchema.parse({ isActive: 'true' });
    expect(r.isActive).toBe(true);
  });

  it('coerces isActive=false string to boolean false', () => {
    const r = branchListQuerySchema.parse({ isActive: 'false' });
    expect(r.isActive).toBe(false);
  });

  it('leaves isActive undefined when absent', () => {
    const r = branchListQuerySchema.parse({});
    expect(r.isActive).toBeUndefined();
  });

  it('rejects invalid isActive value', () => {
    const r = branchListQuerySchema.safeParse({ isActive: 'yes' });
    expect(r.success).toBe(false);
  });
});

describe('supplierListQuerySchema', () => {
  it('coerces active=true string to boolean true', () => {
    const r = supplierListQuerySchema.parse({ active: 'true' });
    expect(r.active).toBe(true);
  });

  it('coerces active=false string to boolean false', () => {
    const r = supplierListQuerySchema.parse({ active: 'false' });
    expect(r.active).toBe(false);
  });

  it('leaves active undefined when absent', () => {
    const r = supplierListQuerySchema.parse({});
    expect(r.active).toBeUndefined();
  });
});