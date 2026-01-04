import { useReducer, useCallback, useMemo } from 'react';
import type { SearchFilters } from '@/lib/types';
import { searchReducer, initialSearchState } from './search-reducer';
import { createSearchAction, useDocumentClickHandler } from './use-search-actions';
import { useSearchStats } from './use-search-stats';

interface UseSearchOptions {
  perPage?: number;
}

export function useSearch(options: UseSearchOptions = {}) {
  const { perPage = 20 } = options;
  const [state, dispatch] = useReducer(searchReducer, initialSearchState);

  const { trackImpressions, getTotalImpressions } = useSearchStats({
    onImpressionsUpdate: (total) => dispatch({ type: 'SET_IMPRESSIONS', payload: total }),
  });

  const totalImpressionsRef = useMemo(() => ({ current: getTotalImpressions() }), [getTotalImpressions]);

  const searchAction = useMemo(
    () => createSearchAction({ query: state.query, perPage, dispatch, totalImpressionsRef }),
    [state.query, perPage, totalImpressionsRef]
  );

  const search = useCallback(async (
    userId?: number,
    enablePersonalization: boolean = true,
    filters?: SearchFilters,
    page: number = 1
  ) => {
    await searchAction(userId, enablePersonalization, filters, page);
  }, [searchAction]);

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

  const handleDocumentClick = useDocumentClickHandler(state.query, dispatch);

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
