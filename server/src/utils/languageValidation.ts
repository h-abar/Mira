const ARABIC_RE = /[\u0600-\u06FF]/;
const LATIN_RE = /[A-Za-z]/;

export function containsArabic(value: string): boolean {
  return ARABIC_RE.test(value);
}

export function containsLatin(value: string): boolean {
  return LATIN_RE.test(value);
}

export function isArabicText(value: string): boolean {
  const v = value.trim();
  return v.length > 0 && containsArabic(v);
}

export function isLatinText(value: string): boolean {
  const v = value.trim();
  return v.length > 0 && containsLatin(v);
}