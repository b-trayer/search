import type { DocumentResult, UserProfile, SearchStats, SearchFilters, SearchField } from '@/lib/types';

export interface SearchState {
  query: string;
  results: DocumentResult[];
  isLoading: boolean;
  hasSearched: boolean;
  totalResults: number;
  page: number;
  totalPages: number;
  isPersonalized: boolean;
  userProfile: UserProfile | null;
  stats: SearchStats;
  error: string | null;
  errorCode: string | null;
  isRetryable: boolean;
  totalImpressions: number;
  lastSearchParams: {
    userId?: number;
    enablePersonalization: boolean;
    filters?: SearchFilters;
    searchField?: SearchField;
  } | null;
}

export type SearchAction =
  | { type: 'SET_QUERY'; payload: string }
  | { type: 'SEARCH_START' }
  | { type: 'SEARCH_SUCCESS'; payload: { results: DocumentResult[]; total: number; page: number; totalPages: number; personalized: boolean; userProfile: UserProfile | null } }
  | { type: 'SEARCH_ERROR'; payload: { error: string; errorCode: string; isRetryable: boolean } }
  | { type: 'SET_STATS'; payload: SearchStats }
  | { type: 'SET_IMPRESSIONS'; payload: number }
  | { type: 'SET_LAST_PARAMS'; payload: SearchState['lastSearchParams'] }
  | { type: 'RESET' }
  | { type: 'SET_EMPTY_QUERY_ERROR' }
  | { type: 'SET_PAGE'; payload: number }
  | { type: 'INCREMENT_CLICK'; payload: string };

export const DEFAULT_STATS: SearchStats = {
  totalResults: 0,
  avgCTR: 0,
  impressions: 0,
};

export const initialSearchState: SearchState = {
  query: '',
  results: [],
  isLoading: false,
  hasSearched: false,
  totalResults: 0,
  page: 1,
  totalPages: 1,
  isPersonalized: false,
  userProfile: null,
  stats: DEFAULT_STATS,
  error: null,
  errorCode: null,
  isRetryable: false,
  totalImpressions: 0,
  lastSearchParams: null,
};
