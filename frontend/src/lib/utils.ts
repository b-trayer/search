import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { getLanguage } from '@/lib/i18n';
import { ru } from '@/lib/i18n/translations.ru';
import { en } from '@/lib/i18n/translations.en';

const DICTS = { ru, en } as const;

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface ParsedAuthors {
  mainAuthor: string;
  otherAuthors: string[];
  all: string[];
}

export function parseAuthors(authorsStr: string | undefined | null): ParsedAuthors {
  if (!authorsStr) {
    return { mainAuthor: '', otherAuthors: [], all: [] };
  }

  const authorsList = authorsStr.split(',').map(a => a.trim()).filter(Boolean);

  return {
    mainAuthor: authorsList[0] || '',
    otherAuthors: authorsList.slice(1),
    all: authorsList,
  };
}

export function formatOtherAuthors(otherAuthors: string[], maxVisible: number = 2): string {
  if (otherAuthors.length === 0) return '';
  if (otherAuthors.length <= maxVisible) {
    return otherAuthors.join(', ');
  }
  const remaining = otherAuthors.length - maxVisible;
  const visible = otherAuthors.slice(0, maxVisible).join(', ');
  const lang = getLanguage();
  const suffix =
    lang === 'ru'
      ? `и еще ${remaining}`
      : `and ${remaining} more`;
  return `${visible} ${suffix}`;
}

const RUSSIAN_TO_KEY: Record<string, string> = {
  'Учебник': 'textbook',
  'Диссертация': 'dissertation',
  'Статья': 'article',
  'Монография': 'monograph',
  'Справочник': 'reference',
};

const KEY_LIST = [
  'book',
  'serial',
  'journal_article',
  'textbook',
  'dissertation',
  'collection',
  'article',
  'manual',
  'methodical',
  'nsu_article',
  'monograph',
  'abstract',
  'thesis',
  'conference',
  'reference',
  'electronic_copy',
  'doctoral_dissertation',
  'proceedings',
  'tutorial',
  'electronic',
  'dictionary',
  'book_article',
  'network_resource',
  'autoreferat',
  'other',
] as const;

const KEY_SET = new Set<string>(KEY_LIST);

const MATERIAL_MARKER_KEYWORDS = [
  'учебники',
  'учебник',
  'задачники',
  'задачник',
  'монография',
  'монографии',
  'сборник',
  'сборники',
  'пособие',
  'пособия',
  'методические указания',
  'методические пособия',
  'методические рекомендации',
  'практикум',
  'практикумы',
  'словари',
  'словарь',
  'справочник',
  'справочники',
  'статьи',
  'статья',
  'автореферат',
  'авторефераты',
  'диссертация',
  'диссертации',
  'хрестоматия',
];

const MATERIAL_MARKER_REGEX = new RegExp(
  `\\s*\\((?:${MATERIAL_MARKER_KEYWORDS.join('|')})\\)\\s*`,
  'gi',
);

const NOISY_RUBRICS = new Set([
  'учебные издания для высших учебных заведений',
  'учебные издания',
  'труды штатных преподавателей нгу',
  'труды преподавателей и сотрудников нгу',
  'труды преподавателей нгу',
  'издания нгу',
  'книги редкого фонда нб нгу',
  'книги редкого фонда',
  'научные издания',
  'художественные издания',
  'периодические издания',
]);

function lookupDocType(key: string): string | null {
  const dict = DICTS[getLanguage()] ?? DICTS.ru;
  return dict[`dt.${key}`] ?? null;
}

export function formatBadgeText(text: string): string {
  if (!text) return '';
  const lower = text.toLowerCase();
  if (KEY_SET.has(lower)) {
    return lookupDocType(lower) ?? text;
  }
  const mappedKey = RUSSIAN_TO_KEY[text];
  if (mappedKey) {
    return lookupDocType(mappedKey) ?? text;
  }
  const withoutParens = text.replace(/\s*\([^)]*\)/g, '').trim();
  if (!withoutParens) return '';
  return withoutParens.charAt(0).toUpperCase() + withoutParens.slice(1);
}

export function uniqueBadges(items: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const item of items) {
    if (!item) continue;
    const fragments = item
      .split(MATERIAL_MARKER_REGEX)
      .map((f) => f.trim())
      .filter((f) => f.length > 0);

    for (const fragment of fragments) {
      if (NOISY_RUBRICS.has(fragment.toLowerCase())) continue;
      const formatted = formatBadgeText(fragment);
      const parts = formatted
        .split(/(?<=[а-яё])\s+(?=[А-ЯЁA-Z])|[;,]/)
        .map((p) => p.trim())
        .filter((p) => p.length > 0);

      for (const part of parts) {
        const normalized = part.toLowerCase();
        if (NOISY_RUBRICS.has(normalized)) continue;
        if (seen.has(normalized)) continue;
        seen.add(normalized);
        result.push(part.charAt(0).toUpperCase() + part.slice(1));
      }
    }
  }
  return result;
}
