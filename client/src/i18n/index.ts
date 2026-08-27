import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ar from './ar.json';
import en from './en.json';

export const LANG_KEY = 'lang';

export type Lang = 'ar' | 'en';

export const getSavedLang = (): Lang => {
  try {
    const saved = localStorage.getItem(LANG_KEY);
    return saved === 'en' ? 'en' : 'ar';
  } catch {
    return 'ar';
  }
};

export const applyDocLang = (lang: Lang) => {
  document.documentElement.setAttribute('lang', lang);
  document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
};

export const setLang = (lang: Lang) => {
  localStorage.setItem(LANG_KEY, lang);
  applyDocLang(lang);
  void i18n.changeLanguage(lang);
};

export const toggleLang = (): Lang => {
  const next: Lang = i18n.language === 'en' ? 'ar' : 'en';
  setLang(next);
  return next;
};

const initialLang = getSavedLang();
applyDocLang(initialLang);

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ar: { translation: ar },
  },
  lng: initialLang,
  fallbackLng: 'ar',
  interpolation: {
    escapeValue: false,
  },
  returnNull: false,
});

export default i18n;