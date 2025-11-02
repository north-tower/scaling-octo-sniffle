'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  AlertTriangle
} from 'lucide-react';

export default function ReportsPage() {
  // Mock data - in real app, this would come from API
  const monthlyCollectionData = [
    { name: 'Jan', value: 28000 },
    { name: 'Feb', value: 32000 },
    { name: 'Mar', value: 35000 },
    { name: 'Apr', value: 30000 },
    { name: 'May', value: 38000 },
    { name: 'Jun', value: 42000 },
  ];

  const feeTypeData = [
    { name: 'Tuition', value: 25000, color: '#0088FE' },
    { name: 'Transport', value: 8000, color: '#00C49F' },
    { name: 'Library', value: 3000, color: '#FFBB28' },
    { name: 'Sports', value: 2000, color: '#FF8042' },
    { name: 'Exam', value: 4000, color: '#8884D8' },
  ];

  const classWiseData = [
    { name: 'Class 1', data: [{ x: 'Jan', y: 5000 }, { x: 'Feb', y: 5500 }, { x: 'Mar', y: 6000 }] },
    { name: 'Class 2', data: [{ x: 'Jan', y: 6000 }, { x: 'Feb', y: 6500 }, { x: 'Mar', y: 7000 }] },
    { name: 'Class 3', data: [{ x: 'Jan', y: 7000 }, { x: 'Feb', y: 7500 }, { x: 'Mar', y: 8000 }] },
  ];

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

  const handleGenerateReport = (reportType: string) => {
    console.log('Generating report:', reportType);
    // In real app, this would call the API to generate the report
  };

  const handleExportReport = (reportType: string, format: string) => {
    console.log('Exporting report:', reportType, 'as', format);
    // In real app, this would download the report in the specified format
  };

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
          <Button variant="outline">
            <Calendar className="mr-2 h-4 w-4" />
            Set Date Range
          </Button>
          <Button>
            <Download className="mr-2 h-4 w-4" />
            Export All Reports
          </Button>
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
              >
                Generate Report
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <BarChartComponent
          data={monthlyCollectionData}
          title="Monthly Collection Trend"
          description="Fee collection over the past 6 months"
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
          description="Collection trends by class"
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
            <div className="text-2xl font-bold">₹2,45,000</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding Amount</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹45,000</div>
            <p className="text-xs text-muted-foreground">
              -8% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collection Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">84.5%</div>
            <p className="text-xs text-muted-foreground">
              +2.1% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Defaulters</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45</div>
            <p className="text-xs text-muted-foreground">
              -5 from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Reports */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Recent Reports
          </CardTitle>
          <CardDescription>
            Recently generated reports and exports
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { name: 'Fee Collection Report - January 2024', type: 'PDF', date: '2024-01-31', size: '2.3 MB' },
              { name: 'Outstanding Fees Report - January 2024', type: 'Excel', date: '2024-01-30', size: '1.8 MB' },
              { name: 'Payment History Report - Q4 2023', type: 'CSV', date: '2024-01-29', size: '4.1 MB' },
            ].map((report, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium">{report.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {report.date} • {report.size}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{report.type}</Badge>
                  <Button variant="ghost" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

