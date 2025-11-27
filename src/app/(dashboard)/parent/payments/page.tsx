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
  Receipt, 
  Search,
  Loader2,
  CheckCircle,
  Calendar,
  DollarSign,
  GraduationCap,
  Filter,
  Eye,
  Download,
  FileText,
  CreditCard
} from 'lucide-react';
import { parentPortalApi } from '@/lib/api';
import { useApi } from '@/hooks/useApi';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { EmptyState } from '@/components/shared/EmptyState';
import { useDebounce } from '@/hooks/useDebounce';

export default function ParentPaymentsPage() {
  const router = useRouter();
  const [children, setChildren] = useState<any[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>('all');
  const [payments, setPayments] = useState<any[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [localSearch, setLocalSearch] = useState('');
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
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

  // Fetch payments for selected child
  const { loading: paymentsLoading, execute: fetchPayments } = useApi(
    async (childId: string, params?: any) => {
      if (childId === 'all') {
        // Fetch payments for all children
        const promises = children.map((child: any) =>
          parentPortalApi.getChildPayments(child.id, { ...params, limit: 100 }).catch(() => null)
        );
        const results = await Promise.all(promises);
        const allPayments = results
          .flatMap((result: any, index: number) => {
            if (!result?.data) return [];
            const child = children[index];
            const payments = result.data.payments || [];
            return payments.map((payment: any) => ({
              ...payment,
              childId: child.id,
              childName: child.name || `${child.first_name || ''} ${child.last_name || ''}`.trim(),
              childClass: child.class,
              childSection: child.section,
            }));
          })
          .sort((a: any, b: any) => {
            const dateA = new Date(a.payment_date || a.created_at || 0);
            const dateB = new Date(b.payment_date || b.created_at || 0);
            return dateB.getTime() - dateA.getTime();
          });
        
        // Apply pagination manually for "all children"
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedPayments = allPayments.slice(startIndex, endIndex);
        
        return {
          success: true,
          data: {
            payments: paginatedPayments,
            pagination: {
              currentPage: page,
              totalPages: Math.ceil(allPayments.length / limit),
              totalItems: allPayments.length,
              itemsPerPage: limit,
            },
          },
        };
      } else {
        return parentPortalApi.getChildPayments(childId, { ...params, page, limit });
      }
    },
    {
      onSuccess: (response: any) => {
        const data = response?.data || response;
        if (data) {
          const paymentsList = data.payments || [];
          setPayments(paymentsList);
          if (data.pagination) {
            setPagination(data.pagination);
          }
        }
      },
      onError: (error) => {
        console.error('Failed to fetch payments:', error);
        setPayments([]);
        setPagination(null);
      },
    }
  );

  useEffect(() => {
    fetchChildren();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedChildId && children.length > 0) {
      const params: any = { page, limit };
      if (startDate) {
        params.start_date = startDate;
      }
      if (endDate) {
        params.end_date = endDate;
      }
      if (academicYearFilter !== 'all') {
        params.academic_year = academicYearFilter;
      }
      fetchPayments(selectedChildId, params);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChildId, startDate, endDate, academicYearFilter, children.length, page]);

  // Filter payments based on search
  useEffect(() => {
    let filtered = payments;

    // Search filter
    if (debouncedSearch) {
      const searchLower = debouncedSearch.toLowerCase();
      filtered = filtered.filter((payment: any) => {
        const receiptNumber = (payment.receipt_number || '').toLowerCase();
        const transactionId = (payment.transaction_id || '').toLowerCase();
        const paymentMethod = (payment.payment_method || '').toLowerCase();
        const feeType = (payment.feeStructure?.fee_type || '').toLowerCase();
        const childName = (payment.childName || '').toLowerCase();
        return (
          receiptNumber.includes(searchLower) ||
          transactionId.includes(searchLower) ||
          paymentMethod.includes(searchLower) ||
          feeType.includes(searchLower) ||
          childName.includes(searchLower)
        );
      });
    }

    setFilteredPayments(filtered);
  }, [payments, debouncedSearch]);

  const handleSearch = (value: string) => {
    setLocalSearch(value);
    setSearch(value);
  };

  const loading = childrenLoading || paymentsLoading;

  // Get unique academic years from payments
  const academicYears = Array.from(
    new Set(
      payments
        .map((payment: any) => payment.feeStructure?.academic_year)
        .filter((year: any) => year)
    )
  ).sort();

  // Calculate summary statistics
  const summary = payments.reduce(
    (acc: any, payment: any) => {
      const amount = parseFloat(payment.amount_paid || 0);
      acc.totalAmount += amount;
      acc.totalCount += 1;
      
      // Count by payment method
      const method = payment.payment_method || 'unknown';
      if (!acc.byMethod[method]) {
        acc.byMethod[method] = { count: 0, amount: 0 };
      }
      acc.byMethod[method].count += 1;
      acc.byMethod[method].amount += amount;
      
      return acc;
    },
    {
      totalAmount: 0,
      totalCount: 0,
      byMethod: {} as Record<string, { count: number; amount: number }>,
    }
  );

  const handleViewReceipt = (payment: any) => {
    if (payment.childId && payment.id) {
      router.push(`/parent/children/${payment.childId}/receipt/${payment.id}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
          <p className="text-muted-foreground">
            View payment history for your children
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
          <div className="grid gap-4 md:grid-cols-5">
            <div className="space-y-2">
              <Label>Child</Label>
              <Select value={selectedChildId} onValueChange={(value) => {
                setSelectedChildId(value);
                setPage(1); // Reset to first page when changing child
              }}>
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
              <Label>Start Date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            <div className="space-y-2">
              <Label>End Date</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            <div className="space-y-2">
              <Label>Academic Year</Label>
              <Select 
                value={academicYearFilter} 
                onValueChange={(value) => {
                  setAcademicYearFilter(value);
                  setPage(1);
                }}
              >
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
                  placeholder="Search payments..."
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
      {payments.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(summary.totalAmount)}</div>
              <p className="text-xs text-muted-foreground">{summary.totalCount} transactions</p>
            </CardContent>
          </Card>

          {Object.entries(summary.byMethod).slice(0, 3).map(([method, data]: [string, any]) => (
            <Card key={method}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium capitalize">{method}</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(data.amount)}</div>
                <p className="text-xs text-muted-foreground">{data.count} payments</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Payments List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Payment History
          </CardTitle>
          <CardDescription>
            {selectedChildId === 'all' 
              ? 'Payments for all your children' 
              : `Payments for ${children.find((c: any) => c.id === selectedChildId)?.name || 'selected child'}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading && payments.length === 0 ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredPayments.length === 0 ? (
            <EmptyState
              title="No payments found"
              description={
                search || startDate || endDate || academicYearFilter !== 'all'
                  ? "Try adjusting your filters"
                  : "No payments have been recorded yet."
              }
              icon={Receipt}
            />
          ) : (
            <>
              <div className="space-y-4">
                {filteredPayments.map((payment: any) => {
                  const paymentDate = payment.payment_date 
                    ? new Date(payment.payment_date) 
                    : payment.created_at 
                    ? new Date(payment.created_at)
                    : null;
                  const feeStructure = payment.feeStructure || {};

                  return (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-semibold">
                                {formatCurrency(payment.amount_paid || 0)}
                              </p>
                              {selectedChildId === 'all' && (
                                <>
                                  <span className="text-muted-foreground">•</span>
                                  <p className="text-sm text-muted-foreground">
                                    {payment.childName}
                                  </p>
                                </>
                              )}
                              {payment.receipt_number && (
                                <>
                                  <span className="text-muted-foreground">•</span>
                                  <Badge variant="outline" className="text-xs">
                                    Receipt: {payment.receipt_number}
                                  </Badge>
                                </>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {feeStructure.fee_type || 'Fee Payment'}
                              {feeStructure.academic_year && ` • ${feeStructure.academic_year}`}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-sm">
                          {paymentDate && (
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="text-muted-foreground">Payment Date</p>
                                <p className="font-medium">{format(paymentDate, 'MMM dd, yyyy')}</p>
                              </div>
                            </div>
                          )}

                          <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-muted-foreground">Method</p>
                              <p className="font-medium capitalize">{payment.payment_method || 'N/A'}</p>
                            </div>
                          </div>

                          {payment.transaction_id && (
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="text-muted-foreground">Transaction ID</p>
                                <p className="font-medium text-xs">{payment.transaction_id}</p>
                              </div>
                            </div>
                          )}

                          {payment.receivedBy && (
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="text-muted-foreground">Received By</p>
                                <p className="font-medium text-xs">{payment.receivedBy.username || 'N/A'}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="ml-4 flex gap-2">
                        {payment.receipt_number && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewReceipt(payment)}
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Receipt
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (payment.childId) {
                              router.push(`/parent/children/${payment.childId}/payments`);
                            }
                          }}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Showing {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} to{' '}
                    {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of{' '}
                    {pagination.totalItems} payments
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(1)}
                      disabled={pagination.currentPage === 1 || loading}
                    >
                      First
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={pagination.currentPage === 1 || loading}
                    >
                      Previous
                    </Button>
                    <span className="text-sm">
                      Page {pagination.currentPage} of {pagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={pagination.currentPage >= pagination.totalPages || loading}
                    >
                      Next
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(pagination.totalPages)}
                      disabled={pagination.currentPage >= pagination.totalPages || loading}
                    >
                      Last
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


