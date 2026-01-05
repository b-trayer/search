import { describe, it, expect } from 'vitest';
import { searchReducer, initialSearchState, DEFAULT_STATS } from './search-reducer';
import type { DocumentResult } from '@/lib/types';

const mockDocument: DocumentResult = {
  document_id: 'doc-1',
  title: 'Test Document',
  authors: 'Author A',
  url: 'http://test.com',
  cover: '',
  collection: 'test',
  subject_area: 'Physics',
  subjects: ['Physics'],
  organization: 'Test Org',
  publication_info: '',
  language: 'ru',
  source: 'test',
  year: 2024,
  document_type: 'textbook',
  base_score: 10,
  log_bm25: 2.5,
  f_type: 0.5,
  f_topic: 0.8,
  f_user: 0.65,
  user_contrib: 0.975,
  smoothed_ctr: 0.1,
  ctr_factor: 0.095,
  ctr_contrib: 0.048,
  ctr_boost: 1.1,
  final_score: 3.523,
  position: 1,
  highlights: {},
  clicks: 5,
  impressions: 100,
  weights: {
    w_user: 1.5,
    alpha_type: 0.4,
    alpha_topic: 0.6,
    beta_ctr: 0.5,
    ctr_alpha_prior: 1,
    ctr_beta_prior: 10,
  },
};

describe('searchReducer', () => {
  describe('SET_QUERY', () => {
    it('updates query', () => {
      const state = searchReducer(initialSearchState, { type: 'SET_QUERY', payload: 'физика' });
      expect(state.query).toBe('физика');
    });
  });

  describe('SEARCH_START', () => {
    it('sets loading state', () => {
      const state = searchReducer(initialSearchState, { type: 'SEARCH_START' });
      expect(state.isLoading).toBe(true);
      expect(state.hasSearched).toBe(true);
      expect(state.error).toBeNull();
      expect(state.errorCode).toBeNull();
      expect(state.isRetryable).toBe(false);
    });
  });

  describe('SEARCH_SUCCESS', () => {
    it('updates results and metadata', () => {
      const startState = { ...initialSearchState, isLoading: true };
      const payload = {
        results: [mockDocument],
        total: 100,
        page: 1,
        totalPages: 5,
        personalized: true,
        userProfile: { user_id: 1, username: 'test', role: 'student', specialization: 'Physics', faculty: null, course: 2, interests: [] },
      };

      const state = searchReducer(startState, { type: 'SEARCH_SUCCESS', payload });
      expect(state.isLoading).toBe(false);
      expect(state.results).toEqual([mockDocument]);
      expect(state.totalResults).toBe(100);
      expect(state.page).toBe(1);
      expect(state.totalPages).toBe(5);
      expect(state.isPersonalized).toBe(true);
      expect(state.userProfile).toEqual(payload.userProfile);
    });
  });

  describe('SEARCH_ERROR', () => {
    it('sets error state', () => {
      const startState = { ...initialSearchState, isLoading: true };
      const payload = {
        error: 'Сервис недоступен',
        errorCode: 'OPENSEARCH_UNAVAILABLE',
        isRetryable: true,
      };

      const state = searchReducer(startState, { type: 'SEARCH_ERROR', payload });
      expect(state.isLoading).toBe(false);
      expect(state.results).toEqual([]);
      expect(state.error).toBe('Сервис недоступен');
      expect(state.errorCode).toBe('OPENSEARCH_UNAVAILABLE');
      expect(state.isRetryable).toBe(true);
    });
  });

  describe('SET_STATS', () => {
    it('updates stats', () => {
      const stats = { totalResults: 50, avgCTR: 5.5, impressions: 1000 };
      const state = searchReducer(initialSearchState, { type: 'SET_STATS', payload: stats });
      expect(state.stats).toEqual(stats);
    });
  });

  describe('SET_IMPRESSIONS', () => {
    it('updates total impressions', () => {
      const state = searchReducer(initialSearchState, { type: 'SET_IMPRESSIONS', payload: 5000 });
      expect(state.totalImpressions).toBe(5000);
    });
  });

  describe('SET_LAST_PARAMS', () => {
    it('stores last search params', () => {
      const params = { userId: 42, enablePersonalization: true, filters: { language: 'ru' } };
      const state = searchReducer(initialSearchState, { type: 'SET_LAST_PARAMS', payload: params });
      expect(state.lastSearchParams).toEqual(params);
    });
  });

  describe('SET_EMPTY_QUERY_ERROR', () => {
    it('sets empty query error', () => {
      const state = searchReducer(initialSearchState, { type: 'SET_EMPTY_QUERY_ERROR' });
      expect(state.error).toBe('Введите поисковый запрос');
      expect(state.errorCode).toBe('EMPTY_QUERY');
      expect(state.isRetryable).toBe(false);
    });
  });

  describe('RESET', () => {
    it('resets to initial state but preserves impressions', () => {
      const modifiedState = {
        ...initialSearchState,
        query: 'test',
        results: [mockDocument],
        totalImpressions: 5000,
      };

      const state = searchReducer(modifiedState, { type: 'RESET' });
      expect(state.query).toBe('');
      expect(state.results).toEqual([]);
      expect(state.totalImpressions).toBe(5000);
    });
  });

  describe('SET_PAGE', () => {
    it('updates page number', () => {
      const state = searchReducer(initialSearchState, { type: 'SET_PAGE', payload: 3 });
      expect(state.page).toBe(3);
    });
  });

  describe('INCREMENT_CLICK', () => {
    it('increments click count without recalculating scores', () => {
      const stateWithResults = { ...initialSearchState, results: [mockDocument] };
      const state = searchReducer(stateWithResults, { type: 'INCREMENT_CLICK', payload: 'doc-1' });

      const updatedDoc = state.results[0];
      expect(updatedDoc.clicks).toBe(6);
      expect(updatedDoc.smoothed_ctr).toBe(mockDocument.smoothed_ctr);
      expect(updatedDoc.final_score).toBe(mockDocument.final_score);
    });

    it('does not modify other documents', () => {
      const doc2 = { ...mockDocument, document_id: 'doc-2', clicks: 10 };
      const stateWithResults = { ...initialSearchState, results: [mockDocument, doc2] };
      const state = searchReducer(stateWithResults, { type: 'INCREMENT_CLICK', payload: 'doc-1' });

      expect(state.results[1].clicks).toBe(10);
    });
  });
});

describe('initialSearchState', () => {
  it('has correct default values', () => {
    expect(initialSearchState.query).toBe('');
    expect(initialSearchState.results).toEqual([]);
    expect(initialSearchState.isLoading).toBe(false);
    expect(initialSearchState.hasSearched).toBe(false);
    expect(initialSearchState.totalResults).toBe(0);
    expect(initialSearchState.page).toBe(1);
    expect(initialSearchState.totalPages).toBe(1);
    expect(initialSearchState.isPersonalized).toBe(false);
    expect(initialSearchState.userProfile).toBeNull();
    expect(initialSearchState.stats).toEqual(DEFAULT_STATS);
    expect(initialSearchState.error).toBeNull();
    expect(initialSearchState.errorCode).toBeNull();
    expect(initialSearchState.isRetryable).toBe(false);
    expect(initialSearchState.totalImpressions).toBe(0);
    expect(initialSearchState.lastSearchParams).toBeNull();
  });
});
