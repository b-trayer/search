import type { SettingsData } from './types';
import type { RankingWeights } from '@/lib/types';
import type { RoleTypeMatrix, TopicScores, SpecializationTopics } from '@/lib/api';

export type WeightKey = keyof RankingWeights;

export function isWeightChanged(data: SettingsData, key: WeightKey): boolean {
  if (!data.weights || !data.originalWeights) return false;
  return data.weights[key] !== data.originalWeights[key];
}

export function isMatrixCellChanged(
  data: SettingsData,
  role: string,
  docType: string,
): boolean {
  if (!data.roleTypeMatrix || !data.originalRoleTypeMatrix) return false;
  return data.roleTypeMatrix[role]?.[docType] !== data.originalRoleTypeMatrix[role]?.[docType];
}

export function isMatrixRowChanged(data: SettingsData, role: string): boolean {
  if (!data.roleTypeMatrix || !data.originalRoleTypeMatrix) return false;
  const row = data.roleTypeMatrix[role] || {};
  const orig = data.originalRoleTypeMatrix[role] || {};
  return Object.keys(row).some((dt) => row[dt] !== orig[dt]);
}

export function isTopicScoreChanged(data: SettingsData, key: string): boolean {
  if (!data.topicScores || !data.originalTopicScores) return false;
  return data.topicScores[key] !== data.originalTopicScores[key];
}

export function isSpecializationChanged(
  data: SettingsData,
  specialization: string,
): boolean {
  if (!data.specializationTopics || !data.originalSpecializationTopics) return false;
  const cur = data.specializationTopics[specialization] || [];
  const orig = data.originalSpecializationTopics[specialization] || [];
  return JSON.stringify(cur) !== JSON.stringify(orig);
}

export interface DiffEntry {
  group: 'weights' | 'matrix' | 'topics' | 'specializations';
  label: string;
  before: string;
  after: string;
}

export function buildDiffEntries(data: SettingsData): DiffEntry[] {
  const out: DiffEntry[] = [];

  if (data.weights && data.originalWeights) {
    for (const key of Object.keys(data.weights) as WeightKey[]) {
      const a = data.originalWeights[key];
      const b = data.weights[key];
      if (a !== b) {
        out.push({
          group: 'weights',
          label: key,
          before: formatNumber(a),
          after: formatNumber(b),
        });
      }
    }
  }

  if (data.roleTypeMatrix && data.originalRoleTypeMatrix) {
    for (const role of Object.keys(data.roleTypeMatrix)) {
      const row = data.roleTypeMatrix[role] || {};
      const orig = data.originalRoleTypeMatrix[role] || {};
      for (const dt of Object.keys(row)) {
        if (row[dt] !== orig[dt]) {
          out.push({
            group: 'matrix',
            label: `${role} → ${dt}`,
            before: formatNumber(orig[dt] ?? 0),
            after: formatNumber(row[dt]),
          });
        }
      }
    }
  }

  if (data.topicScores && data.originalTopicScores) {
    for (const key of Object.keys(data.topicScores)) {
      if (data.topicScores[key] !== data.originalTopicScores[key]) {
        out.push({
          group: 'topics',
          label: key,
          before: formatNumber(data.originalTopicScores[key] ?? 0),
          after: formatNumber(data.topicScores[key]),
        });
      }
    }
  }

  if (data.specializationTopics && data.originalSpecializationTopics) {
    const keys = new Set([
      ...Object.keys(data.specializationTopics),
      ...Object.keys(data.originalSpecializationTopics),
    ]);
    for (const k of keys) {
      const cur = data.specializationTopics[k] || [];
      const orig = data.originalSpecializationTopics[k] || [];
      if (JSON.stringify(cur) !== JSON.stringify(orig)) {
        out.push({
          group: 'specializations',
          label: k,
          before: orig.length === 0 ? '—' : `${orig.length} слов`,
          after: cur.length === 0 ? '—' : `${cur.length} слов`,
        });
      }
    }
  }

  return out;
}

function formatNumber(n: number): string {
  if (Number.isInteger(n)) return n.toString();
  return n.toFixed(2);
}

export function normalizeRow(row: Record<string, number>): Record<string, number> {
  const sum = Object.values(row).reduce((acc, v) => acc + (Number.isFinite(v) ? v : 0), 0);
  if (sum <= 0) return { ...row };
  const out: Record<string, number> = {};
  for (const k of Object.keys(row)) {
    out[k] = Math.round(((row[k] || 0) / sum) * 100) / 100;
  }
  return out;
}

export function normalizeAlphas(
  alphaType: number,
  alphaTopic: number,
): { alpha_type: number; alpha_topic: number } {
  const sum = alphaType + alphaTopic;
  if (sum <= 0) return { alpha_type: 0.5, alpha_topic: 0.5 };
  return {
    alpha_type: Math.round((alphaType / sum) * 100) / 100,
    alpha_topic: Math.round((alphaTopic / sum) * 100) / 100,
  };
}
