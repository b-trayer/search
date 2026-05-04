import type { SearchState, SearchAction } from './search/search-types';
export type { SearchState, SearchAction } from './search/search-types';
export { DEFAULT_STATS, initialSearchState } from './search/search-types';

function handleIncrementClick(state: SearchState, documentId: string): SearchState {
  const updatedResults = state.results.map(doc =>
    doc.document_id !== documentId ? doc : { ...doc, clicks: doc.clicks + 1 }
  );
  return { ...state, results: updatedResults };
}

export function searchReducer(state: SearchState, action: SearchAction): SearchState {
  switch (action.type) {
    case 'SET_QUERY':
      return { ...state, query: action.payload };

    case 'SEARCH_START':
      return { ...state, isLoading: true, hasSearched: true, error: null, errorCode: null, isRetryable: false };

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
      return { ...state, error: 'Введите поисковый запрос', errorCode: 'EMPTY_QUERY', isRetryable: false };

    case 'RESET':
      return { ...state, query: '', results: [], isLoading: false, hasSearched: false, totalResults: 0, page: 1, totalPages: 1, isPersonalized: false, userProfile: null, stats: { totalResults: 0, avgCTR: 0, impressions: 0 }, error: null, errorCode: null, isRetryable: false, lastSearchParams: null };

    case 'INCREMENT_CLICK':
      return handleIncrementClick(state, action.payload);

    default:
      return state;
  }
}
