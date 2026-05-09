import { DEFAULT_LANGUAGE, LANGUAGES, STORAGE_KEY, type Language } from './types';

type Listener = (language: Language) => void;

function isLanguage(value: unknown): value is Language {
  return typeof value === 'string' && (LANGUAGES as string[]).includes(value);
}

function detectInitialLanguage(): Language {
  if (typeof window === 'undefined') return DEFAULT_LANGUAGE;

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (isLanguage(stored)) return stored;
  } catch {
    /* localStorage may be blocked */
  }

  return DEFAULT_LANGUAGE;
}

let currentLanguage: Language = detectInitialLanguage();
const listeners = new Set<Listener>();

export function getLanguage(): Language {
  return currentLanguage;
}

export function setLanguage(next: Language): void {
  if (next === currentLanguage) return;
  currentLanguage = next;

  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* localStorage may be blocked */
    }
    if (typeof document !== 'undefined') {
      document.documentElement.lang = next;
    }
  }

  for (const listener of listeners) listener(next);
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

if (typeof document !== 'undefined') {
  document.documentElement.lang = currentLanguage;
}
