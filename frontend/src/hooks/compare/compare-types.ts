import type { DocumentResult, User } from '@/lib/types';

export interface CompareState {
  user: User | null;
  userId: number | null;
  results: DocumentResult[];
}

export interface CompareStats {
  common: number;
  total: number;
  uniqueLeft: number;
  uniqueRight: number;
  avgPersonalization1: number;
  avgPersonalization2: number;
  avgFinalScore1: number;
  avgFinalScore2: number;
  spearman: number | null;
}

export const createEmptyState = (): CompareState => ({
  user: null,
  userId: null,
  results: [],
});

export function calculateStats(
  leftResults: DocumentResult[],
  rightResults: DocumentResult[],
): CompareStats | null {
  if (leftResults.length === 0 || rightResults.length === 0) return null;

  const ids1 = new Set(leftResults.map((d) => d.document_id));
  const ids2 = new Set(rightResults.map((d) => d.document_id));
  const common = [...ids1].filter((id) => ids2.has(id)).length;
  const total = Math.min(leftResults.length, rightResults.length);

  const avgPersonalization1 =
    leftResults.reduce((acc, d) => acc + (d.user_contrib || 0), 0) / leftResults.length;
  const avgPersonalization2 =
    rightResults.reduce((acc, d) => acc + (d.user_contrib || 0), 0) / rightResults.length;
  const avgFinalScore1 =
    leftResults.reduce((acc, d) => acc + (d.final_score || 0), 0) / leftResults.length;
  const avgFinalScore2 =
    rightResults.reduce((acc, d) => acc + (d.final_score || 0), 0) / rightResults.length;

  return {
    common,
    total,
    uniqueLeft: leftResults.length - common,
    uniqueRight: rightResults.length - common,
    avgPersonalization1,
    avgPersonalization2,
    avgFinalScore1,
    avgFinalScore2,
    spearman: spearmanOnIntersection(leftResults, rightResults),
  };
}

export function spearmanOnIntersection(
  left: DocumentResult[],
  right: DocumentResult[],
): number | null {
  const posLeft = new Map<string, number>();
  left.forEach((d, idx) => posLeft.set(d.document_id, idx + 1));
  const posRight = new Map<string, number>();
  right.forEach((d, idx) => posRight.set(d.document_id, idx + 1));

  const pairs: Array<[number, number]> = [];
  posLeft.forEach((rankL, id) => {
    const rankR = posRight.get(id);
    if (rankR !== undefined) pairs.push([rankL, rankR]);
  });

  if (pairs.length < 2) return null;

  const n = pairs.length;
  let sumD2 = 0;
  for (const [a, b] of pairs) {
    sumD2 += (a - b) ** 2;
  }
  return 1 - (6 * sumD2) / (n * (n * n - 1));
}

export function formatSigned(value: number, fractionDigits = 3): string {
  if (Number.isNaN(value)) return '—';
  const fixed = value.toFixed(fractionDigits);
  if (value > 0) return `+${fixed}`;
  return fixed;
}
