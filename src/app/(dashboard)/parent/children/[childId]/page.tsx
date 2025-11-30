'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { 
  ArrowLeft,
  Loader2,
  GraduationCap,
  Calendar,
  Phone,
  Mail,
  MapPin,
  User,
  CreditCard,
  Receipt,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  Eye
} from 'lucide-react';
import { parentPortalApi } from '@/lib/api';
import { useApi } from '@/hooks/useApi';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { useRouter, useParams } from 'next/navigation';
import { EmptyState } from '@/components/shared/EmptyState';
import { StatsCard } from '@/components/shared/StatsCard';

interface ChildData {
  id?: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  student_id?: string;
  class?: string;
  section?: string;
  roll_number?: string;
  phone?: string;
  email?: string;
  address?: string;
  date_of_birth?: string;
  admission_date?: string;
  gender?: string;
  blood_group?: string;
  status?: 'active' | 'inactive' | 'graduated' | 'transferred';
  emergency_contact?: string;
  emergency_contact_name?: string;
}

interface ChildStats {
  totalFees?: number;
  totalPayments?: number;
  totalPaid?: number;
  outstandingBalance?: number;
  monthlyPayments?: number;
  overdueFees?: number;
}

interface BalanceSummary {
  totalAmount?: number;
  paidAmount?: number;
  balanceAmount?: number;
  overdueAmount?: number;
  overdueCount?: number;
}

