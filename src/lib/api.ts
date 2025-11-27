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
let refreshToken: string | null = null;

export const setAuthTokens = (token: string, refresh: string) => {
  authToken = token;
  refreshToken = refresh;
  localStorage.setItem('authToken', token);
  localStorage.setItem('refreshToken', refresh);
};

export const clearAuthTokens = () => {
  authToken = null;
  refreshToken = null;
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
    const apiError: ApiError = {
      message: error.response?.data?.message || error.message || 'An error occurred',
      code: error.response?.data?.code,
      details: error.response?.data?.details,
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
  post: async <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
    const response = await apiClient.post(url, data, config);
    return response.data;
  },

  // PUT request
  put: async <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
    const response = await apiClient.put(url, data, config);
    return response.data;
  },

  // PATCH request
  patch: async <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
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
    const response = await api.post('/auth/login', { email, password });
    // Transform backend response to match our AuthUser type
    if (response.success && response.data) {
      const { user, token, refreshToken } = response.data as any;
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
    return response;
  },

  register: async (userData: any): Promise<ApiResponse<{ user: AuthUser; token: string }>> => {
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
  getAll: async (params?: any): Promise<ApiResponse<any>> => {
    return api.get('/students', { params });
  },

  getById: async (id: string): Promise<ApiResponse<any>> => {
    return api.get(`/students/${id}`);
  },

  create: async (data: any): Promise<ApiResponse<any>> => {
    return api.post('/students', data);
  },

  update: async (id: string, data: any): Promise<ApiResponse<any>> => {
    return api.put(`/students/${id}`, data);
  },

  delete: async (id: string): Promise<ApiResponse<void>> => {
    return api.delete(`/students/${id}`);
  },

  bulkDelete: async (ids: string[]): Promise<ApiResponse<void>> => {
    return api.post('/students/bulk-delete', { ids });
  },

  search: async (query: string): Promise<ApiResponse<any>> => {
    return api.get('/students/search', { params: { q: query } });
  },

  getFees: async (id: string): Promise<ApiResponse<any>> => {
    return api.get(`/students/${id}/fees`);
  },

  getPayments: async (id: string): Promise<ApiResponse<any>> => {
    return api.get(`/students/${id}/payments`);
  },

  uploadDocument: async (id: string, file: File): Promise<ApiResponse<any>> => {
    return api.upload(`/students/${id}/documents`, file);
  },

  getDocuments: async (id: string): Promise<ApiResponse<any>> => {
    return api.get(`/students/${id}/documents`);
  },
};

// Parents API
export const parentsApi = {
  getAll: async (params?: any): Promise<ApiResponse<any>> => {
    return api.get('/parents', { params });
  },

  getById: async (id: string): Promise<ApiResponse<any>> => {
    return api.get(`/parents/${id}`);
  },

  create: async (data: any): Promise<ApiResponse<any>> => {
    return api.post('/parents', data);
  },

  update: async (id: string, data: any): Promise<ApiResponse<any>> => {
    return api.put(`/parents/${id}`, data);
  },

  delete: async (id: string): Promise<ApiResponse<void>> => {
    return api.delete(`/parents/${id}`);
  },

  getChildren: async (id: string): Promise<ApiResponse<any>> => {
    return api.get(`/parents/${id}/children`);
  },

  getChildrenFees: async (id: string): Promise<ApiResponse<any>> => {
    return api.get(`/parents/${id}/children/fees`);
  },
};

// Fee Structures API
export const feeStructuresApi = {
  getAll: async (params?: any): Promise<ApiResponse<any>> => {
    return api.get('/fee-structures', { params });
  },

  getById: async (id: string): Promise<ApiResponse<any>> => {
    return api.get(`/fee-structures/${id}`);
  },

  create: async (data: any): Promise<ApiResponse<any>> => {
    return api.post('/fee-structures', data);
  },

  update: async (id: string, data: any): Promise<ApiResponse<any>> => {
    return api.put(`/fee-structures/${id}`, data);
  },

  delete: async (id: string): Promise<ApiResponse<void>> => {
    return api.delete(`/fee-structures/${id}`);
  },

  assignToStudents: async (data: any): Promise<ApiResponse<any>> => {
    const { id, ...assignData } = data;
    return api.post(`/fee-structures/${id}/assign`, assignData);
  },

  getAssignments: async (params?: any): Promise<ApiResponse<any>> => {
    return api.get('/fee-structures/assignments', { params });
  },

  waiveAssignment: async (id: string, reason?: string): Promise<ApiResponse<any>> => {
    return api.put(`/fee-structures/assignments/${id}/waive`, { reason });
  },
};

