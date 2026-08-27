import { describe, it, expect, vi } from 'vitest';

vi.mock('../../config/database', () => ({ prisma: {} }));

import { isOfferValid } from './offers.service';

describe('isOfferValid', () => {
  const farPast = new Date('2020-01-01T00:00:00.000Z');
  const farFuture = new Date('2099-01-01T00:00:00.000Z');

  it('returns true for an active offer with an open window', () => {
    expect(isOfferValid({ isActive: true, validFrom: null, validTo: null })).toBe(true);
  });

  it('returns false for an inactive offer', () => {
    expect(isOfferValid({ isActive: false, validFrom: null, validTo: null })).toBe(false);
  });

  it('returns false when the offer has not started yet', () => {
    expect(isOfferValid({ isActive: true, validFrom: farFuture, validTo: null })).toBe(false);
  });

  it('returns false when the offer has expired', () => {
    expect(isOfferValid({ isActive: true, validFrom: null, validTo: farPast })).toBe(false);
  });

  it('returns true within the valid window and false outside it', () => {
    expect(isOfferValid({ isActive: true, validFrom: farPast, validTo: farFuture })).toBe(true);
    expect(isOfferValid({ isActive: true, validFrom: farFuture, validTo: farFuture })).toBe(false);
  });
});