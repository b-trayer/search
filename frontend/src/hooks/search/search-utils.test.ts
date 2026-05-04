import { describe, it, expect, vi } from 'vitest';
import { calculateAvgCtr, handleSearchError } from './search-utils';
import { ApiError } from '@/lib/api';
import type { DocumentResult } from '@/lib/types';

describe('calculateAvgCtr', () => {
  it('returns 0 for empty results', () => {
    expect(calculateAvgCtr([])).toBe(0);
  });

  it('calculates average CTR correctly', () => {
    const results: DocumentResult[] = [
      { document_id: '1', ctr_boost: 1.1 } as DocumentResult,
      { document_id: '2', ctr_boost: 1.2 } as DocumentResult,
      { document_id: '3', ctr_boost: 1.3 } as DocumentResult,
    ];

    const avgCtr = calculateAvgCtr(results);
    expect(avgCtr).toBeCloseTo(20, 1);
  });

  it('handles ctr_boost of 1 (no boost)', () => {
    const results: DocumentResult[] = [
      { document_id: '1', ctr_boost: 1.0 } as DocumentResult,
    ];

    expect(calculateAvgCtr(results)).toBe(0);
  });
});

describe('handleSearchError', () => {
  it('dispatches SEARCH_ERROR with ApiError details', () => {
    const dispatch = vi.fn();
    const apiError = new ApiError('Ошибка поиска', 503, 'DATABASE_ERROR');

    handleSearchError(apiError, dispatch);

    expect(dispatch).toHaveBeenCalledWith({
      type: 'SEARCH_ERROR',
      payload: expect.objectContaining({
        errorCode: 'DATABASE_ERROR',
        isRetryable: true,
      }),
    });
  });

  it('dispatches SEARCH_ERROR with unknown error for non-ApiError', () => {
    const dispatch = vi.fn();
    const error = new Error('Something went wrong');

    handleSearchError(error, dispatch);

    expect(dispatch).toHaveBeenCalledWith({
      type: 'SEARCH_ERROR',
      payload: {
        error: 'Произошла неизвестная ошибка',
        errorCode: 'UNKNOWN_ERROR',
        isRetryable: false,
      },
    });
  });

  it('handles string errors', () => {
    const dispatch = vi.fn();

    handleSearchError('string error', dispatch);

    expect(dispatch).toHaveBeenCalledWith({
      type: 'SEARCH_ERROR',
      payload: {
        error: 'Произошла неизвестная ошибка',
        errorCode: 'UNKNOWN_ERROR',
        isRetryable: false,
      },
    });
  });
});
