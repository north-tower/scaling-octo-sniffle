'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChartComponent } from '@/components/charts/BarChart';
import { PieChartComponent } from '@/components/charts/PieChart';
import { LineChartComponent } from '@/components/charts/LineChart';
import { 
  Download, 
  Calendar,
  DollarSign,
  FileText,
  Loader2,
  ArrowLeft,
  Filter
} from 'lucide-react';
import { reportsApi } from '@/lib/api';
import { useApi } from '@/hooks/useApi';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FormField } from '@/components/forms/FormField';
import { useRouter } from 'next/navigation';
import { formatCurrency } from '@/lib/utils';

interface FeeCollectionData {
  summary: {
    totalCollection: number;
    totalTransactions: number;
  };
  collectionByFeeType: Array<{
    fee_type: string;
    count: number;
    total: number;
  }>;
  collectionByClass: Array<{
    class: string;
    count: number;
    total: number;
  }>;
  monthlyCollection: Array<{
    month: string;
    count: number;
    total: number;
  }>;
}

export default function FeeCollectionPage() {
  const router = useRouter();
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 6);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [isDateRangeDialogOpen, setIsDateRangeDialogOpen] = useState(false);
  const [academicYear, setAcademicYear] = useState<string>('all');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [collectionData, setCollectionData] = useState<FeeCollectionData | null>(null);

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

  // Fetch fee collection data
  type FeeCollectionResponse = {
    data: FeeCollectionData;
  } | {
    success: boolean;
    data: FeeCollectionData;
  } | FeeCollectionData;

  const { loading, execute: fetchFeeCollection } = useApi<FeeCollectionResponse>(
    (params: {
      start_date?: string;
      end_date?: string;
      academic_year?: string;
      class?: string;
    }) => reportsApi.getFeeCollection(params),
    {
      onSuccess: (response) => {
        if (response && typeof response === 'object' && 'data' in response) {
          setCollectionData(response.data);
        } else if (response && typeof response === 'object' && 'summary' in response) {
          // Direct FeeCollectionData object
          setCollectionData(response as FeeCollectionData);
        }
      },
      onError: (error) => {
        console.error('Failed to fetch fee collection:', error);
        toast.error('Failed to fetch fee collection data');
        setCollectionData(null);
      },
    }
  );

  // Fetch data on mount and when filters change
  useEffect(() => {
    const params: {
      start_date?: string;
      end_date?: string;
      academic_year?: string;
      class?: string;
    } = {};
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    if (academicYear && academicYear !== 'all') params.academic_year = academicYear;
    if (selectedClass && selectedClass !== 'all') params.class = selectedClass;

    fetchFeeCollection(params);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate, academicYear, selectedClass]);

  // Transform data for charts
  const feeTypeChartData = useMemo(() => {
    if (!collectionData?.collectionByFeeType) return [];
    return collectionData.collectionByFeeType.map(item => ({
      name: item.fee_type || 'Unknown',
      value: parseFloat(item.total.toString()) || 0,
    }));
  }, [collectionData]);

  const classChartData = useMemo(() => {
    if (!collectionData?.collectionByClass) return [];
    return collectionData.collectionByClass.map(item => ({
      name: item.class || 'Unknown',
      value: parseFloat(item.total.toString()) || 0,
    }));
  }, [collectionData]);

  const monthlyChartData = useMemo(() => {
    if (!collectionData?.monthlyCollection) return [];
    return [{
      name: 'Collection',
      data: collectionData.monthlyCollection.map(item => ({
        x: item.month || 'Unknown',
        y: parseFloat(item.total.toString()) || 0,
      })),
      color: '#0088FE',
    }];
  }, [collectionData]);

  const handleApplyDateRange = () => {
    setIsDateRangeDialogOpen(false);
    // Data will be refetched automatically via useEffect
  };

  const handleClearFilters = () => {
    const date = new Date();
    date.setMonth(date.getMonth() - 6);
    setStartDate(date.toISOString().split('T')[0]);
    setEndDate(new Date().toISOString().split('T')[0]);
    setAcademicYear('all');
    setSelectedClass('all');
  };

  const handleExport = () => {
    toast.info('Export functionality coming soon');
  };

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
            <h1 className="text-3xl font-bold">Fee Collection Report</h1>
            <p className="text-muted-foreground">
              View detailed fee collection analytics and trends
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setIsDateRangeDialogOpen(true)}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Date Range
          </Button>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              label="Academic Year"
              value={academicYear || undefined}
              onChange={(value) => setAcademicYear(value === 'all' ? '' : value || '')}
              type="select"
              options={[
                { value: 'all', label: 'All Academic Years' },
                ...academicYears.map(year => ({ value: year, label: year }))
              ]}
            />
            <FormField
              label="Class"
              value={selectedClass || undefined}
              onChange={(value) => setSelectedClass(value === 'all' ? '' : value || '')}
              type="select"
              options={[
                { value: 'all', label: 'All Classes' },
                ...classes.map(cls => ({ value: cls.name, label: cls.name }))
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
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Collection</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                formatCurrency(collectionData?.summary?.totalCollection || 0)
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Total amount collected in the selected period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                collectionData?.summary?.totalTransactions || 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Number of payment transactions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <PieChartComponent
          data={feeTypeChartData}
          title="Collection by Fee Type"
          description="Distribution of collections across different fee types"
        />

        <BarChartComponent
          data={classChartData}
          title="Collection by Class"
          description="Total collection amount per class"
        />
      </div>

      <LineChartComponent
        data={monthlyChartData}
        title="Monthly Collection Trend"
        description="Fee collection trend over time"
      />

      {/* Date Range Dialog */}
      <Dialog open={isDateRangeDialogOpen} onOpenChange={setIsDateRangeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select Date Range</DialogTitle>
            <DialogDescription>
              Choose the start and end dates for the collection report
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <FormField
              label="Start Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <FormField
              label="End Date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDateRangeDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleApplyDateRange}>
              Apply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

