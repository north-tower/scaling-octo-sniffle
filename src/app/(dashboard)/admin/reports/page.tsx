'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { BarChartComponent } from '@/components/charts/BarChart';
import { PieChartComponent } from '@/components/charts/PieChart';
import { LineChartComponent } from '@/components/charts/LineChart';
import { 
  BarChart3, 
  Download, 
  Calendar,
  FileText,
  TrendingUp,
  Users,
  DollarSign,
  AlertTriangle,
  Loader2
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
import { Label } from '@/components/ui/label';

export default function ReportsPage() {
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 6);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [isDateRangeDialogOpen, setIsDateRangeDialogOpen] = useState(false);
  const [academicYear, setAcademicYear] = useState('');
  const [selectedClass, setSelectedClass] = useState('');

  // Fee Collection Report
  const { loading: collectionLoading, execute: fetchFeeCollection } = useApi(
    (params: any) => reportsApi.getFeeCollection(params),
    {
      onSuccess: (response: any) => {
        if (response?.data) {
          setCollectionData(response.data);
        } else if (response?.success && response?.data) {
          setCollectionData(response.data);
        }
      },
      onError: (error) => {
        console.error('Failed to fetch fee collection:', error);
        setCollectionData(null);
      },
    }
  );

  // Outstanding Fees Report
  const { loading: outstandingLoading, execute: fetchOutstanding } = useApi(
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
        setOutstandingData(null);
      },
    }
  );

  // Defaulters Report
  const { loading: defaultersLoading, execute: fetchDefaulters } = useApi(
    (params: any) => reportsApi.getDefaulters(params),
    {
      onSuccess: (response: any) => {
        if (response?.data) {
          setDefaultersData(response.data);
        } else if (response?.success && response?.data) {
          setDefaultersData(response.data);
        }
      },
      onError: (error) => {
        console.error('Failed to fetch defaulters:', error);
        setDefaultersData(null);
      },
    }
  );

  // Fetch data on mount and when filters change
  useEffect(() => {
    const params: any = {
      start_date: startDate,
      end_date: endDate,
    };
    if (academicYear) params.academic_year = academicYear;
    if (selectedClass) params.class = selectedClass;

    fetchFeeCollection(params);
    fetchOutstanding(params);
    fetchDefaulters(params);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate, academicYear, selectedClass]);

  // Store fetched data
  const [collectionData, setCollectionData] = useState<any>(null);
  const [outstandingData, setOutstandingData] = useState<any>(null);
  const [defaultersData, setDefaultersData] = useState<any>(null);

  // Transform data for charts
  const monthlyCollectionData = useMemo(() => {
    if (!collectionData?.monthlyCollection) return [];
    
    return collectionData.monthlyCollection.map((item: any) => {
      const month = item.month || item.dataValues?.month || 'Unknown';
      const total = parseFloat(item.total || item.dataValues?.total || 0);
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthIndex = typeof month === 'string' && month.includes('-') 
        ? parseInt(month.split('-')[1]) - 1 
        : parseInt(month) - 1;
      
      return {
        name: monthNames[monthIndex] || month,
        value: total,
      };
    }).slice(-6); // Last 6 months
  }, [collectionData]);

  const feeTypeData = useMemo(() => {
    if (!collectionData?.collectionByFeeType) return [];
    
    const colors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658'];
    return collectionData.collectionByFeeType.map((item: any, index: number) => {
      const feeType = item.fee_type || item.dataValues?.fee_type || 'Unknown';
      const total = parseFloat(item.total || item.dataValues?.total || 0);
      
      return {
        name: feeType.charAt(0).toUpperCase() + feeType.slice(1),
        value: total,
        color: colors[index % colors.length],
      };
    });
  }, [collectionData]);

  const classWiseData = useMemo(() => {
    if (!collectionData?.collectionByClass) return [];
    
    return collectionData.collectionByClass.map((item: any) => {
      const className = item.class || item.dataValues?.class || 'Unknown';
      const total = parseFloat(item.total || item.dataValues?.total || 0);
      
      return {
        name: `Class ${className}`,
        data: [{ x: 'Collection', y: total }],
      };
    }).slice(0, 6); // First 6 classes
  }, [collectionData]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const totalCollection = collectionData?.summary?.totalCollection || 0;
    const totalTransactions = collectionData?.summary?.totalTransactions || 0;
    const totalOutstanding = outstandingData?.summary?.totalOutstanding || 0;
    const totalDefaulters = defaultersData?.summary?.totalDefaulters || 0;

    // Calculate collection rate (this would need total expected fees)
    const collectionRate = totalCollection > 0 
      ? ((totalCollection / (totalCollection + totalOutstanding)) * 100).toFixed(1)
      : '0';

    return {
      totalCollection,
      totalTransactions,
      totalOutstanding,
      totalDefaulters,
      collectionRate,
    };
  }, [collectionData, outstandingData, defaultersData]);

  const handleGenerateReport = async (reportType: string) => {
    try {
      const params: any = {
        start_date: startDate,
        end_date: endDate,
      };
      if (academicYear) params.academic_year = academicYear;
      if (selectedClass) params.class = selectedClass;

      let response;
      switch (reportType) {
        case 'fee-collection':
          response = await reportsApi.getFeeCollection(params);
          if (response.success) {
            setCollectionData(response.data);
            toast.success('Fee collection report generated');
          }
          break;
        case 'outstanding-fees':
          response = await reportsApi.getOutstandingFees(params);
          if (response.success) {
            setOutstandingData(response.data);
            toast.success('Outstanding fees report generated');
          }
          break;
        case 'payment-history':
          toast.info('Payment history is available in the Payments > History page');
          break;
        case 'defaulters':
          response = await reportsApi.getDefaulters(params);
          if (response.success) {
            setDefaultersData(response.data);
            toast.success('Defaulters report generated');
          }
          break;
        default:
          toast.error('Unknown report type');
      }
    } catch (error: any) {
      console.error('Failed to generate report:', error);
      toast.error(error?.message || 'Failed to generate report');
    }
  };

  const handleExportReport = async (reportType: string, format: string) => {
    try {
      const params: any = {
        start_date: startDate,
        end_date: endDate,
      };
      if (academicYear) params.academic_year = academicYear;
      if (selectedClass) params.class = selectedClass;

      await reportsApi.exportReport(reportType, params, format);
      toast.success(`Report exported as ${format.toUpperCase()}`);
    } catch (error: any) {
      console.error('Failed to export report:', error);
      toast.error(error?.message || 'Failed to export report');
    }
  };

  const handleApplyDateRange = () => {
    setIsDateRangeDialogOpen(false);
    // Data will be refetched automatically via useEffect
  };

  const reportTypes = [
    {
      id: 'fee-collection',
      title: 'Fee Collection Report',
      description: 'Monthly fee collection summary with trends',
      icon: BarChart3,
      color: 'bg-blue-100 text-blue-800',
    },
    {
      id: 'outstanding-fees',
      title: 'Outstanding Fees Report',
      description: 'Students with pending payments',
      icon: AlertTriangle,
      color: 'bg-red-100 text-red-800',
    },
    {
      id: 'payment-history',
      title: 'Payment History Report',
      description: 'Detailed payment transaction history',
      icon: FileText,
      color: 'bg-green-100 text-green-800',
    },
    {
      id: 'defaulters',
      title: 'Defaulters Report',
      description: 'Students with overdue payments',
      icon: Users,
      color: 'bg-orange-100 text-orange-800',
    },
  ];

  const loading = collectionLoading || outstandingLoading || defaultersLoading;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">
            Generate and export comprehensive fee management reports
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => setIsDateRangeDialogOpen(true)}
          >
            <Calendar className="mr-2 h-4 w-4" />
            Set Date Range
          </Button>
          {loading && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>
      </div>

      {/* Report Types */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {reportTypes.map((report) => (
          <Card key={report.id} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className={`p-2 rounded-lg ${report.color}`}>
                  <report.icon className="h-5 w-5" />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <span className="sr-only">Export options</span>
                      <Download className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleExportReport(report.id, 'pdf')}>
                      Export as PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExportReport(report.id, 'excel')}>
                      Export as Excel
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExportReport(report.id, 'csv')}>
                      Export as CSV
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              <h3 className="font-semibold mb-2">{report.title}</h3>
              <p className="text-sm text-muted-foreground mb-4">{report.description}</p>
              <Button 
                size="sm" 
                className="w-full"
                onClick={() => handleGenerateReport(report.id)}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Generate Report'
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Section */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading report data...</span>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <BarChartComponent
              data={monthlyCollectionData}
              title="Monthly Collection Trend"
              description="Fee collection over the selected period"
              height={300}
            />
            <PieChartComponent
              data={feeTypeData}
              title="Fee Type Distribution"
              description="Breakdown of collected fees by type"
              height={300}
            />
            <LineChartComponent
              data={classWiseData}
              title="Class-wise Collection"
              description="Collection by class"
              height={300}
            />
          </div>

          {/* Summary Statistics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Collection</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">KES {summaryStats.totalCollection.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  {summaryStats.totalTransactions} transactions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Outstanding Amount</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">KES {summaryStats.totalOutstanding.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  Pending payments
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Collection Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summaryStats.collectionRate}%</div>
                <p className="text-xs text-muted-foreground">
                  Collection efficiency
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Defaulters</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summaryStats.totalDefaulters}</div>
                <p className="text-xs text-muted-foreground">
                  Students with overdue fees
                </p>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Date Range Dialog */}
      <Dialog open={isDateRangeDialogOpen} onOpenChange={setIsDateRangeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Date Range</DialogTitle>
            <DialogDescription>
              Select the date range for generating reports
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                name="startDate"
                label="Start Date"
                type="date"
                required
                value={startDate}
                onChange={(value) => setStartDate(value)}
              />
              <FormField
                name="endDate"
                label="End Date"
                type="date"
                required
                value={endDate}
                onChange={(value) => setEndDate(value)}
              />
            </div>
            <FormField
              name="academicYear"
              label="Academic Year (Optional)"
              type="select"
              placeholder="All Academic Years"
              value={academicYear || 'all'}
              onChange={(value) => setAcademicYear(value === 'all' ? '' : value)}
              options={[
                { label: 'All Academic Years', value: 'all' },
                { label: '2023-2024', value: '2023-2024' },
                { label: '2024-2025', value: '2024-2025' },
                { label: '2025-2026', value: '2025-2026' },
              ]}
            />
            <FormField
              name="selectedClass"
              label="Class (Optional)"
              type="select"
              placeholder="All Classes"
              value={selectedClass || 'all'}
              onChange={(value) => setSelectedClass(value === 'all' ? '' : value)}
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
