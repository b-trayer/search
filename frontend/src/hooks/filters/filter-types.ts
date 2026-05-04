import type { SearchFilters } from '@/lib/types';

export interface Filters {
  collections: string[];
  knowledge_areas: string[];
  document_types: string[];
  languages: string[];
  sources: string[];
  databases: string[];
  year_from: number | null;
  year_to: number | null;
  has_pdf: boolean | null;
}

export const EMPTY_FILTERS: Filters = {
  collections: [],
  knowledge_areas: [],
  document_types: [],
  languages: [],
  sources: [],
  databases: [],
  year_from: null,
  year_to: null,
  has_pdf: null,
};

export function hasActiveFilters(filters: Filters): boolean {
  return (
    filters.collections.length > 0 ||
    filters.languages.length > 0 ||
    filters.document_types.length > 0 ||
    filters.knowledge_areas.length > 0 ||
    filters.sources.length > 0 ||
    filters.databases.length > 0 ||
    filters.year_from !== null ||
    filters.year_to !== null ||
    filters.has_pdf !== null
  );
}

export function convertFiltersToSearchParams(filters: Filters): SearchFilters | undefined {
  if (!hasActiveFilters(filters)) return undefined;
  return {
    collection: filters.collections[0],
    language: filters.languages[0],
    document_type: filters.document_types.length > 0 ? filters.document_types : undefined,
    knowledge_area: filters.knowledge_areas[0],
    source: filters.sources[0],
    databases: filters.databases.length > 0 ? filters.databases : undefined,
    year_from: filters.year_from ?? undefined,
    year_to: filters.year_to ?? undefined,
    has_pdf: filters.has_pdf ?? undefined,
  };
}
