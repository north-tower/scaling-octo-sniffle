import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { toast } from 'sonner';
import { ApiResponse, ApiError, AuthUser } from './types';

// Check if backend is available
export const checkBackendConnection = async (): Promise<boolean> => {
  try {
    // Try to ping the backend - adjust endpoint based on your backend
    const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}`.replace('/api', ''), {
      timeout: 5000,
    });
    return response.status === 200;
  } catch (error) {
    console.error('Backend connection failed:', error);
    return false;
  }
};

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const API_TIMEOUT = 30000; // 30 seconds

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token management
let authToken: string | null = null;

export const setAuthTokens = (token: string, refresh: string) => {
  authToken = token;
  localStorage.setItem('authToken', token);
  localStorage.setItem('refreshToken', refresh);
};

export const clearAuthTokens = () => {
  authToken = null;
  localStorage.removeItem('authToken');
  localStorage.removeItem('refreshToken');
};

export const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('authToken');
  }
  return authToken;
};

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling and token refresh
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    // Handle 401 errors (unauthorized)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Attempt to refresh token
        const refresh = localStorage.getItem('refreshToken');
        if (refresh) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken: refresh,
          });

          const { token, refreshToken: newRefreshToken } = response.data.data;
          setAuthTokens(token, newRefreshToken);

          // Retry original request with new token
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        clearAuthTokens();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    // Handle other errors
    const errorData = error.response?.data as { message?: string; code?: string; details?: Record<string, unknown> } | undefined;
    const apiError: ApiError = {
      message: errorData?.message || error.message || 'An error occurred',
      code: errorData?.code,
      details: errorData?.details,
      statusCode: error.response?.status || 500,
    };

    // Show error toast for non-401 errors
    if (error.response?.status !== 401) {
      toast.error(apiError.message);
    }

    return Promise.reject(apiError);
  }
);

// Generic API methods
export const api = {
  // GET request
  get: async <T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
    const response = await apiClient.get(url, config);
    return response.data;
  },

  // POST request
  post: async <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
    const response = await apiClient.post(url, data, config);
    return response.data;
  },

  // PUT request
  put: async <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
    const response = await apiClient.put(url, data, config);
    return response.data;
  },

  // PATCH request
  patch: async <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
    const response = await apiClient.patch(url, data, config);
    return response.data;
  },

  // DELETE request
  delete: async <T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
    const response = await apiClient.delete(url, config);
    return response.data;
  },

  // Upload file
  upload: async <T>(url: string, file: File, onProgress?: (progress: number) => void): Promise<ApiResponse<T>> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });

    return response.data;
  },

  // Download file
  download: async (url: string, filename?: string): Promise<void> => {
    const response = await apiClient.get(url, {
      responseType: 'blob',
    });

    const blob = new Blob([response.data]);
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  },
};

// Authentication API
export const authApi = {
  login: async (email: string, password: string): Promise<ApiResponse<{ user: AuthUser; token: string; refreshToken?: string }>> => {
    const response = await api.post<{ user: AuthUser; token: string; refreshToken?: string }>('/auth/login', { email, password });
    // Transform backend response to match our AuthUser type
    if (response.success && response.data) {
      const responseData = response.data;
      const { user, token, refreshToken } = responseData;
      return {
        success: true,
        data: {
          user: {
            ...user,
            token,
            refreshToken: refreshToken || token,
          },
          token,
          refreshToken: refreshToken || token,
        },
      };
    }
    return response as ApiResponse<{ user: AuthUser; token: string; refreshToken?: string }>;
  },

  register: async (userData: unknown): Promise<ApiResponse<{ user: AuthUser; token: string }>> => {
    return api.post('/auth/register', userData);
  },

  logout: async (): Promise<ApiResponse<void>> => {
    return api.post('/auth/logout');
  },

  refreshToken: async (refreshToken: string): Promise<ApiResponse<{ token: string; refreshToken: string }>> => {
    return api.post('/auth/refresh', { refreshToken });
  },

  forgotPassword: async (email: string): Promise<ApiResponse<void>> => {
    return api.post('/auth/forgot-password', { email });
  },

  resetPassword: async (token: string, password: string): Promise<ApiResponse<void>> => {
    return api.post('/auth/reset-password', { token, password });
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<ApiResponse<void>> => {
    return api.post('/auth/change-password', { currentPassword, newPassword });
  },

  getProfile: async (): Promise<ApiResponse<AuthUser>> => {
    return api.get('/auth/profile');
  },

  updateProfile: async (data: Partial<AuthUser>): Promise<ApiResponse<AuthUser>> => {
    return api.put('/auth/profile', data);
  },
};

// Students API
export const studentsApi = {
  getAll: async <T = unknown>(params?: Record<string, unknown>): Promise<ApiResponse<T>> => {
    return api.get<T>('/students', { params });
  },

  getById: async <T = unknown>(id: string): Promise<ApiResponse<T>> => {
    return api.get<T>(`/students/${id}`);
  },

  create: async <T = unknown>(data: unknown): Promise<ApiResponse<T>> => {
    return api.post<T>('/students', data);
  },

  update: async <T = unknown>(id: string, data: unknown): Promise<ApiResponse<T>> => {
    return api.put<T>(`/students/${id}`, data);
  },

  delete: async (id: string): Promise<ApiResponse<void>> => {
    return api.delete(`/students/${id}`);
  },

  bulkDelete: async (ids: string[]): Promise<ApiResponse<void>> => {
    return api.post('/students/bulk-delete', { ids });
  },

  search: async <T = unknown>(query: string): Promise<ApiResponse<T>> => {
    return api.get<T>('/students/search', { params: { q: query } });
  },

  getFees: async <T = unknown>(id: string): Promise<ApiResponse<T>> => {
    return api.get<T>(`/students/${id}/fees`);
  },

  getPayments: async <T = unknown>(id: string): Promise<ApiResponse<T>> => {
    return api.get<T>(`/students/${id}/payments`);
  },

  uploadDocument: async <T = unknown>(id: string, file: File): Promise<ApiResponse<T>> => {
    return api.upload<T>(`/students/${id}/documents`, file);
  },

  getDocuments: async <T = unknown>(id: string): Promise<ApiResponse<T>> => {
    return api.get<T>(`/students/${id}/documents`);
  },
};

// Parents API
export const parentsApi = {
  getAll: async <T = unknown>(params?: Record<string, unknown>): Promise<ApiResponse<T>> => {
    return api.get<T>('/parents', { params });
  },

  getById: async <T = unknown>(id: string): Promise<ApiResponse<T>> => {
    return api.get<T>(`/parents/${id}`);
  },

  create: async <T = unknown>(data: unknown): Promise<ApiResponse<T>> => {
    return api.post<T>('/parents', data);
  },

  update: async <T = unknown>(id: string, data: unknown): Promise<ApiResponse<T>> => {
    return api.put<T>(`/parents/${id}`, data);
  },

  delete: async (id: string): Promise<ApiResponse<void>> => {
    return api.delete(`/parents/${id}`);
  },

  getChildren: async <T = unknown>(id: string): Promise<ApiResponse<T>> => {
    return api.get<T>(`/parents/${id}/children`);
  },

  getChildrenFees: async <T = unknown>(id: string): Promise<ApiResponse<T>> => {
    return api.get<T>(`/parents/${id}/children/fees`);
  },
};

// Fee Structures API
export const feeStructuresApi = {
  getAll: async <T = unknown>(params?: Record<string, unknown>): Promise<ApiResponse<T>> => {
    return api.get<T>('/fee-structures', { params });
  },

  getById: async <T = unknown>(id: string): Promise<ApiResponse<T>> => {
    return api.get<T>(`/fee-structures/${id}`);
  },

  create: async <T = unknown>(data: unknown): Promise<ApiResponse<T>> => {
    return api.post<T>('/fee-structures', data);
  },

  update: async <T = unknown>(id: string, data: unknown): Promise<ApiResponse<T>> => {
    return api.put<T>(`/fee-structures/${id}`, data);
  },

  delete: async (id: string): Promise<ApiResponse<void>> => {
    return api.delete(`/fee-structures/${id}`);
  },

  assignToStudents: async <T = unknown>(data: { id: string; [key: string]: unknown }): Promise<ApiResponse<T>> => {
    const { id, ...assignData } = data;
    return api.post<T>(`/fee-structures/${id}/assign`, assignData);
  },

  getAssignments: async <T = unknown>(params?: Record<string, unknown>): Promise<ApiResponse<T>> => {
    return api.get<T>('/fee-structures/assignments', { params });
  },

  waiveAssignment: async <T = unknown>(id: string, reason?: string): Promise<ApiResponse<T>> => {
    return api.put<T>(`/fee-structures/assignments/${id}/waive`, { reason });
  },
};

// Fees API
export const feesApi = {
  getAll: async <T = unknown>(params?: Record<string, unknown>): Promise<ApiResponse<T>> => {
    return api.get<T>('/fees', { params });
  },

  getById: async <T = unknown>(id: string): Promise<ApiResponse<T>> => {
    return api.get<T>(`/fees/${id}`);
  },

  getByStudent: async <T = unknown>(studentId: string): Promise<ApiResponse<T>> => {
    return api.get<T>(`/fees/student/${studentId}`);
  },

  update: async <T = unknown>(id: string, data: unknown): Promise<ApiResponse<T>> => {
    return api.put<T>(`/fees/${id}`, data);
  },

  delete: async (id: string): Promise<ApiResponse<void>> => {
    return api.delete(`/fees/${id}`);
  },

  getOutstanding: async <T = unknown>(params?: Record<string, unknown>): Promise<ApiResponse<T>> => {
    return api.get<T>('/fees/outstanding', { params });
  },

  getOverdue: async <T = unknown>(params?: Record<string, unknown>): Promise<ApiResponse<T>> => {
    return api.get<T>('/fees/overdue', { params });
  },
};

// Payments API
export const paymentsApi = {
  getAll: async <T = unknown>(params?: Record<string, unknown>): Promise<ApiResponse<T>> => {
    return api.get<T>('/payments', { params });
  },

  getById: async <T = unknown>(id: string): Promise<ApiResponse<T>> => {
    return api.get<T>(`/payments/${id}`);
  },

  create: async <T = unknown>(data: unknown): Promise<ApiResponse<T>> => {
    return api.post<T>('/payments', data);
  },

  update: async <T = unknown>(id: string, data: unknown): Promise<ApiResponse<T>> => {
    return api.put<T>(`/payments/${id}`, data);
  },

  delete: async (id: string): Promise<ApiResponse<void>> => {
    return api.delete(`/payments/${id}`);
  },

  getReceipt: async (id: string): Promise<void> => {
    return api.download(`/payments/receipt/${id}`);
  },

  generateReceipt: async <T = unknown>(id: string): Promise<ApiResponse<T>> => {
    return api.get<T>(`/payments/receipt/${id}`);
  },

  voidPayment: async <T = unknown>(id: string, reason?: string): Promise<ApiResponse<T>> => {
    return api.put<T>(`/payments/${id}/void`, { reason });
  },

  getStats: async <T = unknown>(params?: Record<string, unknown>): Promise<ApiResponse<T>> => {
    return api.get<T>('/payments/stats', { params });
  },

  bulkImport: async <T = unknown>(file: File): Promise<ApiResponse<T>> => {
    return api.upload<T>('/payments/bulk-import', file);
  },
};

// Classes API
export const classesApi = {
  getAll: async <T = unknown>(params?: Record<string, unknown>): Promise<ApiResponse<T>> => {
    return api.get<T>('/classes', { params });
  },

  getById: async <T = unknown>(id: string): Promise<ApiResponse<T>> => {
    return api.get<T>(`/classes/${id}`);
  },

  create: async <T = unknown>(data: unknown): Promise<ApiResponse<T>> => {
    return api.post<T>('/classes', data);
  },

  update: async <T = unknown>(id: string, data: unknown): Promise<ApiResponse<T>> => {
    return api.put<T>(`/classes/${id}`, data);
  },

  delete: async (id: string): Promise<ApiResponse<void>> => {
    return api.delete(`/classes/${id}`);
  },

  getStudents: async <T = unknown>(id: string): Promise<ApiResponse<T>> => {
    return api.get<T>(`/classes/${id}/students`);
  },
};

// Academic Years API
export const academicYearsApi = {
  getAll: async <T = unknown>(params?: Record<string, unknown>): Promise<ApiResponse<T>> => {
    return api.get<T>('/academic-years', { params });
  },

  getById: async <T = unknown>(id: string): Promise<ApiResponse<T>> => {
    return api.get<T>(`/academic-years/${id}`);
  },

  create: async <T = unknown>(data: unknown): Promise<ApiResponse<T>> => {
    return api.post<T>('/academic-years', data);
  },

  update: async <T = unknown>(id: string, data: unknown): Promise<ApiResponse<T>> => {
    return api.put<T>(`/academic-years/${id}`, data);
  },

  delete: async (id: string): Promise<ApiResponse<void>> => {
    return api.delete(`/academic-years/${id}`);
  },

  getActive: async <T = unknown>(): Promise<ApiResponse<T>> => {
    return api.get<T>('/academic-years/active');
  },
};

// Reports API
export const reportsApi = {
  getFeeCollection: async <T = unknown>(params: Record<string, unknown>): Promise<ApiResponse<T>> => {
    return api.get<T>('/reports/fee-collection', { params });
  },

  getOutstandingFees: async <T = unknown>(params?: Record<string, unknown>): Promise<ApiResponse<T>> => {
    return api.get<T>('/reports/outstanding-fees', { params });
  },

  getPaymentHistory: async <T = unknown>(params: Record<string, unknown>): Promise<ApiResponse<T>> => {
    return api.get<T>('/reports/payment-history', { params });
  },

  getDefaulters: async <T = unknown>(params?: Record<string, unknown>): Promise<ApiResponse<T>> => {
    return api.get<T>('/reports/defaulters', { params });
  },

  exportReport: async (type: string, params: Record<string, unknown>, format: string): Promise<void> => {
    return api.download(`/reports/${type}/export`, `${type}-report.${format}`);
  },
};

// Dashboard API
export const dashboardApi = {
  getStats: async <T = unknown>(): Promise<ApiResponse<T>> => {
    return api.get<T>('/dashboard/stats');
  },

  getRecentPayments: async <T = unknown>(): Promise<ApiResponse<T>> => {
    return api.get<T>('/dashboard/recent-payments');
  },

  getUpcomingDues: async <T = unknown>(): Promise<ApiResponse<T>> => {
    return api.get<T>('/dashboard/upcoming-dues');
  },

  getCollectionTrends: async <T = unknown>(): Promise<ApiResponse<T>> => {
    return api.get<T>('/dashboard/collection-trends');
  },

  getRecentActivities: async <T = unknown>(): Promise<ApiResponse<T>> => {
    return api.get<T>('/dashboard/alerts');
  },

  getMonthlyCollection: async <T = unknown>(): Promise<ApiResponse<T>> => {
    return api.get<T>('/dashboard/collection-trends');
  },

  getAlerts: async <T = unknown>(): Promise<ApiResponse<T>> => {
    return api.get<T>('/dashboard/alerts');
  },
};

// Parent Portal API
export const parentPortalApi = {
  getSummary: async <T = unknown>(): Promise<ApiResponse<T>> => {
    return api.get<T>('/parent/summary');
  },

  getChildren: async <T = unknown>(): Promise<ApiResponse<T>> => {
    return api.get<T>('/parent/children');
  },

  getChildProfile: async <T = unknown>(childId: string): Promise<ApiResponse<T>> => {
    return api.get<T>(`/parent/children/${childId}`);
  },

  getChildFees: async <T = unknown>(childId: string, params?: Record<string, unknown>): Promise<ApiResponse<T>> => {
    return api.get<T>(`/parent/children/${childId}/fees`, { params });
  },

  getChildPayments: async <T = unknown>(childId: string, params?: Record<string, unknown>): Promise<ApiResponse<T>> => {
    return api.get<T>(`/parent/children/${childId}/payments`, { params });
  },

  getChildBalance: async <T = unknown>(childId: string, params?: Record<string, unknown>): Promise<ApiResponse<T>> => {
    return api.get<T>(`/parent/children/${childId}/balance`, { params });
  },

  getChildStats: async <T = unknown>(childId: string): Promise<ApiResponse<T>> => {
    return api.get<T>(`/parent/children/${childId}/stats`);
  },

  getChildReceipt: async <T = unknown>(childId: string, paymentId: string): Promise<ApiResponse<T>> => {
    return api.get<T>(`/parent/children/${childId}/receipt/${paymentId}`);
  },
};

// Settings API
export const settingsApi = {
  getAppSettings: async <T = unknown>(): Promise<ApiResponse<T>> => {
    return api.get<T>('/settings/app');
  },

  updateAppSettings: async <T = unknown>(data: unknown): Promise<ApiResponse<T>> => {
    return api.put<T>('/settings/app', data);
  },

  getUserSettings: async <T = unknown>(): Promise<ApiResponse<T>> => {
    return api.get<T>('/settings/user');
  },

  updateUserSettings: async <T = unknown>(data: unknown): Promise<ApiResponse<T>> => {
    return api.put<T>('/settings/user', data);
  },
};

// Notifications API
export const notificationsApi = {
  getAll: async <T = unknown>(params?: Record<string, unknown>): Promise<ApiResponse<T>> => {
    return api.get<T>('/notifications', { params });
  },

  markAsRead: async (id: string): Promise<ApiResponse<void>> => {
    return api.put(`/notifications/${id}/read`);
  },

  markAllAsRead: async (): Promise<ApiResponse<void>> => {
    return api.put('/notifications/read-all');
  },

  delete: async (id: string): Promise<ApiResponse<void>> => {
    return api.delete(`/notifications/${id}`);
  },
};

// Utility functions
export const handleApiError = (error: unknown): string => {
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as { response?: { data?: { message?: string } }; message?: string };
    if (axiosError.response?.data?.message) {
      return axiosError.response.data.message;
    }
    if (axiosError.message) {
      return axiosError.message;
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
};

export const isNetworkError = (error: unknown): boolean => {
  return error !== null && typeof error === 'object' && 'request' in error && !('response' in error);
};

export const isServerError = (error: unknown): boolean => {
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as { response?: { status?: number } };
    return (axiosError.response?.status ?? 0) >= 500;
  }
  return false;
};

export const isClientError = (error: unknown): boolean => {
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as { response?: { status?: number } };
    const status = axiosError.response?.status ?? 0;
    return status >= 400 && status < 500;
  }
  return false;
};

export default apiClient;

