import type { FilterItem } from '@/lib/types';
import { getLanguage } from '@/lib/i18n';
import { ru } from '@/lib/i18n/translations.ru';
import { en } from '@/lib/i18n/translations.en';

const DICTS = { ru, en } as const;

const DATABASE_KEYS = [
  'ELIB',
  'BOOKS',
  'SERIAL',
  'ANALITOLD',
  'ANALITNSU',
  'ANALITBOOKS',
  'ABSTRACT',
  'ELCOPY',
  'ELRES',
  'NETRES',
] as const;

const DOCUMENT_TYPE_KEYS = [
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
] as const;

const RUSSIAN_TO_DOC_KEY: Record<string, (typeof DOCUMENT_TYPE_KEYS)[number]> = {
  'Учебник': 'textbook',
  'Диссертация': 'dissertation',
  'Статья': 'article',
  'Монография': 'monograph',
  'Справочник': 'reference',
};

function lookupTranslation(prefix: string, key: string): string | null {
  const dict = DICTS[getLanguage()] ?? DICTS.ru;
  const value = dict[`${prefix}.${key}`];
  return typeof value === 'string' ? value : null;
}

export const DATABASE_LABELS: Record<string, string> = Object.fromEntries(
  DATABASE_KEYS.map((key) => [key, ru[`db.${key}`] ?? key]),
) as Record<string, string>;

export const getDatabaseLabel = (name: string): string => {
  return lookupTranslation('db', name) ?? name;
};

export const DOCUMENT_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  DOCUMENT_TYPE_KEYS.map((key) => [key, ru[`dt.${key}`] ?? key]),
) as Record<string, string>;

export const getDocumentTypeLabel = (name: string): string => {
  if (DOCUMENT_TYPE_KEYS.includes(name as (typeof DOCUMENT_TYPE_KEYS)[number])) {
    return lookupTranslation('dt', name) ?? name;
  }
  const mapped = RUSSIAN_TO_DOC_KEY[name];
  if (mapped) return lookupTranslation('dt', mapped) ?? name;
  return name;
};

export interface MergedDocTypes {
  merged: FilterItem[];
  aliasMap: Map<string, string[]>;
}

export const mergeDocumentTypes = (items: FilterItem[]): MergedDocTypes => {
  const labelToItems = new Map<string, { names: string[]; count: number }>();

  for (const item of items) {
    const label = getDocumentTypeLabel(item.name);
    const existing = labelToItems.get(label);
    if (existing) {
      existing.names.push(item.name);
      existing.count += item.count;
    } else {
      labelToItems.set(label, { names: [item.name], count: item.count });
    }
  }

  const merged: FilterItem[] = [];
  const aliasMap = new Map<string, string[]>();

  for (const [, data] of labelToItems) {
    const canonicalName = data.names[0];
    merged.push({ name: canonicalName, count: data.count });
    aliasMap.set(canonicalName, data.names);
  }

  merged.sort((a, b) => b.count - a.count);

  return { merged, aliasMap };
};
