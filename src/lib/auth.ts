import { NextRequest, NextResponse } from 'next/server';
import { AuthUser, UserRole } from './types';

// Route protection utilities
export const isAuthenticated = (user: AuthUser | null): boolean => {
  return user !== null && user.token !== undefined;
};

export const hasRole = (user: AuthUser | null, role: UserRole): boolean => {
  return user?.role === role;
};

export const hasAnyRole = (user: AuthUser | null, roles: UserRole[]): boolean => {
  return user ? roles.includes(user.role) : false;
};

export const canAccessRoute = (user: AuthUser | null, allowedRoles: UserRole[]): boolean => {
  return isAuthenticated(user) && hasAnyRole(user, allowedRoles);
};

// Route protection middleware
type RouteHandler = (req: NextRequest, ...args: unknown[]) => Promise<NextResponse>;

export const withAuth = (handler: RouteHandler) => {
  return async (req: NextRequest, ...args: unknown[]): Promise<NextResponse> => {
    // This would be implemented with actual auth checking
    // For now, we'll return the handler
    return handler(req, ...args);
  };
};

// Role-based route protection
export const withRole = (_roles: UserRole[]) => {
  return (handler: RouteHandler): RouteHandler => {
    return async (req: NextRequest, ...args: unknown[]): Promise<NextResponse> => {
      // This would check user roles and protect routes
      // For now, we'll return the handler
      // TODO: Implement role checking using _roles parameter
      return handler(req, ...args);
    };
  };
};

// Admin route protection
export const withAdmin = (handler: RouteHandler): RouteHandler => {
  return withRole(['admin'])(handler);
};

// Student route protection
export const withStudent = (handler: RouteHandler): RouteHandler => {
  return withRole(['student'])(handler);
};

// Parent route protection
export const withParent = (handler: RouteHandler): RouteHandler => {
  return withRole(['parent'])(handler);
};

// Accountant route protection
export const withAccountant = (handler: RouteHandler): RouteHandler => {
  return withRole(['accountant'])(handler);
};

// Admin or Accountant route protection
export const withAdminOrAccountant = (handler: RouteHandler): RouteHandler => {
  return withRole(['admin', 'accountant'])(handler);
};

// Student or Parent route protection
export const withStudentOrParent = (handler: RouteHandler): RouteHandler => {
  return withRole(['student', 'parent'])(handler);
};

// Token utilities
export const getTokenFromRequest = (req: NextRequest): string | null => {
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
};

export const setTokenInResponse = (res: NextResponse, token: string): NextResponse => {
  res.cookies.set('authToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
  return res;
};

export const clearTokenFromResponse = (res: NextResponse): NextResponse => {
  res.cookies.delete('authToken');
  res.cookies.delete('refreshToken');
  return res;
};

// JWT token utilities
interface JWTPayload {
  exp?: number;
  iat?: number;
  [key: string]: unknown;
}

export const parseJWT = (token: string): JWTPayload | null => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload) as JWTPayload;
  } catch {
    return null;
  }
};

export const isTokenExpired = (token: string): boolean => {
  const payload = parseJWT(token);
  if (!payload || !payload.exp) return true;
  
  const currentTime = Date.now() / 1000;
  return payload.exp < currentTime;
};

export const getTokenExpirationTime = (token: string): Date | null => {
  const payload = parseJWT(token);
  if (!payload || !payload.exp) return null;
  
  return new Date(payload.exp * 1000);
};

export const getTokenTimeUntilExpiry = (token: string): number => {
  const expirationTime = getTokenExpirationTime(token);
  if (!expirationTime) return 0;
  
  return expirationTime.getTime() - Date.now();
};

