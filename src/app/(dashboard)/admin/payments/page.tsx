'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/tables/DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Eye, Edit, Plus, Receipt, Download, Loader2, Search, X, Calendar } from 'lucide-react';
import { paymentsApi, studentsApi, feeStructuresApi } from '@/lib/api';
import { useApi } from '@/hooks/useApi';
import { useDebounce } from '@/hooks/useDebounce';
import { toast } from 'sonner';
import { BackendStudent, BackendFeeStructure } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FormField } from '@/components/forms/FormField';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

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

export default function PaymentsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');
  const [payments, setPayments] = useState<Payment[]>([]);
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null>(null);
  const [localSearch, setLocalSearch] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isVoidDialogOpen, setIsVoidDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [students, setStudents] = useState<Array<{ id: string; name: string }>>([]);
  const [feeStructures, setFeeStructures] = useState<Array<{ id: string; name: string }>>([]);
  const [voidReason, setVoidReason] = useState('');

  // Form data
  const [formData, setFormData] = useState({
    student_id: '',
    fee_structure_id: '',
    amount_paid: '',
    payment_method: 'cash',
    payment_date: new Date().toISOString().split('T')[0],
    transaction_id: '',
    notes: '',
    bank_reference: '',
    cheque_number: '',
    cheque_date: '',
    bank_name: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Debounce search
  const debouncedSearch = useDebounce(search, 500);

  // Fetch students and fee structures for dropdowns
  type StudentsResponse = {
    students: BackendStudent[];
  } | {
    data: {
      students: BackendStudent[];
    };
  } | {
    data: BackendStudent[];
  } | BackendStudent[];

  const { loading: studentsLoading, execute: fetchStudents } = useApi<StudentsResponse>(
    () => studentsApi.getAll({ limit: 100 }),
    {
      onSuccess: (response) => {
        let studentsData: BackendStudent[] = [];
        if (response && typeof response === 'object' && 'students' in response && Array.isArray(response.students)) {
          studentsData = response.students;
        } else if (response && typeof response === 'object' && 'data' in response) {
          if (Array.isArray(response.data)) {
            studentsData = response.data;
          } else if (response.data && typeof response.data === 'object' && 'students' in response.data && Array.isArray(response.data.students)) {
            studentsData = response.data.students;
          }
        } else if (Array.isArray(response)) {
          studentsData = response;
        }

        const formatted = studentsData.map((s: BackendStudent) => ({
          id: s.id?.toString() || '',
          name: `${s.first_name || ''} ${s.last_name || ''} (${s.student_id || ''}) - Class ${s.class || ''}`,
        }));
        setStudents(formatted);
      },
    }
  );

  type FeeStructuresResponse = {
    feeStructures: BackendFeeStructure[];
  } | {
    data: {
      feeStructures: BackendFeeStructure[];
    };
  } | {
    data: BackendFeeStructure[];
  } | BackendFeeStructure[];

  const { loading: feeStructuresLoading, execute: fetchFeeStructures } = useApi<FeeStructuresResponse>(
    () => feeStructuresApi.getAll({ limit: 100 }),
    {
      onSuccess: (response) => {
        let feeStructuresData: BackendFeeStructure[] = [];
        if (response && typeof response === 'object' && 'feeStructures' in response && Array.isArray(response.feeStructures)) {
          feeStructuresData = response.feeStructures;
        } else if (response && typeof response === 'object' && 'data' in response) {
          if (Array.isArray(response.data)) {
            feeStructuresData = response.data;
          } else if (response.data && typeof response.data === 'object' && 'feeStructures' in response.data && Array.isArray(response.data.feeStructures)) {
            feeStructuresData = response.data.feeStructures;
          }
        } else if (Array.isArray(response)) {
          feeStructuresData = response;
        }

        const formatted = feeStructuresData.map((fs: BackendFeeStructure) => ({
          id: fs.id?.toString() || '',
          name: `${fs.fee_type || 'Fee'} - Class ${fs.class || ''} - KES ${parseFloat(fs.amount || '0').toLocaleString()}`,
        }));
        setFeeStructures(formatted);
      },
    }
  );

  // Fetch payments
  type PaymentsResponse = {
    payments: Payment[];
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  } | {
    data: {
      payments: Payment[];
      pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    };
  } | {
    data: Payment[];
  } | Payment[];

  const { loading, execute: fetchPayments } = useApi<PaymentsResponse>(
    (params: { page?: number; limit?: number; search?: string }) => paymentsApi.getAll(params),
    {
      onSuccess: (response) => {
        let paymentsData: Payment[] = [];
        let paginationData: { page: number; limit: number; total: number; totalPages: number } | null = null;

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
      },
      onError: (error) => {
        console.error('Failed to fetch payments:', error);
        setPayments([]);
      },
    }
  );

  // Fetch on mount and when params change
  useEffect(() => {
    fetchPayments({ page, limit, search: debouncedSearch });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, debouncedSearch]);

  // Fetch students and fee structures on mount
  useEffect(() => {
    fetchStudents();
    fetchFeeStructures();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = (value: string) => {
    setLocalSearch(value);
    setSearch(value);
    setPage(1);
  };

  const handleFieldChange = (field: string, value: string | number | boolean | Date | undefined) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleAddPayment = async () => {
    // Validation
    const errors: Record<string, string> = {};
    if (!formData.student_id) errors.student_id = 'Student is required';
    if (!formData.fee_structure_id) errors.fee_structure_id = 'Fee structure is required';
    if (!formData.amount_paid || parseFloat(formData.amount_paid) <= 0) {
      errors.amount_paid = 'Amount must be greater than 0';
    }
    if (!formData.payment_date) errors.payment_date = 'Payment date is required';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      // Transform to backend format
      const backendData: {
        student_id: number;
        fee_structure_id: number;
        amount_paid: number;
        payment_method: string;
        payment_date: string;
        transaction_id?: string;
        notes?: string;
        bank_reference?: string;
        cheque_number?: string;
        cheque_date?: string;
        bank_name?: string;
      } = {
        student_id: parseInt(formData.student_id),
        fee_structure_id: parseInt(formData.fee_structure_id),
        amount_paid: parseFloat(formData.amount_paid),
        payment_method: formData.payment_method,
        payment_date: formData.payment_date,
      };

      if (formData.transaction_id) backendData.transaction_id = formData.transaction_id;
      if (formData.notes) backendData.notes = formData.notes;
      if (formData.bank_reference) backendData.bank_reference = formData.bank_reference;
      if (formData.cheque_number) backendData.cheque_number = formData.cheque_number;
      if (formData.cheque_date) backendData.cheque_date = formData.cheque_date;
      if (formData.bank_name) backendData.bank_name = formData.bank_name;

      const response = await paymentsApi.create(backendData);

      if (response.success) {
        toast.success('Payment recorded successfully');
        setIsAddDialogOpen(false);
        resetForm();
        fetchPayments({ page, limit, search: debouncedSearch });
      }
    } catch (error) {
      console.error('Failed to create payment:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to record payment';
      toast.error(errorMessage);
    }
  };

  const handleUpdatePayment = async () => {
    if (!selectedPayment) return;

    try {
      const updateData: {
        notes?: string;
        bank_reference?: string;
        cheque_number?: string;
        cheque_date?: string;
        bank_name?: string;
      } = {};
      if (formData.notes !== undefined) updateData.notes = formData.notes;
      if (formData.bank_reference !== undefined) updateData.bank_reference = formData.bank_reference;
      if (formData.cheque_number !== undefined) updateData.cheque_number = formData.cheque_number;
      if (formData.cheque_date !== undefined) updateData.cheque_date = formData.cheque_date;
      if (formData.bank_name !== undefined) updateData.bank_name = formData.bank_name;

      const response = await paymentsApi.update(selectedPayment.id, updateData);

      if (response.success) {
        toast.success('Payment updated successfully');
        setIsEditDialogOpen(false);
        setSelectedPayment(null);
        resetForm();
        fetchPayments({ page, limit, search: debouncedSearch });
      }
    } catch (error) {
      console.error('Failed to update payment:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update payment';
      toast.error(errorMessage);
    }
  };

  const handleVoidPayment = async () => {
    if (!selectedPayment) return;

    try {
      const response = await paymentsApi.voidPayment(selectedPayment.id, voidReason);

      if (response.success) {
        toast.success('Payment voided successfully');
        setIsVoidDialogOpen(false);
        setVoidReason('');
        setSelectedPayment(null);
        fetchPayments({ page, limit, search: debouncedSearch });
      }
    } catch (error) {
      console.error('Failed to void payment:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to void payment';
      toast.error(errorMessage);
    }
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

  const resetForm = () => {
    setFormData({
      student_id: '',
      fee_structure_id: '',
      amount_paid: '',
      payment_method: 'cash',
      payment_date: new Date().toISOString().split('T')[0],
      transaction_id: '',
      notes: '',
      bank_reference: '',
      cheque_number: '',
      cheque_date: '',
      bank_name: '',
    });
    setFormErrors({});
  };

  const handleOpenEditDialog = (payment: Payment) => {
    setSelectedPayment(payment);
    setFormData({
      student_id: payment.student_id,
      fee_structure_id: payment.fee_structure_id,
      amount_paid: payment.amount_paid,
      payment_method: payment.payment_method,
      payment_date: payment.payment_date ? payment.payment_date.split('T')[0] : new Date().toISOString().split('T')[0],
      transaction_id: payment.transaction_id || '',
      notes: payment.notes || '',
      bank_reference: payment.bank_reference || '',
      cheque_number: payment.cheque_number || '',
      cheque_date: payment.cheque_date ? payment.cheque_date.split('T')[0] : '',
      bank_name: payment.bank_name || '',
    });
    setFormErrors({});
    setIsEditDialogOpen(true);
  };

  const handleOpenViewDialog = (payment: Payment) => {
    setSelectedPayment(payment);
    setIsViewDialogOpen(true);
  };

  const columns: ColumnDef<Payment>[] = useMemo(() => [
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
                ID: {student?.student_id || studentId || 'N/A'} | Class: {student?.class || 'N/A'} - {student?.section || 'N/A'}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'feeStructure',
      header: 'Fee Structure',
      cell: ({ row }) => {
        const feeStructure = row.original.feeStructure;
        return (
          <div>
            <p className="font-medium capitalize">{feeStructure?.fee_type || 'N/A'}</p>
            <p className="text-sm text-muted-foreground">
              Class {feeStructure?.class || 'N/A'} | Academic Year: {feeStructure?.academic_year || 'N/A'}
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
                Late fee: KES {lateFee.toLocaleString()}
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
      accessorKey: 'payment_date',
      header: 'Payment Date',
      cell: ({ row }) => {
        const date = row.original.payment_date;
        return (
          <div>
            {date ? (
              <>
                <p className="text-sm">{new Date(date).toLocaleDateString()}</p>
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
      accessorKey: 'transaction_id',
      header: 'Reference',
      cell: ({ row }) => {
        const refNumber = row.original.transaction_id || row.original.bank_reference;
        return (
          <div>
            {refNumber ? (
              <span className="font-mono text-sm">{refNumber}</span>
            ) : (
              <span className="text-muted-foreground text-sm">-</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'is_void',
      header: 'Status',
      cell: ({ row }) => {
        const isVoid = row.original.is_void;
        return (
          <Badge variant={isVoid ? 'destructive' : 'default'}>
            {isVoid ? 'Voided' : 'Active'}
          </Badge>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const payment = row.original;
        const isVoid = payment.is_void;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => handleOpenViewDialog(payment)}
              >
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              {payment.receipt_number && (
                <DropdownMenuItem
                  onClick={() => handleDownloadReceipt(payment.id)}
                >
                  <Receipt className="mr-2 h-4 w-4" />
                  Download Receipt
                </DropdownMenuItem>
              )}
              {!isVoid && (
                <>
                  <DropdownMenuItem
                    onClick={() => handleOpenEditDialog(payment)}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Payment
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      setSelectedPayment(payment);
                      setIsVoidDialogOpen(true);
                    }}
                    className="text-destructive"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Void Payment
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ], []);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
          <p className="text-muted-foreground">
            View and manage all payment transactions
            {pagination && (
              <span className="ml-2">
                ({pagination.total || payments.length} total)
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push('/admin/payments/history')}>
            <Calendar className="mr-2 h-4 w-4" />
            View History
          </Button>
          <Button onClick={() => router.push('/admin/payments/record')}>
            <Plus className="mr-2 h-4 w-4" />
            Record Payment
          </Button>
        </div>
      </div>

      {/* Search Input */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by receipt number or student..."
            value={localSearch}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        {loading && (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

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

      {/* Add Payment Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              Record a new payment transaction. Fields marked with * are required.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                name="student_id"
                label="Student"
                type="select"
                placeholder="Select student"
                required
                value={formData.student_id || undefined}
                onChange={(value) => handleFieldChange('student_id', value)}
                options={students.map((s) => ({ label: s.name, value: s.id }))}
                disabled={studentsLoading}
                error={formErrors.student_id}
              />
              <FormField
                name="fee_structure_id"
                label="Fee Structure"
                type="select"
                placeholder="Select fee structure"
                required
                value={formData.fee_structure_id || undefined}
                onChange={(value) => handleFieldChange('fee_structure_id', value)}
                options={feeStructures.map((fs) => ({ label: fs.name, value: fs.id }))}
                disabled={feeStructuresLoading}
                error={formErrors.fee_structure_id}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                name="amount_paid"
                label="Amount Paid (KES)"
                type="number"
                placeholder="Enter amount"
                required
                value={formData.amount_paid}
                onChange={(value) => handleFieldChange('amount_paid', value)}
                error={formErrors.amount_paid}
              />
              <FormField
                name="payment_method"
                label="Payment Method"
                type="select"
                placeholder="Select payment method"
                required
                value={formData.payment_method}
                onChange={(value) => handleFieldChange('payment_method', value)}
                options={[
                  { label: 'Cash', value: 'cash' },
                  { label: 'Bank Transfer', value: 'bank_transfer' },
                  { label: 'Cheque', value: 'cheque' },
                  { label: 'Online', value: 'online' },
                  { label: 'Card', value: 'card' },
                  { label: 'Other', value: 'other' },
                ]}
                error={formErrors.payment_method}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                name="payment_date"
                label="Payment Date"
                type="date"
                placeholder="Select payment date"
                required
                value={formData.payment_date}
                onChange={(value) => handleFieldChange('payment_date', value)}
                error={formErrors.payment_date}
              />
              <FormField
                name="transaction_id"
                label="Transaction ID (Optional)"
                type="text"
                placeholder="Enter transaction ID"
                value={formData.transaction_id}
                onChange={(value) => handleFieldChange('transaction_id', value)}
                error={formErrors.transaction_id}
              />
            </div>

            {formData.payment_method === 'bank_transfer' && (
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  name="bank_reference"
                  label="Bank Reference"
                  type="text"
                  placeholder="Enter bank reference"
                  value={formData.bank_reference}
                  onChange={(value) => handleFieldChange('bank_reference', value)}
                />
                <FormField
                  name="bank_name"
                  label="Bank Name"
                  type="text"
                  placeholder="Enter bank name"
                  value={formData.bank_name}
                  onChange={(value) => handleFieldChange('bank_name', value)}
                />
              </div>
            )}

            {formData.payment_method === 'cheque' && (
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  name="cheque_number"
                  label="Cheque Number"
                  type="text"
                  placeholder="Enter cheque number"
                  value={formData.cheque_number}
                  onChange={(value) => handleFieldChange('cheque_number', value)}
                />
                <FormField
                  name="cheque_date"
                  label="Cheque Date"
                  type="date"
                  placeholder="Select cheque date"
                  value={formData.cheque_date}
                  onChange={(value) => handleFieldChange('cheque_date', value)}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Notes (Optional)</Label>
              <Textarea
                placeholder="Enter any additional notes..."
                className="min-h-[100px]"
                value={formData.notes}
                onChange={(e) => handleFieldChange('notes', e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddDialogOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleAddPayment}>
              Record Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Payment Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Payment</DialogTitle>
            <DialogDescription>
              Update payment details. Only certain fields can be edited.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <Alert>
              <AlertDescription>
                Only notes, bank reference, cheque number, cheque date, and bank name can be updated.
              </AlertDescription>
            </Alert>

            {formData.payment_method === 'bank_transfer' && (
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  name="bank_reference"
                  label="Bank Reference"
                  type="text"
                  placeholder="Enter bank reference"
                  value={formData.bank_reference}
                  onChange={(value) => handleFieldChange('bank_reference', value)}
                />
                <FormField
                  name="bank_name"
                  label="Bank Name"
                  type="text"
                  placeholder="Enter bank name"
                  value={formData.bank_name}
                  onChange={(value) => handleFieldChange('bank_name', value)}
                />
              </div>
            )}

            {formData.payment_method === 'cheque' && (
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  name="cheque_number"
                  label="Cheque Number"
                  type="text"
                  placeholder="Enter cheque number"
                  value={formData.cheque_number}
                  onChange={(value) => handleFieldChange('cheque_number', value)}
                />
                <FormField
                  name="cheque_date"
                  label="Cheque Date"
                  type="date"
                  placeholder="Select cheque date"
                  value={formData.cheque_date}
                  onChange={(value) => handleFieldChange('cheque_date', value)}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Enter any additional notes..."
                className="min-h-[100px]"
                value={formData.notes}
                onChange={(e) => handleFieldChange('notes', e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                setSelectedPayment(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdatePayment}>
              Update Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

          <DialogFooter>
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
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Void Payment Dialog */}
      <AlertDialog open={isVoidDialogOpen} onOpenChange={setIsVoidDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Void Payment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to void this payment? This action cannot be undone and will update the student&apos;s fee balance.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            {selectedPayment && (
              <div className="rounded-lg border p-4 bg-muted/50">
                <p className="text-sm font-medium mb-2">Payment Details:</p>
                <p className="text-sm">
                  Receipt: {selectedPayment.receipt_number} | Amount: KES {parseFloat(selectedPayment.amount_paid || '0').toLocaleString()}
                </p>
                <p className="text-sm">
                  Student: {selectedPayment.student?.first_name} {selectedPayment.student?.last_name}
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label>Reason for Voiding (Optional)</Label>
              <Textarea
                placeholder="Enter reason for voiding this payment..."
                className="min-h-[100px]"
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setIsVoidDialogOpen(false);
              setVoidReason('');
              setSelectedPayment(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleVoidPayment}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Void Payment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