// Fees API
export const feesApi = {
  getAll: async (params?: any): Promise<ApiResponse<any>> => {
    return api.get('/fees', { params });
  },

  getById: async (id: string): Promise<ApiResponse<any>> => {
    return api.get(`/fees/${id}`);
  },

  getByStudent: async (studentId: string): Promise<ApiResponse<any>> => {
    return api.get(`/fees/student/${studentId}`);
  },

  update: async (id: string, data: any): Promise<ApiResponse<any>> => {
    return api.put(`/fees/${id}`, data);
  },

  delete: async (id: string): Promise<ApiResponse<void>> => {
    return api.delete(`/fees/${id}`);
  },

  getOutstanding: async (params?: any): Promise<ApiResponse<any>> => {
    return api.get('/fees/outstanding', { params });
  },

  getOverdue: async (params?: any): Promise<ApiResponse<any>> => {
    return api.get('/fees/overdue', { params });
  },
};

// Payments API
export const paymentsApi = {
  getAll: async (params?: any): Promise<ApiResponse<any>> => {
    return api.get('/payments', { params });
  },

  getById: async (id: string): Promise<ApiResponse<any>> => {
    return api.get(`/payments/${id}`);
  },

  create: async (data: any): Promise<ApiResponse<any>> => {
    return api.post('/payments', data);
  },

  update: async (id: string, data: any): Promise<ApiResponse<any>> => {
    return api.put(`/payments/${id}`, data);
  },

  delete: async (id: string): Promise<ApiResponse<void>> => {
    return api.delete(`/payments/${id}`);
  },

  getReceipt: async (id: string): Promise<void> => {
    return api.download(`/payments/receipt/${id}`);
  },

  generateReceipt: async (id: string): Promise<ApiResponse<any>> => {
    return api.get(`/payments/receipt/${id}`);
  },

  voidPayment: async (id: string, reason?: string): Promise<ApiResponse<any>> => {
    return api.put(`/payments/${id}/void`, { reason });
  },

  getStats: async (params?: any): Promise<ApiResponse<any>> => {
    return api.get('/payments/stats', { params });
  },

  bulkImport: async (file: File): Promise<ApiResponse<any>> => {
    return api.upload('/payments/bulk-import', file);
  },
};

// Classes API
export const classesApi = {
  getAll: async (params?: any): Promise<ApiResponse<any>> => {
    return api.get('/classes', { params });
  },

  getById: async (id: string): Promise<ApiResponse<any>> => {
    return api.get(`/classes/${id}`);
  },

  create: async (data: any): Promise<ApiResponse<any>> => {
    return api.post('/classes', data);
  },

  update: async (id: string, data: any): Promise<ApiResponse<any>> => {
    return api.put(`/classes/${id}`, data);
  },

  delete: async (id: string): Promise<ApiResponse<void>> => {
    return api.delete(`/classes/${id}`);
  },

  getStudents: async (id: string): Promise<ApiResponse<any>> => {
    return api.get(`/classes/${id}/students`);
  },
};

// Academic Years API
export const academicYearsApi = {
  getAll: async (params?: any): Promise<ApiResponse<any>> => {
    return api.get('/academic-years', { params });
  },

  getById: async (id: string): Promise<ApiResponse<any>> => {
    return api.get(`/academic-years/${id}`);
  },

  create: async (data: any): Promise<ApiResponse<any>> => {
    return api.post('/academic-years', data);
  },

  update: async (id: string, data: any): Promise<ApiResponse<any>> => {
    return api.put(`/academic-years/${id}`, data);
  },

  delete: async (id: string): Promise<ApiResponse<void>> => {
    return api.delete(`/academic-years/${id}`);
  },

  getActive: async (): Promise<ApiResponse<any>> => {
    return api.get('/academic-years/active');
  },
};

