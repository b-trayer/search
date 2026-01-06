import type { DocumentResult, User } from '@/lib/types';

export interface CompareState {
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

export const createEmptyState = (): CompareState => ({
  user: null,
  userId: null,
  results: [],
});

export function calculateStats(
  leftResults: DocumentResult[],
  rightResults: DocumentResult[]
): CompareStats | null {
  if (leftResults.length === 0 || rightResults.length === 0) return null;

  const ids1 = new Set(leftResults.map(d => d.document_id));
  const ids2 = new Set(rightResults.map(d => d.document_id));
  const common = [...ids1].filter(id => ids2.has(id)).length;
  const total = Math.min(leftResults.length, rightResults.length);

  const avg1 = leftResults.reduce((acc, d) => acc + (d.user_contrib || 0), 0) / leftResults.length;
  const avg2 = rightResults.reduce((acc, d) => acc + (d.user_contrib || 0), 0) / rightResults.length;

  return { common, total, avgPersonalization1: avg1.toFixed(3), avgPersonalization2: avg2.toFixed(3) };
}
