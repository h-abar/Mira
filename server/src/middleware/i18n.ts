import { NextFunction, Request, Response } from 'express';

const SUPPORTED_LANGS = ['ar', 'en'];
const DEFAULT_LANG = 'ar';

export function i18n(req: Request, _res: Response, next: NextFunction): void {
  const queryLang = req.query.lang;
  const headerLang = req.headers['accept-language'];

  let candidate: string = DEFAULT_LANG;
  if (typeof queryLang === 'string' && queryLang.trim().length > 0) {
    candidate = queryLang;
  } else if (typeof headerLang === 'string' && headerLang.trim().length > 0) {
    candidate = headerLang.split(',')[0];
  }

  const normalized = candidate.trim().toLowerCase().slice(0, 2);
  req.lang = SUPPORTED_LANGS.includes(normalized) ? normalized : DEFAULT_LANG;
  next();
}