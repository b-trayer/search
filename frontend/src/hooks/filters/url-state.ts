import type { Filters } from './filter-types';
import { EMPTY_FILTERS } from './filter-types';
import type { SearchField, SortBy } from '@/lib/types';

export interface UrlSearchState {
  query: string;
  filters: Filters;
  searchField: SearchField;
  sortBy: SortBy;
  enablePersonalization: boolean;
  userId: number | null;
}

const SEARCH_FIELDS: SearchField[] = ['all', 'title', 'authors', 'subjects', 'collection'];
const SORT_VALUES: SortBy[] = ['relevance', 'year_desc', 'year_asc', 'title_asc', 'popularity_desc'];

const KEYS = {
  query: 'q',
  databases: 'db',
  documentTypes: 'type',
  collections: 'col',
  knowledgeAreas: 'area',
  languages: 'lang',
  sources: 'src',
  yearFrom: 'yfrom',
  yearTo: 'yto',
  hasPdf: 'pdf',
  searchField: 'pf',
  sortBy: 'sort',
  personalization: 'pers',
  userId: 'u',
} as const;

function parseList(raw: string | null): string[] {
  if (!raw) return [];
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function parseInt10(raw: string | null): number | null {
  if (raw === null || raw === '') return null;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) ? n : null;
}

function parseBool(raw: string | null): boolean | null {
  if (raw === null) return null;
  if (raw === '1' || raw === 'true') return true;
  if (raw === '0' || raw === 'false') return false;
  return null;
}

export function parseSearchParams(params: URLSearchParams): UrlSearchState {
  const searchFieldRaw = params.get(KEYS.searchField);
  const searchField: SearchField = SEARCH_FIELDS.includes(searchFieldRaw as SearchField)
    ? (searchFieldRaw as SearchField)
    : 'all';

  const sortRaw = params.get(KEYS.sortBy);
  const sortBy: SortBy = SORT_VALUES.includes(sortRaw as SortBy)
    ? (sortRaw as SortBy)
    : 'relevance';

  return {
    query: params.get(KEYS.query) ?? '',
    searchField,
    sortBy,
    enablePersonalization: parseBool(params.get(KEYS.personalization)) !== false,
    userId: parseInt10(params.get(KEYS.userId)),
    filters: {
      ...EMPTY_FILTERS,
      databases: parseList(params.get(KEYS.databases)),
      document_types: parseList(params.get(KEYS.documentTypes)),
      collections: parseList(params.get(KEYS.collections)),
      knowledge_areas: parseList(params.get(KEYS.knowledgeAreas)),
      languages: parseList(params.get(KEYS.languages)),
      sources: parseList(params.get(KEYS.sources)),
      year_from: parseInt10(params.get(KEYS.yearFrom)),
      year_to: parseInt10(params.get(KEYS.yearTo)),
      has_pdf: parseBool(params.get(KEYS.hasPdf)),
    },
  };
}

export function buildSearchParams(state: UrlSearchState): URLSearchParams {
  const params = new URLSearchParams();

  if (state.query.trim()) params.set(KEYS.query, state.query);
  if (state.searchField !== 'all') params.set(KEYS.searchField, state.searchField);
  if (state.sortBy !== 'relevance') params.set(KEYS.sortBy, state.sortBy);
  if (!state.enablePersonalization) params.set(KEYS.personalization, '0');
  if (state.userId !== null) params.set(KEYS.userId, String(state.userId));

  const f = state.filters;
  if (f.databases.length > 0) params.set(KEYS.databases, f.databases.join(','));
  if (f.document_types.length > 0) params.set(KEYS.documentTypes, f.document_types.join(','));
  if (f.collections.length > 0) params.set(KEYS.collections, f.collections.join(','));
  if (f.knowledge_areas.length > 0) params.set(KEYS.knowledgeAreas, f.knowledge_areas.join(','));
  if (f.languages.length > 0) params.set(KEYS.languages, f.languages.join(','));
  if (f.sources.length > 0) params.set(KEYS.sources, f.sources.join(','));
  if (f.year_from !== null) params.set(KEYS.yearFrom, String(f.year_from));
  if (f.year_to !== null) params.set(KEYS.yearTo, String(f.year_to));
  if (f.has_pdf !== null) params.set(KEYS.hasPdf, f.has_pdf ? '1' : '0');

  return params;
}
