/**
 * i18n setup — react-i18next + a tiny localStorage persister.
 *
 *   - Default locale: VI (Vietnamese)
 *   - Persisted under `cp.locale` so the choice survives a refresh
 *   - No automatic browser detection — the project is VN-first
 */
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import { STORAGE_KEYS } from '@cp/shared';

import en from './locales/en';
import vi from './locales/vi';

export type AppLocale = 'en' | 'vi';

const LOCALE_STORAGE_KEY = STORAGE_KEYS.locale;

function readSavedLocale(): AppLocale {
  if (typeof window === 'undefined') return 'vi';
  const saved = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  return saved === 'en' || saved === 'vi' ? saved : 'vi';
}

void i18next.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    vi: { translation: vi },
  },
  lng: readSavedLocale(),
  fallbackLng: 'vi',
  interpolation: { escapeValue: false }, // React already escapes
  returnNull: false,
});

i18next.on('languageChanged', (lng) => {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, lng);
    window.document.documentElement.setAttribute('lang', lng);
  }
});

if (typeof window !== 'undefined') {
  window.document.documentElement.setAttribute('lang', i18next.language);
}

export default i18next;
