import type { FilterItem } from '@/lib/types';

export const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  book: 'Книга',
  serial: 'Периодическое издание',
  journal_article: 'Статья из журнала',
  textbook: 'Учебник',
  'Учебник': 'Учебник',
  dissertation: 'Диссертация',
  'Диссертация': 'Диссертация',
  collection: 'Сборник',
  article: 'Статья',
  'Статья': 'Статья',
  manual: 'Методическое пособие',
  methodical: 'Методическое пособие',
  nsu_article: 'Статья НГУ',
  monograph: 'Монография',
  'Монография': 'Монография',
  abstract: 'Реферат',
  thesis: 'Дипломная работа',
  conference: 'Материалы конференции',
  reference: 'Справочник',
  'Справочник': 'Справочник',
  electronic_copy: 'Электронная копия',
  doctoral_dissertation: 'Докторская диссертация',
  proceedings: 'Труды конференции',
  tutorial: 'Учебное пособие',
  electronic: 'Электронный ресурс',
  dictionary: 'Словарь',
  book_article: 'Статья из книги',
  network_resource: 'Сетевой ресурс',
  autoreferat: 'Автореферат',
};

export const getDocumentTypeLabel = (name: string): string => {
  return DOCUMENT_TYPE_LABELS[name] || name;
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

  for (const [label, data] of labelToItems) {
    const canonicalName = data.names[0];
    merged.push({ name: canonicalName, count: data.count });
    aliasMap.set(canonicalName, data.names);
  }

  merged.sort((a, b) => b.count - a.count);

  return { merged, aliasMap };
};
