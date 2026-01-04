import type { RankingWeights, WeightPreset, PresetsResponse } from '../types';
import { API_BASE, safeFetch, handleResponse } from './client';

export type RoleTypeMatrix = Record<string, Record<string, number>>;
export type TopicScores = Record<string, number>;
export type SpecializationTopics = Record<string, string[]>;

export async function getWeights(): Promise<RankingWeights> {
  const response = await safeFetch(`${API_BASE}/api/v1/settings/weights`);
  return handleResponse<RankingWeights>(response);
}

export async function setWeights(weights: RankingWeights): Promise<RankingWeights> {
  const response = await safeFetch(`${API_BASE}/api/v1/settings/weights`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(weights),
  });
  return handleResponse<RankingWeights>(response);
}

export async function getPresets(): Promise<PresetsResponse> {
  const response = await safeFetch(`${API_BASE}/api/v1/settings/presets`);
  return handleResponse<PresetsResponse>(response);
}

export async function applyPreset(preset: WeightPreset): Promise<RankingWeights> {
  const response = await safeFetch(`${API_BASE}/api/v1/settings/presets/${preset}`, {
    method: 'POST',
  });
  return handleResponse<RankingWeights>(response);
}

export async function resetWeights(): Promise<RankingWeights> {
  const response = await safeFetch(`${API_BASE}/api/v1/settings/reset`, {
    method: 'POST',
  });
  return handleResponse<RankingWeights>(response);
}

export async function getRoleTypeMatrix(): Promise<RoleTypeMatrix> {
  const response = await safeFetch(`${API_BASE}/api/v1/settings/role-type-matrix`);
  return handleResponse<RoleTypeMatrix>(response);
}

export async function setRoleTypeMatrix(matrix: RoleTypeMatrix): Promise<RoleTypeMatrix> {
  const response = await safeFetch(`${API_BASE}/api/v1/settings/role-type-matrix`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(matrix),
  });
  return handleResponse<RoleTypeMatrix>(response);
}

export async function getTopicScores(): Promise<TopicScores> {
  const response = await safeFetch(`${API_BASE}/api/v1/settings/topic-scores`);
  return handleResponse<TopicScores>(response);
}

export async function setTopicScores(scores: TopicScores): Promise<TopicScores> {
  const response = await safeFetch(`${API_BASE}/api/v1/settings/topic-scores`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(scores),
  });
  return handleResponse<TopicScores>(response);
}

export async function getSpecializationTopics(): Promise<SpecializationTopics> {
  const response = await safeFetch(`${API_BASE}/api/v1/settings/specialization-topics`);
  return handleResponse<SpecializationTopics>(response);
}

export async function setSpecializationTopics(topics: SpecializationTopics): Promise<SpecializationTopics> {
  const response = await safeFetch(`${API_BASE}/api/v1/settings/specialization-topics`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(topics),
  });
  return handleResponse<SpecializationTopics>(response);
}

export async function resetPreferences(): Promise<{
  role_type_matrix: RoleTypeMatrix;
  topic_scores: TopicScores;
  specialization_topics: SpecializationTopics;
}> {
  const response = await safeFetch(`${API_BASE}/api/v1/settings/preferences/reset`, {
    method: 'POST',
  });
  return handleResponse(response);
}
