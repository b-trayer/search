import { describe, expect, it } from 'vitest';
import {
  DATABASE_LABELS,
  DOCUMENT_TYPE_LABELS,
  getDatabaseLabel,
  getDocumentTypeLabel,
  mergeDocumentTypes,
} from './filter-utils';

describe('getDatabaseLabel', () => {
  it('returns Russian label for known databases', () => {
    expect(getDatabaseLabel('ELIB')).toBe('Электронная библиотека НГУ');
    expect(getDatabaseLabel('BOOKS')).toBe('Книги');
    expect(getDatabaseLabel('SERIAL')).toBe('Журналы и периодика');
  });

  it('falls back to original key when label is not defined', () => {
    expect(getDatabaseLabel('UNKNOWN')).toBe('UNKNOWN');
    expect(getDatabaseLabel('')).toBe('');
  });

  it('covers every key declared in DATABASE_LABELS', () => {
    for (const [key, label] of Object.entries(DATABASE_LABELS)) {
      expect(getDatabaseLabel(key)).toBe(label);
    }
  });
});

describe('getDocumentTypeLabel', () => {
  it('translates raw machine codes', () => {
    expect(getDocumentTypeLabel('book')).toBe('Книга');
    expect(getDocumentTypeLabel('serial')).toBe('Периодическое издание');
    expect(getDocumentTypeLabel('textbook')).toBe('Учебник');
  });

  it('keeps already Russian labels intact', () => {
    expect(getDocumentTypeLabel('Учебник')).toBe('Учебник');
    expect(getDocumentTypeLabel('Диссертация')).toBe('Диссертация');
  });

  it('falls back to original value for unknown types', () => {
    expect(getDocumentTypeLabel('zzz_unknown')).toBe('zzz_unknown');
  });

  it('covers every key declared in DOCUMENT_TYPE_LABELS', () => {
    for (const [key, label] of Object.entries(DOCUMENT_TYPE_LABELS)) {
      expect(getDocumentTypeLabel(key)).toBe(label);
    }
  });
});

describe('mergeDocumentTypes', () => {
  it('returns empty result for empty input', () => {
    const { merged, aliasMap } = mergeDocumentTypes([]);
    expect(merged).toEqual([]);
    expect(aliasMap.size).toBe(0);
  });

  it('merges Russian and English variants under one canonical entry', () => {
    const { merged, aliasMap } = mergeDocumentTypes([
      { name: 'textbook', count: 100 },
      { name: 'Учебник', count: 50 },
    ]);

    expect(merged).toHaveLength(1);
    expect(merged[0].count).toBe(150);
    expect(aliasMap.get(merged[0].name)).toEqual(['textbook', 'Учебник']);
  });

  it('preserves single entries without aliases', () => {
    const { merged, aliasMap } = mergeDocumentTypes([
      { name: 'monograph', count: 40 },
    ]);

    expect(merged).toEqual([{ name: 'monograph', count: 40 }]);
    expect(aliasMap.get('monograph')).toEqual(['monograph']);
  });

  it('sorts merged list by count descending', () => {
    const { merged } = mergeDocumentTypes([
      { name: 'monograph', count: 5 },
      { name: 'book', count: 100 },
      { name: 'article', count: 30 },
    ]);

    expect(merged.map((m) => m.count)).toEqual([100, 30, 5]);
  });

  it('keeps unknown types as their own canonical entry', () => {
    const { merged, aliasMap } = mergeDocumentTypes([
      { name: 'unmapped', count: 7 },
    ]);

    expect(merged).toEqual([{ name: 'unmapped', count: 7 }]);
    expect(aliasMap.get('unmapped')).toEqual(['unmapped']);
  });
});
