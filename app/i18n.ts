import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import enTranslations from './locales/en';
import zhTranslations from './locales/zh';

const resources = {
  en: {
    translation: enTranslations,
  },
  zh: {
    translation: zhTranslations,
  },
};

// Debug logging
console.log('Loading translations...');
console.log('Resources:', { en: enTranslations, zh: zhTranslations });
console.log('EN errors sample:', enTranslations.errors);
console.log('ZH errors sample:', zhTranslations.errors);

// Get initial language from server
const getInitialLanguage = () => {
  if (typeof window !== 'undefined' && (window as any).__INITIAL_LANGUAGE__) {
    return (window as any).__INITIAL_LANGUAGE__;
  }
  return 'en';
};

// Only initialize if not already initialized
if (!i18n.isInitialized) {
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources,
      fallbackLng: 'en',
      lng: getInitialLanguage(), // Use server-provided language
      debug: true,
      
      interpolation: {
        escapeValue: false, // React already escapes values
      },
      
      detection: {
        order: ['cookie', 'localStorage', 'navigator', 'htmlTag'],
        caches: ['cookie', 'localStorage'],
        lookupCookie: 'i18nextLng',
        lookupLocalStorage: 'i18nextLng',
        cookieMinutes: 525600, // 1 year
        cookieOptions: {
          path: '/',
          sameSite: 'lax'
        },
        convertDetectedLanguage: (lng: string) => {
          // Normalize language codes to avoid hydration mismatch
          if (lng.startsWith('en')) return 'en';
          if (lng.startsWith('zh')) return 'zh';
          return lng;
        },
      },
    });
}

export default i18n;