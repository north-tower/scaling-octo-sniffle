'use client';

import React, { useState, useEffect } from 'react';
import { StatsCard } from '@/components/shared/StatsCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Users, 
  CreditCard, 
  DollarSign,
  Calendar,
  Receipt,
  AlertTriangle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { parentPortalApi } from '@/lib/api';
import { useApi } from '@/hooks/useApi';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { EmptyState } from '@/components/shared/EmptyState';

export default function ParentDashboard() {
  const router = useRouter();
  const [summary, setSummary] = useState<any>(null);
  const [children, setChildren] = useState<any[]>([]);
  const [recentPayments, setRecentPayments] = useState<any[]>([]);
  const [upcomingDues, setUpcomingDues] = useState<any[]>([]);

  // Fetch summary data
  const { loading: summaryLoading, execute: fetchSummary } = useApi(
    () => parentPortalApi.getSummary(),
    {
      onSuccess: (response: any) => {
        const data = response?.data || response;
        if (data) {
          setSummary(data.summary || {});
          setChildren(data.children || []);
        }
      },
      onError: (error) => {
        console.error('Failed to fetch summary:', error);
      },
    }
  );

  // Fetch recent payments for all children
  const { loading: paymentsLoading, execute: fetchRecentPayments } = useApi(
    async () => {
      if (children.length === 0) return { success: true, data: [] };
      
      // Fetch payments for all children
      const paymentPromises = children.map((child: any) =>
        parentPortalApi.getChildPayments(child.id, { page: 1, limit: 3 })
      );
      
      const results = await Promise.all(paymentPromises);
      const allPayments = results
        .flatMap((result: any) => {
          const payments = result?.data?.payments || result?.payments || [];
          return payments.map((payment: any) => ({
            ...payment,
            childName: children.find((c: any) => c.id === payment.student_id)?.name || 'Unknown',
          }));
        })
        .sort((a: any, b: any) => {
          const dateA = new Date(a.payment_date || a.createdAt || 0);
          const dateB = new Date(b.payment_date || b.createdAt || 0);
          return dateB.getTime() - dateA.getTime();
        })
        .slice(0, 5);
      
      return { success: true, data: allPayments };
    },
    {
      onSuccess: (response: any) => {
        const payments = response?.data || [];
        setRecentPayments(payments);
      },
      onError: (error) => {
        console.error('Failed to fetch recent payments:', error);
      },
    }
  );

  // Fetch upcoming dues (balances) for all children
  const { loading: duesLoading, execute: fetchUpcomingDues } = useApi(
    async () => {
      if (children.length === 0) return { success: true, data: [] };
      
      // Fetch balances for all children
      const balancePromises = children.map((child: any) =>
        parentPortalApi.getChildBalance(child.id)
      );
      
      const results = await Promise.all(balancePromises);
      const allBalances = results
        .flatMap((result: any) => {
          const balances = result?.data?.balances || result?.balances || [];
          return balances
            .filter((balance: any) => parseFloat(balance.balance_amount || 0) > 0)
            .map((balance: any) => ({
              ...balance,
              childName: children.find((c: any) => c.id === balance.student_id)?.name || 'Unknown',
            }));
        })
        .sort((a: any, b: any) => {
          const dateA = new Date(a.due_date || a.createdAt || 0);
          const dateB = new Date(b.due_date || b.createdAt || 0);
          return dateA.getTime() - dateB.getTime();
        })
        .slice(0, 5);
      
      return { success: true, data: allBalances };
    },
    {
      onSuccess: (response: any) => {
        const dues = response?.data || [];
        setUpcomingDues(dues);
      },
      onError: (error) => {
        console.error('Failed to fetch upcoming dues:', error);
      },
    }
  );

  useEffect(() => {
    fetchSummary();
  }, []);

  useEffect(() => {
    if (children.length > 0) {
      fetchRecentPayments();
      fetchUpcomingDues();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [children.length]);

  const loading = summaryLoading || paymentsLoading || duesLoading;

  const parentStats = summary ? {
    totalChildren: summary.totalChildren || children.length,
    totalFees: summary.totalFees || 0,
    totalPaid: summary.totalPaid || 0,
    totalPending: summary.totalOutstanding || 0,
  } : {
    totalChildren: 0,
    totalFees: 0,
    totalPaid: 0,
    totalPending: 0,
  };

  if (loading && !summary) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Parent Dashboard</h1>
          <p className="text-muted-foreground">
            Manage fees and payments for your children.
          </p>
        </div>
        <Button onClick={() => router.push('/parent/payments')}>
          <Receipt className="mr-2 h-4 w-4" />
          Make Payment
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Children"
          value={parentStats.totalChildren}
          icon={Users}
          description="Enrolled students"
        />
        <StatsCard
          title="Total Fees"
          value={formatCurrency(parentStats.totalFees)}
          icon={CreditCard}
          description="All children combined"
        />
        <StatsCard
          title="Paid Amount"
          value={formatCurrency(parentStats.totalPaid)}
          icon={DollarSign}
          description="Total paid"
        />
        <StatsCard
          title="Pending Amount"
          value={formatCurrency(parentStats.totalPending)}
          icon={AlertTriangle}
          description="Outstanding fees"
        />
      </div>

      {/* Children Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            My Children
          </CardTitle>
          <CardDescription>
            Overview of your children's fee status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : children.length === 0 ? (
            <EmptyState
              title="No children found"
              description="Please contact the administrator to link your children to your account."
              icon={Users}
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {children.map((child: any) => (
                <div 
                  key={child.id} 
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                  onClick={() => router.push(`/parent/children/${child.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        {child.name?.split(' ').map((n: string) => n[0]).join('') || 'C'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{child.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {child.class} {child.section ? `- ${child.section}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(child.outstandingBalance || 0)}</p>
                    <p className="text-sm text-muted-foreground">
                      {child.overdueCount > 0 ? `${child.overdueCount} overdue` : 'Pending'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bottom Row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Payments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Recent Payments
            </CardTitle>
            <CardDescription>
              Latest payment transactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : recentPayments.length === 0 ? (
              <EmptyState
                title="No recent payments"
                description="Payment history will appear here once payments are made."
                icon={Receipt}
              />
            ) : (
              <div className="space-y-4">
                {recentPayments.map((payment: any) => (
                  <div 
                    key={payment.id} 
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                    onClick={() => router.push(`/parent/children/${payment.student_id}/payments`)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">{payment.childName || 'Unknown'}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatCurrency(payment.amount_paid || payment.amount || 0)} • {payment.payment_method || 'N/A'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {payment.payment_date 
                          ? format(new Date(payment.payment_date), 'MMM dd, yyyy')
                          : payment.createdAt 
                          ? format(new Date(payment.createdAt), 'MMM dd, yyyy')
                          : 'N/A'}
                      </p>
                      <Badge variant="default" className="text-xs">
                        Completed
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
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
              Fees due for your children
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : upcomingDues.length === 0 ? (
              <EmptyState
                title="No upcoming dues"
                description="All fees are up to date."
                icon={CheckCircle}
              />
            ) : (
              <div className="space-y-4">
                {upcomingDues.map((due: any) => {
                  const dueDate = due.due_date ? new Date(due.due_date) : null;
                  const isOverdue = due.is_overdue || (dueDate && dueDate < new Date() && !isNaN(dueDate.getTime()));
                  const feeType = due.feeStructure?.fee_type || 'Fee';
                  
                  return (
                    <div 
                      key={due.id} 
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                      onClick={() => router.push(`/parent/children/${due.student_id}/fees`)}
                    >
                      <div>
                        <p className="font-medium">{due.childName || 'Unknown'}</p>
                        <p className="text-sm text-muted-foreground">
                          {feeType} • Due: {dueDate && !isNaN(dueDate.getTime()) ? format(dueDate, 'MMM dd, yyyy') : 'N/A'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(due.balance_amount || due.amount || 0)}</p>
                        <Badge 
                          variant={isOverdue ? 'destructive' : 'secondary'}
                          className="text-xs"
                        >
                          {isOverdue ? 'Overdue' : 'Pending'}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

