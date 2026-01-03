
import { useReducer, useCallback, useEffect, useRef } from 'react';
import { searchDocuments, registerClick, getSearchStats, registerImpressions, ApiError } from '@/lib/api';
import type { DocumentResult, UserProfile, SearchStats, SearchFilters } from '@/lib/types';

interface UseSearchOptions {
  topK?: number;
}

interface SearchState {
  query: string;
  results: DocumentResult[];
  isLoading: boolean;
  hasSearched: boolean;
  totalResults: number;
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

type SearchAction =
  | { type: 'SET_QUERY'; payload: string }
  | { type: 'SEARCH_START' }
  | { type: 'SEARCH_SUCCESS'; payload: { results: DocumentResult[]; total: number; personalized: boolean; userProfile: UserProfile | null } }
  | { type: 'SEARCH_ERROR'; payload: { error: string; errorCode: string; isRetryable: boolean } }
  | { type: 'SET_STATS'; payload: SearchStats }
  | { type: 'SET_IMPRESSIONS'; payload: number }
  | { type: 'SET_LAST_PARAMS'; payload: SearchState['lastSearchParams'] }
  | { type: 'RESET' }
  | { type: 'SET_EMPTY_QUERY_ERROR' };

const DEFAULT_STATS: SearchStats = {
  totalResults: 0,
  avgCTR: 0,
  impressions: 0,
};

const initialState: SearchState = {
  query: '',
  results: [],
  isLoading: false,
  hasSearched: false,
  totalResults: 0,
  isPersonalized: false,
  userProfile: null,
  stats: DEFAULT_STATS,
  error: null,
  errorCode: null,
  isRetryable: false,
  totalImpressions: 0,
  lastSearchParams: null,
};

function searchReducer(state: SearchState, action: SearchAction): SearchState {
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
        isPersonalized: action.payload.personalized,
        userProfile: action.payload.userProfile,
      };

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
      return { ...initialState, totalImpressions: state.totalImpressions };

    default:
      return state;
  }
}

export function useSearch(options: UseSearchOptions = {}) {
  const { topK = 20 } = options;
  const [state, dispatch] = useReducer(searchReducer, initialState);

  const totalImpressionsRef = useRef(state.totalImpressions);
  totalImpressionsRef.current = state.totalImpressions;

  useEffect(() => {
    getSearchStats()
      .then((data) => {
        dispatch({ type: 'SET_IMPRESSIONS', payload: data.total_impressions });
      })
      .catch((err) => {
        if (import.meta.env.DEV) {
          console.warn('Failed to load search stats:', err);
        }
      });
  }, []);

  const search = useCallback(async (
    userId?: number,
    enablePersonalization: boolean = true,
    filters?: SearchFilters
  ) => {
    if (!state.query.trim()) {
      dispatch({ type: 'SET_EMPTY_QUERY_ERROR' });
      return;
    }

    dispatch({ type: 'SET_LAST_PARAMS', payload: { userId, enablePersonalization, filters } });
    dispatch({ type: 'SEARCH_START' });

    try {
      const response = await searchDocuments(state.query, userId, enablePersonalization, topK, filters);

      dispatch({
        type: 'SEARCH_SUCCESS',
        payload: {
          results: response.results,
          total: response.total,
          personalized: response.personalized,
          userProfile: response.user_profile,
        },
      });

      const avgCtr = response.results.length > 0
        ? response.results.reduce((acc, d) => acc + (d.ctr_boost - 1), 0) / response.results.length * 100
        : 0;

      let updatedImpressions = totalImpressionsRef.current;
      if (userId && response.results.length > 0) {
        const impressionsResult = await registerImpressions({
          query: state.query,
          user_id: userId,
          document_ids: response.results.map(r => r.document_id),
        });
        if (impressionsResult) {
          updatedImpressions = impressionsResult.total_impressions;
          dispatch({ type: 'SET_IMPRESSIONS', payload: updatedImpressions });
        }
      }

      dispatch({
        type: 'SET_STATS',
        payload: {
          totalResults: response.total,
          avgCTR: avgCtr,
          impressions: updatedImpressions,
        },
      });
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('Search error:', err);
      }

      if (err instanceof ApiError) {
        dispatch({
          type: 'SEARCH_ERROR',
          payload: {
            error: err.getUserMessage(),
            errorCode: err.code,
            isRetryable: err.isRetryable(),
          },
        });
      } else {
        dispatch({
          type: 'SEARCH_ERROR',
          payload: {
            error: 'Произошла неизвестная ошибка',
            errorCode: 'UNKNOWN_ERROR',
            isRetryable: false,
          },
        });
      }
    }
  }, [state.query, topK]);

  const retry = useCallback(async () => {
    if (state.lastSearchParams) {
      await search(
        state.lastSearchParams.userId,
        state.lastSearchParams.enablePersonalization,
        state.lastSearchParams.filters
      );
    }
  }, [search, state.lastSearchParams]);

  const handleDocumentClick = useCallback((doc: DocumentResult, userId?: number) => {
    if (doc.url) {
      try {
        const url = new URL(doc.url);
        if (url.protocol === 'https:' || url.protocol === 'http:') {
          window.open(doc.url, '_blank', 'noopener,noreferrer');
        }
      } catch {
        if (import.meta.env.DEV) {
          console.warn('Invalid URL:', doc.url);
        }
      }
    }

    if (userId && state.query) {
      registerClick({
        query: state.query,
        user_id: userId,
        document_id: doc.document_id,
        position: doc.position,
      }).then(result => {
        if (!result.success && result.error && import.meta.env.DEV) {
          console.debug('Click not tracked:', result.error.code);
        }
      });
    }
  }, [state.query]);

  const setQuery = useCallback((query: string) => {
    dispatch({ type: 'SET_QUERY', payload: query });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  return {
    query: state.query,
    results: state.results,
    isLoading: state.isLoading,
    hasSearched: state.hasSearched,
    totalResults: state.totalResults,
    isPersonalized: state.isPersonalized,
    userProfile: state.userProfile,
    stats: state.stats,
    error: state.error,
    errorCode: state.errorCode,
    isRetryable: state.isRetryable,
    setQuery,
    search,
    handleDocumentClick,
    reset,
    retry,
  };
}
