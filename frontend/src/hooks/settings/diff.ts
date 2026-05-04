import type { SettingsData } from './types';

function countDifferingKeys<T extends Record<string, unknown>>(
  a: T | null | undefined,
  b: T | null | undefined,
): number {
  if (!a || !b) return 0;
  let count = 0;
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const k of keys) {
    if (JSON.stringify(a[k]) !== JSON.stringify(b[k])) count += 1;
  }
  return count;
}

function countMatrixDiff(
  a: Record<string, Record<string, number>> | null,
  b: Record<string, Record<string, number>> | null,
): number {
  if (!a || !b) return 0;
  let count = 0;
  for (const role of Object.keys(a)) {
    const rowA = a[role] || {};
    const rowB = b[role] || {};
    for (const dt of Object.keys(rowA)) {
      if (rowA[dt] !== rowB[dt]) count += 1;
    }
  }
  return count;
}

function countTopicsDiff(
  a: Record<string, string[]> | null,
  b: Record<string, string[]> | null,
): number {
  if (!a || !b) return 0;
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  let count = 0;
  for (const k of keys) {
    const listA = a[k] || [];
    const listB = b[k] || [];
    if (JSON.stringify(listA) !== JSON.stringify(listB)) count += 1;
  }
  return count;
}

export function countPendingChanges(data: SettingsData): number {
  return (
    countDifferingKeys(data.weights, data.originalWeights) +
    countMatrixDiff(data.roleTypeMatrix, data.originalRoleTypeMatrix) +
    countDifferingKeys(data.topicScores, data.originalTopicScores) +
    countTopicsDiff(data.specializationTopics, data.originalSpecializationTopics)
  );
}