export default function ChildProfilePage() {
  const router = useRouter();
  const params = useParams();
  const childId = params?.childId as string;
  
  const [child, setChild] = useState<ChildData | null>(null);
  const [stats, setStats] = useState<ChildStats | null>(null);
  const [balance, setBalance] = useState<BalanceSummary | null>(null);

  // Fetch child profile
  type ChildProfileResponse = {
    data: {
      child: ChildData;
    };
  } | {
    data: ChildData;
  } | {
    child: ChildData;
  } | ChildData;

  const { loading: childLoading, execute: fetchChild } = useApi<ChildProfileResponse>(
    () => parentPortalApi.getChildProfile(childId),
    {
      onSuccess: (response) => {
        const data = response && typeof response === 'object' && 'data' in response ? response.data : response;
        if (data && typeof data === 'object') {
          if ('child' in data && data.child) {
            setChild(data.child as ChildData);
          } else {
            setChild(data as ChildData);
          }
        }
      },
      onError: (error) => {
        console.error('Failed to fetch child:', error);
      },
    }
  );

  // Fetch child stats
  type ChildStatsResponse = {
    data: {
      stats: ChildStats;
    };
  } | {
    data: ChildStats;
  } | {
    stats: ChildStats;
  } | ChildStats;

  const { loading: statsLoading, execute: fetchStats } = useApi<ChildStatsResponse>(
    () => parentPortalApi.getChildStats(childId),
    {
      onSuccess: (response) => {
        const data = response && typeof response === 'object' && 'data' in response ? response.data : response;
        if (data && typeof data === 'object') {
          if ('stats' in data && data.stats) {
            setStats(data.stats as ChildStats);
          } else {
            setStats(data as ChildStats);
          }
        }
      },
      onError: (error) => {
        console.error('Failed to fetch stats:', error);
      },
    }
  );

  // Fetch child balance summary
  type ChildBalanceResponse = {
    data: {
      summary: BalanceSummary;
    };
  } | {
    data: BalanceSummary;
  } | {
    summary: BalanceSummary;
  } | BalanceSummary;

  const { loading: balanceLoading, execute: fetchBalance } = useApi<ChildBalanceResponse>(
    () => parentPortalApi.getChildBalance(childId),
    {
      onSuccess: (response) => {
        const data = response && typeof response === 'object' && 'data' in response ? response.data : response;
        if (data && typeof data === 'object') {
          if ('summary' in data && data.summary) {
            setBalance(data.summary as BalanceSummary);
          } else {
            setBalance(data as BalanceSummary);
          }
        }
      },
      onError: (error) => {
        console.error('Failed to fetch balance:', error);
      },
    }
  );

  useEffect(() => {
    if (childId) {
      fetchChild();
      fetchStats();
      fetchBalance();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [childId]);

  const loading = childLoading || statsLoading || balanceLoading;

  if (loading && !child) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!child) {
    return (
      <div className="space-y-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/parent/children')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Children
        </Button>
        <EmptyState
          title="Child not found"
          description="The child you're looking for doesn't exist or you don't have access to view it."
          icon={User}
        />
      </div>
    );
  }

  const childName = child.name || `${child.first_name || ''} ${child.last_name || ''}`.trim() || 'Child';
  const initials = childName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'C';

  const dateOfBirth = child.date_of_birth 
    ? new Date(child.date_of_birth) 
    : null;
  const admissionDate = child.admission_date 
    ? new Date(child.admission_date) 
    : null;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/parent/children')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Children
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{childName}</h1>
            <p className="text-muted-foreground">
              Student Profile and Fee Information
            </p>
          </div>
        </div>
      </div>

      {/* Profile Card */}
      <Card>
        <CardHeader>
          <CardTitle>Student Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex items-center justify-center md:justify-start">
              <Avatar className="h-24 w-24">
                <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <Label className="text-muted-foreground text-sm">Student ID</Label>
                  <p className="font-medium">{child.student_id || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-sm">Class</Label>
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium">
                      {child.class || 'N/A'} {child.section ? `- ${child.section}` : ''}
                    </p>
                  </div>
                </div>
                {child.roll_number && (
                  <div>
                    <Label className="text-muted-foreground text-sm">Roll Number</Label>
                    <p className="font-medium">{child.roll_number}</p>
                  </div>
                )}
                {dateOfBirth && (
                  <div>
                    <Label className="text-muted-foreground text-sm">Date of Birth</Label>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <p className="font-medium">{format(dateOfBirth, 'PPP')}</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="space-y-4">
                {child.gender && (
                  <div>
                    <Label className="text-muted-foreground text-sm">Gender</Label>
                    <p className="font-medium capitalize">{child.gender}</p>
                  </div>
                )}
                {child.blood_group && (
                  <div>
                    <Label className="text-muted-foreground text-sm">Blood Group</Label>
                    <p className="font-medium">{child.blood_group}</p>
                  </div>
                )}
                {admissionDate && (
                  <div>
                    <Label className="text-muted-foreground text-sm">Admission Date</Label>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <p className="font-medium">{format(admissionDate, 'PPP')}</p>
                    </div>
                  </div>
                )}
                {child.status && (
                  <div>
                    <Label className="text-muted-foreground text-sm">Status</Label>
                    <div>
                      <Badge variant={child.status === 'active' ? 'default' : 'secondary'}>
                        {child.status === 'active' ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {child.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <Label className="text-muted-foreground text-sm">Phone</Label>
                  <p className="font-medium">{child.phone}</p>
                </div>
              </div>
            )}
            {child.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <Label className="text-muted-foreground text-sm">Email</Label>
                  <p className="font-medium">{child.email}</p>
                </div>
              </div>
            )}
            {child.address && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div>
                  <Label className="text-muted-foreground text-sm">Address</Label>
                  <p className="font-medium">{child.address}</p>
                </div>
              </div>
            )}
            {child.emergency_contact && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <Label className="text-muted-foreground text-sm">Emergency Contact</Label>
                  <p className="font-medium">
                    {child.emergency_contact}
                    {child.emergency_contact_name && ` (${child.emergency_contact_name})`}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Fees"
            value={stats.totalFees || 0}
            icon={CreditCard}
            description="Assigned fees"
          />
          <StatsCard
            title="Total Payments"
            value={stats.totalPayments || 0}
            icon={Receipt}
            description="Payment transactions"
          />
          <StatsCard
            title="Total Paid"
            value={formatCurrency(stats.totalPaid || 0)}
            icon={DollarSign}
            description="Amount paid"
          />
          <StatsCard
            title="Outstanding"
            value={formatCurrency(stats.outstandingBalance || 0)}
            icon={AlertTriangle}
            description="Remaining balance"
            change={
              stats.outstandingBalance > 0
                ? { value: 100, type: 'increase' }
                : undefined
            }
          />
        </div>
      )}

      {/* Balance Summary */}
      {balance && (
        <Card>
          <CardHeader>
            <CardTitle>Balance Summary</CardTitle>
            <CardDescription>Current fee balance overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div>
                <Label className="text-muted-foreground text-sm">Total Amount</Label>
                <p className="text-2xl font-bold">{formatCurrency(balance.totalAmount || 0)}</p>
              </div>
              <div>
                <Label className="text-muted-foreground text-sm">Paid Amount</Label>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(balance.paidAmount || 0)}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground text-sm">Balance Amount</Label>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(balance.balanceAmount || 0)}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground text-sm">Overdue</Label>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(balance.overdueAmount || 0)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {balance.overdueCount || 0} {balance.overdueCount === 1 ? 'fee' : 'fees'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push(`/parent/children/${childId}/fees`)}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Fees
            </CardTitle>
            <CardDescription>View all fee assignments</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              <Eye className="mr-2 h-4 w-4" />
              View Fees
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push(`/parent/children/${childId}/payments`)}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Payments
            </CardTitle>
            <CardDescription>View payment history</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              <Eye className="mr-2 h-4 w-4" />
              View Payments
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push(`/parent/children/${childId}/balance`)}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Balance
            </CardTitle>
            <CardDescription>View detailed balance</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              <Eye className="mr-2 h-4 w-4" />
              View Balance
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats */}
      {stats && (stats.monthlyPayments > 0 || stats.overdueFees > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {stats.monthlyPayments > 0 && (
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-sm">This Month&apos;s Payments</Label>
                    <p className="font-semibold">{formatCurrency(stats.monthlyPayments)}</p>
                  </div>
                </div>
              )}
              {stats.overdueFees > 0 && (
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-sm">Overdue Fees</Label>
                    <p className="font-semibold text-red-600">
                      {stats.overdueFees} {stats.overdueFees === 1 ? 'fee' : 'fees'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

