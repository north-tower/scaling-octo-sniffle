'use client';

import React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/tables/DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Eye, Edit, Trash2, Plus, BookOpen } from 'lucide-react';
import { FeeStructure } from '@/lib/types';

// Mock data - in real app, this would come from API
const mockFeeStructures: FeeStructure[] = [
  {
    id: '1',
    name: 'Tuition Fee - Class 1',
    description: 'Monthly tuition fee for Class 1 students',
    amount: 5000,
    feeType: 'tuition',
    classId: '1',
    academicYearId: '1',
    dueDate: new Date('2024-01-15'),
    lateFeeAmount: 500,
    lateFeeDays: 5,
    isRecurring: true,
    recurringInterval: 'monthly',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: '2',
    name: 'Transport Fee - Class 1',
    description: 'Monthly transport fee for Class 1 students',
    amount: 1500,
    feeType: 'transport',
    classId: '1',
    academicYearId: '1',
    dueDate: new Date('2024-01-20'),
    lateFeeAmount: 150,
    lateFeeDays: 3,
    isRecurring: true,
    recurringInterval: 'monthly',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: '3',
    name: 'Library Fee - All Classes',
    description: 'Annual library membership fee',
    amount: 1000,
    feeType: 'library',
    classId: 'all',
    academicYearId: '1',
    dueDate: new Date('2024-02-01'),
    lateFeeAmount: 100,
    lateFeeDays: 7,
    isRecurring: false,
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
];

export default function FeeStructuresPage() {
  const columns: ColumnDef<FeeStructure>[] = [
    {
      accessorKey: 'name',
      header: 'Fee Structure',
      cell: ({ row }) => {
        const fee = row.original;
        return (
          <div>
            <p className="font-medium">{fee.name}</p>
            <p className="text-sm text-muted-foreground">{fee.description}</p>
          </div>
        );
      },
    },
    {
      accessorKey: 'feeType',
      header: 'Type',
      cell: ({ row }) => {
        const feeType = row.original.feeType;
        const typeColors = {
          tuition: 'bg-blue-100 text-blue-800',
          transport: 'bg-green-100 text-green-800',
          library: 'bg-purple-100 text-purple-800',
          sports: 'bg-orange-100 text-orange-800',
          exam: 'bg-red-100 text-red-800',
          other: 'bg-gray-100 text-gray-800',
        };
        return (
          <Badge className={typeColors[feeType] || typeColors.other}>
            {feeType.charAt(0).toUpperCase() + feeType.slice(1)}
          </Badge>
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
            {row.original.lateFeeAmount && (
              <p className="text-xs text-muted-foreground">
                Late fee: ₹{row.original.lateFeeAmount}
              </p>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'class',
      header: 'Class',
      cell: ({ row }) => {
        const classId = row.original.classId;
        return (
          <Badge variant="secondary">
            {classId === 'all' ? 'All Classes' : `Class ${classId}`}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'dueDate',
      header: 'Due Date',
      cell: ({ row }) => {
        const dueDate = row.original.dueDate;
        return (
          <div>
            <p className="text-sm">{dueDate.toLocaleDateString()}</p>
            {row.original.lateFeeDays && (
              <p className="text-xs text-muted-foreground">
                Grace: {row.original.lateFeeDays} days
              </p>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'recurring',
      header: 'Recurring',
      cell: ({ row }) => {
        const fee = row.original;
        return (
          <div className="text-center">
            {fee.isRecurring ? (
              <Badge variant="default" className="text-xs">
                {fee.recurringInterval}
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-xs">
                One-time
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const isActive = row.original.isActive;
        return (
          <Badge variant={isActive ? 'default' : 'secondary'}>
            {isActive ? 'Active' : 'Inactive'}
          </Badge>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const feeStructure = row.original;

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
                  console.log('View fee structure:', feeStructure.id);
                }}
              >
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  console.log('Edit fee structure:', feeStructure.id);
                }}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit Structure
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  console.log('Assign to students:', feeStructure.id);
                }}
              >
                <BookOpen className="mr-2 h-4 w-4" />
                Assign to Students
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  console.log('Delete fee structure:', feeStructure.id);
                }}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Structure
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
          <h1 className="text-3xl font-bold tracking-tight">Fee Structures</h1>
          <p className="text-muted-foreground">
            Manage fee structures and assign them to students
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <BookOpen className="mr-2 h-4 w-4" />
            Assign Fees
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Fee Structure
          </Button>
        </div>
      </div>

      {/* Fee Structures Table */}
      <DataTable
        columns={columns}
        data={mockFeeStructures}
        searchKey="name"
        searchPlaceholder="Search fee structures..."
        showSearch={true}
        showColumnToggle={true}
        showPagination={true}
        showExport={true}
        onRowClick={(feeStructure) => {
          console.log('Row clicked:', feeStructure);
        }}
        onSelectionChange={(selectedFeeStructures) => {
          console.log('Selected fee structures:', selectedFeeStructures);
        }}
      />
    </div>
  );
}

