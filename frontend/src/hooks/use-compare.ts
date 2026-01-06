import { useState, useCallback, useMemo } from 'react';
import { searchDocuments } from '@/lib/api';
import type { User } from '@/lib/types';
import { CompareState, createEmptyState, calculateStats } from './compare/compare-types';
export type { CompareStats } from './compare/compare-types';

export function useCompare() {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [left, setLeft] = useState<CompareState>(createEmptyState());
  const [right, setRight] = useState<CompareState>(createEmptyState());

  const setLeftUserId = useCallback((userId: number | null) => setLeft(p => ({ ...p, userId })), []);
  const setLeftUser = useCallback((user: User | null) => setLeft(p => ({ ...p, user })), []);
  const setRightUserId = useCallback((userId: number | null) => setRight(p => ({ ...p, userId })), []);
  const setRightUser = useCallback((user: User | null) => setRight(p => ({ ...p, user })), []);

  const compare = useCallback(async (
    overrideQuery?: string,
    overrideLeftUserId?: number | null,
    overrideRightUserId?: number | null
  ) => {
    const searchQuery = overrideQuery ?? query;
    const leftUserId = overrideLeftUserId !== undefined ? overrideLeftUserId : left.userId;
    const rightUserId = overrideRightUserId !== undefined ? overrideRightUserId : right.userId;

    if (!searchQuery.trim()) { setError('Введите поисковый запрос'); return; }
    setIsLoading(true);
    setError(null);

    try {
      const [r1, r2] = await Promise.all([
        searchDocuments(searchQuery, leftUserId || undefined, true, 1, 20, undefined, 'all'),
        searchDocuments(searchQuery, rightUserId || undefined, true, 1, 20, undefined, 'all'),
      ]);
      setLeft(p => ({ ...p, results: r1.results.slice(0, 10) }));
      setRight(p => ({ ...p, results: r2.results.slice(0, 10) }));
    } catch { setError('Не удалось выполнить поиск'); }
    finally { setIsLoading(false); }
  }, [query, left.userId, right.userId]);

  const stats = useMemo(() => calculateStats(left.results, right.results), [left.results, right.results]);

  return { query, setQuery, isLoading, error, left, right, setLeftUserId, setLeftUser, setRightUserId, setRightUser, compare, stats };
}

export function getPositionChange(docId: string, current: { document_id: string }[], other: { document_id: string }[]): number | null {
  const currentPos = current.findIndex(d => d.document_id === docId) + 1;
  const otherPos = other.findIndex(d => d.document_id === docId) + 1;
  return otherPos === 0 ? null : otherPos - currentPos;
}
