'use client';

import React from 'react';
import { StatsCard } from '@/components/shared/StatsCard';
import { BarChartComponent } from '@/components/charts/BarChart';
import { PieChartComponent } from '@/components/charts/PieChart';
import { LineChartComponent } from '@/components/charts/LineChart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  CreditCard, 
  DollarSign, 
  AlertTriangle,
  TrendingUp,
  Calendar,
  UserPlus,
  Receipt
} from 'lucide-react';

export default function AdminDashboard() {
  // Mock data - in real app, this would come from API
  const stats = {
    totalStudents: 1250,
    totalFees: 45000,
    collectedAmount: 32000,
    pendingAmount: 13000,
    overdueAmount: 5000,
    defaultersCount: 45,
  };

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

  const recentActivities = [
    { id: 1, type: 'payment', message: 'Payment received from John Doe', time: '2 minutes ago', amount: 5000 },
    { id: 2, type: 'student', message: 'New student registered: Jane Smith', time: '1 hour ago' },
    { id: 3, type: 'fee', message: 'Fee structure updated for Class 5', time: '3 hours ago' },
    { id: 4, type: 'payment', message: 'Payment received from Mike Johnson', time: '5 hours ago', amount: 3000 },
  ];

  const upcomingDues = [
    { id: 1, student: 'Alice Brown', class: 'Class 3', amount: 5000, dueDate: '2024-01-15' },
    { id: 2, student: 'Bob Wilson', class: 'Class 4', amount: 5500, dueDate: '2024-01-16' },
    { id: 3, student: 'Carol Davis', class: 'Class 2', amount: 4500, dueDate: '2024-01-17' },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's what's happening with your fee management.
          </p>
        </div>
        <div className="flex gap-2">
          <Button>
            <UserPlus className="mr-2 h-4 w-4" />
            Add Student
          </Button>
          <Button variant="outline">
            <Receipt className="mr-2 h-4 w-4" />
            Record Payment
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Students"
          value={stats.totalStudents.toLocaleString()}
          change={{ value: 12, type: 'increase' }}
          icon={Users}
          description="Active students"
        />
        <StatsCard
          title="Total Fees"
          value={`₹${stats.totalFees.toLocaleString()}`}
          change={{ value: 8, type: 'increase' }}
          icon={CreditCard}
          description="This month"
        />
        <StatsCard
          title="Collected Amount"
          value={`₹${stats.collectedAmount.toLocaleString()}`}
          change={{ value: 15, type: 'increase' }}
          icon={DollarSign}
          description="This month"
        />
        <StatsCard
          title="Defaulters"
          value={stats.defaultersCount}
          change={{ value: 5, type: 'decrease' }}
          icon={AlertTriangle}
          description="Overdue payments"
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <BarChartComponent
          data={monthlyCollectionData}
          title="Monthly Collection"
          description="Fee collection trend over months"
          height={300}
        />
        <PieChartComponent
          data={feeTypeData}
          title="Fee Type Distribution"
          description="Breakdown by fee types"
          height={300}
        />
        <LineChartComponent
          data={classWiseData}
          title="Class-wise Collection"
          description="Collection trend by class"
          height={300}
        />
      </div>

      {/* Bottom Row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Recent Activities
            </CardTitle>
            <CardDescription>
              Latest updates and transactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className="h-2 w-2 rounded-full bg-primary mt-2" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{activity.message}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">{activity.time}</span>
                      {activity.amount && (
                        <Badge variant="secondary" className="text-xs">
                          ₹{activity.amount.toLocaleString()}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Dues */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Upcoming Dues
            </CardTitle>
            <CardDescription>
              Fees due in the next 7 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingDues.map((due) => (
                <div key={due.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{due.student}</p>
                    <p className="text-sm text-muted-foreground">{due.class}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">₹{due.amount.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">{due.dueDate}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

