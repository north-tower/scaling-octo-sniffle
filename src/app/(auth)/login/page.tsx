'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, LoginFormData } from '@/lib/validations';
import { useAuth } from '@/store/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { School, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isLoading, error, clearError, user } = useAuth();
  const [showPassword, setShowPassword] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data);
      
      // Get redirect URL from query params or use default based on role
      const redirectUrl = searchParams.get('redirect');
      
      if (redirectUrl) {
        router.push(redirectUrl);
      } else {
        // Will be set after login completes
        // The redirect will happen in the useEffect below
      }
    } catch {
      // Error is handled by the auth store
    }
  };

  // Redirect based on user role after successful login
  React.useEffect(() => {
    if (user) {
      const redirectUrl = searchParams.get('redirect');
      
      if (redirectUrl) {
        router.push(redirectUrl);
      } else {
        // Default redirect based on role
        switch (user.role) {
          case 'admin':
          case 'accountant':
            router.push('/admin/dashboard');
            break;
          case 'student':
            router.push('/student/dashboard');
            break;
          case 'parent':
            router.push('/parent/dashboard');
            break;
          default:
            router.push('/admin/dashboard');
        }
      }
    }
  }, [user, router, searchParams]);

  React.useEffect(() => {
    clearError();
  }, [clearError]);

  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <div className="h-12 w-12 rounded-lg bg-primary flex items-center justify-center">
            <School className="h-6 w-6 text-primary-foreground" />
          </div>
        </div>
        <CardTitle className="text-2xl">Welcome Back</CardTitle>
        <CardDescription>
          Sign in to your Fee Management System account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              {...register('email')}
              className={errors.email ? 'border-destructive' : ''}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                {...register('password')}
                className={errors.password ? 'border-destructive' : ''}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>

          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Button variant="link" className="text-sm">
            Forgot your password?
          </Button>
        </div>

        <div className="mt-4 text-center text-sm text-muted-foreground">
          <p>Demo Credentials:</p>
          <p className="font-mono text-xs mt-1">
            Admin: admin@school.com / admin123
          </p>
          <p className="font-mono text-xs">
            Student: student@school.com / student123
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

