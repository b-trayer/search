import { useState, useCallback } from 'react';
import { Filters, EMPTY_FILTERS } from './filters/filter-types';
export type { Filters } from './filters/filter-types';
export { EMPTY_FILTERS, convertFiltersToSearchParams, hasActiveFilters } from './filters/filter-types';

type ListKey = 'collections' | 'knowledge_areas' | 'document_types' | 'languages' | 'sources' | 'databases';

export function countActiveFilters(filters: Filters): number {
  return (
    filters.collections.length +
    filters.knowledge_areas.length +
    filters.document_types.length +
    filters.languages.length +
    filters.sources.length +
    filters.databases.length +
    (filters.year_from !== null || filters.year_to !== null ? 1 : 0) +
    (filters.has_pdf !== null ? 1 : 0)
  );
}

export function useFilters(initialFilters?: Partial<Filters>) {
  const [filters, setFilters] = useState<Filters>({ ...EMPTY_FILTERS, ...initialFilters });

  const toggle = useCallback((key: ListKey, name: string, checked: boolean) => {
    setFilters((prev) => ({
      ...prev,
      [key]: checked ? [...prev[key], name] : prev[key].filter((item) => item !== name),
    }));
  }, []);

  const setHasPdf = useCallback(
    (value: boolean | null) => setFilters((prev) => ({ ...prev, has_pdf: value })),
    [],
  );

  const setYearRange = useCallback(
    (year_from: number | null, year_to: number | null) =>
      setFilters((prev) => ({ ...prev, year_from, year_to })),
    [],
  );

  const reset = useCallback(() => setFilters(EMPTY_FILTERS), []);

  const totalSelected = countActiveFilters(filters);

  return { filters, setFilters, toggle, setHasPdf, setYearRange, reset, totalSelected };
}
