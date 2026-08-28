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
  it('accepts Arabic input and mixed text with Arabic, rejects Latin-only and empty input', () => {
    expect(isArabicText('شامبو')).toBe(true);
    expect(isArabicText('شامبو Shampoo')).toBe(true);
    expect(isArabicText('كيراتين 500ml')).toBe(true);
    expect(isArabicText('Shampoo')).toBe(false);
    expect(isArabicText('')).toBe(false);
    expect(isArabicText('   ')).toBe(false);
    expect(isArabicText('123')).toBe(false);
  });
});

describe('isLatinText', () => {
  it('accepts Latin input and mixed text with Latin, rejects Arabic-only and empty input', () => {
    expect(isLatinText('Shampoo')).toBe(true);
    expect(isLatinText('Shampoo شامبو')).toBe(true);
    expect(isLatinText('Keratin 500ml')).toBe(true);
    expect(isLatinText('شامبو')).toBe(false);
    expect(isLatinText('')).toBe(false);
    expect(isLatinText('   ')).toBe(false);
    expect(isLatinText('123')).toBe(false);
  });
});