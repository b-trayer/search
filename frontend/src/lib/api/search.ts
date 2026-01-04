import type { SearchResponse, SearchFilters, FilterOptions, ClickData } from '../types';
import { API_BASE, safeFetch, handleResponse, parseErrorResponse, ApiError } from './client';

export async function searchDocuments(
  query: string,
  userId?: number,
  enablePersonalization: boolean = true,
  page: number = 1,
  perPage: number = 20,
  filters?: SearchFilters
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
