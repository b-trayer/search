import { useState, useCallback } from 'react';
import { Filters, EMPTY_FILTERS, convertFiltersToSearchParams } from './filters/filter-types';
export type { Filters } from './filters/filter-types';
export { convertFiltersToSearchParams } from './filters/filter-types';

export function useFilters(initialFilters?: Partial<Filters>) {
  const [filters, setFilters] = useState<Filters>({ ...EMPTY_FILTERS, ...initialFilters });

  const toggle = useCallback((key: keyof Omit<Filters, 'has_pdf'>, name: string, checked: boolean) => {
    setFilters((prev) => ({
      ...prev,
      [key]: checked ? [...prev[key], name] : prev[key].filter((item) => item !== name),
    }));
  }, []);

  const setHasPdf = useCallback((value: boolean | null) => setFilters((prev) => ({ ...prev, has_pdf: value })), []);
  const reset = useCallback(() => setFilters(EMPTY_FILTERS), []);

  const totalSelected =
    filters.collections.length + filters.knowledge_areas.length + filters.document_types.length +
    filters.languages.length + filters.sources.length + (filters.has_pdf !== null ? 1 : 0);

  return { filters, setFilters, toggle, setHasPdf, reset, totalSelected };
}
