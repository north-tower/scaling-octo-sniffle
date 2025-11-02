'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { ApiResponse, ApiError } from '@/lib/types';

interface UseApiOptions {
  immediate?: boolean;
  onSuccess?: (data: any) => void;
  onError?: (error: ApiError) => void;
}

interface UseApiReturn<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
  execute: (...args: any[]) => Promise<T | null>;
  reset: () => void;
}

export function useApi<T = any>(
  apiFunction: (...args: any[]) => Promise<ApiResponse<T>>,
  options: UseApiOptions = {}
): UseApiReturn<T> {
  const { immediate = false, onSuccess, onError } = options;
  
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const execute = useCallback(async (...args: any[]): Promise<T | null> => {
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
    } catch (err: any) {
      const apiError: ApiError = {
        message: err.message || 'An error occurred',
        code: err.code,
        details: err.details,
        statusCode: err.statusCode || 500,
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
interface UsePaginatedApiOptions extends UseApiOptions {
  pageSize?: number;
}

interface UsePaginatedApiReturn<T> extends UseApiReturn<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  refresh: () => void;
}

export function usePaginatedApi<T = any>(
  apiFunction: (params: any) => Promise<ApiResponse<{ data: T[]; pagination: any }>>,
  options: UsePaginatedApiOptions = {}
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

  const { data, loading, error, execute, reset } = useApi(
    (params: any) => apiFunction({ ...params, page, limit }),
    {
      ...apiOptions,
      onSuccess: (response: any) => {
        setPagination(response.pagination);
        apiOptions.onSuccess?.(response.data);
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
interface UseFormApiOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: ApiError) => void;
  successMessage?: string;
}

interface UseFormApiReturn<T> {
  loading: boolean;
  error: ApiError | null;
  submit: (data: T) => Promise<boolean>;
  reset: () => void;
}

export function useFormApi<T = any>(
  apiFunction: (data: T) => Promise<ApiResponse<any>>,
  options: UseFormApiOptions = {}
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
    } catch (err: any) {
      const apiError: ApiError = {
        message: err.message || 'An error occurred',
        code: err.code,
        details: err.details,
        statusCode: err.statusCode || 500,
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

