import { describe, it, expect } from 'vitest';
import { cn, parseAuthors, formatOtherAuthors, formatBadgeText, uniqueBadges } from './utils';

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('handles conditional classes', () => {
    expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz');
  });

  it('merges tailwind classes correctly', () => {
    expect(cn('p-4', 'p-2')).toBe('p-2');
  });
});

describe('parseAuthors', () => {
  it('returns empty result for null input', () => {
    const result = parseAuthors(null);
    expect(result).toEqual({ mainAuthor: '', otherAuthors: [], all: [] });
  });

  it('returns empty result for undefined input', () => {
    const result = parseAuthors(undefined);
    expect(result).toEqual({ mainAuthor: '', otherAuthors: [], all: [] });
  });

  it('returns empty result for empty string', () => {
    const result = parseAuthors('');
    expect(result).toEqual({ mainAuthor: '', otherAuthors: [], all: [] });
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
    expect(result.all).toEqual(['Иванов И.И.', 'Петров П.П.', 'Сидоров С.С.']);
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

  it('returns single author', () => {
    expect(formatOtherAuthors(['Петров П.П.'])).toBe('Петров П.П.');
  });

  it('returns two authors', () => {
    expect(formatOtherAuthors(['Петров П.П.', 'Сидоров С.С.'])).toBe('Петров П.П., Сидоров С.С.');
  });

  it('truncates with default maxVisible', () => {
    const authors = ['Петров П.П.', 'Сидоров С.С.', 'Козлов К.К.', 'Смирнов С.С.'];
    expect(formatOtherAuthors(authors)).toBe('Петров П.П., Сидоров С.С. и ещё 2');
  });

  it('respects custom maxVisible', () => {
    const authors = ['A', 'B', 'C', 'D'];
    expect(formatOtherAuthors(authors, 3)).toBe('A, B, C и ещё 1');
  });
});

describe('formatBadgeText', () => {
  it('returns empty string for empty input', () => {
    expect(formatBadgeText('')).toBe('');
  });

  it('translates known document types', () => {
    expect(formatBadgeText('textbook')).toBe('Учебник');
    expect(formatBadgeText('dissertation')).toBe('Диссертация');
    expect(formatBadgeText('article')).toBe('Статья');
    expect(formatBadgeText('monograph')).toBe('Монография');
  });

  it('handles case insensitive input', () => {
    expect(formatBadgeText('TEXTBOOK')).toBe('Учебник');
    expect(formatBadgeText('Dissertation')).toBe('Диссертация');
  });

  it('removes parentheses content', () => {
    expect(formatBadgeText('Физика (общий курс)')).toBe('Физика');
  });

  it('capitalizes first letter for unknown types', () => {
    expect(formatBadgeText('unknown_type')).toBe('Unknown_type');
  });
});

describe('uniqueBadges', () => {
  it('returns empty array for empty input', () => {
    expect(uniqueBadges([])).toEqual([]);
  });

  it('removes duplicates case-insensitively', () => {
    const result = uniqueBadges(['Физика', 'физика', 'ФИЗИКА']);
    expect(result).toEqual(['Физика']);
  });

  it('formats and deduplicates', () => {
    const result = uniqueBadges(['textbook', 'Textbook', 'учебник']);
    expect(result.length).toBeLessThanOrEqual(2);
  });

  it('preserves order of first occurrence', () => {
    const result = uniqueBadges(['A', 'B', 'A', 'C']);
    expect(result).toEqual(['A', 'B', 'C']);
  });
});
