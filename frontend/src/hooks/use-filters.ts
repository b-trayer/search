
import { useState, useCallback } from 'react';

export interface Filters {
  collections: string[];
  subjects: string[];
  languages: string[];
}

const EMPTY_FILTERS: Filters = {
  collections: [],
  subjects: [],
  languages: [],
};

export function useFilters(initialFilters?: Partial<Filters>) {
  const [filters, setFilters] = useState<Filters>({
    ...EMPTY_FILTERS,
    ...initialFilters,
  });

  const toggleCollection = useCallback((name: string, checked: boolean) => {
    setFilters((prev) => ({
      ...prev,
      collections: checked
        ? [...prev.collections, name]
        : prev.collections.filter((c) => c !== name),
    }));
  }, []);

  const toggleSubject = useCallback((name: string, checked: boolean) => {
    setFilters((prev) => ({
      ...prev,
      subjects: checked
        ? [...prev.subjects, name]
        : prev.subjects.filter((s) => s !== name),
    }));
  }, []);

  const toggleLanguage = useCallback((name: string, checked: boolean) => {
    setFilters((prev) => ({
      ...prev,
      languages: checked
        ? [...prev.languages, name]
        : prev.languages.filter((l) => l !== name),
    }));
  }, []);

  const reset = useCallback(() => {
    setFilters(EMPTY_FILTERS);
  }, []);

  const totalSelected =
    filters.collections.length +
    filters.subjects.length +
    filters.languages.length;

  return {
    filters,
    setFilters,
    toggleCollection,
    toggleSubject,
    toggleLanguage,
    reset,
    totalSelected,
  };
}
