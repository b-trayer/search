import type { SearchFilters } from '@/lib/types';

export interface Filters {
  collections: string[];
  knowledge_areas: string[];
  document_types: string[];
  languages: string[];
  sources: string[];
  has_pdf: boolean | null;
}

export const EMPTY_FILTERS: Filters = {
  collections: [],
  knowledge_areas: [],
  document_types: [],
  languages: [],
  sources: [],
  has_pdf: null,
};

export function convertFiltersToSearchParams(filters: Filters): SearchFilters | undefined {
  const hasFilters =
    filters.collections.length > 0 || filters.languages.length > 0 ||
    filters.document_types.length > 0 || filters.knowledge_areas.length > 0 ||
    filters.sources.length > 0 || filters.has_pdf !== null;

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
