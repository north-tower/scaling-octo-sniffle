'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { ApiResponse, ApiError } from '@/lib/types';

interface UseApiOptions<T = unknown> {
  immediate?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: ApiError) => void;
}

interface UseApiReturn<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
  execute: (...args: unknown[]) => Promise<T | null>;
  reset: () => void;
}

export function useApi<T = unknown>(
  apiFunction: (...args: unknown[]) => Promise<ApiResponse<T>>,
  options: UseApiOptions<T> = {}
): UseApiReturn<T> {
  const { immediate = false, onSuccess, onError } = options;
  
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const execute = useCallback(async (...args: unknown[]): Promise<T | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiFunction(...args);
      
      if (response.success) {
        setData(response.data);
        onSuccess?.(response.data);
        return response.data;
      } else {
        throw new Error(response.message || 'API call failed');
      }
    } catch (err) {
      const error = err as { message?: string; code?: string; details?: unknown; statusCode?: number };
      const apiError: ApiError = {
        message: error.message || 'An error occurred',
        code: error.code,
        details: error.details,
        statusCode: error.statusCode || 500,
      };
      
      setError(apiError);
      onError?.(apiError);
      
      // Show error toast unless it's a 401 (handled by auth interceptor)
      if (apiError.statusCode !== 401) {
        toast.error(apiError.message);
      }
      
      return null;
    } finally {
      setLoading(false);
    }
  }, [apiFunction, onSuccess, onError]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [immediate, execute]);

  return {
    data,
    loading,
    error,
    execute,
    reset,
  };
}

// Hook for paginated data
interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface UsePaginatedApiOptions<T = unknown> extends UseApiOptions<T[]> {
  pageSize?: number;
}

interface UsePaginatedApiReturn<T> extends UseApiReturn<T[]> {
  pagination: PaginationData;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  refresh: () => void;
}

export function usePaginatedApi<T = unknown>(
  apiFunction: (params: Record<string, unknown>) => Promise<ApiResponse<{ data: T[]; pagination: PaginationData }>>,
  options: UsePaginatedApiOptions<T> = {}
): UsePaginatedApiReturn<T> {
  const { pageSize = 10, ...apiOptions } = options;
  
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(pageSize);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: pageSize,
    total: 0,
    totalPages: 0,
  });

  const { data, loading, error, execute, reset } = useApi<{ data: T[]; pagination: PaginationData }>(
    (params: Record<string, unknown>) => apiFunction({ ...params, page, limit }),
    {
      ...apiOptions,
      onSuccess: (response) => {
        if (response?.pagination) {
          setPagination(response.pagination);
        }
        if (response?.data) {
          apiOptions.onSuccess?.(response.data);
        }
      },
    }
  );

  const refresh = useCallback(() => {
    execute({ page, limit });
  }, [execute, page, limit]);

  const handleSetPage = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const handleSetLimit = useCallback((newLimit: number) => {
    setLimit(newLimit);
    setPage(1); // Reset to first page when changing limit
  }, []);

  return {
    data: data || [],
    loading,
    error,
    execute,
    reset,
    pagination,
    setPage: handleSetPage,
    setLimit: handleSetLimit,
    refresh,
  };
}

// Hook for form submission
interface UseFormApiOptions<TResponse = unknown> {
  onSuccess?: (data: TResponse) => void;
  onError?: (error: ApiError) => void;
  successMessage?: string;
}

interface UseFormApiReturn<T> {
  loading: boolean;
  error: ApiError | null;
  submit: (data: T) => Promise<boolean>;
  reset: () => void;
}

export function useFormApi<T = unknown, TResponse = unknown>(
  apiFunction: (data: T) => Promise<ApiResponse<TResponse>>,
  options: UseFormApiOptions<TResponse> = {}
): UseFormApiReturn<T> {
  const { onSuccess, onError, successMessage } = options;
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const submit = useCallback(async (data: T): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiFunction(data);
      
      if (response.success) {
        onSuccess?.(response.data);
        if (successMessage) {
          toast.success(successMessage);
        }
        return true;
      } else {
        throw new Error(response.message || 'Form submission failed');
      }
    } catch (err) {
      const error = err as { message?: string; code?: string; details?: unknown; statusCode?: number };
      const apiError: ApiError = {
        message: error.message || 'An error occurred',
        code: error.code,
        details: error.details,
        statusCode: error.statusCode || 500,
      };
      
      setError(apiError);
      onError?.(apiError);
      
      if (apiError.statusCode !== 401) {
        toast.error(apiError.message);
      }
      
      return false;
    } finally {
      setLoading(false);
    }
  }, [apiFunction, onSuccess, onError, successMessage]);

  const reset = useCallback(() => {
    setError(null);
    setLoading(false);
  }, []);

  return {
    loading,
    error,
    submit,
    reset,
  };
}

export default useApi;

