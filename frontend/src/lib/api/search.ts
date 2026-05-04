import type { SearchResponse, SearchFilters, FilterOptions, ClickData, SearchField, SortBy, RankingWeights } from '../types';
import { API_BASE, safeFetch, handleResponse, parseErrorResponse, ApiError } from './client';

export interface SearchDocumentsOptions {
  weightsOverride?: Partial<RankingWeights>;
  signal?: AbortSignal;
}

export async function searchDocuments(
  query: string,
  userId?: number,
  enablePersonalization: boolean = true,
  page: number = 1,
  perPage: number = 20,
  filters?: SearchFilters,
  searchField: SearchField = 'all',
  sortBy: SortBy = 'relevance',
  options: SearchDocumentsOptions = {}
): Promise<SearchResponse> {
  const response = await safeFetch(`${API_BASE}/api/v1/search/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query,
      user_id: userId,
      page,
      per_page: perPage,
      enable_personalization: enablePersonalization,
      filters,
      search_field: searchField,
      sort_by: sortBy,
      weights_override: options.weightsOverride,
    }),
    signal: options.signal,
  });

  return handleResponse<SearchResponse>(response);
}

export interface FilterOptionsParams {
  query?: string;
  filters?: SearchFilters;
  searchField?: SearchField;
  signal?: AbortSignal;
}

export async function getFilterOptions(
  params: FilterOptionsParams = {},
): Promise<FilterOptions> {
  const { query, filters, searchField, signal } = params;
  const hasContext = (query && query.trim().length > 0) || filters !== undefined;

  if (!hasContext) {
    const response = await safeFetch(`${API_BASE}/api/v1/search/filters`, { signal });
    return handleResponse<FilterOptions>(response);
  }

  const response = await safeFetch(`${API_BASE}/api/v1/search/filters`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: query && query.trim() ? query : null,
      filters: filters ?? null,
      search_field: searchField ?? 'all',
    }),
    signal,
  });
  return handleResponse<FilterOptions>(response);
}

export interface SearchStatsResponse {
  total_impressions: number;
  total_clicks: number;
  total_documents: number;
}

export async function getSearchStats(): Promise<SearchStatsResponse> {
  const response = await safeFetch(`${API_BASE}/api/v1/search/stats`);
  return handleResponse<SearchStatsResponse>(response);
}

export interface ImpressionsData {
  query: string;
  user_id: number | null;
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

    return { success: false, error: apiError };
  }
}
