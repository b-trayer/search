import { registerImpressions, ApiError } from '@/lib/api';
import type { DocumentResult } from '@/lib/types';
import type { SearchAction } from '../search-reducer';

export function calculateAvgCtr(results: DocumentResult[]): number {
  if (results.length === 0) return 0;
  return results.reduce((acc, d) => acc + (d.ctr_boost - 1), 0) / results.length * 100;
}

export async function handleImpressions(
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

export function handleSearchError(err: unknown, dispatch: React.Dispatch<SearchAction>): void {
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
