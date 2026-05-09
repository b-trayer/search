import { getLanguage } from './store';
import { ru } from './translations.ru';
import { en } from './translations.en';
import type { Language, TranslationDict } from './types';

const DICTS: Record<Language, TranslationDict> = { ru, en };

function applyParams(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key: string) => {
    const value = params[key];
    return value === undefined || value === null ? '' : String(value);
  });
}

export function translate(key: string, params?: Record<string, string | number>): string {
  const lang = getLanguage();
  const dict = DICTS[lang];
  const template = dict[key] ?? DICTS.en[key] ?? key;
  return applyParams(template, params);
}

function pickPluralForm(language: Language, count: number): 'one' | 'few' | 'many' {
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

export function pluralStatic(baseKey: string, count: number, params?: Record<string, string | number>): string {
  const form = pickPluralForm(getLanguage(), count);
  return translate(`${baseKey}.${form}`, { count, ...params });
}
