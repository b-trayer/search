import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFilters } from './use-filters';

describe('useFilters', () => {
  it('initializes with empty filters', () => {
    const { result } = renderHook(() => useFilters());

    expect(result.current.filters).toEqual({
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
    expect(result.current.totalSelected).toBe(0);
  });

  it('initializes with custom filters', () => {
    const { result } = renderHook(() => useFilters({
      languages: ['ru', 'en'],
      has_pdf: true,
    }));

    expect(result.current.filters.languages).toEqual(['ru', 'en']);
    expect(result.current.filters.has_pdf).toBe(true);
    expect(result.current.totalSelected).toBe(3);
  });

  describe('toggle', () => {
    it('adds item when checked is true', () => {
      const { result } = renderHook(() => useFilters());

      act(() => {
        result.current.toggle('languages', 'ru', true);
      });

      expect(result.current.filters.languages).toEqual(['ru']);
      expect(result.current.totalSelected).toBe(1);
    });

    it('removes item when checked is false', () => {
      const { result } = renderHook(() => useFilters({ languages: ['ru', 'en'] }));

      act(() => {
        result.current.toggle('languages', 'ru', false);
      });

      expect(result.current.filters.languages).toEqual(['en']);
      expect(result.current.totalSelected).toBe(1);
    });

    it('works with different filter types', () => {
      const { result } = renderHook(() => useFilters());

      act(() => {
        result.current.toggle('collections', 'books', true);
        result.current.toggle('document_types', 'textbook', true);
        result.current.toggle('sources', 'nsu', true);
      });

      expect(result.current.filters.collections).toEqual(['books']);
      expect(result.current.filters.document_types).toEqual(['textbook']);
      expect(result.current.filters.sources).toEqual(['nsu']);
      expect(result.current.totalSelected).toBe(3);
    });
  });

  describe('setHasPdf', () => {
    it('sets has_pdf to true', () => {
      const { result } = renderHook(() => useFilters());

      act(() => {
        result.current.setHasPdf(true);
      });

      expect(result.current.filters.has_pdf).toBe(true);
      expect(result.current.totalSelected).toBe(1);
    });

    it('sets has_pdf to null', () => {
      const { result } = renderHook(() => useFilters({ has_pdf: true }));

      act(() => {
        result.current.setHasPdf(null);
      });

      expect(result.current.filters.has_pdf).toBeNull();
      expect(result.current.totalSelected).toBe(0);
    });
  });

  describe('reset', () => {
    it('resets all filters', () => {
      const { result } = renderHook(() => useFilters({
        languages: ['ru'],
        sources: ['nsu'],
        has_pdf: true,
      }));

      expect(result.current.totalSelected).toBe(3);

      act(() => {
        result.current.reset();
      });

      expect(result.current.filters).toEqual({
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
      expect(result.current.totalSelected).toBe(0);
    });
  });

  describe('setFilters', () => {
    it('sets entire filters object', () => {
      const { result } = renderHook(() => useFilters());

      act(() => {
        result.current.setFilters({
          collections: ['a'],
          knowledge_areas: ['b'],
          document_types: ['c'],
          languages: ['d'],
          sources: ['e'],
          databases: ['BOOKS'],
          year_from: null,
          year_to: null,
          has_pdf: true,
        });
      });

      expect(result.current.filters.collections).toEqual(['a']);
      expect(result.current.filters.databases).toEqual(['BOOKS']);
      expect(result.current.filters.has_pdf).toBe(true);
      expect(result.current.totalSelected).toBe(7);
    });
  });

  describe('databases', () => {
    it('adds and removes databases via toggle', () => {
      const { result } = renderHook(() => useFilters());

      act(() => {
        result.current.toggle('databases', 'BOOKS', true);
        result.current.toggle('databases', 'SERIAL', true);
      });
      expect(result.current.filters.databases).toEqual(['BOOKS', 'SERIAL']);
      expect(result.current.totalSelected).toBe(2);

      act(() => {
        result.current.toggle('databases', 'BOOKS', false);
      });
      expect(result.current.filters.databases).toEqual(['SERIAL']);
      expect(result.current.totalSelected).toBe(1);
    });
  });

  describe('setYearRange', () => {
    it('sets and clears year range', () => {
      const { result } = renderHook(() => useFilters());

      act(() => {
        result.current.setYearRange(2010, 2020);
      });
      expect(result.current.filters.year_from).toBe(2010);
      expect(result.current.filters.year_to).toBe(2020);
      expect(result.current.totalSelected).toBe(1);

      act(() => {
        result.current.setYearRange(null, null);
      });
      expect(result.current.filters.year_from).toBeNull();
      expect(result.current.filters.year_to).toBeNull();
      expect(result.current.totalSelected).toBe(0);
    });
  });

  describe('totalSelected', () => {
    it('counts all selected items correctly', () => {
      const { result } = renderHook(() => useFilters({
        collections: ['a', 'b'],
        knowledge_areas: ['c'],
        document_types: ['d', 'e', 'f'],
        languages: ['g'],
        sources: [],
        has_pdf: true,
      }));

      expect(result.current.totalSelected).toBe(8);
    });

    it('does not count has_pdf when null', () => {
      const { result } = renderHook(() => useFilters({
        languages: ['ru'],
        has_pdf: null,
      }));

      expect(result.current.totalSelected).toBe(1);
    });
  });
});
