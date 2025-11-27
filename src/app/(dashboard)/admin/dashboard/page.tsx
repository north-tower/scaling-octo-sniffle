'use client';

import React, { useMemo, useEffect } from 'react';
import { StatsCard } from '@/components/shared/StatsCard';
import { BarChartComponent } from '@/components/charts/BarChart';
import { PieChartComponent } from '@/components/charts/PieChart';
import { LineChartComponent } from '@/components/charts/LineChart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  CreditCard, 
  DollarSign, 
  AlertTriangle,
  TrendingUp,
  Calendar,
  UserPlus,
  Receipt,
  Loader2
} from 'lucide-react';
import { useApi } from '@/hooks/useApi';
import { dashboardApi } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { format, formatDistanceToNow, parseISO, startOfMonth, endOfMonth, startOfDay, endOfDay } from 'date-fns';

export default function AdminDashboard() {
  const router = useRouter();

  // Fetch dashboard stats
  const { data: statsData, loading: statsLoading, execute: refreshStats } = useApi(
    dashboardApi.getStats,
    { immediate: false }
  );

  // Fetch recent payments
  const { data: recentPaymentsData, loading: paymentsLoading, execute: fetchPayments } = useApi(
    () => dashboardApi.getRecentPayments(),
    { immediate: false }
  );

  // Fetch upcoming dues
  const { data: upcomingDuesData, loading: duesLoading, execute: fetchDues } = useApi(
    () => dashboardApi.getUpcomingDues(),
    { immediate: false }
  );

  // Fetch collection trends
  const { data: trendsData, loading: trendsLoading, execute: fetchTrends } = useApi(
    () => dashboardApi.getCollectionTrends(),
    { immediate: false }
  );

  // Fetch alerts/activities
  const { data: alertsData, loading: alertsLoading, execute: fetchAlerts } = useApi(
    dashboardApi.getAlerts,
    { immediate: false }
  );

  // Stagger API requests to avoid rate limiting - only run once on mount
  useEffect(() => {
    let isMounted = true;
    
    // Fetch stats immediately
    refreshStats();
    
    // Stagger other requests
    const timer1 = setTimeout(() => {
      if (isMounted) fetchPayments();
    }, 150);
    
    const timer2 = setTimeout(() => {
      if (isMounted) fetchDues();
    }, 300);
    
    const timer3 = setTimeout(() => {
      if (isMounted) fetchTrends();
    }, 450);
    
    const timer4 = setTimeout(() => {
      if (isMounted) fetchAlerts();
    }, 600);

    return () => {
      isMounted = false;
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - only run once on mount

  // Transform stats data
  const stats = useMemo(() => {
    if (!statsData) {
      return {
        totalStudents: 0,
        totalFees: 0,
        collectedAmount: 0,
        pendingAmount: 0,
        overdueAmount: 0,
        defaultersCount: 0,
      };
    }

    const overview = statsData.overview || {};
    const currentPeriod = statsData.currentPeriod || {};

    return {
      totalStudents: overview.totalStudents || 0,
      totalFees: overview.totalFeeStructures || 0,
      collectedAmount: currentPeriod.monthlyCollection || 0,
      pendingAmount: overview.totalOutstanding || 0,
      overdueAmount: 0, // Not directly available, can be calculated
      defaultersCount: overview.overdueFeesCount || 0,
    };
  }, [statsData]);

  // Transform monthly collection data for bar chart
  const monthlyCollectionData = useMemo(() => {
    if (!trendsData?.dailyCollection) {
      return [];
    }

    // Group by month from daily collection
    const monthlyMap = new Map<string, number>();
    
    trendsData.dailyCollection.forEach((item: any) => {
      try {
        const date = item.date ? parseISO(item.date) : new Date();
        const monthKey = format(date, 'MMM');
        const total = parseFloat(item.total) || 0;
        
        if (monthlyMap.has(monthKey)) {
          monthlyMap.set(monthKey, monthlyMap.get(monthKey)! + total);
        } else {
          monthlyMap.set(monthKey, total);
        }
      } catch (e) {
        // Skip invalid dates
      }
    });

    return Array.from(monthlyMap.entries())
      .map(([name, value]) => ({ name, value: Math.round(value) }))
      .slice(-6); // Last 6 months
  }, [trendsData]);

  // Transform fee type data for pie chart
  const feeTypeData = useMemo(() => {
    if (!trendsData?.collectionByFeeType) {
      return [];
    }

    const colors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658'];
    
    return trendsData.collectionByFeeType.map((item: any, index: number) => ({
      name: item.fee_type ? item.fee_type.charAt(0).toUpperCase() + item.fee_type.slice(1) : 'Other',
      value: Math.round(parseFloat(item.total) || 0),
      color: colors[index % colors.length],
    }));
  }, [trendsData]);

  // Transform class-wise data for line chart
  const classWiseData = useMemo(() => {
    if (!trendsData?.classWiseCollection) {
      return [];
    }

    // For line chart, we need time series data per class
    // Since we have daily collection, we can group by class and date
    // For now, let's create a simple representation
    const classData = trendsData.classWiseCollection.map((item: any) => ({
      name: item.class || 'Unknown',
      data: [{ 
        x: format(new Date(), 'MMM'), 
        y: Math.round(parseFloat(item.total) || 0) 
      }],
    }));

    return classData.slice(0, 5); // Top 5 classes
  }, [trendsData]);

  // Transform recent activities from payments and alerts
  const recentActivities = useMemo(() => {
    const activities: any[] = [];

    // Add recent payments as activities
    if (recentPaymentsData?.recentPayments) {
      recentPaymentsData.recentPayments.slice(0, 5).forEach((payment: any) => {
        const studentName = payment.student 
          ? `${payment.student.first_name || ''} ${payment.student.last_name || ''}`.trim()
          : 'Unknown Student';
        
        const paymentDate = payment.payment_date || payment.createdAt;
        const timeAgo = paymentDate 
          ? formatDistanceToNow(new Date(paymentDate), { addSuffix: true })
          : 'Recently';
        
        activities.push({
          id: payment.id,
          type: 'payment',
          message: `Payment received from ${studentName}`,
          time: timeAgo,
          amount: parseFloat(payment.amount_paid) || 0,
        });
      });
    }

    // Add alerts as activities
    if (alertsData?.alerts) {
      alertsData.alerts.forEach((alert: any, index: number) => {
        activities.push({
          id: `alert-${index}`,
          type: alert.type || 'info',
          message: alert.message,
          time: 'Just now',
        });
      });
    }

    return activities.slice(0, 5);
  }, [recentPaymentsData, alertsData]);

  // Transform upcoming dues
  const upcomingDues = useMemo(() => {
    if (!upcomingDuesData?.upcomingDues) {
      return [];
    }

    return upcomingDuesData.upcomingDues.slice(0, 5).map((due: any) => {
      const student = due.student || {};
      const studentName = `${student.first_name || ''} ${student.last_name || ''}`.trim() || 'Unknown';
      const className = student.class ? `Class ${student.class}` : 'Unknown Class';
      
      const dueDate = due.due_date ? format(new Date(due.due_date), 'yyyy-MM-dd') : 'N/A';
      
      return {
        id: due.id,
        student: studentName,
        class: className,
        amount: Math.round(parseFloat(due.balance_amount) || 0),
        dueDate,
      };
    });
  }, [upcomingDuesData]);

  const isLoading = statsLoading || paymentsLoading || duesLoading || trendsLoading || alertsLoading;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's what's happening with your fee management.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => router.push('/admin/students/add')}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add Student
          </Button>
          <Button variant="outline" onClick={() => router.push('/admin/payments/record')}>
            <Receipt className="mr-2 h-4 w-4" />
            Record Payment
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading dashboard data...</span>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="Total Students"
              value={stats.totalStudents.toLocaleString()}
              icon={Users}
              description="Active students"
            />
            <StatsCard
              title="Total Fee Structures"
              value={stats.totalFees.toLocaleString()}
              icon={CreditCard}
              description="Active fee structures"
            />
            <StatsCard
              title="Collected Amount"
              value={`KES ${stats.collectedAmount.toLocaleString()}`}
              icon={DollarSign}
              description="This month"
            />
            <StatsCard
              title="Defaulters"
              value={stats.defaultersCount}
              icon={AlertTriangle}
              description="Overdue payments"
            />
          </div>

          {/* Charts Row */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {monthlyCollectionData.length > 0 ? (
              <BarChartComponent
                data={monthlyCollectionData}
                title="Monthly Collection"
                description="Fee collection trend over months"
                height={300}
              />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Collection</CardTitle>
                  <CardDescription>No data available</CardDescription>
                </CardHeader>
              </Card>
            )}
            
            {feeTypeData.length > 0 ? (
              <PieChartComponent
                data={feeTypeData}
                title="Fee Type Distribution"
                description="Breakdown by fee types"
                height={300}
              />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Fee Type Distribution</CardTitle>
                  <CardDescription>No data available</CardDescription>
                </CardHeader>
              </Card>
            )}
            
            {classWiseData.length > 0 ? (
              <LineChartComponent
                data={classWiseData}
                title="Class-wise Collection"
                description="Collection trend by class"
                height={300}
              />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Class-wise Collection</CardTitle>
                  <CardDescription>No data available</CardDescription>
                </CardHeader>
              </Card>
            )}
          </div>

          {/* Bottom Row */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Recent Activities */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Recent Activities
                </CardTitle>
                <CardDescription>
                  Latest updates and transactions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recentActivities.length > 0 ? (
                  <div className="space-y-4">
                    {recentActivities.map((activity) => (
                      <div key={activity.id} className="flex items-start gap-3">
                        <div className="h-2 w-2 rounded-full bg-primary mt-2" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{activity.message}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground">{activity.time}</span>
                            {activity.amount && (
                              <Badge variant="secondary" className="text-xs">
                                KES {activity.amount.toLocaleString()}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No recent activities
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Upcoming Dues */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Upcoming Dues
                </CardTitle>
                <CardDescription>
                  Fees due in the next 30 days
                </CardDescription>
              </CardHeader>
              <CardContent>
                {upcomingDues.length > 0 ? (
                  <div className="space-y-4">
                    {upcomingDues.map((due) => (
                      <div key={due.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{due.student}</p>
                          <p className="text-sm text-muted-foreground">{due.class}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">KES {due.amount.toLocaleString()}</p>
                          <p className="text-sm text-muted-foreground">{due.dueDate}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No upcoming dues
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

