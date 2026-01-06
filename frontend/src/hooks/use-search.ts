import { useReducer, useCallback, useMemo } from 'react';
import type { SearchFilters, SearchField } from '@/lib/types';
import { searchReducer, initialSearchState } from './search-reducer';
import { createSearchAction, useDocumentClickHandler } from './use-search-actions';
import { useSearchStats } from './use-search-stats';

export function useSearch(options: { perPage?: number } = {}) {
  const { perPage = 20 } = options;
  const [state, dispatch] = useReducer(searchReducer, initialSearchState);

  const { getTotalImpressions } = useSearchStats({
    onImpressionsUpdate: (total) => dispatch({ type: 'SET_IMPRESSIONS', payload: total }),
  });

  const totalImpressionsRef = useMemo(() => ({ current: getTotalImpressions() }), [getTotalImpressions]);
  const searchAction = useMemo(() => createSearchAction({ query: state.query, perPage, dispatch, totalImpressionsRef }), [state.query, perPage, totalImpressionsRef]);
  const handleDocumentClick = useDocumentClickHandler(state.query, dispatch);

  const search = useCallback(async (userId?: number, enablePersonalization = true, filters?: SearchFilters, page = 1, searchField: SearchField = 'all') => {
    await searchAction(userId, enablePersonalization, filters, page, searchField);
  }, [searchAction]);

  const goToPage = useCallback(async (page: number) => {
    const p = state.lastSearchParams;
    if (p) await search(p.userId, p.enablePersonalization, p.filters, page, p.searchField);
  }, [search, state.lastSearchParams]);

  const retry = useCallback(async () => {
    const p = state.lastSearchParams;
    if (p) await search(p.userId, p.enablePersonalization, p.filters, state.page, p.searchField);
  }, [search, state.lastSearchParams, state.page]);

  return {
    query: state.query, results: state.results, isLoading: state.isLoading, hasSearched: state.hasSearched,
    totalResults: state.totalResults, page: state.page, totalPages: state.totalPages, isPersonalized: state.isPersonalized,
    userProfile: state.userProfile, stats: state.stats, error: state.error, errorCode: state.errorCode, isRetryable: state.isRetryable,
    setQuery: useCallback((q: string) => dispatch({ type: 'SET_QUERY', payload: q }), []),
    search, handleDocumentClick, reset: useCallback(() => dispatch({ type: 'RESET' }), []), retry, goToPage,
  };
}
