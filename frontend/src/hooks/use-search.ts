
import { useState, useCallback } from 'react';
import { searchDocuments, registerClick, ApiError } from '@/lib/api';
import type { DocumentResult, UserProfile, SearchStats, SearchFilters } from '@/lib/types';

interface UseSearchOptions {
  topK?: number;
}

interface UseSearchReturn {

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


  setQuery: (query: string) => void;
  search: (userId?: number, enablePersonalization?: boolean, filters?: SearchFilters) => Promise<void>;
  handleDocumentClick: (doc: DocumentResult, userId?: number) => void;
  reset: () => void;
  retry: () => Promise<void>;
}

const DEFAULT_STATS: SearchStats = {
  totalResults: 0,
  avgCTR: 0,
  impressions: 0,
  avgTime: 0,
};

export function useSearch(options: UseSearchOptions = {}): UseSearchReturn {
  const { topK = 20 } = options;

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<DocumentResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [isPersonalized, setIsPersonalized] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<SearchStats>(DEFAULT_STATS);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [isRetryable, setIsRetryable] = useState(false);


  const [lastSearchParams, setLastSearchParams] = useState<{
    userId?: number;
    enablePersonalization: boolean;
    filters?: SearchFilters;
  } | null>(null);

  const search = useCallback(async (
    userId?: number,
    enablePersonalization: boolean = true,
    filters?: SearchFilters
  ) => {
    if (!query.trim()) {
      setError('Введите поисковый запрос');
      setErrorCode('EMPTY_QUERY');
      setIsRetryable(false);
      return;
    }


    setLastSearchParams({ userId, enablePersonalization, filters });

    setIsLoading(true);
    setHasSearched(true);
    setError(null);
    setErrorCode(null);
    setIsRetryable(false);

    try {
      const response = await searchDocuments(query, userId, enablePersonalization, topK, filters);

      setResults(response.results);
      setTotalResults(response.total);
      setIsPersonalized(response.personalized);
      setUserProfile(response.user_profile);


      const avgCtr = response.results.length > 0
        ? response.results.reduce((acc, d) => acc + (d.ctr_boost - 1), 0) / response.results.length * 100
        : 0;

      setStats({
        totalResults: response.total,
        avgCTR: avgCtr,
        impressions: response.total * 10,
        avgTime: 2.5,
      });
    } catch (err) {
      console.error('Search error:', err);
      setResults([]);

      if (err instanceof ApiError) {
        setError(err.getUserMessage());
        setErrorCode(err.code);
        setIsRetryable(err.isRetryable());
      } else {
        setError('Произошла неизвестная ошибка');
        setErrorCode('UNKNOWN_ERROR');
        setIsRetryable(false);
      }
    } finally {
      setIsLoading(false);
    }
  }, [query, topK]);

  const retry = useCallback(async () => {
    if (lastSearchParams) {
      await search(
        lastSearchParams.userId,
        lastSearchParams.enablePersonalization,
        lastSearchParams.filters
      );
    }
  }, [search, lastSearchParams]);

  const handleDocumentClick = useCallback((doc: DocumentResult, userId?: number) => {

    if (doc.url) {
      window.open(doc.url, '_blank');
    }


    if (userId && query) {
      registerClick({
        query,
        user_id: userId,
        document_id: doc.document_id,
        position: doc.position,
      }).then(result => {
        if (!result.success && result.error) {


          console.debug('Click not tracked:', result.error.code);
        }
      });
    }
  }, [query]);

  const reset = useCallback(() => {
    setQuery('');
    setResults([]);
    setHasSearched(false);
    setTotalResults(0);
    setIsPersonalized(false);
    setUserProfile(null);
    setStats(DEFAULT_STATS);
    setError(null);
    setErrorCode(null);
    setIsRetryable(false);
    setLastSearchParams(null);
  }, []);

  return {
    query,
    results,
    isLoading,
    hasSearched,
    totalResults,
    isPersonalized,
    userProfile,
    stats,
    error,
    errorCode,
    isRetryable,
    setQuery,
    search,
    handleDocumentClick,
    reset,
    retry,
  };
}
