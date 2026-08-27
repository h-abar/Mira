import { describe, it, expect } from 'vitest';
import { containsArabic, containsLatin, isArabicText, isLatinText } from './languageValidation';

describe('containsArabic', () => {
  it('detects Arabic letters', () => {
    expect(containsArabic('شامبو')).toBe(true);
    expect(containsArabic('hello')).toBe(false);
  });
});

describe('containsLatin', () => {
  it('detects Latin letters', () => {
    expect(containsLatin('Shampoo')).toBe(true);
    expect(containsLatin('شامبو')).toBe(false);
  });
});

describe('isArabicText', () => {
  it('accepts pure Arabic and rejects empty, mixed or Latin-only input', () => {
    expect(isArabicText('شامبو')).toBe(true);
    expect(isArabicText('')).toBe(false);
    expect(isArabicText('   ')).toBe(false);
    expect(isArabicText('Shampoo')).toBe(false);
    expect(isArabicText('شامبو Shampoo')).toBe(false);
    expect(isArabicText('123')).toBe(false);
  });
});

describe('isLatinText', () => {
  it('accepts pure Latin and rejects empty, mixed or Arabic-only input', () => {
    expect(isLatinText('Shampoo')).toBe(true);
    expect(isLatinText('')).toBe(false);
    expect(isLatinText('شامبو')).toBe(false);
    expect(isLatinText('Shampoo شامبو')).toBe(false);
    expect(isLatinText('123')).toBe(false);
  });
});