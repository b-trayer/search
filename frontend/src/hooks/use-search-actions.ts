import { useCallback } from 'react';
import { searchDocuments, registerClick, registerImpressions, ApiError } from '@/lib/api';
import type { DocumentResult, SearchFilters, SearchResponse } from '@/lib/types';
import type { SearchAction, SearchState } from './search-reducer';

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
    page: number = 1
  ) => {
    if (!query.trim()) {
      dispatch({ type: 'SET_EMPTY_QUERY_ERROR' });
      return;
    }

    dispatch({ type: 'SET_LAST_PARAMS', payload: { userId, enablePersonalization, filters } });
    dispatch({ type: 'SEARCH_START' });

    try {
      const response = await searchDocuments(query, userId, enablePersonalization, page, perPage, filters);

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
        query,
        userId,
        response.results,
        totalImpressionsRef.current,
        dispatch
      );

      dispatch({
        type: 'SET_STATS',
        payload: {
          totalResults: response.total,
          avgCTR: avgCtr,
          impressions: updatedImpressions,
        },
      });
    } catch (err) {
      handleSearchError(err, dispatch);
    }
  };
}

function calculateAvgCtr(results: DocumentResult[]): number {
  if (results.length === 0) return 0;
  return results.reduce((acc, d) => acc + (d.ctr_boost - 1), 0) / results.length * 100;
}

async function handleImpressions(
  query: string,
  userId: number | undefined,
  results: DocumentResult[],
  currentImpressions: number,
  dispatch: React.Dispatch<SearchAction>
): Promise<number> {
  if (results.length === 0) return currentImpressions;

  const impressionsResult = await registerImpressions({
    query,
    user_id: userId ?? null,
    document_ids: results.map(r => r.document_id),
  });

  if (impressionsResult) {
    dispatch({ type: 'SET_IMPRESSIONS', payload: impressionsResult.total_impressions });
    return impressionsResult.total_impressions;
  }

  return currentImpressions;
}

function handleSearchError(err: unknown, dispatch: React.Dispatch<SearchAction>): void {
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

export function useDocumentClickHandler(query: string, dispatch: React.Dispatch<SearchAction>) {
  return useCallback((doc: DocumentResult, userId?: number) => {
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

    if (query) {
      registerClick({
        query,
        user_id: userId ?? null,
        document_id: doc.document_id,
        position: doc.position,
      }).then(result => {
        if (result.success) {
          dispatch({ type: 'INCREMENT_CLICK', payload: doc.document_id });
        }
      });
    }
  }, [query, dispatch]);
}
