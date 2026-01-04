import type { DocumentResult, UserProfile, SearchStats, SearchFilters } from '@/lib/types';

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

function handleIncrementClick(state: SearchState, documentId: string): SearchState {
  const updatedResults = state.results.map(doc => {
    if (doc.document_id !== documentId) return doc;

    const newClicks = doc.clicks + 1;
    const w = doc.weights;
    const alpha = w?.ctr_alpha_prior ?? 1.0;
    const beta = w?.ctr_beta_prior ?? 10.0;
    const newSmoothedCtr = (newClicks + alpha) / (doc.impressions + alpha + beta);
    const newCtrFactor = Math.log(1 + newSmoothedCtr * 10);
    const newCtrContrib = (w?.beta_ctr ?? 0.5) * newCtrFactor;
    const newFinalScore = doc.log_bm25 + (doc.user_contrib ?? 0) + newCtrContrib;

    return {
      ...doc,
      clicks: newClicks,
      smoothed_ctr: newSmoothedCtr,
      ctr_factor: newCtrFactor,
      ctr_contrib: newCtrContrib,
      final_score: newFinalScore,
    };
  });
  return { ...state, results: updatedResults };
}

export function searchReducer(state: SearchState, action: SearchAction): SearchState {
  switch (action.type) {
    case 'SET_QUERY':
      return { ...state, query: action.payload };

    case 'SEARCH_START':
      return {
        ...state,
        isLoading: true,
        hasSearched: true,
        error: null,
        errorCode: null,
        isRetryable: false,
      };

    case 'SEARCH_SUCCESS':
      return {
        ...state,
        isLoading: false,
        results: action.payload.results,
        totalResults: action.payload.total,
        page: action.payload.page,
        totalPages: action.payload.totalPages,
        isPersonalized: action.payload.personalized,
        userProfile: action.payload.userProfile,
      };

    case 'SET_PAGE':
      return { ...state, page: action.payload };

    case 'SEARCH_ERROR':
      return {
        ...state,
        isLoading: false,
        results: [],
        error: action.payload.error,
        errorCode: action.payload.errorCode,
        isRetryable: action.payload.isRetryable,
      };

    case 'SET_STATS':
      return { ...state, stats: action.payload };

    case 'SET_IMPRESSIONS':
      return { ...state, totalImpressions: action.payload };

    case 'SET_LAST_PARAMS':
      return { ...state, lastSearchParams: action.payload };

    case 'SET_EMPTY_QUERY_ERROR':
      return {
        ...state,
        error: 'Введите поисковый запрос',
        errorCode: 'EMPTY_QUERY',
        isRetryable: false,
      };

    case 'RESET':
      return { ...initialSearchState, totalImpressions: state.totalImpressions };

    case 'INCREMENT_CLICK':
      return handleIncrementClick(state, action.payload);

    default:
      return state;
  }
}
