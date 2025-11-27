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
  Eye
} from 'lucide-react';
import { parentPortalApi } from '@/lib/api';
import { useApi } from '@/hooks/useApi';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { EmptyState } from '@/components/shared/EmptyState';
import { useDebounce } from '@/hooks/useDebounce';

export default function ParentFeesPage() {
  const router = useRouter();
  const [children, setChildren] = useState<any[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>('all');
  const [fees, setFees] = useState<any[]>([]);
  const [filteredFees, setFilteredFees] = useState<any[]>([]);
  const [localSearch, setLocalSearch] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [academicYearFilter, setAcademicYearFilter] = useState<string>('all');
  const debouncedSearch = useDebounce(search, 500);

  // Fetch children
  const { loading: childrenLoading, execute: fetchChildren } = useApi(
    () => parentPortalApi.getSummary(),
    {
      onSuccess: (response: any) => {
        const data = response?.data || response;
        if (data) {
          const childrenList = data.children || [];
          setChildren(childrenList);
          // Auto-select first child if available
          if (childrenList.length > 0 && selectedChildId === 'all') {
            setSelectedChildId(childrenList[0].id);
          }
        }
      },
      onError: (error) => {
        console.error('Failed to fetch children:', error);
        setChildren([]);
      },
    }
  );

  // Fetch fees for selected child
  const { loading: feesLoading, execute: fetchFees } = useApi(
    async (childId: string, params?: any) => {
      if (childId === 'all') {
        // Fetch fees for all children
        const promises = children.map((child: any) =>
          parentPortalApi.getChildFees(child.id, params).catch(() => null)
        );
        const results = await Promise.all(promises);
        const allFees = results
          .flatMap((result: any, index: number) => {
            if (!result?.data) return [];
            const child = children[index];
            const fees = result.data.fees || [];
            return fees.map((fee: any) => ({
              ...fee,
              childId: child.id,
              childName: child.name || `${child.first_name || ''} ${child.last_name || ''}`.trim(),
              childClass: child.class,
              childSection: child.section,
            }));
          });
        return { success: true, data: { fees: allFees } };
      } else {
        return parentPortalApi.getChildFees(childId, params);
      }
    },
    {
      onSuccess: (response: any) => {
        const data = response?.data || response;
        if (data) {
          const feesList = data.fees || [];
          setFees(feesList);
        }
      },
      onError: (error) => {
        console.error('Failed to fetch fees:', error);
        setFees([]);
      },
    }
  );

  useEffect(() => {
    fetchChildren();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedChildId && children.length > 0) {
      const params: any = {};
      if (academicYearFilter !== 'all') {
        params.academic_year = academicYearFilter;
      }
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      fetchFees(selectedChildId, params);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChildId, academicYearFilter, statusFilter, children.length]);

  // Filter fees based on search
  useEffect(() => {
    let filtered = fees;

    // Search filter
    if (debouncedSearch) {
      const searchLower = debouncedSearch.toLowerCase();
      filtered = filtered.filter((fee: any) => {
        const feeType = (fee.feeStructure?.fee_type || '').toLowerCase();
        const description = (fee.feeStructure?.description || '').toLowerCase();
        const childName = (fee.childName || '').toLowerCase();
        return (
          feeType.includes(searchLower) ||
          description.includes(searchLower) ||
          childName.includes(searchLower)
        );
      });
    }

    setFilteredFees(filtered);
  }, [fees, debouncedSearch]);

  const handleSearch = (value: string) => {
    setLocalSearch(value);
    setSearch(value);
  };

  const loading = childrenLoading || feesLoading;

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

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fees</h1>
          <p className="text-muted-foreground">
            View and manage fees for your children
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label>Child</Label>
              <Select value={selectedChildId} onValueChange={setSelectedChildId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select child" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Children</SelectItem>
                  {children.map((child: any) => (
                    <SelectItem key={child.id} value={child.id}>
                      {child.name || `${child.first_name || ''} ${child.last_name || ''}`.trim()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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
            {selectedChildId === 'all' 
              ? 'Fees for all your children' 
              : `Fees for ${children.find((c: any) => c.id === selectedChildId)?.name || 'selected child'}`}
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
                  : "No fees have been assigned yet."
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
                            {selectedChildId === 'all' && (
                              <>
                                <span className="text-muted-foreground">•</span>
                                <p className="text-sm text-muted-foreground">
                                  {fee.childName}
                                </p>
                              </>
                            )}
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

                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-muted-foreground">Status</p>
                            <Badge
                              variant={
                                status === 'paid'
                                  ? 'default'
                                  : isOverdue || status === 'overdue'
                                  ? 'destructive'
                                  : 'secondary'
                              }
                              className="mt-1"
                            >
                              {status === 'paid' 
                                ? 'Paid' 
                                : isOverdue || status === 'overdue'
                                ? 'Overdue'
                                : 'Pending'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (fee.childId) {
                            router.push(`/parent/children/${fee.childId}/fees`);
                          }
                        }}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
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


