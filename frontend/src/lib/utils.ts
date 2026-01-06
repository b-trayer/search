import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

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
  return `${otherAuthors.slice(0, maxVisible).join(', ')} и ещё ${otherAuthors.length - maxVisible}`;
}

const DOCUMENT_TYPE_RU: Record<string, string> = {
  'book': 'Книга',
  'serial': 'Периодическое издание',
  'journal_article': 'Статья из журнала',
  'textbook': 'Учебник',
  'dissertation': 'Диссертация',
  'collection': 'Сборник',
  'article': 'Статья',
  'manual': 'Методическое пособие',
  'nsu_article': 'Статья НГУ',
  'monograph': 'Монография',
  'abstract': 'Реферат',
  'thesis': 'Дипломная работа',
  'conference': 'Материалы конференции',
  'reference': 'Справочник',
  'electronic_copy': 'Электронная копия',
  'methodical': 'Методическое пособие',
  'doctoral_dissertation': 'Докторская диссертация',
  'proceedings': 'Труды конференции',
  'tutorial': 'Учебное пособие',
  'electronic': 'Электронный ресурс',
  'dictionary': 'Словарь',
  'book_article': 'Статья из книги',
  'network_resource': 'Сетевой ресурс',
  'autoreferat': 'Автореферат',
  'other': 'Другое',
};

export function formatBadgeText(text: string): string {
  if (!text) return '';
  const lower = text.toLowerCase();
  if (DOCUMENT_TYPE_RU[lower]) {
    return DOCUMENT_TYPE_RU[lower];
  }
  const withoutParens = text.replace(/\s*\([^)]*\)/g, '').trim();
  if (!withoutParens) return '';
  return withoutParens.charAt(0).toUpperCase() + withoutParens.slice(1);
}

export function uniqueBadges(items: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const item of items) {
    const formatted = formatBadgeText(item);
    const parts = formatted
      .split(/(?<=[а-яё])\s+(?=[А-ЯЁA-Z])|[;,]/)
      .map(p => p.trim().toLowerCase())
      .filter(p => p.length > 0);

    for (const part of parts) {
      if (!seen.has(part)) {
        seen.add(part);
        result.push(part);
      }
    }
  }
  return result;
}
