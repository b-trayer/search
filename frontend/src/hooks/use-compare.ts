
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
  avgPersonalization1: string;
  avgPersonalization2: string;
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

  const compare = useCallback(async (
    overrideQuery?: string,
    overrideLeftUserId?: number | null,
    overrideRightUserId?: number | null
  ) => {
    const searchQuery = overrideQuery ?? query;
    const leftUserId = overrideLeftUserId !== undefined ? overrideLeftUserId : left.userId;
    const rightUserId = overrideRightUserId !== undefined ? overrideRightUserId : right.userId;

    if (!searchQuery.trim()) {
      setError('Введите поисковый запрос');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [response1, response2] = await Promise.all([
        searchDocuments(searchQuery, leftUserId || undefined, !!leftUserId, 1, 10),
        searchDocuments(searchQuery, rightUserId || undefined, !!rightUserId, 1, 10),
      ]);

      setLeft((prev) => ({ ...prev, results: response1.results.slice(0, 10) }));
      setRight((prev) => ({ ...prev, results: response2.results.slice(0, 10) }));
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
    const total = Math.min(left.results.length, right.results.length);

    const avgPersonalization1 =
      left.results.reduce((acc, d) => acc + (d.user_contrib || 0), 0) / left.results.length;
    const avgPersonalization2 =
      right.results.reduce((acc, d) => acc + (d.user_contrib || 0), 0) / right.results.length;

    return {
      common,
      total,
      avgPersonalization1: avgPersonalization1.toFixed(3),
      avgPersonalization2: avgPersonalization2.toFixed(3),
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
