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
import { MoreHorizontal, Eye, Edit, Trash2, User, Plus } from 'lucide-react';
import { Student } from '@/lib/types';

// Mock data - in real app, this would come from API
const mockStudents: Student[] = [
  {
    id: '1',
    studentId: 'STU2024001',
    firstName: 'John',
    lastName: 'Doe',
    dateOfBirth: new Date('2010-05-15'),
    gender: 'male',
    address: '123 Main St, City',
    phone: '9876543210',
    email: 'john.doe@email.com',
    emergencyContact: 'Jane Doe',
    emergencyPhone: '9876543211',
    classId: '1',
    admissionDate: new Date('2024-01-01'),
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: '2',
    studentId: 'STU2024002',
    firstName: 'Jane',
    lastName: 'Smith',
    dateOfBirth: new Date('2011-03-20'),
    gender: 'female',
    address: '456 Oak Ave, City',
    phone: '9876543212',
    email: 'jane.smith@email.com',
    emergencyContact: 'John Smith',
    emergencyPhone: '9876543213',
    classId: '2',
    admissionDate: new Date('2024-01-02'),
    isActive: true,
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
  },
  {
    id: '3',
    studentId: 'STU2024003',
    firstName: 'Mike',
    lastName: 'Johnson',
    dateOfBirth: new Date('2009-12-10'),
    gender: 'male',
    address: '789 Pine Rd, City',
    phone: '9876543214',
    email: 'mike.johnson@email.com',
    emergencyContact: 'Sarah Johnson',
    emergencyPhone: '9876543215',
    classId: '3',
    admissionDate: new Date('2024-01-03'),
    isActive: true,
    createdAt: new Date('2024-01-03'),
    updatedAt: new Date('2024-01-03'),
  },
];

export default function StudentsPage() {
  const columns: ColumnDef<Student>[] = [
    {
      accessorKey: 'student',
      header: 'Student',
      cell: ({ row }) => {
        const student = row.original;
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={student.avatar} />
              <AvatarFallback>
                {student.firstName[0]}{student.lastName[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{student.firstName} {student.lastName}</p>
              <p className="text-sm text-muted-foreground">{student.studentId}</p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'class',
      header: 'Class',
      cell: ({ row }) => {
        // In real app, this would come from the class relationship
        return <Badge variant="secondary">Class {row.original.classId}</Badge>;
      },
    },
    {
      accessorKey: 'contact',
      header: 'Contact',
      cell: ({ row }) => {
        const student = row.original;
        return (
          <div>
            <p className="text-sm">{student.phone}</p>
            <p className="text-sm text-muted-foreground">{student.email}</p>
          </div>
        );
      },
    },
    {
      accessorKey: 'balance',
      header: 'Balance',
      cell: ({ row }) => {
        // Mock balance - in real app, this would be calculated
        const balance = Math.floor(Math.random() * 10000);
        return (
          <div className="text-right">
            <p className={`font-medium ${balance > 0 ? 'text-destructive' : 'text-green-600'}`}>
              ₹{balance.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">
              {balance > 0 ? 'Outstanding' : 'Paid'}
            </p>
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
        const student = row.original;

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
                  // Navigate to student details
                  console.log('View student:', student.id);
                }}
              >
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  // Navigate to edit student
                  console.log('Edit student:', student.id);
                }}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit Student
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  // Delete student
                  console.log('Delete student:', student.id);
                }}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Student
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
          <h1 className="text-3xl font-bold tracking-tight">Students</h1>
          <p className="text-muted-foreground">
            Manage student records and information
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Student
        </Button>
      </div>

      {/* Students Table */}
      <DataTable
        columns={columns}
        data={mockStudents}
        searchKey="firstName"
        searchPlaceholder="Search students..."
        showSearch={true}
        showColumnToggle={true}
        showPagination={true}
        showExport={true}
        onRowClick={(student) => {
          console.log('Row clicked:', student);
        }}
        onSelectionChange={(selectedStudents) => {
          console.log('Selected students:', selectedStudents);
        }}
      />
    </div>
  );
}

