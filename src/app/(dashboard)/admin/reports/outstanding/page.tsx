'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/tables/DataTable';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { BarChartComponent } from '@/components/charts/BarChart';
import { PieChartComponent } from '@/components/charts/PieChart';
import { 
  Download, 
  AlertTriangle,
  DollarSign,
  Users,
  FileText,
  Loader2,
  ArrowLeft,
  Filter
} from 'lucide-react';
import { reportsApi } from '@/lib/api';
import { useApi } from '@/hooks/useApi';
import { toast } from 'sonner';
import { FormField } from '@/components/forms/FormField';
import { useRouter } from 'next/navigation';
import { formatCurrency } from '@/lib/utils';

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

interface OutstandingFeesData {
  summary: {
    totalOutstanding: number;
    overdueCount: number;
    totalStudents: number;
    totalFees: number;
  };
  outstandingFees: OutstandingFee[];
}

const calculateDaysOverdue = (dueDate: string): number => {
  if (!dueDate) return 0;
  const due = new Date(dueDate);
  const now = new Date();
  const diffTime = now.getTime() - due.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
};

export default function OutstandingFeesReportPage() {
  const router = useRouter();
  const [outstandingData, setOutstandingData] = useState<OutstandingFeesData | null>(null);
  const [academicYear, setAcademicYear] = useState<string>('all');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [filterOverdue, setFilterOverdue] = useState<string>('all');

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
    '2026-2027',
  ]);

  // Fetch outstanding fees data
  const { loading, execute: fetchOutstandingFees } = useApi(
    (params: any) => reportsApi.getOutstandingFees(params),
    {
      onSuccess: (response: any) => {
        if (response?.data) {
          setOutstandingData(response.data);
        } else if (response?.success && response?.data) {
          setOutstandingData(response.data);
        }
      },
      onError: (error) => {
        console.error('Failed to fetch outstanding fees:', error);
        toast.error('Failed to fetch outstanding fees data');
        setOutstandingData(null);
      },
    }
  );

  // Fetch data on mount and when filters change
  useEffect(() => {
    const params: any = {};
    if (academicYear && academicYear !== 'all') params.academic_year = academicYear;
    if (selectedClass && selectedClass !== 'all') params.class = selectedClass;
    if (filterOverdue && filterOverdue !== 'all') {
      params.is_overdue = filterOverdue === 'overdue' ? 'true' : 'false';
    }

    fetchOutstandingFees(params);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [academicYear, selectedClass, filterOverdue]);

  // Transform data for charts
  const overdueVsOutstandingChartData = useMemo(() => {
    if (!outstandingData?.summary) return [];
    const overdue = outstandingData.summary.overdueCount;
    const outstanding = outstandingData.summary.totalFees - overdue;
    return [
      { name: 'Overdue', value: overdue },
      { name: 'Outstanding', value: outstanding },
    ];
  }, [outstandingData]);

  const classWiseChartData = useMemo(() => {
    if (!outstandingData?.outstandingFees) return [];
    const classMap = new Map<string, number>();
    
    outstandingData.outstandingFees.forEach(fee => {
      const className = fee.student?.class || 'Unknown';
      const current = classMap.get(className) || 0;
      classMap.set(className, current + parseFloat(fee.balance_amount || '0'));
    });

    return Array.from(classMap.entries()).map(([name, value]) => ({
      name,
      value,
    }));
  }, [outstandingData]);

  const feeTypeChartData = useMemo(() => {
    if (!outstandingData?.outstandingFees) return [];
    const feeTypeMap = new Map<string, number>();
    
    outstandingData.outstandingFees.forEach(fee => {
      const feeType = fee.feeStructure?.fee_type || 'Unknown';
      const current = feeTypeMap.get(feeType) || 0;
      feeTypeMap.set(feeType, current + parseFloat(fee.balance_amount || '0'));
    });

    return Array.from(feeTypeMap.entries()).map(([name, value]) => ({
      name,
      value,
    }));
  }, [outstandingData]);

  const handleClearFilters = () => {
    setAcademicYear('all');
    setSelectedClass('all');
    setFilterOverdue('all');
  };

  const handleExport = () => {
    toast.info('Export functionality coming soon');
  };

  // Table columns
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
      accessorKey: 'balance_amount',
      header: 'Outstanding Amount',
      cell: ({ row }) => {
        const balance = parseFloat(row.original.balance_amount || '0');
        return (
          <div className="text-right">
            <p className="font-medium text-destructive">{formatCurrency(balance)}</p>
            <p className="text-xs text-muted-foreground">
              Total: {formatCurrency(parseFloat(row.original.total_amount || '0'))} | 
              Paid: {formatCurrency(parseFloat(row.original.paid_amount || '0'))}
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
  ], []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Outstanding Fees Report</h1>
            <p className="text-muted-foreground">
              View detailed outstanding fees analytics and trends
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleExport}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <FormField
              label="Academic Year"
              value={academicYear || undefined}
              onChange={(value) => setAcademicYear(value === 'all' ? '' : value || 'all')}
              type="select"
              options={[
                { value: 'all', label: 'All Academic Years' },
                ...academicYears.map(year => ({ value: year, label: year }))
              ]}
            />
            <FormField
              label="Class"
              value={selectedClass || undefined}
              onChange={(value) => setSelectedClass(value === 'all' ? '' : value || 'all')}
              type="select"
              options={[
                { value: 'all', label: 'All Classes' },
                ...classes.map(cls => ({ value: cls.name, label: cls.name }))
              ]}
            />
            <FormField
              label="Status"
              value={filterOverdue || undefined}
              onChange={(value) => setFilterOverdue(value === 'all' ? '' : value || 'all')}
              type="select"
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'overdue', label: 'Overdue Only' },
                { value: 'outstanding', label: 'Outstanding Only' },
              ]}
            />
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={handleClearFilters}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Outstanding</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                formatCurrency(outstandingData?.summary?.totalOutstanding || 0)
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Total outstanding amount
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Fees</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                outstandingData?.summary?.overdueCount || 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Number of overdue fees
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Students Affected</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                outstandingData?.summary?.totalStudents || 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Students with outstanding fees
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Fees</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                outstandingData?.summary?.totalFees || 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Total outstanding fee records
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <PieChartComponent
          data={overdueVsOutstandingChartData}
          title="Overdue vs Outstanding"
          description="Distribution of overdue and outstanding fees"
        />

        <BarChartComponent
          data={classWiseChartData}
          title="Outstanding by Class"
          description="Total outstanding amount per class"
        />
      </div>

      <BarChartComponent
        data={feeTypeChartData}
        title="Outstanding by Fee Type"
        description="Total outstanding amount by fee type"
      />

      {/* Outstanding Fees Table */}
      <Card>
        <CardHeader>
          <CardTitle>Outstanding Fees Details</CardTitle>
          <CardDescription>
            Detailed list of all outstanding fees
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : outstandingData?.outstandingFees && outstandingData.outstandingFees.length > 0 ? (
            <DataTable
              columns={columns}
              data={outstandingData.outstandingFees}
            />
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No outstanding fees found
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

