
import { useState, useCallback, useMemo } from 'react';
import { searchDocuments } from '@/lib/api';
import type { DocumentResult, User } from '@/lib/types';

interface CompareState {
  user: User | null;
  userId: number | null;
  results: DocumentResult[];
}

export interface CompareStats {
  common: number;
  total: number;
  avgBoost1: string;
  avgBoost2: string;
}

export function useCompare() {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [left, setLeft] = useState<CompareState>({
    user: null,
    userId: null,
    results: [],
  });

  const [right, setRight] = useState<CompareState>({
    user: null,
    userId: null,
    results: [],
  });

  const setLeftUserId = useCallback((userId: number | null) => {
    setLeft((prev) => ({ ...prev, userId }));
  }, []);

  const setLeftUser = useCallback((user: User | null) => {
    setLeft((prev) => ({ ...prev, user }));
  }, []);

  const setRightUserId = useCallback((userId: number | null) => {
    setRight((prev) => ({ ...prev, userId }));
  }, []);

  const setRightUser = useCallback((user: User | null) => {
    setRight((prev) => ({ ...prev, user }));
  }, []);

  const compare = useCallback(async () => {
    if (!query.trim()) {
      setError('Введите поисковый запрос');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [response1, response2] = await Promise.all([
        searchDocuments(query, left.userId || undefined, !!left.userId, 10),
        searchDocuments(query, right.userId || undefined, !!right.userId, 10),
      ]);

      setLeft((prev) => ({ ...prev, results: response1.results }));
      setRight((prev) => ({ ...prev, results: response2.results }));
    } catch (err) {
      setError('Не удалось выполнить поиск');
      console.error('Compare error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [query, left.userId, right.userId]);

  const stats = useMemo((): CompareStats | null => {
    if (left.results.length === 0 || right.results.length === 0) return null;

    const ids1 = new Set(left.results.map((d) => d.document_id));
    const ids2 = new Set(right.results.map((d) => d.document_id));
    const common = [...ids1].filter((id) => ids2.has(id)).length;

    const avgBoost1 =
      left.results.reduce((acc, d) => acc + (d.ctr_boost || 1), 0) / left.results.length;
    const avgBoost2 =
      right.results.reduce((acc, d) => acc + (d.ctr_boost || 1), 0) / right.results.length;

    return {
      common,
      total: 10,
      avgBoost1: avgBoost1.toFixed(2),
      avgBoost2: avgBoost2.toFixed(2),
    };
  }, [left.results, right.results]);

  return {
    query,
    setQuery,
    isLoading,
    error,
    left,
    right,
    setLeftUserId,
    setLeftUser,
    setRightUserId,
    setRightUser,
    compare,
    stats,
  };
}

export function getPositionChange(
  docId: string,
  currentResults: DocumentResult[],
  otherResults: DocumentResult[]
): number | null {
  const currentPos = currentResults.findIndex((d) => d.document_id === docId) + 1;
  const otherPos = otherResults.findIndex((d) => d.document_id === docId) + 1;

  if (otherPos === 0) return null;
  return otherPos - currentPos;
}
