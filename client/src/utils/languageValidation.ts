const ARABIC_RE = /[\u0600-\u06FF]/;
const LATIN_RE = /[A-Za-z]/;

export function isArabicText(value: string): boolean {
  const v = value.trim();
  return v.length > 0 && ARABIC_RE.test(v);
}

export function isLatinText(value: string): boolean {
  const v = value.trim();
  return v.length > 0 && LATIN_RE.test(v);
}