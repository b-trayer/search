import type { RankingWeights, WeightPreset } from '@/lib/types';
import type { RoleTypeMatrix, TopicScores, SpecializationTopics } from '@/lib/api';

export interface SettingsData {
  weights: RankingWeights | null;
  originalWeights: RankingWeights | null;
  currentPreset: WeightPreset | null;
  roleTypeMatrix: RoleTypeMatrix | null;
  originalRoleTypeMatrix: RoleTypeMatrix | null;
  topicScores: TopicScores | null;
  originalTopicScores: TopicScores | null;
  specializationTopics: SpecializationTopics | null;
  originalSpecializationTopics: SpecializationTopics | null;
  isLoading: boolean;
  isSaving: boolean;
  hasChanges: boolean;
}

export const initialSettingsData: SettingsData = {
  weights: null,
  originalWeights: null,
  currentPreset: null,
  roleTypeMatrix: null,
  originalRoleTypeMatrix: null,
  topicScores: null,
  originalTopicScores: null,
  specializationTopics: null,
  originalSpecializationTopics: null,
  isLoading: true,
  isSaving: false,
  hasChanges: false,
};

export function checkHasChanges(data: SettingsData): boolean {
  const { weights, originalWeights, roleTypeMatrix, originalRoleTypeMatrix,
    topicScores, originalTopicScores, specializationTopics, originalSpecializationTopics } = data;

  return (
    JSON.stringify(weights) !== JSON.stringify(originalWeights) ||
    JSON.stringify(roleTypeMatrix) !== JSON.stringify(originalRoleTypeMatrix) ||
    JSON.stringify(topicScores) !== JSON.stringify(originalTopicScores) ||
    JSON.stringify(specializationTopics) !== JSON.stringify(originalSpecializationTopics)
  );
}

export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}
