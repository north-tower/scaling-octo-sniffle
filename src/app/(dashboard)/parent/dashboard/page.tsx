'use client';

import React from 'react';
import { StatsCard } from '@/components/shared/StatsCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Users, 
  CreditCard, 
  DollarSign,
  Calendar,
  Receipt,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

export default function ParentDashboard() {
  // Mock data - in real app, this would come from API
  const children = [
    { id: '1', name: 'John Doe', class: 'Class 3', avatar: '', totalFees: 15000, paidAmount: 12000 },
    { id: '2', name: 'Jane Doe', class: 'Class 1', avatar: '', totalFees: 10000, paidAmount: 8000 },
  ];

  const parentStats = {
    totalChildren: children.length,
    totalFees: children.reduce((sum, child) => sum + child.totalFees, 0),
    totalPaid: children.reduce((sum, child) => sum + child.paidAmount, 0),
    totalPending: children.reduce((sum, child) => sum + (child.totalFees - child.paidAmount), 0),
  };

  const recentPayments = [
    { id: 1, child: 'John Doe', amount: 5000, date: '2024-01-10', method: 'Online', status: 'completed' },
    { id: 2, child: 'Jane Doe', amount: 3000, date: '2024-01-05', method: 'Bank Transfer', status: 'completed' },
    { id: 3, child: 'John Doe', amount: 2000, date: '2024-01-01', method: 'Cash', status: 'completed' },
  ];

  const upcomingDues = [
    { id: 1, child: 'John Doe', feeType: 'Tuition Fee', amount: 3000, dueDate: '2024-01-15', status: 'pending' },
    { id: 2, child: 'Jane Doe', feeType: 'Transport Fee', amount: 1500, dueDate: '2024-01-20', status: 'pending' },
    { id: 3, child: 'John Doe', feeType: 'Library Fee', amount: 500, dueDate: '2024-01-25', status: 'overdue' },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Parent Dashboard</h1>
          <p className="text-muted-foreground">
            Manage fees and payments for your children.
          </p>
        </div>
        <Button>
          <Receipt className="mr-2 h-4 w-4" />
          Make Payment
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Children"
          value={parentStats.totalChildren}
          icon={Users}
          description="Enrolled students"
        />
        <StatsCard
          title="Total Fees"
          value={`₹${parentStats.totalFees.toLocaleString()}`}
          icon={CreditCard}
          description="All children combined"
        />
        <StatsCard
          title="Paid Amount"
          value={`₹${parentStats.totalPaid.toLocaleString()}`}
          change={{ value: 80, type: 'increase' }}
          icon={DollarSign}
          description="Total paid"
        />
        <StatsCard
          title="Pending Amount"
          value={`₹${parentStats.totalPending.toLocaleString()}`}
          icon={AlertTriangle}
          description="Outstanding fees"
        />
      </div>

      {/* Children Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            My Children
          </CardTitle>
          <CardDescription>
            Overview of your children's fee status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {children.map((child) => (
              <div key={child.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={child.avatar} />
                    <AvatarFallback>
                      {child.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{child.name}</p>
                    <p className="text-sm text-muted-foreground">{child.class}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">₹{(child.totalFees - child.paidAmount).toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Pending</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

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
              Latest payment transactions
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
                      <p className="font-medium">{payment.child}</p>
                      <p className="text-sm text-muted-foreground">₹{payment.amount.toLocaleString()} • {payment.method}</p>
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
              Fees due for your children
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingDues.map((due) => (
                <div key={due.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{due.child}</p>
                    <p className="text-sm text-muted-foreground">{due.feeType} • Due: {due.dueDate}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">₹{due.amount.toLocaleString()}</p>
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

