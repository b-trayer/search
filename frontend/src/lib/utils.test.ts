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
    expect(formatOtherAuthors(['А', 'Б', 'В', 'Г'])).toBe('А, Б и еще 2');
  });

  it('respects custom maxVisible', () => {
    expect(formatOtherAuthors(['А', 'Б', 'В'], 1)).toBe('А и еще 2');
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

  it('removes duplicates and capitalises the first letter', () => {
    const result = uniqueBadges(['Физика', 'физика', 'ФИЗИКА']);
    expect(result).toEqual(['Физика']);
  });

  it('splits by semicolon', () => {
    const result = uniqueBadges(['Физика; Математика']);
    expect(result).toContain('Физика');
    expect(result).toContain('Математика');
  });

  it('splits by comma', () => {
    const result = uniqueBadges(['Физика, Математика']);
    expect(result).toContain('Физика');
    expect(result).toContain('Математика');
  });

  it('splits on uppercase transitions', () => {
    const result = uniqueBadges(['Физика Теоретическая физика']);
    expect(result).toContain('Физика');
    expect(result).toContain('Теоретическая физика');
  });

  it('preserves order of first occurrence', () => {
    const result = uniqueBadges(['Физика', 'Математика', 'Физика']);
    expect(result[0]).toBe('Физика');
    expect(result[1]).toBe('Математика');
    expect(result).toHaveLength(2);
  });

  it('splits long lowercase string by material markers', () => {
    const result = uniqueBadges([
      'математический анализ (учебники) комплексный анализ (учебники) гармонический анализ (учебники)',
    ]);
    expect(result).toEqual([
      'Математический анализ',
      'Комплексный анализ',
      'Гармонический анализ',
    ]);
  });

  it('strips noisy library rubrics', () => {
    const result = uniqueBadges([
      'Математический анализ (задачники) Труды штатных преподавателей НГУ',
    ]);
    expect(result).toEqual(['Математический анализ']);
  });

  it('drops Учебные издания для высших учебных заведений', () => {
    const result = uniqueBadges([
      'Математический анализ Задачи Решение Учебные издания для высших учебных заведений',
    ]);
    expect(result).toContain('Математический анализ');
    expect(result).not.toContain('Учебные издания для высших учебных заведений');
  });

  it('handles mix of capital and lowercase entries', () => {
    const result = uniqueBadges([
      'История',
      'Войны (история)',
      'Пелопоннесская война',
    ]);
    expect(result).toEqual(['История', 'Войны', 'Пелопоннесская война']);
  });
});
