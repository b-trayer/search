export { ApiError, type ApiErrorCode } from './client';

export {
  searchDocuments,
  getFilterOptions,
  getSearchStats,
  registerImpressions,
  registerClick,
  type SearchStatsResponse,
  type ImpressionsData,
  type ImpressionsResult,
  type ClickResult,
  type SearchDocumentsOptions,
} from './search';

export { getUsers, getUser, updateUserInterests } from './users';

export {
  getWeights,
  setWeights,
  getPresets,
  applyPreset,
  resetWeights,
  saveCustomPreset,
  deleteCustomPreset,
  getRoleTypeMatrix,
  setRoleTypeMatrix,
  getTopicScores,
  setTopicScores,
  getSpecializationTopics,
  setSpecializationTopics,
  resetPreferences,
  type CustomPresetCreate,
  type RoleTypeMatrix,
  type TopicScores,
  type SpecializationTopics,
} from './settings';

export type { User, SearchResponse, DocumentResult, RankingWeights } from '../types';
