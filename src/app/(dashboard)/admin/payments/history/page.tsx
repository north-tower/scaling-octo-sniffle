'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/tables/DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2, Download, Calendar, Filter, X } from 'lucide-react';
import { reportsApi, paymentsApi } from '@/lib/api';
import { useApi } from '@/hooks/useApi';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { FormField } from '@/components/forms/FormField';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Payment {
  id: string;
  student_id: string;
  fee_structure_id: string;
  amount_paid: string;
  payment_method: string;
  payment_date: string;
  receipt_number: string;
  transaction_id?: string;
  late_fee_paid?: string;
  discount_applied?: string;
  notes?: string;
  bank_reference?: string;
  cheque_number?: string;
  cheque_date?: string;
  bank_name?: string;
  is_void: boolean;
  void_reason?: string;
  created_at: string;
  student?: {
    id: string;
    student_id: string;
    first_name: string;
    last_name: string;
    class: string;
    section: string;
    roll_number: string;
  };
  feeStructure?: {
    id: string;
    class: string;
    fee_type: string;
    amount: string;
    academic_year: string;
  };
  receivedBy?: {
    id: string;
    username: string;
    email: string;
  };
}

export default function PaymentHistoryPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    totalItems?: number;
  } | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Filter states
  const [filterStudentId, setFilterStudentId] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState('');
  const [filterStartDate, setFilterStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  });
  const [filterEndDate, setFilterEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [filterAcademicYear, setFilterAcademicYear] = useState('');

  // Summary stats
  const [summary, setSummary] = useState({
    totalPayments: 0,
    totalAmount: 0,
    averageAmount: 0,
  });

  // Fetch payments using reports API
  type PaymentHistoryResponse = {
    payments: Payment[];
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      totalItems?: number;
    };
  } | {
    data: {
      payments: Payment[];
      pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        totalItems?: number;
      };
    };
  } | {
    data: Payment[];
  } | Payment[];

  const { loading, execute: fetchPayments } = useApi<PaymentHistoryResponse>(
    (params: {
      page?: number;
      limit?: number;
      start_date?: string;
      end_date?: string;
      student_id?: string;
      payment_method?: string;
      class?: string;
      academic_year?: string;
    }) => reportsApi.getPaymentHistory(params),
    {
      onSuccess: (response) => {
        let paymentsData: Payment[] = [];
        let paginationData: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
          totalItems?: number;
        } | null = null;

        if (response && typeof response === 'object' && 'payments' in response && Array.isArray(response.payments)) {
          paymentsData = response.payments;
          paginationData = response.pagination || null;
        } else if (response && typeof response === 'object' && 'data' in response) {
          if (Array.isArray(response.data)) {
            paymentsData = response.data;
          } else if (response.data && typeof response.data === 'object' && 'payments' in response.data && Array.isArray(response.data.payments)) {
            paymentsData = response.data.payments;
            paginationData = response.data.pagination || null;
          }
        } else if (Array.isArray(response)) {
          paymentsData = response;
        }

        setPayments(paymentsData);
        if (paginationData) {
          setPagination(paginationData);
        }

        // Calculate summary (payment history report only returns non-voided payments)
        const totalAmount = paymentsData.reduce(
          (sum: number, p: Payment) => sum + parseFloat(p.amount_paid || '0'),
          0
        );

        setSummary({
          totalPayments: paginationData?.totalItems || paymentsData.length,
          totalAmount,
          averageAmount: paymentsData.length > 0 ? totalAmount / paymentsData.length : 0,
        });
      },
      onError: (error) => {
        console.error('Failed to fetch payments:', error);
        setPayments([]);
      },
    }
  );

  // Fetch on mount and when params change
  useEffect(() => {
    const params: {
      page: number;
      limit: number;
      start_date?: string;
      end_date?: string;
      student_id?: string;
      payment_method?: string;
      class?: string;
      academic_year?: string;
    } = {
      page,
      limit,
    };

    // Date range is required for payment history report
    if (filterStartDate) params.start_date = filterStartDate;
    if (filterEndDate) params.end_date = filterEndDate;
    
    // If no dates set, use default range (last 30 days)
    if (!filterStartDate && !filterEndDate) {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      params.start_date = startDate.toISOString().split('T')[0];
      params.end_date = endDate.toISOString().split('T')[0];
    }

    if (filterStudentId) params.student_id = filterStudentId;
    if (filterPaymentMethod) params.payment_method = filterPaymentMethod;
    if (filterClass) params.class = filterClass;
    if (filterAcademicYear) params.academic_year = filterAcademicYear;

    fetchPayments(params);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, filterStudentId, filterPaymentMethod, filterStartDate, filterEndDate, filterClass, filterAcademicYear]);


  const handleClearFilters = () => {
    setFilterStudentId('');
    setFilterClass('');
    setFilterPaymentMethod('');
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    setFilterStartDate(startDate.toISOString().split('T')[0]);
    setFilterEndDate(endDate.toISOString().split('T')[0]);
    setFilterAcademicYear('');
    setPage(1);
  };

  const handleDownloadReceipt = async (paymentId: string) => {
    try {
      await paymentsApi.getReceipt(paymentId);
      toast.success('Receipt downloaded');
    } catch (error) {
      console.error('Failed to download receipt:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to download receipt';
      toast.error(errorMessage);
    }
  };

  const handleOpenViewDialog = (payment: Payment) => {
    setSelectedPayment(payment);
    setIsViewDialogOpen(true);
  };

  const columns: ColumnDef<Payment>[] = useMemo(() => [
    {
      accessorKey: 'payment_date',
      header: 'Date',
      cell: ({ row }) => {
        const date = row.original.payment_date;
        return (
          <div>
            {date ? (
              <>
                <p className="text-sm font-medium">{new Date(date).toLocaleDateString()}</p>
                <p className="text-xs text-muted-foreground">{new Date(date).toLocaleTimeString()}</p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">N/A</p>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'student',
      header: 'Student',
      cell: ({ row }) => {
        const student = row.original.student;
        const studentId = row.original.student_id;
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback>
                {student?.first_name?.[0] || ''}{student?.last_name?.[0] || ''}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">
                {student?.first_name || 'N/A'} {student?.last_name || ''}
              </p>
              <p className="text-sm text-muted-foreground">
                ID: {student?.student_id || studentId || 'N/A'} | Class: {student?.class || 'N/A'}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'feeStructure',
      header: 'Fee Type',
      cell: ({ row }) => {
        const feeStructure = row.original.feeStructure;
        return (
          <div>
            <p className="font-medium capitalize">{feeStructure?.fee_type || 'N/A'}</p>
            <p className="text-sm text-muted-foreground">
              Class {feeStructure?.class || 'N/A'} | {feeStructure?.academic_year || 'N/A'}
            </p>
          </div>
        );
      },
    },
    {
      accessorKey: 'amount_paid',
      header: 'Amount',
      cell: ({ row }) => {
        const amount = parseFloat(row.original.amount_paid || '0');
        const lateFee = parseFloat(row.original.late_fee_paid || '0');
        return (
          <div className="text-right">
            <p className="font-medium">KES {amount.toLocaleString()}</p>
            {lateFee > 0 && (
              <p className="text-xs text-muted-foreground">
                + Late: KES {lateFee.toLocaleString()}
              </p>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'payment_method',
      header: 'Method',
      cell: ({ row }) => {
        const method = row.original.payment_method;
        const methodColors: Record<string, string> = {
          cash: 'bg-green-100 text-green-800',
          bank_transfer: 'bg-blue-100 text-blue-800',
          cheque: 'bg-purple-100 text-purple-800',
          online: 'bg-orange-100 text-orange-800',
          card: 'bg-red-100 text-red-800',
          other: 'bg-gray-100 text-gray-800',
        };
        return (
          <Badge className={methodColors[method] || 'bg-gray-100 text-gray-800'}>
            {method?.replace('_', ' ').toUpperCase() || 'N/A'}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'receipt_number',
      header: 'Receipt',
      cell: ({ row }) => {
        const receiptNumber = row.original.receipt_number;
        return (
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm">{receiptNumber || 'N/A'}</span>
            {receiptNumber && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownloadReceipt(row.original.id);
                }}
              >
                <Download className="h-3 w-3" />
              </Button>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'receivedBy',
      header: 'Recorded By',
      cell: ({ row }) => {
        const receivedBy = row.original.receivedBy;
        return (
          <div>
            {receivedBy ? (
              <p className="text-sm">{receivedBy.username || receivedBy.email || 'N/A'}</p>
            ) : (
              <p className="text-sm text-muted-foreground">N/A</p>
            )}
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const payment = row.original;

        return (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleOpenViewDialog(payment)}
          >
            View
          </Button>
        );
      },
    },
  ], []);

  const activeFiltersCount = [
    filterStudentId,
    filterClass,
    filterPaymentMethod,
    filterAcademicYear,
  ].filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/admin/payments')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Payment History</h1>
            <p className="text-muted-foreground">
              View and filter payment transaction history
              {pagination && (
                <span className="ml-2">
                  ({pagination.total || payments.length} total)
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="mr-2 h-4 w-4" />
            Filters
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalPayments}</div>
            <p className="text-xs text-muted-foreground">
              In current view
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KES {summary.totalAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Collected in view
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Amount</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KES {summary.averageAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Per payment
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalPayments}</div>
            <p className="text-xs text-muted-foreground">
              Payment records
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Filters</CardTitle>
              <div className="flex gap-2">
                {activeFiltersCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearFilters}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Clear All
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                name="filterStudentId"
                label="Student ID"
                type="text"
                placeholder="Enter student ID"
                value={filterStudentId}
                onChange={(value) => {
                  setFilterStudentId(value);
                  setPage(1);
                }}
              />
              <FormField
                name="filterClass"
                label="Class"
                type="select"
                placeholder="All Classes"
                value={filterClass || 'all'}
                onChange={(value) => {
                  setFilterClass(value === 'all' ? '' : value);
                  setPage(1);
                }}
                options={[
                  { label: 'All Classes', value: 'all' },
                  { label: 'Class 1', value: '1' },
                  { label: 'Class 2', value: '2' },
                  { label: 'Class 3', value: '3' },
                  { label: 'Class 4', value: '4' },
                  { label: 'Class 5', value: '5' },
                  { label: 'Class 6', value: '6' },
                  { label: 'Class 7', value: '7' },
                  { label: 'Class 8', value: '8' },
                  { label: 'Class 9', value: '9' },
                  { label: 'Class 10', value: '10' },
                  { label: 'Class 11', value: '11' },
                  { label: 'Class 12', value: '12' },
                ]}
              />
              <FormField
                name="filterPaymentMethod"
                label="Payment Method"
                type="select"
                placeholder="All Methods"
                value={filterPaymentMethod || 'all'}
                onChange={(value) => {
                  setFilterPaymentMethod(value === 'all' ? '' : value);
                  setPage(1);
                }}
                options={[
                  { label: 'All Methods', value: 'all' },
                  { label: 'Cash', value: 'cash' },
                  { label: 'Bank Transfer', value: 'bank_transfer' },
                  { label: 'Cheque', value: 'cheque' },
                  { label: 'Online', value: 'online' },
                  { label: 'Card', value: 'card' },
                  { label: 'Other', value: 'other' },
                ]}
              />
              <FormField
                name="filterStartDate"
                label="Start Date *"
                type="date"
                placeholder="Select start date"
                required
                value={filterStartDate}
                onChange={(value) => {
                  setFilterStartDate(value);
                  setPage(1);
                }}
              />
              <FormField
                name="filterEndDate"
                label="End Date *"
                type="date"
                placeholder="Select end date"
                required
                value={filterEndDate}
                onChange={(value) => {
                  setFilterEndDate(value);
                  setPage(1);
                }}
              />
              <FormField
                name="filterAcademicYear"
                label="Academic Year"
                type="select"
                placeholder="All Academic Years"
                value={filterAcademicYear || 'all'}
                onChange={(value) => {
                  setFilterAcademicYear(value === 'all' ? '' : value);
                  setPage(1);
                }}
                options={[
                  { label: 'All Academic Years', value: 'all' },
                  { label: '2023-2024', value: '2023-2024' },
                  { label: '2024-2025', value: '2024-2025' },
                  { label: '2025-2026', value: '2025-2026' },
                ]}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading Indicator */}
      {loading && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Loading payment history...</span>
        </div>
      )}

      {/* Payments Table */}
      <DataTable
        columns={columns}
        data={payments}
        searchKey="receipt_number"
        searchPlaceholder="Filter in current page..."
        showSearch={false}
        showColumnToggle={true}
        showPagination={false}
        showExport={true}
        loading={loading}
      />

      {/* Server-side Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, pagination.total)} of {pagination.total} payments
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(1)}
              disabled={page === 1 || loading}
            >
              First
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={page === 1 || loading}
            >
              Previous
            </Button>
            <span className="text-sm">
              Page {page} of {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={page >= pagination.totalPages || loading}
            >
              Next
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(pagination.totalPages)}
              disabled={page >= pagination.totalPages || loading}
            >
              Last
            </Button>
          </div>
        </div>
      )}

      {/* View Payment Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Payment Details</DialogTitle>
            <DialogDescription>
              View complete payment information
            </DialogDescription>
          </DialogHeader>

          {selectedPayment && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Student</Label>
                  <p className="font-medium">
                    {selectedPayment.student?.first_name} {selectedPayment.student?.last_name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    ID: {selectedPayment.student?.student_id} | Class: {selectedPayment.student?.class} - {selectedPayment.student?.section}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Fee Structure</Label>
                  <p className="font-medium capitalize">
                    {selectedPayment.feeStructure?.fee_type}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Class {selectedPayment.feeStructure?.class} | Academic Year: {selectedPayment.feeStructure?.academic_year}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Amount Paid</Label>
                  <p className="font-medium text-lg">KES {parseFloat(selectedPayment.amount_paid || '0').toLocaleString()}</p>
                  {parseFloat(selectedPayment.late_fee_paid || '0') > 0 && (
                    <p className="text-sm text-muted-foreground">
                      Late Fee: KES {parseFloat(selectedPayment.late_fee_paid || '0').toLocaleString()}
                    </p>
                  )}
                </div>
                <div>
                  <Label className="text-muted-foreground">Payment Method</Label>
                  <p className="font-medium">{selectedPayment.payment_method?.replace('_', ' ').toUpperCase()}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Payment Date</Label>
                  <p className="font-medium">
                    {selectedPayment.payment_date ? new Date(selectedPayment.payment_date).toLocaleString() : 'N/A'}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Receipt Number</Label>
                  <p className="font-medium font-mono">{selectedPayment.receipt_number || 'N/A'}</p>
                </div>
              </div>

              {selectedPayment.transaction_id && (
                <div>
                  <Label className="text-muted-foreground">Transaction ID</Label>
                  <p className="font-medium font-mono">{selectedPayment.transaction_id}</p>
                </div>
              )}

              {selectedPayment.bank_reference && (
                <div>
                  <Label className="text-muted-foreground">Bank Reference</Label>
                  <p className="font-medium">{selectedPayment.bank_reference}</p>
                </div>
              )}

              {selectedPayment.cheque_number && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Cheque Number</Label>
                    <p className="font-medium">{selectedPayment.cheque_number}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Cheque Date</Label>
                    <p className="font-medium">
                      {selectedPayment.cheque_date ? new Date(selectedPayment.cheque_date).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
              )}

              {selectedPayment.notes && (
                <div>
                  <Label className="text-muted-foreground">Notes</Label>
                  <p className="text-sm">{selectedPayment.notes}</p>
                </div>
              )}

              {selectedPayment.receivedBy && (
                <div>
                  <Label className="text-muted-foreground">Recorded By</Label>
                  <p className="text-sm">{selectedPayment.receivedBy.username || selectedPayment.receivedBy.email}</p>
                </div>
              )}

              {selectedPayment.is_void && (
                <Alert variant="destructive">
                  <AlertDescription>
                    <strong>Voided Payment</strong>
                    {selectedPayment.void_reason && (
                      <p className="mt-1">Reason: {selectedPayment.void_reason}</p>
                    )}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2">
            {selectedPayment?.receipt_number && (
              <Button
                variant="outline"
                onClick={() => {
                  if (selectedPayment) handleDownloadReceipt(selectedPayment.id);
                }}
              >
                <Download className="mr-2 h-4 w-4" />
                Download Receipt
              </Button>
            )}
            <Button onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

