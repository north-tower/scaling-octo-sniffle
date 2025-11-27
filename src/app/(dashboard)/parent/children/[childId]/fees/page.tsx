'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  CreditCard, 
  Search,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Calendar,
  DollarSign,
  GraduationCap,
  Filter,
  ArrowLeft,
  Eye
} from 'lucide-react';
import { parentPortalApi } from '@/lib/api';
import { useApi } from '@/hooks/useApi';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { useRouter, useParams } from 'next/navigation';
import { EmptyState } from '@/components/shared/EmptyState';
import { useDebounce } from '@/hooks/useDebounce';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export default function ChildFeesPage() {
  const router = useRouter();
  const params = useParams();
  const childId = params?.childId as string;
  
  const [child, setChild] = useState<any>(null);
  const [fees, setFees] = useState<any[]>([]);
  const [filteredFees, setFilteredFees] = useState<any[]>([]);
  const [localSearch, setLocalSearch] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [academicYearFilter, setAcademicYearFilter] = useState<string>('all');
  const debouncedSearch = useDebounce(search, 500);

  // Fetch child profile
  const { loading: childLoading, execute: fetchChild } = useApi(
    () => parentPortalApi.getChildProfile(childId),
    {
      onSuccess: (response: any) => {
        const data = response?.data || response;
        if (data) {
          setChild(data.child || data);
        }
      },
      onError: (error) => {
        console.error('Failed to fetch child:', error);
      },
    }
  );

  // Fetch fees
  const { loading: feesLoading, execute: fetchFees } = useApi(
    (params?: any) => parentPortalApi.getChildFees(childId, params),
    {
      onSuccess: (response: any) => {
        const data = response?.data || response;
        if (data) {
          setFees(data.fees || []);
          if (data.child && !child) {
            setChild(data.child);
          }
        }
      },
      onError: (error) => {
        console.error('Failed to fetch fees:', error);
        setFees([]);
      },
    }
  );

  useEffect(() => {
    if (childId) {
      fetchChild();
      fetchFees();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [childId]);

  useEffect(() => {
    if (childId) {
      const params: any = {};
      if (academicYearFilter !== 'all') {
        params.academic_year = academicYearFilter;
      }
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      fetchFees(params);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, academicYearFilter]);

  // Filter fees based on search
  useEffect(() => {
    let filtered = fees;

    // Search filter
    if (debouncedSearch) {
      const searchLower = debouncedSearch.toLowerCase();
      filtered = filtered.filter((fee: any) => {
        const feeType = (fee.feeStructure?.fee_type || '').toLowerCase();
        const description = (fee.feeStructure?.description || '').toLowerCase();
        return (
          feeType.includes(searchLower) ||
          description.includes(searchLower)
        );
      });
    }

    setFilteredFees(filtered);
  }, [fees, debouncedSearch]);

  const handleSearch = (value: string) => {
    setLocalSearch(value);
    setSearch(value);
  };

  const loading = childLoading || feesLoading;

  // Get unique academic years from fees
  const academicYears = Array.from(
    new Set(
      fees
        .map((fee: any) => fee.feeStructure?.academic_year)
        .filter((year: any) => year)
    )
  ).sort();

  // Calculate summary statistics
  const summary = fees.reduce(
    (acc: any, fee: any) => {
      const amount = parseFloat(fee.feeStructure?.amount || 0);
      acc.totalAmount += amount;
      if (fee.status === 'paid') {
        acc.paidAmount += amount;
        acc.paidCount += 1;
      } else if (fee.status === 'assigned') {
        acc.pendingAmount += amount;
        acc.pendingCount += 1;
      } else if (fee.status === 'overdue') {
        acc.overdueAmount += amount;
        acc.overdueCount += 1;
      }
      acc.totalCount += 1;
      return acc;
    },
    {
      totalAmount: 0,
      paidAmount: 0,
      pendingAmount: 0,
      overdueAmount: 0,
      totalCount: 0,
      paidCount: 0,
      pendingCount: 0,
      overdueCount: 0,
    }
  );

  const childName = child?.name || `${child?.first_name || ''} ${child?.last_name || ''}`.trim() || 'Child';
  const initials = childName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'C';

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
            <h1 className="text-3xl font-bold tracking-tight">Fees</h1>
            <p className="text-muted-foreground">
              Fee assignments for {childName}
            </p>
          </div>
        </div>
      </div>

      {/* Child Info Card */}
      {child && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-primary/10 text-primary text-lg">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="text-xl font-semibold">{childName}</h3>
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <GraduationCap className="h-4 w-4" />
                    <span>
                      {child.class || 'N/A'} {child.section ? `- ${child.section}` : ''}
                    </span>
                  </div>
                  {child.student_id && (
                    <div className="flex items-center gap-1">
                      <span>ID: {child.student_id}</span>
                    </div>
                  )}
                  {child.roll_number && (
                    <div className="flex items-center gap-1">
                      <span>Roll: {child.roll_number}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Academic Year</Label>
              <Select value={academicYearFilter} onValueChange={setAcademicYearFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All years" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {academicYears.map((year: any) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search fees..."
                  value={localSearch}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {fees.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Fees</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(summary.totalAmount)}</div>
              <p className="text-xs text-muted-foreground">{summary.totalCount} fees</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Paid</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(summary.paidAmount)}
              </div>
              <p className="text-xs text-muted-foreground">{summary.paidCount} fees paid</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {formatCurrency(summary.pendingAmount)}
              </div>
              <p className="text-xs text-muted-foreground">{summary.pendingCount} fees pending</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(summary.overdueAmount)}
              </div>
              <p className="text-xs text-muted-foreground">{summary.overdueCount} fees overdue</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Fees List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Fee Assignments
          </CardTitle>
          <CardDescription>
            All fees assigned to {childName}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading && fees.length === 0 ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredFees.length === 0 ? (
            <EmptyState
              title="No fees found"
              description={
                search || statusFilter !== 'all' || academicYearFilter !== 'all'
                  ? "Try adjusting your filters"
                  : "No fees have been assigned to this child yet."
              }
              icon={CreditCard}
            />
          ) : (
            <div className="space-y-4">
              {filteredFees.map((fee: any) => {
                const feeStructure = fee.feeStructure || {};
                const dueDate = feeStructure.due_date 
                  ? new Date(feeStructure.due_date) 
                  : null;
                const assignedDate = fee.assigned_date 
                  ? new Date(fee.assigned_date) 
                  : null;
                const isOverdue = dueDate && dueDate < new Date() && fee.status !== 'paid';
                const status = fee.status || 'assigned';

                return (
                  <div
                    key={fee.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <CreditCard className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">{feeStructure.fee_type || 'Fee'}</p>
                            <Badge
                              variant={
                                status === 'paid'
                                  ? 'default'
                                  : isOverdue || status === 'overdue'
                                  ? 'destructive'
                                  : 'secondary'
                              }
                            >
                              {status === 'paid' 
                                ? 'Paid' 
                                : isOverdue || status === 'overdue'
                                ? 'Overdue'
                                : 'Pending'}
                            </Badge>
                          </div>
                          {feeStructure.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {feeStructure.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-sm">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-muted-foreground">Amount</p>
                            <p className="font-medium">{formatCurrency(feeStructure.amount || 0)}</p>
                          </div>
                        </div>

                        {dueDate && (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-muted-foreground">Due Date</p>
                              <p className="font-medium">{format(dueDate, 'MMM dd, yyyy')}</p>
                            </div>
                          </div>
                        )}

                        {feeStructure.academic_year && (
                          <div className="flex items-center gap-2">
                            <GraduationCap className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-muted-foreground">Academic Year</p>
                              <p className="font-medium">{feeStructure.academic_year}</p>
                            </div>
                          </div>
                        )}

                        {assignedDate && (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-muted-foreground">Assigned Date</p>
                              <p className="font-medium">{format(assignedDate, 'MMM dd, yyyy')}</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {feeStructure.late_fee_amount && parseFloat(feeStructure.late_fee_amount) > 0 && (
                        <div className="mt-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded text-sm">
                          <p className="text-yellow-800 dark:text-yellow-200">
                            <AlertTriangle className="inline h-4 w-4 mr-1" />
                            Late fee: {formatCurrency(feeStructure.late_fee_amount)}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/parent/children/${childId}/balance`)}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View Balance
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


