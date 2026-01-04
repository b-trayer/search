import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ApiError, safeFetch, handleResponse, parseErrorResponse } from './client';

describe('ApiError', () => {
  it('creates error with correct properties', () => {
    const error = new ApiError('Test error', 404, 'USER_NOT_FOUND');
    expect(error.message).toBe('Test error');
    expect(error.status).toBe(404);
    expect(error.code).toBe('USER_NOT_FOUND');
    expect(error.name).toBe('ApiError');
  });

  it('defaults to UNKNOWN_ERROR code', () => {
    const error = new ApiError('Test', 500);
    expect(error.code).toBe('UNKNOWN_ERROR');
  });

  describe('isNetworkError', () => {
    it('returns true for NETWORK_ERROR', () => {
      const error = new ApiError('Network', 0, 'NETWORK_ERROR');
      expect(error.isNetworkError()).toBe(true);
    });

    it('returns true for OPENSEARCH_UNAVAILABLE', () => {
      const error = new ApiError('OpenSearch', 503, 'OPENSEARCH_UNAVAILABLE');
      expect(error.isNetworkError()).toBe(true);
    });

    it('returns false for other errors', () => {
      const error = new ApiError('Not found', 404, 'USER_NOT_FOUND');
      expect(error.isNetworkError()).toBe(false);
    });
  });

  describe('isRetryable', () => {
    it('returns true for 503 status', () => {
      const error = new ApiError('Service unavailable', 503, 'INTERNAL_ERROR');
      expect(error.isRetryable()).toBe(true);
    });

    it('returns true for NETWORK_ERROR', () => {
      const error = new ApiError('Network', 0, 'NETWORK_ERROR');
      expect(error.isRetryable()).toBe(true);
    });

    it('returns false for 404', () => {
      const error = new ApiError('Not found', 404, 'USER_NOT_FOUND');
      expect(error.isRetryable()).toBe(false);
    });
  });

  describe('getUserMessage', () => {
    it('returns correct messages for each code', () => {
      expect(new ApiError('', 0, 'EMPTY_QUERY').getUserMessage()).toBe('Введите поисковый запрос');
      expect(new ApiError('', 0, 'OPENSEARCH_UNAVAILABLE').getUserMessage()).toBe('Сервис поиска временно недоступен');
      expect(new ApiError('', 0, 'INDEX_NOT_FOUND').getUserMessage()).toBe('Поисковый индекс не найден');
      expect(new ApiError('', 0, 'USER_NOT_FOUND').getUserMessage()).toBe('Пользователь не найден');
      expect(new ApiError('', 0, 'DATABASE_ERROR').getUserMessage()).toBe('Ошибка базы данных');
      expect(new ApiError('', 0, 'VALIDATION_ERROR').getUserMessage()).toBe('Неверные данные запроса');
      expect(new ApiError('', 0, 'NETWORK_ERROR').getUserMessage()).toBe('Ошибка сети. Проверьте подключение');
      expect(new ApiError('', 0, 'INTERNAL_ERROR').getUserMessage()).toBe('Произошла ошибка. Попробуйте позже');
      expect(new ApiError('', 0, 'UNKNOWN_ERROR').getUserMessage()).toBe('Произошла ошибка. Попробуйте позже');
    });
  });
});

describe('parseErrorResponse', () => {
  it('parses error with code and message', async () => {
    const response = new Response(JSON.stringify({
      detail: { code: 'USER_NOT_FOUND', message: 'User 123 not found' }
    }), { status: 404 });

    const error = await parseErrorResponse(response);
    expect(error.code).toBe('USER_NOT_FOUND');
    expect(error.message).toBe('User 123 not found');
    expect(error.status).toBe(404);
  });

  it('parses string detail', async () => {
    const response = new Response(JSON.stringify({
      detail: 'Something went wrong'
    }), { status: 500 });

    const error = await parseErrorResponse(response);
    expect(error.message).toBe('Something went wrong');
    expect(error.status).toBe(500);
  });

  it('handles non-JSON response', async () => {
    const response = new Response('Internal Server Error', {
      status: 500,
      statusText: 'Internal Server Error'
    });

    const error = await parseErrorResponse(response);
    expect(error.message).toBe('HTTP 500: Internal Server Error');
    expect(error.status).toBe(500);
  });
});

describe('handleResponse', () => {
  it('returns JSON for successful response', async () => {
    const data = { results: [], total: 0 };
    const response = new Response(JSON.stringify(data), { status: 200 });

    const result = await handleResponse(response);
    expect(result).toEqual(data);
  });

  it('throws ApiError for error response', async () => {
    const response = new Response(JSON.stringify({
      detail: { code: 'EMPTY_QUERY', message: 'Query is empty' }
    }), { status: 400 });

    await expect(handleResponse(response)).rejects.toThrow(ApiError);
  });
});

describe('safeFetch', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('returns response for successful request', async () => {
    const mockResponse = new Response(JSON.stringify({ ok: true }), { status: 200 });
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockResponse);

    const response = await safeFetch('http://test.com/api');
    expect(response.ok).toBe(true);
  });

  it('throws ApiError on network failure', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network failed'));

    await expect(safeFetch('http://test.com/api')).rejects.toThrow(ApiError);
  });

  it('throws ApiError with NETWORK_ERROR code on timeout', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(() =>
      new Promise((_, reject) => {
        const error = new Error('Aborted');
        error.name = 'AbortError';
        reject(error);
      })
    );

    try {
      await safeFetch('http://test.com/api');
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).code).toBe('NETWORK_ERROR');
    }
  });
});
