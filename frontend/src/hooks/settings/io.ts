import type { SettingsData } from './types';
import type { RankingWeights } from '@/lib/types';
import type { RoleTypeMatrix, TopicScores, SpecializationTopics } from '@/lib/api';

export interface SettingsExport {
  version: 1;
  exported_at: string;
  weights: RankingWeights;
  role_type_matrix: RoleTypeMatrix;
  topic_scores: TopicScores;
  specialization_topics: SpecializationTopics;
}

export function buildExport(data: SettingsData): SettingsExport | null {
  if (!data.weights || !data.roleTypeMatrix || !data.topicScores || !data.specializationTopics) {
    return null;
  }
  return {
    version: 1,
    exported_at: new Date().toISOString(),
    weights: data.weights,
    role_type_matrix: data.roleTypeMatrix,
    topic_scores: data.topicScores,
    specialization_topics: data.specializationTopics,
  };
}

export function downloadJson(filename: string, payload: unknown): void {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export interface ParseResult {
  ok: boolean;
  payload?: SettingsExport;
  error?: string;
}

export function parseImport(raw: string): ParseResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, error: 'Файл не является валидным JSON' };
  }

  if (typeof parsed !== 'object' || parsed === null) {
    return { ok: false, error: 'Корневой элемент должен быть объектом' };
  }

  const obj = parsed as Record<string, unknown>;
  const required = ['weights', 'role_type_matrix', 'topic_scores', 'specialization_topics'];
  for (const key of required) {
    if (!(key in obj)) {
      return { ok: false, error: `Отсутствует поле «${key}»` };
    }
  }

  return { ok: true, payload: obj as unknown as SettingsExport };
}
