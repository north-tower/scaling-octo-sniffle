'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { authApi, dashboardApi, studentsApi, checkBackendConnection } from '@/lib/api';

type TestResult = {
  name: string;
  status: 'pending' | 'success' | 'error';
  message?: string;
  duration?: number;
};

export default function TestConnectionPage() {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);

  const updateResult = (index: number, update: Partial<TestResult>) => {
    setResults(prev => {
      const newResults = [...prev];
      newResults[index] = { ...newResults[index], ...update };
      return newResults;
    });
  };

  const runTests = async () => {
    setTesting(true);
    const tests: TestResult[] = [
      { name: 'Backend Connection', status: 'pending' },
      { name: 'Login API', status: 'pending' },
      { name: 'Dashboard Stats API', status: 'pending' },
      { name: 'Students API', status: 'pending' },
    ];
    setResults(tests);

    // Test 1: Backend Connection
    try {
      const start = Date.now();
      const isConnected = await checkBackendConnection();
      const duration = Date.now() - start;
      
      if (isConnected) {
        updateResult(0, {
          status: 'success',
          message: 'Backend is reachable',
          duration,
        });
      } else {
        throw new Error('Backend not reachable');
      }
    } catch (error: any) {
      updateResult(0, {
        status: 'error',
        message: error.message || 'Connection failed',
      });
      setTesting(false);
      return;
    }

    // Test 2: Login API
    try {
      const start = Date.now();
      const response = await authApi.login('admin@school.com', 'admin123');
      const duration = Date.now() - start;
      
      if (response.success) {
        updateResult(1, {
          status: 'success',
          message: 'Login successful',
          duration,
        });
      } else {
        throw new Error('Login failed');
      }
    } catch (error: any) {
      updateResult(1, {
        status: 'error',
        message: error.message || 'Login failed',
      });
    }

    // Test 3: Dashboard Stats API
    try {
      const start = Date.now();
      const response = await dashboardApi.getStats();
      const duration = Date.now() - start;
      
      if (response.success) {
        updateResult(2, {
          status: 'success',
          message: 'Dashboard stats retrieved',
          duration,
        });
      } else {
        throw new Error('Failed to get stats');
      }
    } catch (error: any) {
      updateResult(2, {
        status: 'error',
        message: error.message || 'Failed to get stats',
      });
    }

    // Test 4: Students API
    try {
      const start = Date.now();
      const response = await studentsApi.getAll({ page: 1, limit: 10 });
      const duration = Date.now() - start;
      
      if (response.success) {
        updateResult(3, {
          status: 'success',
          message: `Retrieved ${response.data?.students?.length || 0} students`,
          duration,
        });
      } else {
        throw new Error('Failed to get students');
      }
    } catch (error: any) {
      updateResult(3, {
        status: 'error',
        message: error.message || 'Failed to get students',
      });
    }

    setTesting(false);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'pending':
        return <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />;
    }
  };

  return (
    <div className="container mx-auto py-10">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Backend Connection Test</CardTitle>
          <CardDescription>
            Test the connection between frontend and backend API
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Backend URL: <code className="bg-muted px-2 py-1 rounded">
                {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}
              </code>
            </p>
            <p className="text-sm text-muted-foreground">
              Make sure your backend server is running on port 5000
            </p>
          </div>

          <Button 
            onClick={runTests} 
            disabled={testing}
            className="w-full"
          >
            {testing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testing...
              </>
            ) : (
              'Run Connection Tests'
            )}
          </Button>

          {results.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold">Test Results:</h3>
              {results.map((result, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 border rounded-lg"
                >
                  <div className="mt-0.5">
                    {getStatusIcon(result.status)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{result.name}</p>
                      {result.duration && (
                        <span className="text-xs text-muted-foreground">
                          {result.duration}ms
                        </span>
                      )}
                    </div>
                    {result.message && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {result.message}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="pt-4 border-t">
            <h3 className="font-semibold mb-2">Troubleshooting:</h3>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Ensure backend is running: <code>npm run dev</code> in backend folder</li>
              <li>Check backend is on port 5000: <code>http://localhost:5000</code></li>
              <li>Verify CORS is configured for <code>http://localhost:3000</code></li>
              <li>Check browser console for detailed error messages</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
