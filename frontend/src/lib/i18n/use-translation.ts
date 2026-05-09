import { useCallback, useSyncExternalStore } from 'react';
import { ru } from './translations.ru';
import { en } from './translations.en';
import { getLanguage, setLanguage as setLanguageInternal, subscribe } from './store';
import type { Language, TranslationDict } from './types';

const DICTIONARIES: Record<Language, TranslationDict> = { ru, en };

const noopUnsubscribe = () => () => {};

function applyParams(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key: string) => {
    const value = params[key];
    return value === undefined || value === null ? '' : String(value);
  });
}

function pickPlural(language: Language, count: number): 'one' | 'few' | 'many' {
  const abs = Math.abs(count);
  if (language === 'ru') {
    const lastTwo = abs % 100;
    const lastDigit = abs % 10;
    if (lastTwo >= 11 && lastTwo <= 19) return 'many';
    if (lastDigit === 1) return 'one';
    if (lastDigit >= 2 && lastDigit <= 4) return 'few';
    return 'many';
  }
  return abs === 1 ? 'one' : 'many';
}

export interface UseTranslationReturn {
  language: Language;
  setLanguage: (next: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  plural: (baseKey: string, count: number, params?: Record<string, string | number>) => string;
  formatNumber: (value: number) => string;
}

const subscribeStore = (listener: () => void) => {
  if (typeof window === 'undefined') return noopUnsubscribe();
  return subscribe(listener);
};

const getSnapshot = () => getLanguage();
const getServerSnapshot = () => 'ru' as Language;

export function useTranslation(): UseTranslationReturn {
  const language = useSyncExternalStore(subscribeStore, getSnapshot, getServerSnapshot);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const dict = DICTIONARIES[language];
      const template = dict[key] ?? DICTIONARIES.en[key] ?? key;
      return applyParams(template, params);
    },
    [language],
  );

  const plural = useCallback(
    (baseKey: string, count: number, params?: Record<string, string | number>): string => {
      const form = pickPlural(language, count);
      return t(`${baseKey}.${form}`, { count, ...params });
    },
    [language, t],
  );

  const formatNumber = useCallback(
    (value: number): string => {
      const locale = language === 'ru' ? 'ru-RU' : 'en-US';
      return value.toLocaleString(locale);
    },
    [language],
  );

  return {
    language,
    setLanguage: setLanguageInternal,
    t,
    plural,
    formatNumber,
  };
}
