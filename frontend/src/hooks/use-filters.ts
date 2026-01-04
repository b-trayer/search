
import { useState, useCallback } from 'react';
import type { SearchFilters } from '@/lib/types';

export interface Filters {
  collections: string[];
  knowledge_areas: string[];
  document_types: string[];
  languages: string[];
  sources: string[];
  has_pdf: boolean | null;
}

export function convertFiltersToSearchParams(filters: Filters): SearchFilters | undefined {
  const hasFilters =
    filters.collections.length > 0 ||
    filters.languages.length > 0 ||
    filters.document_types.length > 0 ||
    filters.knowledge_areas.length > 0 ||
    filters.sources.length > 0 ||
    filters.has_pdf !== null;

  if (!hasFilters) return undefined;

  return {
    collection: filters.collections[0],
    language: filters.languages[0],
    document_type: filters.document_types.length > 0 ? filters.document_types : undefined,
    knowledge_area: filters.knowledge_areas[0],
    source: filters.sources[0],
    has_pdf: filters.has_pdf ?? undefined,
  };
}

const EMPTY_FILTERS: Filters = {
  collections: [],
  knowledge_areas: [],
  document_types: [],
  languages: [],
  sources: [],
  has_pdf: null,
};

export function useFilters(initialFilters?: Partial<Filters>) {
  const [filters, setFilters] = useState<Filters>({
    ...EMPTY_FILTERS,
    ...initialFilters,
  });

  const toggle = useCallback((key: keyof Omit<Filters, 'has_pdf'>, name: string, checked: boolean) => {
    setFilters((prev) => ({
      ...prev,
      [key]: checked
        ? [...prev[key], name]
        : prev[key].filter((item) => item !== name),
    }));
  }, []);

  const setHasPdf = useCallback((value: boolean | null) => {
    setFilters((prev) => ({ ...prev, has_pdf: value }));
  }, []);

  const reset = useCallback(() => {
    setFilters(EMPTY_FILTERS);
  }, []);

  const totalSelected =
    filters.collections.length +
    filters.knowledge_areas.length +
    filters.document_types.length +
    filters.languages.length +
    filters.sources.length +
    (filters.has_pdf !== null ? 1 : 0);

  return {
    filters,
    setFilters,
    toggle,
    setHasPdf,
    reset,
    totalSelected,
  };
}
