'use client';

import React from 'react';
import { StatsCard } from '@/components/shared/StatsCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CreditCard, 
  DollarSign, 
  Calendar,
  Receipt,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

export default function StudentDashboard() {
  // Mock data - in real app, this would come from API
  const studentStats = {
    totalFees: 25000,
    paidAmount: 20000,
    pendingAmount: 5000,
    overdueAmount: 2000,
  };

  const recentPayments = [
    { id: 1, amount: 5000, date: '2024-01-10', method: 'Online', status: 'completed' },
    { id: 2, amount: 3000, date: '2024-01-05', method: 'Bank Transfer', status: 'completed' },
    { id: 3, amount: 2000, date: '2024-01-01', method: 'Cash', status: 'completed' },
  ];

  const upcomingDues = [
    { id: 1, feeType: 'Tuition Fee', amount: 5000, dueDate: '2024-01-15', status: 'pending' },
    { id: 2, feeType: 'Transport Fee', amount: 1500, dueDate: '2024-01-20', status: 'pending' },
    { id: 3, feeType: 'Library Fee', amount: 500, dueDate: '2024-01-25', status: 'overdue' },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's your fee summary and recent activities.
          </p>
        </div>
        <Button>
          <Receipt className="mr-2 h-4 w-4" />
          View Receipts
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Fees"
          value={`KES ${studentStats.totalFees.toLocaleString()}`}
          icon={CreditCard}
          description="This academic year"
        />
        <StatsCard
          title="Paid Amount"
          value={`KES ${studentStats.paidAmount.toLocaleString()}`}
          change={{ value: 80, type: 'increase' }}
          icon={DollarSign}
          description="Amount paid"
        />
        <StatsCard
          title="Pending Amount"
          value={`KES ${studentStats.pendingAmount.toLocaleString()}`}
          icon={Calendar}
          description="Outstanding fees"
        />
        <StatsCard
          title="Overdue Amount"
          value={`KES ${studentStats.overdueAmount.toLocaleString()}`}
          icon={AlertTriangle}
          description="Past due date"
        />
      </div>

      {/* Bottom Row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Payments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Recent Payments
            </CardTitle>
            <CardDescription>
              Your latest payment transactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentPayments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">KES {payment.amount.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">{payment.method}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{payment.date}</p>
                    <Badge variant="default" className="text-xs">
                      {payment.status}
                    </Badge>
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
              Fees due in the coming days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingDues.map((due) => (
                <div key={due.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{due.feeType}</p>
                    <p className="text-sm text-muted-foreground">Due: {due.dueDate}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">KES {due.amount.toLocaleString()}</p>
                    <Badge 
                      variant={due.status === 'overdue' ? 'destructive' : 'secondary'}
                      className="text-xs"
                    >
                      {due.status}
                    </Badge>
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

