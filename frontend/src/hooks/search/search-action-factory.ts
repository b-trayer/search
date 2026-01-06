import { searchDocuments } from '@/lib/api';
import type { SearchFilters, SearchField } from '@/lib/types';
import type { SearchAction } from '../search-reducer';
import { calculateAvgCtr, handleImpressions, handleSearchError } from './search-utils';

interface SearchActionsParams {
  query: string;
  perPage: number;
  dispatch: React.Dispatch<SearchAction>;
  totalImpressionsRef: React.MutableRefObject<number>;
}

export function createSearchAction({
  query,
  perPage,
  dispatch,
  totalImpressionsRef,
}: SearchActionsParams) {
  return async (
    userId?: number,
    enablePersonalization: boolean = true,
    filters?: SearchFilters,
    page: number = 1,
    searchField: SearchField = 'all'
  ) => {
    if (!query.trim()) {
      dispatch({ type: 'SET_EMPTY_QUERY_ERROR' });
      return;
    }

    dispatch({ type: 'SET_LAST_PARAMS', payload: { userId, enablePersonalization, filters, searchField } });
    dispatch({ type: 'SEARCH_START' });

    try {
      const response = await searchDocuments(query, userId, enablePersonalization, page, perPage, filters, searchField);

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

      const avgCtr = calculateAvgCtr(response.results);
      const updatedImpressions = await handleImpressions(
        query, userId, response.results, totalImpressionsRef.current, dispatch
      );

      dispatch({
        type: 'SET_STATS',
        payload: { totalResults: response.total, avgCTR: avgCtr, impressions: updatedImpressions },
      });
    } catch (err) {
      handleSearchError(err, dispatch);
    }
  };
}
