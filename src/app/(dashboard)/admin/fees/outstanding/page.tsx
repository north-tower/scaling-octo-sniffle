'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/tables/DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Eye, ArrowLeft, Loader2, Search, AlertTriangle, DollarSign, Users, FileText } from 'lucide-react';
import { reportsApi } from '@/lib/api';
import { useApi } from '@/hooks/useApi';
import { useDebounce } from '@/hooks/useDebounce';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import { FormField } from '@/components/forms/FormField';

interface OutstandingFee {
  id: string;
  student_id: string;
  fee_structure_id: string;
  total_amount: string;
  paid_amount: string;
  balance_amount: string;
  due_date: string;
  academic_year: string;
  is_overdue: boolean;
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
    due_date: string;
  };
}

interface OutstandingFeesSummary {
  totalOutstanding: number;
  overdueCount: number;
  totalStudents: number;
  totalFees: number;
}

export default function OutstandingFeesPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');
  const [outstandingFees, setOutstandingFees] = useState<OutstandingFee[]>([]);
  const [summary, setSummary] = useState<OutstandingFeesSummary>({
    totalOutstanding: 0,
    overdueCount: 0,
    totalStudents: 0,
    totalFees: 0,
  });
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null>(null);
  const [localSearch, setLocalSearch] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterAcademicYear, setFilterAcademicYear] = useState('');
  const [filterOverdue, setFilterOverdue] = useState<string>('');

  // Hardcoded classes and academic years
  const [classes] = useState<Array<{ id: string; name: string }>>([
    { id: '1', name: 'Class 1' },
    { id: '2', name: 'Class 2' },
    { id: '3', name: 'Class 3' },
    { id: '4', name: 'Class 4' },
    { id: '5', name: 'Class 5' },
    { id: '6', name: 'Class 6' },
    { id: '7', name: 'Class 7' },
    { id: '8', name: 'Class 8' },
    { id: '9', name: 'Class 9' },
    { id: '10', name: 'Class 10' },
    { id: '11', name: 'Class 11' },
    { id: '12', name: 'Class 12' },
  ]);

  const [academicYears] = useState<string[]>([
    '2023-2024',
    '2024-2025',
    '2025-2026',
  ]);

  // Debounce search
  const debouncedSearch = useDebounce(search, 500);

  // Fetch outstanding fees
  type OutstandingFeesResponse = {
    outstandingFees: OutstandingFee[];
    summary?: {
      totalOutstanding: string | number;
      overdueCount: number;
      totalStudents: number;
      totalFees: number;
    };
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  } | {
    data: {
      outstandingFees: OutstandingFee[];
      summary?: {
        totalOutstanding: string | number;
        overdueCount: number;
        totalStudents: number;
        totalFees: number;
      };
      pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    };
  } | {
    data: OutstandingFee[];
  } | OutstandingFee[];

  const { loading, execute: fetchOutstandingFees } = useApi<OutstandingFeesResponse>(
    (params: { page?: number; limit?: number; search?: string; class?: string; academic_year?: string; is_overdue?: boolean }) => reportsApi.getOutstandingFees(params),
    {
      onSuccess: (response) => {
        let feesData: OutstandingFee[] = [];
        let summaryData: {
          totalOutstanding: string | number;
          overdueCount: number;
          totalStudents: number;
          totalFees: number;
        } | null = null;

        if (response && typeof response === 'object' && 'outstandingFees' in response && Array.isArray(response.outstandingFees)) {
          feesData = response.outstandingFees;
          summaryData = response.summary || null;
        } else if (response && typeof response === 'object' && 'data' in response) {
          if (Array.isArray(response.data)) {
            feesData = response.data;
          } else if (response.data && typeof response.data === 'object' && 'outstandingFees' in response.data && Array.isArray(response.data.outstandingFees)) {
            feesData = response.data.outstandingFees;
            summaryData = response.data.summary || null;
          } else if (response.data && typeof response.data === 'object' && 'data' in response.data && Array.isArray(response.data.data)) {
            feesData = response.data.data;
            summaryData = response.data.summary || null;
          }
        } else if (Array.isArray(response)) {
          feesData = response;
        }

        setOutstandingFees(feesData);

        if (summaryData) {
          setSummary({
            totalOutstanding: parseFloat(String(summaryData.totalOutstanding)) || 0,
            overdueCount: summaryData.overdueCount || 0,
            totalStudents: summaryData.totalStudents || 0,
            totalFees: summaryData.totalFees || feesData.length,
          });
        } else {
          // Calculate summary from data
          const totalOutstanding = feesData.reduce(
            (sum: number, fee: OutstandingFee) => sum + parseFloat(fee.balance_amount || '0'),
            0
          );
          const overdueCount = feesData.filter((fee: OutstandingFee) => fee.is_overdue).length;
          const uniqueStudents = new Set(feesData.map((fee: OutstandingFee) => fee.student_id)).size;

          setSummary({
            totalOutstanding,
            overdueCount,
            totalStudents: uniqueStudents,
            totalFees: feesData.length,
          });
        }

        // Set pagination if available in response
        if (response && typeof response === 'object' && 'pagination' in response && response.pagination) {
          setPagination(response.pagination);
        } else if (response && typeof response === 'object' && 'data' in response && response.data && typeof response.data === 'object' && 'pagination' in response.data && response.data.pagination) {
          setPagination(response.data.pagination);
        }
      },
      onError: (error) => {
        console.error('Failed to fetch outstanding fees:', error);
        setOutstandingFees([]);
      },
    }
  );

  // Fetch on mount and when params change
  useEffect(() => {
    const params: {
      page: number;
      limit: number;
      search: string;
      class?: string;
      academic_year?: string;
      is_overdue?: boolean;
    } = {
      page,
      limit,
      search: debouncedSearch,
    };
    if (filterClass) params.class = filterClass;
    if (filterAcademicYear) params.academic_year = filterAcademicYear;
    if (filterOverdue) params.is_overdue = filterOverdue === 'true';

    fetchOutstandingFees(params);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, debouncedSearch, filterClass, filterAcademicYear, filterOverdue]);

  const handleSearch = (value: string) => {
    setLocalSearch(value);
    setSearch(value);
    setPage(1);
  };

  const calculateDaysOverdue = (dueDate: string): number => {
    if (!dueDate) return 0;
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = today.getTime() - due.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const columns: ColumnDef<OutstandingFee>[] = useMemo(() => [
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
                ID: {student?.student_id || studentId || 'N/A'} | Roll: {student?.roll_number || 'N/A'}
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
              Class {feeStructure?.class || 'N/A'} | Academic Year: {feeStructure?.academic_year || row.original.academic_year || 'N/A'}
            </p>
          </div>
        );
      },
    },
    {
      accessorKey: 'class',
      header: 'Class',
      cell: ({ row }) => {
        const student = row.original.student;
        return (
          <Badge variant="secondary">
            {student?.class || 'N/A'} - {student?.section || 'N/A'}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'amounts',
      header: 'Amount Details',
      cell: ({ row }) => {
        const fee = row.original;
        const total = parseFloat(fee.total_amount || 0);
        const paid = parseFloat(fee.paid_amount || 0);
        const balance = parseFloat(fee.balance_amount || 0);
        return (
          <div className="text-right">
            <p className="font-medium text-destructive">KES {balance.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">
              Total: KES {total.toLocaleString()} | Paid: KES {paid.toLocaleString()}
            </p>
          </div>
        );
      },
    },
    {
      accessorKey: 'dueDate',
      header: 'Due Date',
      cell: ({ row }) => {
        const dueDate = row.original.due_date;
        const daysOverdue = calculateDaysOverdue(dueDate);
        const isOverdue = row.original.is_overdue;
        return (
          <div>
            {dueDate ? (
              <>
                <p className="text-sm">{new Date(dueDate).toLocaleDateString()}</p>
                {isOverdue && daysOverdue > 0 && (
                  <p className="text-xs text-destructive font-medium">
                    {daysOverdue} day{daysOverdue !== 1 ? 's' : ''} overdue
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">N/A</p>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const isOverdue = row.original.is_overdue;
        return (
          <Badge variant={isOverdue ? 'destructive' : 'default'}>
            {isOverdue ? 'Overdue' : 'Outstanding'}
          </Badge>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const fee = row.original;

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
                onClick={() => {
                  if (fee.student_id) {
                    router.push(`/admin/students/${fee.student_id}`);
                  }
                }}
              >
                <Eye className="mr-2 h-4 w-4" />
                View Student
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  router.push(`/admin/payments?student_id=${fee.student_id}`);
                }}
              >
                <DollarSign className="mr-2 h-4 w-4" />
                Record Payment
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ], [router]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/admin/fees')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Outstanding Fees</h1>
            <p className="text-muted-foreground">
              View and manage outstanding fee payments
              {pagination && (
                <span className="ml-2">
                  ({pagination.total || outstandingFees.length} total)
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Outstanding</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KES {summary.totalOutstanding.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {summary.totalFees} fee{summary.totalFees !== 1 ? 's' : ''} outstanding
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Fees</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{summary.overdueCount}</div>
            <p className="text-xs text-muted-foreground">
              Fee{summary.overdueCount !== 1 ? 's' : ''} past due date
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Students with Outstanding</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalStudents}</div>
            <p className="text-xs text-muted-foreground">
              Student{summary.totalStudents !== 1 ? 's' : ''} with pending fees
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Fees</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalFees}</div>
            <p className="text-xs text-muted-foreground">
              Outstanding fee record{summary.totalFees !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by student name or ID..."
            value={localSearch}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <FormField
          name="filterClass"
          label=""
          type="select"
          placeholder="All Classes"
          value={filterClass || 'all'}
          onChange={(value) => {
            setFilterClass(value === 'all' ? '' : value);
            setPage(1);
          }}
          options={[{ label: 'All Classes', value: 'all' }, ...classes.map((cls) => ({ label: cls.name, value: cls.id }))]}
        />
        <FormField
          name="filterAcademicYear"
          label=""
          type="select"
          placeholder="All Academic Years"
          value={filterAcademicYear || 'all'}
          onChange={(value) => {
            setFilterAcademicYear(value === 'all' ? '' : value);
            setPage(1);
          }}
          options={[{ label: 'All Academic Years', value: 'all' }, ...academicYears.map((year) => ({ label: year, value: year }))]}
        />
        <FormField
          name="filterOverdue"
          label=""
          type="select"
          placeholder="All Status"
          value={filterOverdue || 'all'}
          onChange={(value) => {
            setFilterOverdue(value === 'all' ? '' : value);
            setPage(1);
          }}
          options={[
            { label: 'All Status', value: 'all' },
            { label: 'Overdue Only', value: 'true' },
            { label: 'Not Overdue', value: 'false' },
          ]}
        />
        {loading && (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Outstanding Fees Table */}
      <DataTable
        columns={columns}
        data={outstandingFees}
        searchKey="student"
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
            Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, pagination.total)} of {pagination.total} outstanding fees
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
    </div>
  );
}

