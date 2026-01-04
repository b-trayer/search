import { useReducer, useCallback, useEffect, useRef } from 'react';
import { searchDocuments, registerClick, getSearchStats, registerImpressions, ApiError } from '@/lib/api';
import type { DocumentResult, SearchFilters } from '@/lib/types';
import { searchReducer, initialSearchState, type SearchAction } from './search-reducer';

interface UseSearchOptions {
  perPage?: number;
}

export function useSearch(options: UseSearchOptions = {}) {
  const { perPage = 20 } = options;
  const [state, dispatch] = useReducer(searchReducer, initialSearchState);

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
    filters?: SearchFilters,
    page: number = 1
  ) => {
    if (!state.query.trim()) {
      dispatch({ type: 'SET_EMPTY_QUERY_ERROR' });
      return;
    }

    dispatch({ type: 'SET_LAST_PARAMS', payload: { userId, enablePersonalization, filters } });
    dispatch({ type: 'SEARCH_START' });

    try {
      const response = await searchDocuments(state.query, userId, enablePersonalization, page, perPage, filters);

      dispatch({
        type: 'SEARCH_SUCCESS',
        payload: {
          results: response.results,
          total: response.total,
          page: response.page,
          totalPages: response.total_pages,
          personalized: response.personalized,
          userProfile: response.user_profile,
        },
      });

      const avgCtr = response.results.length > 0
        ? response.results.reduce((acc, d) => acc + (d.ctr_boost - 1), 0) / response.results.length * 100
        : 0;

      let updatedImpressions = totalImpressionsRef.current;
      if (response.results.length > 0) {
        const impressionsResult = await registerImpressions({
          query: state.query,
          user_id: userId ?? null,
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
  }, [state.query, perPage]);

  const goToPage = useCallback(async (page: number) => {
    if (state.lastSearchParams) {
      await search(
        state.lastSearchParams.userId,
        state.lastSearchParams.enablePersonalization,
        state.lastSearchParams.filters,
        page
      );
    }
  }, [search, state.lastSearchParams]);

  const retry = useCallback(async () => {
    if (state.lastSearchParams) {
      await search(
        state.lastSearchParams.userId,
        state.lastSearchParams.enablePersonalization,
        state.lastSearchParams.filters,
        state.page
      );
    }
  }, [search, state.lastSearchParams, state.page]);

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

    if (state.query) {
      registerClick({
        query: state.query,
        user_id: userId ?? null,
        document_id: doc.document_id,
        position: doc.position,
      }).then(result => {
        if (result.success) {
          dispatch({ type: 'INCREMENT_CLICK', payload: doc.document_id });
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
    page: state.page,
    totalPages: state.totalPages,
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
    goToPage,
  };
}
