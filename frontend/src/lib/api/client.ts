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
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
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
      throw new ApiError('Request timed out', 0, 'NETWORK_ERROR');
    }

    throw new ApiError(
      error instanceof Error ? error.message : 'Network error',
      0,
      'NETWORK_ERROR'
    );
  }
}
