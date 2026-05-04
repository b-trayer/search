import { describe, expect, it } from 'vitest';
import { parseSearchParams, buildSearchParams } from './url-state';
import { EMPTY_FILTERS } from './filter-types';

describe('parseSearchParams', () => {
  it('returns defaults for an empty url', () => {
    const state = parseSearchParams(new URLSearchParams());
    expect(state.query).toBe('');
    expect(state.searchField).toBe('all');
    expect(state.sortBy).toBe('relevance');
    expect(state.enablePersonalization).toBe(true);
    expect(state.userId).toBeNull();
    expect(state.filters).toEqual(EMPTY_FILTERS);
  });

  it('parses query, sort and search field', () => {
    const state = parseSearchParams(
      new URLSearchParams('?q=квантовая&sort=year_desc&pf=title'),
    );
    expect(state.query).toBe('квантовая');
    expect(state.sortBy).toBe('year_desc');
    expect(state.searchField).toBe('title');
  });

  it('parses comma-separated list filters', () => {
    const state = parseSearchParams(
      new URLSearchParams('?db=BOOKS,SERIAL&type=book,textbook&col=Учебники'),
    );
    expect(state.filters.databases).toEqual(['BOOKS', 'SERIAL']);
    expect(state.filters.document_types).toEqual(['book', 'textbook']);
    expect(state.filters.collections).toEqual(['Учебники']);
  });

  it('parses year and pdf filters', () => {
    const state = parseSearchParams(
      new URLSearchParams('?yfrom=2020&yto=2024&pdf=1'),
    );
    expect(state.filters.year_from).toBe(2020);
    expect(state.filters.year_to).toBe(2024);
    expect(state.filters.has_pdf).toBe(true);
  });

  it('parses user id and personalization off', () => {
    const state = parseSearchParams(new URLSearchParams('?u=42&pers=0'));
    expect(state.userId).toBe(42);
    expect(state.enablePersonalization).toBe(false);
  });

  it('falls back to defaults on invalid sort/field values', () => {
    const state = parseSearchParams(
      new URLSearchParams('?sort=bogus&pf=invalid'),
    );
    expect(state.sortBy).toBe('relevance');
    expect(state.searchField).toBe('all');
  });
});

describe('buildSearchParams', () => {
  it('emits an empty url for default state', () => {
    const params = buildSearchParams({
      query: '',
      filters: EMPTY_FILTERS,
      searchField: 'all',
      sortBy: 'relevance',
      enablePersonalization: true,
      userId: null,
    });
    expect(params.toString()).toBe('');
  });

  it('serialises query and sort and field', () => {
    const params = buildSearchParams({
      query: 'физика',
      filters: EMPTY_FILTERS,
      searchField: 'title',
      sortBy: 'year_desc',
      enablePersonalization: true,
      userId: null,
    });
    expect(params.get('q')).toBe('физика');
    expect(params.get('sort')).toBe('year_desc');
    expect(params.get('pf')).toBe('title');
  });

  it('serialises list filters as comma-separated', () => {
    const params = buildSearchParams({
      query: '',
      filters: { ...EMPTY_FILTERS, databases: ['BOOKS', 'ELIB'], document_types: ['book'] },
      searchField: 'all',
      sortBy: 'relevance',
      enablePersonalization: true,
      userId: null,
    });
    expect(params.get('db')).toBe('BOOKS,ELIB');
    expect(params.get('type')).toBe('book');
  });

  it('serialises year and pdf filters', () => {
    const params = buildSearchParams({
      query: '',
      filters: { ...EMPTY_FILTERS, year_from: 2010, year_to: 2024, has_pdf: false },
      searchField: 'all',
      sortBy: 'relevance',
      enablePersonalization: true,
      userId: null,
    });
    expect(params.get('yfrom')).toBe('2010');
    expect(params.get('yto')).toBe('2024');
    expect(params.get('pdf')).toBe('0');
  });

  it('round-trips a complex state via URL', () => {
    const state = {
      query: 'математика',
      filters: {
        ...EMPTY_FILTERS,
        databases: ['BOOKS'],
        document_types: ['book', 'textbook'],
        year_from: 2020,
        has_pdf: true,
      },
      searchField: 'authors' as const,
      sortBy: 'title_asc' as const,
      enablePersonalization: false,
      userId: 7,
    };
    const params = buildSearchParams(state);
    expect(parseSearchParams(params)).toEqual(state);
  });
});
