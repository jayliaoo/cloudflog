import enTranslations from '../locales/en';
import zhTranslations from '../locales/zh';

type TranslationResources = {
  en: typeof enTranslations;
  zh: typeof zhTranslations;
};

const resources: TranslationResources = {
  en: enTranslations,
  zh: zhTranslations,
};

/**
 * Get a nested value from an object using dot notation
 * @param obj - The object to search in
 * @param path - The dot-separated path (e.g., "about.title")
 * @returns The value at the path or undefined if not found
 */
function getNestedValue(obj: any, path: string): string | undefined {
  return path.split('.').reduce((current, key) => {
    return current && typeof current === 'object' ? current[key] : undefined;
  }, obj);
}

/**
 * Server-side translation function
 * @param language - The language code ('en' or 'zh')
 * @param key - The translation key (e.g., "about.title")
 * @param fallback - Optional fallback value if translation is not found
 * @returns The translated string or fallback
 */
export function serverTranslate(
  language: 'en' | 'zh',
  key: string,
  fallback?: string
): string {
  // Normalize language
  const normalizedLang = language === 'zh' ? 'zh' : 'en';
  
  // Get the translation resource for the language
  const translations = resources[normalizedLang];
  
  if (!translations) {
    console.warn(`Translation resource not found for language: ${normalizedLang}`);
    return fallback || key;
  }
  
  // Get the nested value using dot notation
  const translation = getNestedValue(translations, key);
  
  if (translation && typeof translation === 'string') {
    return translation;
  }
  
  // If translation not found, try fallback to English if we were looking for Chinese
  if (normalizedLang === 'zh') {
    const englishTranslation = getNestedValue(resources.en, key);
    if (englishTranslation && typeof englishTranslation === 'string') {
      return englishTranslation;
    }
  }
  
  // Return fallback or the key itself
  return fallback || key;
}

/**
 * Detect language from request headers
 * @param request - The request object
 * @returns The detected language code
 */
export function detectLanguageFromRequest(request: Request): 'en' | 'zh' {
  const acceptLanguage = request.headers.get('Accept-Language') || '';
  const cookieHeader = request.headers.get('Cookie') || '';
  const languageCookie = cookieHeader.match(/i18nextLng=([^;]+)/)?.[1];
  
  let detectedLanguage = 'en'; // default
  
  if (languageCookie) {
    // Use language from cookie if available
    detectedLanguage = languageCookie;
  } else if (acceptLanguage.includes('zh')) {
    // Detect Chinese from Accept-Language header
    detectedLanguage = 'zh';
  }
  
  // Normalize language
  if (detectedLanguage.startsWith('zh')) return 'zh';
  else return 'en';
}

/**
 * Create a translation function bound to a specific language
 * @param language - The language code
 * @returns A translation function that uses the specified language
 */
export function createServerTranslator(language: 'en' | 'zh') {
  return (key: string, fallback?: string) => serverTranslate(language, key, fallback);
}