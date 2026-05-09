import { translate } from '@/lib/i18n';

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
        return translate('apierror.empty');
      case 'OPENSEARCH_UNAVAILABLE':
        return translate('apierror.unavailable');
      case 'INDEX_NOT_FOUND':
        return translate('apierror.indexNotFound');
      case 'USER_NOT_FOUND':
        return translate('apierror.userNotFound');
      case 'DATABASE_ERROR':
        return translate('apierror.databaseError');
      case 'VALIDATION_ERROR':
        return translate('apierror.validationError');
      case 'NETWORK_ERROR':
        return translate('apierror.networkError');
      case 'INTERNAL_ERROR':
      default:
        return translate('apierror.internalError');
    }
  }
}

export const API_BASE = import.meta.env.VITE_API_URL || '';
const DEFAULT_TIMEOUT = 30000;

export async function parseErrorResponse(response: Response): Promise<ApiError> {
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

export async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw await parseErrorResponse(response);
  }
  return response.json();
}

async function fetchWithTimeout(
  url: string,
  options?: RequestInit,
  timeout: number = DEFAULT_TIMEOUT
): Promise<Response> {
  const timeoutController = new AbortController();
  const externalSignal = options?.signal;
  const timeoutId = setTimeout(() => timeoutController.abort(), timeout);

  const onExternalAbort = () => timeoutController.abort();
  if (externalSignal) {
    if (externalSignal.aborted) timeoutController.abort();
    else externalSignal.addEventListener('abort', onExternalAbort);
  }

  try {
    return await fetch(url, { ...options, signal: timeoutController.signal });
  } finally {
    clearTimeout(timeoutId);
    if (externalSignal) {
      externalSignal.removeEventListener('abort', onExternalAbort);
    }
  }
}

export async function safeFetch(
  url: string,
  options?: RequestInit,
  timeout: number = DEFAULT_TIMEOUT
): Promise<Response> {
  try {
    return await fetchWithTimeout(url, options, timeout);
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      if (options?.signal?.aborted) {
        throw error;
      }
      throw new ApiError('Request timed out', 0, 'NETWORK_ERROR');
    }

    throw new ApiError(
      error instanceof Error ? error.message : 'Network error',
      0,
      'NETWORK_ERROR'
    );
  }
}
