'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/tables/DataTable';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { BarChartComponent } from '@/components/charts/BarChart';
import { PieChartComponent } from '@/components/charts/PieChart';
import { 
  Download, 
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface DefaulterFee {
  id: string;
  student_id: string;
  fee_structure_id: string;
  total_amount: string;
  paid_amount: string;
  balance_amount: string;
  due_date: string;
  academic_year: string;
  is_overdue: boolean;
  daysOverdue?: number;
  student?: {
    id: string;
    student_id: string;
    first_name: string;
    last_name: string;
    class: string;
    section: string;
    roll_number: string;
    phone?: string;
    email?: string;
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

interface StudentDefaulter {
  student: {
    id: string;
    student_id: string;
    first_name: string;
    last_name: string;
    class: string;
    section: string;
    roll_number: string;
    phone?: string;
    email?: string;
  };
  totalOutstanding: number;
  fees: DefaulterFee[];
  maxDaysOverdue: number;
}

interface DefaultersData {
  summary: {
    totalDefaulters: number;
    totalOutstanding: number;
    totalFees: number;
  };
  studentDefaulters: StudentDefaulter[];
}

export default function DefaultersReportPage() {
  const router = useRouter();
  const [defaultersData, setDefaultersData] = useState<DefaultersData | null>(null);
  const [academicYear, setAcademicYear] = useState<string>('all');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [daysOverdue, setDaysOverdue] = useState<string>('');
  const [selectedDefaulter, setSelectedDefaulter] = useState<StudentDefaulter | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);

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

  // Fetch defaulters data
  type DefaultersResponse = {
    data: DefaultersData;
  } | {
    success: boolean;
    data: DefaultersData;
  } | DefaultersData;

  const { loading, execute: fetchDefaulters } = useApi<DefaultersResponse>(
    (params: {
      academic_year?: string;
      class?: string;
      days_overdue?: string;
    }) => reportsApi.getDefaulters(params),
    {
      onSuccess: (response) => {
        if (response && typeof response === 'object' && 'data' in response) {
          setDefaultersData(response.data);
        } else if (response && typeof response === 'object' && 'summary' in response) {
          // Direct DefaultersData object
          setDefaultersData(response as DefaultersData);
        }
      },
      onError: (error) => {
        console.error('Failed to fetch defaulters:', error);
        toast.error('Failed to fetch defaulters data');
        setDefaultersData(null);
      },
    }
  );

  // Fetch data on mount and when filters change
  useEffect(() => {
    const params: {
      academic_year?: string;
      class?: string;
      days_overdue?: string;
    } = {};
    if (academicYear && academicYear !== 'all') params.academic_year = academicYear;
    if (selectedClass && selectedClass !== 'all') params.class = selectedClass;
    if (daysOverdue) params.days_overdue = daysOverdue;

    fetchDefaulters(params);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [academicYear, selectedClass, daysOverdue]);

  // Transform data for charts
  const classWiseChartData = useMemo(() => {
    if (!defaultersData?.studentDefaulters) return [];
    const classMap = new Map<string, number>();
    
    defaultersData.studentDefaulters.forEach(defaulter => {
      const className = defaulter.student?.class || 'Unknown';
      const current = classMap.get(className) || 0;
      classMap.set(className, current + defaulter.totalOutstanding);
    });

    return Array.from(classMap.entries()).map(([name, value]) => ({
      name,
      value,
    }));
  }, [defaultersData]);

  const feeTypeChartData = useMemo(() => {
    if (!defaultersData?.studentDefaulters) return [];
    const feeTypeMap = new Map<string, number>();
    
    defaultersData.studentDefaulters.forEach(defaulter => {
      defaulter.fees.forEach(fee => {
        const feeType = fee.feeStructure?.fee_type || 'Unknown';
        const current = feeTypeMap.get(feeType) || 0;
        feeTypeMap.set(feeType, current + parseFloat(fee.balance_amount || '0'));
      });
    });

    return Array.from(feeTypeMap.entries()).map(([name, value]) => ({
      name,
      value,
    }));
  }, [defaultersData]);

  const daysOverdueChartData = useMemo(() => {
    if (!defaultersData?.studentDefaulters) return [];
    const ranges = [
      { name: '1-30 days', min: 1, max: 30 },
      { name: '31-60 days', min: 31, max: 60 },
      { name: '61-90 days', min: 61, max: 90 },
      { name: '90+ days', min: 91, max: Infinity },
    ];

    const rangeCounts = ranges.map(range => ({
      name: range.name,
      value: defaultersData.studentDefaulters.filter(
        d => d.maxDaysOverdue >= range.min && d.maxDaysOverdue <= range.max
      ).length,
    }));

    return rangeCounts;
  }, [defaultersData]);

  const handleClearFilters = () => {
    setAcademicYear('all');
    setSelectedClass('all');
    setDaysOverdue('');
  };

  const handleExport = () => {
    toast.info('Export functionality coming soon');
  };

  const handleViewDetails = (defaulter: StudentDefaulter) => {
    setSelectedDefaulter(defaulter);
    setIsDetailsDialogOpen(true);
  };

  // Table columns
  const columns: ColumnDef<StudentDefaulter>[] = useMemo(() => [
    {
      accessorKey: 'student',
      header: 'Student',
      cell: ({ row }) => {
        const student = row.original.student;
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
                ID: {student?.student_id || 'N/A'} | Roll: {student?.roll_number || 'N/A'}
              </p>
            </div>
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
      accessorKey: 'totalOutstanding',
      header: 'Total Outstanding',
      cell: ({ row }) => {
        const total = row.original.totalOutstanding;
        return (
          <div className="text-right">
            <p className="font-medium text-destructive">{formatCurrency(total)}</p>
            <p className="text-xs text-muted-foreground">
              {row.original.fees.length} fee{row.original.fees.length !== 1 ? 's' : ''}
            </p>
          </div>
        );
      },
    },
    {
      accessorKey: 'maxDaysOverdue',
      header: 'Days Overdue',
      cell: ({ row }) => {
        const days = row.original.maxDaysOverdue;
        return (
          <div>
            <Badge variant={days > 90 ? 'destructive' : days > 60 ? 'default' : 'secondary'}>
              {days} day{days !== 1 ? 's' : ''}
            </Badge>
          </div>
        );
      },
    },
    {
      accessorKey: 'contact',
      header: 'Contact',
      cell: ({ row }) => {
        const student = row.original.student;
        return (
          <div className="text-sm">
            {student?.phone && <p>{student.phone}</p>}
            {student?.email && <p className="text-muted-foreground">{student.email}</p>}
            {!student?.phone && !student?.email && <p className="text-muted-foreground">N/A</p>}
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        return (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleViewDetails(row.original)}
          >
            View Details
          </Button>
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
            <h1 className="text-3xl font-bold">Fee Defaulters Report</h1>
            <p className="text-muted-foreground">
              View students with overdue fees and outstanding balances
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
              name="daysOverdue"
              label="Days Overdue (Min)"
              type="number"
              value={daysOverdue}
              onChange={(value) => setDaysOverdue(value)}
              placeholder="e.g., 30"
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
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Defaulters</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                defaultersData?.summary?.totalDefaulters || 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Students with overdue fees
            </p>
          </CardContent>
        </Card>

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
                formatCurrency(defaultersData?.summary?.totalOutstanding || 0)
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Total outstanding amount
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Overdue Fees</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                defaultersData?.summary?.totalFees || 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Number of overdue fee records
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <BarChartComponent
          data={classWiseChartData}
          title="Defaulters by Class"
          description="Number of defaulters per class"
        />

        <BarChartComponent
          data={feeTypeChartData}
          title="Outstanding by Fee Type"
          description="Total outstanding amount by fee type"
        />
      </div>

      <PieChartComponent
        data={daysOverdueChartData}
        title="Defaulters by Days Overdue"
        description="Distribution of defaulters by days overdue"
      />

      {/* Defaulters Table */}
      <Card>
        <CardHeader>
          <CardTitle>Defaulters List</CardTitle>
          <CardDescription>
            Students with overdue fees grouped by student
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : defaultersData?.studentDefaulters && defaultersData.studentDefaulters.length > 0 ? (
            <DataTable
              columns={columns}
              data={defaultersData.studentDefaulters}
            />
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No defaulters found
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Defaulter Details</DialogTitle>
            <DialogDescription>
              Detailed view of overdue fees for this student
            </DialogDescription>
          </DialogHeader>
          {selectedDefaulter && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 pb-4 border-b">
                <Avatar className="h-12 w-12">
                  <AvatarFallback>
                    {selectedDefaulter.student?.first_name?.[0] || ''}
                    {selectedDefaulter.student?.last_name?.[0] || ''}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-lg">
                    {selectedDefaulter.student?.first_name} {selectedDefaulter.student?.last_name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    ID: {selectedDefaulter.student?.student_id} | 
                    Class: {selectedDefaulter.student?.class} - {selectedDefaulter.student?.section} | 
                    Roll: {selectedDefaulter.student?.roll_number}
                  </p>
                  {selectedDefaulter.student?.phone && (
                    <p className="text-sm text-muted-foreground">Phone: {selectedDefaulter.student.phone}</p>
                  )}
                  {selectedDefaulter.student?.email && (
                    <p className="text-sm text-muted-foreground">Email: {selectedDefaulter.student.email}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Total Outstanding</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-destructive">
                      {formatCurrency(selectedDefaulter.totalOutstanding)}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Max Days Overdue</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">
                      {selectedDefaulter.maxDaysOverdue} day{selectedDefaulter.maxDaysOverdue !== 1 ? 's' : ''}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Overdue Fees ({selectedDefaulter.fees.length})</h4>
                <div className="space-y-2">
                  {selectedDefaulter.fees.map((fee) => (
                    <Card key={fee.id}>
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium capitalize">{fee.feeStructure?.fee_type || 'N/A'}</p>
                            <p className="text-sm text-muted-foreground">
                              Due: {fee.due_date ? new Date(fee.due_date).toLocaleDateString() : 'N/A'} | 
                              Academic Year: {fee.feeStructure?.academic_year || fee.academic_year || 'N/A'}
                            </p>
                            {fee.daysOverdue !== undefined && (
                              <Badge variant="destructive" className="mt-1">
                                {fee.daysOverdue} day{fee.daysOverdue !== 1 ? 's' : ''} overdue
                              </Badge>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-destructive">
                              {formatCurrency(parseFloat(fee.balance_amount || '0'))}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Total: {formatCurrency(parseFloat(fee.total_amount || '0'))} | 
                              Paid: {formatCurrency(parseFloat(fee.paid_amount || '0'))}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

