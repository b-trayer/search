export type Language = 'ru' | 'en';

export const LANGUAGES: Language[] = ['ru', 'en'];

export const DEFAULT_LANGUAGE: Language = 'ru';

export const STORAGE_KEY = 'app.language';

export type TranslationDict = Record<string, string>;

export type Translations = Record<Language, TranslationDict>;
