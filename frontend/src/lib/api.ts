
import type {
  User,
  SearchResponse,
  SearchFilters,
  RankingWeights,
  WeightPreset,
  PresetsResponse,
  FilterOptions,
  ClickData,
} from './types';


const API_BASE = import.meta.env.VITE_API_URL || '';


export type ApiErrorCode =
  | 'EMPTY_QUERY'
  | 'OPENSEARCH_UNAVAILABLE'
  | 'INDEX_NOT_FOUND'
  | 'USER_NOT_FOUND'
  | 'DATABASE_ERROR'
  | 'VALIDATION_ERROR'
  | 'INTERNAL_ERROR'
  | 'NETWORK_ERROR'
  | 'UNKNOWN_ERROR';

export class ApiError extends Error {
  status: number;
  code: ApiErrorCode;

  constructor(message: string, status: number, code: ApiErrorCode = 'UNKNOWN_ERROR') {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }

  isNetworkError(): boolean {
    return this.code === 'NETWORK_ERROR' || this.code === 'OPENSEARCH_UNAVAILABLE';
  }

  isRetryable(): boolean {
    return this.status === 503 || this.code === 'NETWORK_ERROR';
  }

  getUserMessage(): string {
    switch (this.code) {
      case 'EMPTY_QUERY':
        return 'Введите поисковый запрос';
      case 'OPENSEARCH_UNAVAILABLE':
        return 'Сервис поиска временно недоступен';
      case 'INDEX_NOT_FOUND':
        return 'Поисковый индекс не найден';
      case 'USER_NOT_FOUND':
        return 'Пользователь не найден';
      case 'DATABASE_ERROR':
        return 'Ошибка базы данных';
      case 'VALIDATION_ERROR':
        return 'Неверные данные запроса';
      case 'NETWORK_ERROR':
        return 'Ошибка сети. Проверьте подключение';
      case 'INTERNAL_ERROR':
      default:
        return 'Произошла ошибка. Попробуйте позже';
    }
  }
}

async function parseErrorResponse(response: Response): Promise<ApiError> {
  try {
    const data = await response.json();
    const detail = data.detail;

    if (typeof detail === 'object' && detail.code) {
      return new ApiError(
        detail.message || 'Unknown error',
        response.status,
        detail.code as ApiErrorCode
      );
    }

    return new ApiError(
      typeof detail === 'string' ? detail : 'Unknown error',
      response.status
    );
  } catch {
    return new ApiError(
      `HTTP ${response.status}: ${response.statusText}`,
      response.status
    );
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw await parseErrorResponse(response);
  }
  return response.json();
}

async function safeFetch(url: string, options?: RequestInit): Promise<Response> {
  try {
    return await fetch(url, options);
  } catch (error) {

    throw new ApiError(
      error instanceof Error ? error.message : 'Network error',
      0,
      'NETWORK_ERROR'
    );
  }
}


export async function searchDocuments(
  query: string,
  userId?: number,
  enablePersonalization: boolean = true,
  topK: number = 20,
  filters?: SearchFilters
): Promise<SearchResponse> {
  const response = await safeFetch(`${API_BASE}/api/v1/search/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query,
      user_id: userId,
      top_k: topK,
      enable_personalization: enablePersonalization,
      filters,
    }),
  });

  return handleResponse<SearchResponse>(response);
}

export async function getFilterOptions(): Promise<FilterOptions> {
  const response = await safeFetch(`${API_BASE}/api/v1/search/filters`);
  return handleResponse<FilterOptions>(response);
}

export interface SearchStatsResponse {
  total_impressions: number;
  total_clicks: number;
}

export async function getSearchStats(): Promise<SearchStatsResponse> {
  const response = await safeFetch(`${API_BASE}/api/v1/search/stats`);
  return handleResponse<SearchStatsResponse>(response);
}

export interface ImpressionsData {
  query: string;
  user_id: number;
  document_ids: string[];
  session_id?: string;
}

export interface ImpressionsResult {
  status: string;
  total_impressions: number;
}

export async function registerImpressions(data: ImpressionsData): Promise<ImpressionsResult | null> {
  try {
    const response = await safeFetch(`${API_BASE}/api/v1/search/impressions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      return null;
    }
    return response.json();
  } catch {
    return null;
  }
}

export interface ClickResult {
  success: boolean;
  error?: ApiError;
}

export async function registerClick(clickData: ClickData): Promise<ClickResult> {
  try {
    const response = await safeFetch(`${API_BASE}/api/v1/search/click`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(clickData),
    });

    if (!response.ok) {
      const error = await parseErrorResponse(response);
      console.warn('Click registration failed:', error.code, error.message);
      return { success: false, error };
    }

    return { success: true };
  } catch (error) {
    const apiError = error instanceof ApiError
      ? error
      : new ApiError(
          error instanceof Error ? error.message : 'Unknown error',
          0,
          'NETWORK_ERROR'
        );

    console.warn('Click registration failed:', apiError.code, apiError.message);
    return { success: false, error: apiError };
  }
}


export async function getUsers(role?: string, limit: number = 130): Promise<User[]> {
  const params = new URLSearchParams();
  if (role) params.append('role', role);
  params.append('limit', limit.toString());

  const response = await safeFetch(`${API_BASE}/api/v1/users/?${params}`);
  return handleResponse<User[]>(response);
}

export async function getUser(userId: number): Promise<User> {
  const response = await safeFetch(`${API_BASE}/api/v1/users/${userId}`);
  return handleResponse<User>(response);
}


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


export const api = {
  search: {
    query: searchDocuments,
    filters: getFilterOptions,
    click: registerClick,
    stats: getSearchStats,
  },
  users: {
    list: getUsers,
    get: getUser,
  },
  settings: {
    getWeights,
    setWeights,
    getPresets,
    applyPreset,
    resetWeights,
  },
};


export type { User, SearchResponse, DocumentResult, RankingWeights } from './types';