// Password utilities
export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const generateSecurePassword = (length: number = 12): string => {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  
  // Ensure at least one character from each required category
  password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
  password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
  password += '0123456789'[Math.floor(Math.random() * 10)];
  password += '!@#$%^&*'[Math.floor(Math.random() * 8)];
  
  // Fill the rest randomly
  for (let i = 4; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

// Session management
export const createSession = (): { token: string; refreshToken: string } => {
  // In a real implementation, this would create JWT tokens
  // For now, we'll return mock tokens
  const token = `mock-jwt-token-${Date.now()}`;
  const refreshToken = `mock-refresh-token-${Date.now()}`;
  
  return { token, refreshToken };
};

export const validateSession = (token: string): AuthUser | null => {
  // In a real implementation, this would validate the JWT token
  // For now, we'll return a mock user
  if (token.startsWith('mock-jwt-token-')) {
    return {
      id: '1',
      email: 'admin@school.com',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      token,
      refreshToken: 'mock-refresh-token',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    };
  }
  
  return null;
};

export const refreshSession = (refreshToken: string): { token: string; refreshToken: string } | null => {
  // In a real implementation, this would refresh the JWT token
  // For now, we'll return new mock tokens
  if (refreshToken.startsWith('mock-refresh-token-')) {
    return {
      token: `mock-jwt-token-${Date.now()}`,
      refreshToken: `mock-refresh-token-${Date.now()}`,
    };
  }
  
  return null;
};

// Permission utilities
export const canViewStudents = (user: AuthUser | null): boolean => {
  return hasAnyRole(user, ['admin', 'accountant']);
};

export const canEditStudents = (user: AuthUser | null): boolean => {
  return hasRole(user, 'admin');
};

export const canViewFees = (user: AuthUser | null): boolean => {
  return hasAnyRole(user, ['admin', 'accountant', 'student', 'parent']);
};

export const canEditFees = (user: AuthUser | null): boolean => {
  return hasAnyRole(user, ['admin', 'accountant']);
};

export const canViewPayments = (user: AuthUser | null): boolean => {
  return hasAnyRole(user, ['admin', 'accountant', 'student', 'parent']);
};

export const canRecordPayments = (user: AuthUser | null): boolean => {
  return hasAnyRole(user, ['admin', 'accountant']);
};

export const canViewReports = (user: AuthUser | null): boolean => {
  return hasAnyRole(user, ['admin', 'accountant']);
};

export const canViewDashboard = (user: AuthUser | null): boolean => {
  return isAuthenticated(user);
};

export const canManageSettings = (user: AuthUser | null): boolean => {
  return hasRole(user, 'admin');
};

// Redirect utilities
export const getRedirectPath = (user: AuthUser | null): string => {
  if (!user) return '/login';
  
  switch (user.role) {
    case 'admin':
      return '/admin/dashboard';
    case 'accountant':
      return '/admin/dashboard';
    case 'student':
      return '/student/dashboard';
    case 'parent':
      return '/parent/dashboard';
    default:
      return '/login';
  }
};

export const getDefaultRoute = (role: UserRole): string => {
  switch (role) {
    case 'admin':
    case 'accountant':
      return '/admin/dashboard';
    case 'student':
      return '/student/dashboard';
    case 'parent':
      return '/parent/dashboard';
    default:
      return '/login';
  }
};

// Error handling
export class AuthError extends Error {
  constructor(message: string, public code: string = 'AUTH_ERROR') {
    super(message);
    this.name = 'AuthError';
  }
}

export class PermissionError extends Error {
  constructor(message: string = 'Insufficient permissions') {
    super(message);
    this.name = 'PermissionError';
  }
}

export class TokenError extends Error {
  constructor(message: string = 'Invalid or expired token') {
    super(message);
    this.name = 'TokenError';
  }
}

// Auth constants
export const AUTH_ROUTES = {
  LOGIN: '/login',
  LOGOUT: '/logout',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  PROFILE: '/profile',
} as const;

export const PROTECTED_ROUTES = {
  ADMIN: '/admin',
  STUDENT: '/student',
  PARENT: '/parent',
  DASHBOARD: '/dashboard',
} as const;

export const ROLE_ROUTES = {
  admin: '/admin',
  accountant: '/admin',
  student: '/student',
  parent: '/parent',
} as const;

