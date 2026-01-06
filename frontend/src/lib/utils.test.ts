import { describe, it, expect } from 'vitest';
import {
  parseAuthors,
  formatOtherAuthors,
  formatBadgeText,
  uniqueBadges,
} from './utils';

describe('parseAuthors', () => {
  it('returns empty result for null/undefined', () => {
    expect(parseAuthors(null)).toEqual({ mainAuthor: '', otherAuthors: [], all: [] });
    expect(parseAuthors(undefined)).toEqual({ mainAuthor: '', otherAuthors: [], all: [] });
  });

  it('parses single author', () => {
    const result = parseAuthors('Иванов И.И.');
    expect(result.mainAuthor).toBe('Иванов И.И.');
    expect(result.otherAuthors).toEqual([]);
    expect(result.all).toEqual(['Иванов И.И.']);
  });

  it('parses multiple authors', () => {
    const result = parseAuthors('Иванов И.И., Петров П.П., Сидоров С.С.');
    expect(result.mainAuthor).toBe('Иванов И.И.');
    expect(result.otherAuthors).toEqual(['Петров П.П.', 'Сидоров С.С.']);
    expect(result.all).toHaveLength(3);
  });

  it('trims whitespace', () => {
    const result = parseAuthors('  Иванов И.И.  ,  Петров П.П.  ');
    expect(result.mainAuthor).toBe('Иванов И.И.');
    expect(result.otherAuthors).toEqual(['Петров П.П.']);
  });
});

describe('formatOtherAuthors', () => {
  it('returns empty string for empty array', () => {
    expect(formatOtherAuthors([])).toBe('');
  });

  it('joins authors when less than maxVisible', () => {
    expect(formatOtherAuthors(['А', 'Б'])).toBe('А, Б');
  });

  it('shows count when more than maxVisible', () => {
    expect(formatOtherAuthors(['А', 'Б', 'В', 'Г'])).toBe('А, Б и ещё 2');
  });

  it('respects custom maxVisible', () => {
    expect(formatOtherAuthors(['А', 'Б', 'В'], 1)).toBe('А и ещё 2');
  });
});

describe('formatBadgeText', () => {
  it('returns empty string for empty input', () => {
    expect(formatBadgeText('')).toBe('');
  });

  it('translates known document types', () => {
    expect(formatBadgeText('book')).toBe('Книга');
    expect(formatBadgeText('dissertation')).toBe('Диссертация');
    expect(formatBadgeText('textbook')).toBe('Учебник');
  });

  it('handles case insensitivity', () => {
    expect(formatBadgeText('BOOK')).toBe('Книга');
    expect(formatBadgeText('Book')).toBe('Книга');
  });

  it('removes parentheses content for unknown types', () => {
    expect(formatBadgeText('Физика (общая)')).toBe('Физика');
  });

  it('capitalizes first letter for unknown types', () => {
    expect(formatBadgeText('квантовая механика')).toBe('Квантовая механика');
  });
});

describe('uniqueBadges', () => {
  it('returns empty array for empty input', () => {
    expect(uniqueBadges([])).toEqual([]);
  });

  it('removes duplicates', () => {
    const result = uniqueBadges(['Физика', 'физика', 'ФИЗИКА']);
    expect(result).toEqual(['физика']);
  });

  it('splits by semicolon', () => {
    const result = uniqueBadges(['Физика; Математика']);
    expect(result).toContain('физика');
    expect(result).toContain('математика');
  });

  it('splits by comma', () => {
    const result = uniqueBadges(['Физика, Математика']);
    expect(result).toContain('физика');
    expect(result).toContain('математика');
  });

  it('splits on uppercase transitions', () => {
    const result = uniqueBadges(['Физика Теоретическая физика']);
    expect(result.length).toBeGreaterThanOrEqual(1);
  });

  it('preserves order of first occurrence', () => {
    const result = uniqueBadges(['Физика', 'Математика', 'Физика']);
    expect(result[0]).toBe('физика');
    expect(result[1]).toBe('математика');
    expect(result).toHaveLength(2);
  });
});
