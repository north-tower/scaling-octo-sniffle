import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthState, AuthUser, LoginFormData } from '@/lib/types';
import { authApi } from '@/lib/api';
import { toast } from 'sonner';
import { cookies } from '@/lib/cookies';

interface AuthStore extends AuthState {
  // Actions
  login: (credentials: LoginFormData) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  updateProfile: (data: Partial<AuthUser>) => Promise<void>;
  clearError: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      login: async (credentials: LoginFormData) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await authApi.login(credentials.email, credentials.password);
          
          if (response.success && response.data) {
            const { user, token, refreshToken } = response.data;
            
            // Create AuthUser object with token
            const authUser: AuthUser = {
              ...user,
              token,
              refreshToken: refreshToken || token,
            };
            
            // Store tokens in localStorage
            localStorage.setItem('authToken', token);
            localStorage.setItem('refreshToken', refreshToken || token);
            localStorage.setItem('user', JSON.stringify(authUser));
            
            // Also set cookie for middleware (7 days)
            cookies.set('authToken', token, 7);
            
            set({
              user: authUser,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
            
            toast.success('Login successful');
          } else {
            throw new Error(response.message || 'Login failed');
          }
        } catch (error: any) {
          const errorMessage = error.message || 'Login failed';
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: errorMessage,
          });
          toast.error(errorMessage);
          throw error;
        }
      },

      logout: async () => {
        set({ isLoading: true });
        
        try {
          await authApi.logout();
        } catch (error) {
          // Continue with logout even if API call fails
          console.error('Logout API call failed:', error);
        } finally {
          // Clear local storage and state
          localStorage.removeItem('authToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          
          // Clear cookie
          cookies.delete('authToken');
          
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
          
          toast.success('Logged out successfully');
        }
      },

      refreshToken: async () => {
        const refreshToken = localStorage.getItem('refreshToken');
        
        if (!refreshToken) {
          set({ isAuthenticated: false, user: null });
          return;
        }

        try {
          const response = await authApi.refreshToken(refreshToken);
          
          if (response.success && response.data) {
            const { token, refreshToken: newRefreshToken } = response.data;
            
            // Update tokens
            localStorage.setItem('authToken', token);
            localStorage.setItem('refreshToken', newRefreshToken);
            
            // Update user token
            const currentUser = get().user;
            if (currentUser) {
              set({
                user: {
                  ...currentUser,
                  token,
                  refreshToken: newRefreshToken,
                },
              });
            }
          } else {
            throw new Error('Token refresh failed');
          }
        } catch (error) {
          // Refresh failed, logout user
          localStorage.removeItem('authToken');
          localStorage.removeItem('refreshToken');
          
          set({
            user: null,
            isAuthenticated: false,
            error: 'Session expired. Please login again.',
          });
          
          // Redirect to login page
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        }
      },

      updateProfile: async (data: Partial<AuthUser>) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await authApi.updateProfile(data);
          
          if (response.success && response.data) {
            set({
              user: response.data,
              isLoading: false,
              error: null,
            });
            
            toast.success('Profile updated successfully');
          } else {
            throw new Error(response.message || 'Profile update failed');
          }
        } catch (error: any) {
          const errorMessage = error.message || 'Profile update failed';
          set({
            isLoading: false,
            error: errorMessage,
          });
          toast.error(errorMessage);
          throw error;
        }
      },

      clearError: () => {
        set({ error: null });
      },

      checkAuth: async () => {
        const token = localStorage.getItem('authToken');
        
        if (!token) {
          set({ isAuthenticated: false, user: null });
          return;
        }

        set({ isLoading: true });
        
        try {
          const response = await authApi.getProfile();
          
          if (response.success && response.data) {
            set({
              user: response.data,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
          } else {
            throw new Error('Authentication check failed');
          }
        } catch (error) {
          // Auth check failed, try to refresh token
          await get().refreshToken();
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Selectors for easier access to specific state
export const useAuth = () => {
  const store = useAuthStore();
  return {
    user: store.user,
    isAuthenticated: store.isAuthenticated,
    isLoading: store.isLoading,
    error: store.error,
    login: store.login,
    logout: store.logout,
    updateProfile: store.updateProfile,
    clearError: store.clearError,
  };
};

export const useUser = () => useAuthStore((state) => state.user);
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useAuthLoading = () => useAuthStore((state) => state.isLoading);
export const useAuthError = () => useAuthStore((state) => state.error);

// Helper functions
export const hasRole = (user: AuthUser | null, role: string): boolean => {
  return user?.role === role;
};

export const hasAnyRole = (user: AuthUser | null, roles: string[]): boolean => {
  return user ? roles.includes(user.role) : false;
};

export const isAdmin = (user: AuthUser | null): boolean => {
  return hasRole(user, 'admin');
};

export const isStudent = (user: AuthUser | null): boolean => {
  return hasRole(user, 'student');
};

export const isParent = (user: AuthUser | null): boolean => {
  return hasRole(user, 'parent');
};

export const isAccountant = (user: AuthUser | null): boolean => {
  return hasRole(user, 'accountant');
};

export const canAccessAdmin = (user: AuthUser | null): boolean => {
  return hasAnyRole(user, ['admin', 'accountant']);
};

export const canAccessStudent = (user: AuthUser | null): boolean => {
  return hasAnyRole(user, ['student', 'parent']);
};

export const canAccessParent = (user: AuthUser | null): boolean => {
  return hasRole(user, 'parent');
};

// Token management helpers
export const getStoredToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('authToken');
};

export const getStoredRefreshToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('refreshToken');
};

export const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp * 1000; // Convert to milliseconds
    return Date.now() >= exp;
  } catch {
    return true;
  }
};

export const getTokenExpirationTime = (token: string): Date | null => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return new Date(payload.exp * 1000);
  } catch {
    return null;
  }
};

// Auto-refresh token setup
export const setupTokenRefresh = () => {
  const token = getStoredToken();
  
  if (!token) return;
  
  const expirationTime = getTokenExpirationTime(token);
  
  if (!expirationTime) return;
  
  // Refresh token 5 minutes before expiration
  const refreshTime = expirationTime.getTime() - 5 * 60 * 1000;
  const currentTime = Date.now();
  
  if (refreshTime > currentTime) {
    const timeUntilRefresh = refreshTime - currentTime;
    
    setTimeout(() => {
      useAuthStore.getState().refreshToken();
    }, timeUntilRefresh);
  } else {
    // Token is already expired or about to expire
    useAuthStore.getState().refreshToken();
  }
};

// Initialize auth state on app start
export const initializeAuth = async () => {
  const token = getStoredToken();
  
  if (!token) {
    return;
  }
  
  if (isTokenExpired(token)) {
    await useAuthStore.getState().refreshToken();
  } else {
    await useAuthStore.getState().checkAuth();
    setupTokenRefresh();
  }
};

