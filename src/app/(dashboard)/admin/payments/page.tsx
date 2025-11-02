'use client';

import React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/tables/DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Eye, Edit, Trash2, Plus, Receipt, Download } from 'lucide-react';
import { Payment } from '@/lib/types';

// Mock data - in real app, this would come from API
const mockPayments: Payment[] = [
  {
    id: '1',
    feeId: '1',
    studentId: '1',
    amount: 5000,
    paymentMethod: 'online',
    paymentDate: new Date('2024-01-10'),
    receiptNumber: 'RCP2024001',
    referenceNumber: 'TXN123456',
    notes: 'Monthly tuition fee payment',
    recordedBy: '1',
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-10'),
  },
  {
    id: '2',
    feeId: '2',
    studentId: '2',
    amount: 3000,
    paymentMethod: 'bank_transfer',
    paymentDate: new Date('2024-01-09'),
    receiptNumber: 'RCP2024002',
    referenceNumber: 'BT789012',
    notes: 'Transport fee payment',
    recordedBy: '1',
    createdAt: new Date('2024-01-09'),
    updatedAt: new Date('2024-01-09'),
  },
  {
    id: '3',
    feeId: '3',
    studentId: '3',
    amount: 2000,
    paymentMethod: 'cash',
    paymentDate: new Date('2024-01-08'),
    receiptNumber: 'RCP2024003',
    notes: 'Library fee payment',
    recordedBy: '1',
    createdAt: new Date('2024-01-08'),
    updatedAt: new Date('2024-01-08'),
  },
];

export default function PaymentsPage() {
  const columns: ColumnDef<Payment>[] = [
    {
      accessorKey: 'student',
      header: 'Student',
      cell: ({ row }) => {
        const payment = row.original;
        // Mock student data - in real app, this would come from the student relationship
        const studentName = `Student ${payment.studentId}`;
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src="" />
              <AvatarFallback>
                {studentName.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{studentName}</p>
              <p className="text-sm text-muted-foreground">ID: {payment.studentId}</p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'amount',
      header: 'Amount',
      cell: ({ row }) => {
        const amount = row.original.amount;
        return (
          <div className="text-right">
            <p className="font-medium">₹{amount.toLocaleString()}</p>
          </div>
        );
      },
    },
    {
      accessorKey: 'paymentMethod',
      header: 'Method',
      cell: ({ row }) => {
        const method = row.original.paymentMethod;
        const methodColors = {
          cash: 'bg-green-100 text-green-800',
          bank_transfer: 'bg-blue-100 text-blue-800',
          cheque: 'bg-purple-100 text-purple-800',
          online: 'bg-orange-100 text-orange-800',
          card: 'bg-red-100 text-red-800',
        };
        return (
          <Badge className={methodColors[method] || 'bg-gray-100 text-gray-800'}>
            {method.replace('_', ' ').toUpperCase()}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'paymentDate',
      header: 'Payment Date',
      cell: ({ row }) => {
        const date = row.original.paymentDate;
        return (
          <div>
            <p className="text-sm">{date.toLocaleDateString()}</p>
            <p className="text-xs text-muted-foreground">{date.toLocaleTimeString()}</p>
          </div>
        );
      },
    },
    {
      accessorKey: 'receiptNumber',
      header: 'Receipt',
      cell: ({ row }) => {
        const receiptNumber = row.original.receiptNumber;
        return (
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm">{receiptNumber}</span>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <Download className="h-3 w-3" />
            </Button>
          </div>
        );
      },
    },
    {
      accessorKey: 'referenceNumber',
      header: 'Reference',
      cell: ({ row }) => {
        const refNumber = row.original.referenceNumber;
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
      accessorKey: 'notes',
      header: 'Notes',
      cell: ({ row }) => {
        const notes = row.original.notes;
        return (
          <div className="max-w-xs">
            <p className="text-sm truncate" title={notes}>
              {notes || '-'}
            </p>
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const payment = row.original;

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
                  console.log('View payment:', payment.id);
                }}
              >
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  console.log('Download receipt:', payment.id);
                }}
              >
                <Receipt className="mr-2 h-4 w-4" />
                Download Receipt
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  console.log('Edit payment:', payment.id);
                }}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit Payment
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  console.log('Delete payment:', payment.id);
                }}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Payment
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
          <p className="text-muted-foreground">
            View and manage all payment transactions
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Payments
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Record Payment
          </Button>
        </div>
      </div>

      {/* Payments Table */}
      <DataTable
        columns={columns}
        data={mockPayments}
        searchKey="receiptNumber"
        searchPlaceholder="Search payments..."
        showSearch={true}
        showColumnToggle={true}
        showPagination={true}
        showExport={true}
        onRowClick={(payment) => {
          console.log('Row clicked:', payment);
        }}
        onSelectionChange={(selectedPayments) => {
          console.log('Selected payments:', selectedPayments);
        }}
      />
    </div>
  );
}