// Reports API
export const reportsApi = {
  getFeeCollection: async (params: any): Promise<ApiResponse<any>> => {
    return api.get('/reports/fee-collection', { params });
  },

  getOutstandingFees: async (params?: any): Promise<ApiResponse<any>> => {
    return api.get('/reports/outstanding-fees', { params });
  },

  getPaymentHistory: async (params: any): Promise<ApiResponse<any>> => {
    return api.get('/reports/payment-history', { params });
  },

  getDefaulters: async (params?: any): Promise<ApiResponse<any>> => {
    return api.get('/reports/defaulters', { params });
  },

  exportReport: async (type: string, params: any, format: string): Promise<void> => {
    return api.download(`/reports/${type}/export`, `${type}-report.${format}`);
  },
};

// Dashboard API
export const dashboardApi = {
  getStats: async (): Promise<ApiResponse<any>> => {
    return api.get('/dashboard/stats');
  },

  getRecentPayments: async (): Promise<ApiResponse<any>> => {
    return api.get('/dashboard/recent-payments');
  },

  getUpcomingDues: async (): Promise<ApiResponse<any>> => {
    return api.get('/dashboard/upcoming-dues');
  },

  getCollectionTrends: async (): Promise<ApiResponse<any>> => {
    return api.get('/dashboard/collection-trends');
  },

  getRecentActivities: async (): Promise<ApiResponse<any>> => {
    return api.get('/dashboard/alerts');
  },

  getMonthlyCollection: async (): Promise<ApiResponse<any>> => {
    return api.get('/dashboard/collection-trends');
  },

  getAlerts: async (): Promise<ApiResponse<any>> => {
    return api.get('/dashboard/alerts');
  },
};

// Parent Portal API
export const parentPortalApi = {
  getSummary: async (): Promise<ApiResponse<any>> => {
    return api.get('/parent/summary');
  },

  getChildren: async (): Promise<ApiResponse<any>> => {
    return api.get('/parent/children');
  },

  getChildProfile: async (childId: string): Promise<ApiResponse<any>> => {
    return api.get(`/parent/children/${childId}`);
  },

  getChildFees: async (childId: string, params?: any): Promise<ApiResponse<any>> => {
    return api.get(`/parent/children/${childId}/fees`, { params });
  },

  getChildPayments: async (childId: string, params?: any): Promise<ApiResponse<any>> => {
    return api.get(`/parent/children/${childId}/payments`, { params });
  },

  getChildBalance: async (childId: string, params?: any): Promise<ApiResponse<any>> => {
    return api.get(`/parent/children/${childId}/balance`, { params });
  },

  getChildStats: async (childId: string): Promise<ApiResponse<any>> => {
    return api.get(`/parent/children/${childId}/stats`);
  },

  getChildReceipt: async (childId: string, paymentId: string): Promise<ApiResponse<any>> => {
    return api.get(`/parent/children/${childId}/receipt/${paymentId}`);
  },
};

// Settings API
export const settingsApi = {
  getAppSettings: async (): Promise<ApiResponse<any>> => {
    return api.get('/settings/app');
  },

  updateAppSettings: async (data: any): Promise<ApiResponse<any>> => {
    return api.put('/settings/app', data);
  },

  getUserSettings: async (): Promise<ApiResponse<any>> => {
    return api.get('/settings/user');
  },

  updateUserSettings: async (data: any): Promise<ApiResponse<any>> => {
    return api.put('/settings/user', data);
  },
};

// Notifications API
export const notificationsApi = {
  getAll: async (params?: any): Promise<ApiResponse<any>> => {
    return api.get('/notifications', { params });
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
export const handleApiError = (error: any): string => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.message) {
    return error.message;
  }
  return 'An unexpected error occurred';
};

export const isNetworkError = (error: any): boolean => {
  return !error.response && error.request;
};

export const isServerError = (error: any): boolean => {
  return error.response?.status >= 500;
};

export const isClientError = (error: any): boolean => {
  return error.response?.status >= 400 && error.response?.status < 500;
};

export default apiClient;

