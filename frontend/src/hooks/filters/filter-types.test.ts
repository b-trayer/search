import { describe, expect, it } from 'vitest';
import {
  EMPTY_FILTERS,
  convertFiltersToSearchParams,
  type Filters,
} from './filter-types';

const FULL_DEFAULTS: Filters = { ...EMPTY_FILTERS };

describe('EMPTY_FILTERS', () => {
  it('contains every list filter empty and scalar fields null', () => {
    expect(EMPTY_FILTERS).toEqual({
      collections: [],
      knowledge_areas: [],
      document_types: [],
      languages: [],
      sources: [],
      databases: [],
      year_from: null,
      year_to: null,
      has_pdf: null,
    });
  });
});

describe('convertFiltersToSearchParams', () => {
  it('returns undefined when nothing is selected', () => {
    expect(convertFiltersToSearchParams(FULL_DEFAULTS)).toBeUndefined();
  });

  it('maps single-value list filters to scalar params', () => {
    const result = convertFiltersToSearchParams({
      ...FULL_DEFAULTS,
      collections: ['Учебные'],
      languages: ['Русский'],
      knowledge_areas: ['Физика'],
      sources: ['nsu'],
    });

    expect(result).toEqual({
      collection: 'Учебные',
      language: 'Русский',
      knowledge_area: 'Физика',
      source: 'nsu',
      databases: undefined,
      document_type: undefined,
      year_from: undefined,
      year_to: undefined,
      has_pdf: undefined,
    });
  });

  it('passes document_types as array when any are selected', () => {
    const result = convertFiltersToSearchParams({
      ...FULL_DEFAULTS,
      document_types: ['book', 'textbook'],
    });

    expect(result?.document_type).toEqual(['book', 'textbook']);
  });

  it('passes databases as array when any are selected', () => {
    const result = convertFiltersToSearchParams({
      ...FULL_DEFAULTS,
      databases: ['BOOKS', 'ELIB'],
    });

    expect(result?.databases).toEqual(['BOOKS', 'ELIB']);
  });

  it('keeps databases undefined when list is empty', () => {
    const result = convertFiltersToSearchParams({
      ...FULL_DEFAULTS,
      has_pdf: true,
    });

    expect(result?.databases).toBeUndefined();
  });

  it('forwards a year-from-only range', () => {
    const result = convertFiltersToSearchParams({ ...FULL_DEFAULTS, year_from: 2010 });

    expect(result).toEqual(
      expect.objectContaining({ year_from: 2010, year_to: undefined }),
    );
  });

  it('forwards a year-to-only range', () => {
    const result = convertFiltersToSearchParams({ ...FULL_DEFAULTS, year_to: 1990 });

    expect(result).toEqual(
      expect.objectContaining({ year_from: undefined, year_to: 1990 }),
    );
  });

  it('forwards a full year range', () => {
    const result = convertFiltersToSearchParams({
      ...FULL_DEFAULTS,
      year_from: 2000,
      year_to: 2024,
    });

    expect(result?.year_from).toBe(2000);
    expect(result?.year_to).toBe(2024);
  });

  it('forwards has_pdf=true', () => {
    const result = convertFiltersToSearchParams({ ...FULL_DEFAULTS, has_pdf: true });
    expect(result?.has_pdf).toBe(true);
  });

  it('forwards has_pdf=false', () => {
    const result = convertFiltersToSearchParams({ ...FULL_DEFAULTS, has_pdf: false });
    expect(result?.has_pdf).toBe(false);
  });

  it('returns first item when several are present in single-value lists', () => {
    const result = convertFiltersToSearchParams({
      ...FULL_DEFAULTS,
      collections: ['A', 'B'],
      languages: ['ru', 'en'],
      knowledge_areas: ['X', 'Y'],
      sources: ['s1', 's2'],
    });

    expect(result?.collection).toBe('A');
    expect(result?.language).toBe('ru');
    expect(result?.knowledge_area).toBe('X');
    expect(result?.source).toBe('s1');
  });
});
