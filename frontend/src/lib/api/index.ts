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
} from './search';

export { getUsers, getUser } from './users';

export {
  getWeights,
  setWeights,
  getPresets,
  applyPreset,
  resetWeights,
  getRoleTypeMatrix,
  setRoleTypeMatrix,
  getTopicScores,
  setTopicScores,
  resetPreferences,
  type RoleTypeMatrix,
  type TopicScores,
} from './settings';

export type { User, SearchResponse, DocumentResult, RankingWeights } from '../types';
