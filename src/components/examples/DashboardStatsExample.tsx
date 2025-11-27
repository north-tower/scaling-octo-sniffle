'use client';

import { useEffect, useState } from 'react';
import { dashboardApi } from '@/lib/api';
import { useApi } from '@/hooks/useApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Users, DollarSign, AlertCircle, TrendingUp } from 'lucide-react';

/**
 * Example component showing how to fetch and display dashboard statistics
 * This demonstrates real-time data fetching from the backend
 */
export function DashboardStatsExample() {
  const [stats, setStats] = useState<any>(null);

  const { loading, execute } = useApi(dashboardApi.getStats, {
    immediate: true, // Fetch immediately on mount
    onSuccess: (data) => {
      setStats(data);
    },
  });

  // Refresh stats every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      execute();
    }, 30000);

    return () => clearInterval(interval);
  }, [execute]);

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Total Students */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Students</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats?.totalStudents || 0}
          </div>
          <p className="text-xs text-muted-foreground">
            Active students in system
          </p>
        </CardContent>
      </Card>

      {/* Total Collection */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Collection</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            KES {stats?.totalCollection?.toLocaleString() || 0}
          </div>
          <p className="text-xs text-muted-foreground">
            Total fees collected
          </p>
        </CardContent>
      </Card>

      {/* Pending Dues */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending Dues</CardTitle>
          <AlertCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            KES {stats?.pendingDues?.toLocaleString() || 0}
          </div>
          <p className="text-xs text-muted-foreground">
            Outstanding payments
          </p>
        </CardContent>
      </Card>

      {/* Collection Rate */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Collection Rate</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats?.totalCollection && stats?.totalFees
              ? Math.round((stats.totalCollection / stats.totalFees) * 100)
              : 0}%
          </div>
          <p className="text-xs text-muted-foreground">
            Of total fees collected
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
