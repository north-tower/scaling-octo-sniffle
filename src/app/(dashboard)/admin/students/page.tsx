'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
import { MoreHorizontal, Eye, Edit, Trash2, Plus, Loader2, Search, Upload } from 'lucide-react';
import { Student, CreateStudentForm, BackendStudent } from '@/lib/types';
import { studentsApi } from '@/lib/api';
import { useApi } from '@/hooks/useApi';
import { useRouter } from 'next/navigation';
import { useDebounce } from '@/hooks/useDebounce';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FormField } from '@/components/forms/FormField';
import { createStudentSchema } from '@/lib/validations';

// Transform backend student data to frontend format
const transformStudent = (backendStudent: BackendStudent | Record<string, unknown>): Student => {
  return {
    id: backendStudent.id?.toString() || '',
    studentId: backendStudent.student_id || backendStudent.studentId || '',
    firstName: backendStudent.first_name || backendStudent.firstName || '',
    lastName: backendStudent.last_name || backendStudent.lastName || '',
    dateOfBirth: backendStudent.date_of_birth || backendStudent.dateOfBirth 
      ? new Date(backendStudent.date_of_birth || backendStudent.dateOfBirth) 
      : new Date(),
    gender: backendStudent.gender || 'male',
    bloodGroup: backendStudent.blood_group || backendStudent.bloodGroup,
    address: backendStudent.address || '',
    phone: backendStudent.phone || '',
    email: backendStudent.email,
    emergencyContact: backendStudent.emergency_contact || backendStudent.emergencyContact || '',
    emergencyPhone: backendStudent.emergency_phone || backendStudent.emergencyPhone || '',
    classId: backendStudent.class_id || backendStudent.classId || backendStudent.class?.toString() || '',
    admissionDate: backendStudent.admission_date || backendStudent.admissionDate 
      ? new Date(backendStudent.admission_date || backendStudent.admissionDate) 
      : new Date(),
    isActive: backendStudent.status === 'active' || backendStudent.isActive === true,
    avatar: backendStudent.avatar,
    createdAt: backendStudent.created_at || backendStudent.createdAt 
      ? new Date(backendStudent.created_at || backendStudent.createdAt) 
      : new Date(),
    updatedAt: backendStudent.updated_at || backendStudent.updatedAt 
      ? new Date(backendStudent.updated_at || backendStudent.updatedAt) 
      : new Date(),
  };
};

export default function StudentsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null>(null);
  const [studentBalances, setStudentBalances] = useState<Record<string, number>>({});
  const [localSearch, setLocalSearch] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  // Hardcoded classes data
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
  const [formData, setFormData] = useState<Partial<CreateStudentForm> & { section?: string; rollNumber?: string }>({
    studentId: '',
    firstName: '',
    lastName: '',
    dateOfBirth: undefined,
    gender: 'male',
    bloodGroup: '',
    address: '',
    phone: '',
    email: '',
    emergencyContact: '',
    emergencyPhone: '',
    classId: '',
    section: '',
    rollNumber: '',
    admissionDate: undefined,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Debounce search to avoid too many API calls
  const debouncedSearch = useDebounce(search, 500);

  // Fetch students
  type StudentsResponse = {
    students: BackendStudent[];
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  } | {
    data: {
      students: BackendStudent[];
      pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    };
  } | {
    data: BackendStudent[];
  } | {
    data: {
      data: BackendStudent[];
      pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    };
  } | BackendStudent[];

  const { loading, execute: fetchStudents } = useApi<StudentsResponse>(
    (params: { page?: number; limit?: number; search?: string }) => studentsApi.getAll(params),
    {
      onSuccess: (response) => {
        // Handle different response structures
        let studentsData: BackendStudent[] = [];
        let paginationData: { page: number; limit: number; total: number; totalPages: number } | null = null;

        if (response && typeof response === 'object' && 'students' in response && Array.isArray(response.students)) {
          studentsData = response.students;
          paginationData = response.pagination || null;
        } else if (response && typeof response === 'object' && 'data' in response) {
          if (Array.isArray(response.data)) {
            studentsData = response.data;
          } else if (response.data && typeof response.data === 'object' && 'students' in response.data && Array.isArray(response.data.students)) {
            studentsData = response.data.students;
            paginationData = response.data.pagination || null;
          } else if (response.data && typeof response.data === 'object' && 'data' in response.data && Array.isArray(response.data.data)) {
            studentsData = response.data.data;
            paginationData = response.data.pagination || null;
          }
        } else if (Array.isArray(response)) {
          studentsData = response;
        }

        if (studentsData && studentsData.length > 0) {
          const transformed = studentsData.map(transformStudent);
          setStudents(transformed);
          if (paginationData) {
            setPagination(paginationData);
          }
          
          // Try to extract balances from student data if available
          const balances: Record<string, number> = {};
          studentsData.forEach((student) => {
            if (student && typeof student === 'object' && 'id' in student) {
              // Check for balance in various possible fields
              const balance = ('balance' in student && typeof student.balance === 'number' ? student.balance : 0) ||
                             ('outstanding_balance' in student && typeof student.outstanding_balance === 'number' ? student.outstanding_balance : 0) ||
                             ('outstandingBalance' in student && typeof student.outstandingBalance === 'number' ? student.outstandingBalance : 0) ||
                             ('total_balance' in student && typeof student.total_balance === 'number' ? student.total_balance : 0) ||
                             ('totalBalance' in student && typeof student.totalBalance === 'number' ? student.totalBalance : 0) ||
                             0;
              balances[String(student.id)] = balance;
            }
          });
          if (Object.keys(balances).length > 0) {
            setStudentBalances(balances);
          }
        } else {
          setStudents([]);
        }
      },
      onError: (error) => {
        console.error('Failed to fetch students:', error);
        setStudents([]);
      },
    }
  );

  // Fetch students on mount and when params change
  useEffect(() => {
    fetchStudents({ page, limit, search: debouncedSearch });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, debouncedSearch]);

  const handleSearch = (value: string) => {
    setLocalSearch(value);
    setSearch(value);
    setPage(1); // Reset to first page on new search
  };

  const handleDelete = useCallback(async (studentId: string) => {
    if (confirm('Are you sure you want to delete this student?')) {
      try {
        await studentsApi.delete(studentId);
        toast.success('Student deleted successfully');
        // Refresh the list
        fetchStudents({ page, limit, search: debouncedSearch });
      } catch (error) {
        console.error('Failed to delete student:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to delete student';
        toast.error(errorMessage);
      }
    }
  }, [page, limit, debouncedSearch, fetchStudents]);

  // Handle form field changes
  const handleFieldChange = (field: keyof CreateStudentForm | 'section' | 'rollNumber', value: string | number | boolean | Date | undefined) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Handle form submission
  const [submitting, setSubmitting] = useState(false);

  const handleAddStudent = async () => {
    // Validate form - check required fields manually since we have extra fields
    const formDataWithExtras = formData as Partial<CreateStudentForm> & { section?: string; rollNumber?: string };
    if (!formDataWithExtras.section || !formDataWithExtras.rollNumber) {
      const errors: Record<string, string> = {};
      if (!formDataWithExtras.section) errors.section = 'Section is required';
      if (!formDataWithExtras.rollNumber) errors.rollNumber = 'Roll number is required';
      setFormErrors(errors);
      toast.error('Please fill in all required fields');
      return;
    }

    // Validate form
    try {
      const validatedData = createStudentSchema.parse(formData);
      setSubmitting(true);
      setFormErrors({});

      // Transform to backend format (snake_case)
      // Clean phone numbers - remove any non-digit characters, remove leading zeros, ensure it starts with 1-9
      // Backend regex: /^[\+]?[1-9][\d]{0,15}$/ - must start with 1-9, not 0
      const cleanPhone = validatedData.phone.replace(/\D/g, '').replace(/^0+/, '');
      const cleanEmergencyPhone = validatedData.emergencyPhone.replace(/\D/g, '').replace(/^0+/, '');
      
      // Ensure phone numbers start with 1-9 (not 0)
      if (cleanPhone && !/^[1-9]/.test(cleanPhone)) {
        setFormErrors({ phone: 'Phone number must start with 1-9 (not 0)' });
        setSubmitting(false);
        return;
      }
      if (cleanEmergencyPhone && !/^[1-9]/.test(cleanEmergencyPhone)) {
        setFormErrors({ emergencyPhone: 'Emergency phone number must start with 1-9 (not 0)' });
        setSubmitting(false);
        return;
      }
      
      const backendData: {
        student_id: string;
        first_name: string;
        last_name: string;
        date_of_birth: string | Date | undefined;
        gender: string;
        blood_group: string | null;
        address: string;
        phone: string;
        email: string | null;
        emergency_contact: string;
        emergency_phone: string;
        class: string;
        section: string;
        roll_number: string;
        admission_date: string | Date | undefined;
        parent_id?: number;
      } = {
        student_id: validatedData.studentId,
        first_name: validatedData.firstName,
        last_name: validatedData.lastName,
        date_of_birth: validatedData.dateOfBirth?.toISOString().split('T')[0] || validatedData.dateOfBirth,
        gender: validatedData.gender,
        blood_group: validatedData.bloodGroup || null,
        address: validatedData.address,
        phone: cleanPhone,
        email: validatedData.email || null,
        emergency_contact: validatedData.emergencyContact,
        emergency_phone: cleanEmergencyPhone,
        class: validatedData.classId, // Backend expects 'class' not 'class_id'
        section: formDataWithExtras.section || 'A', // Default to 'A' if not provided
        roll_number: formDataWithExtras.rollNumber || '',
        admission_date: validatedData.admissionDate?.toISOString().split('T')[0] || validatedData.admissionDate,
      };
      
      // Only include parent_id if it's provided and valid
      if (validatedData.parentId && validatedData.parentId.trim() !== '') {
        const parentIdNum = parseInt(validatedData.parentId);
        if (!isNaN(parentIdNum) && parentIdNum > 0) {
          backendData.parent_id = parentIdNum;
        }
      }

      const response = await studentsApi.create(backendData);
      
      if (response.success) {
        toast.success('Student added successfully');
        setIsAddDialogOpen(false);
        // Reset form
    setFormData({
      studentId: '',
      firstName: '',
      lastName: '',
      dateOfBirth: undefined,
      gender: 'male',
      bloodGroup: '',
      address: '',
      phone: '',
      email: '',
      emergencyContact: '',
      emergencyPhone: '',
      classId: '',
      section: 'A',
      rollNumber: '',
      admissionDate: undefined,
    });
        setFormErrors({});
        // Refresh the list
        fetchStudents({ page, limit, search: debouncedSearch });
      }
    } catch (error) {
      if (error && typeof error === 'object' && 'errors' in error && Array.isArray(error.errors)) {
        // Zod validation errors
        const errors: Record<string, string> = {};
        (error.errors as Array<{ path: (string | number)[]; message: string }>).forEach((err) => {
          if (err.path && err.path[0] !== undefined) {
            errors[String(err.path[0])] = err.message;
          }
        });
        setFormErrors(errors);
        toast.error('Please fix the form errors');
      } else if (error && typeof error === 'object' && 'details' in error) {
        // API validation errors
        const details = error.details as Record<string, string>;
        setFormErrors(details);
        const errorMessage = 'message' in error && typeof error.message === 'string' ? error.message : 'Failed to create student';
        toast.error(errorMessage);
      } else {
        const errorMessage = error instanceof Error ? error.message : 'Failed to create student';
        toast.error(errorMessage);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenAddDialog = () => {
    setIsAddDialogOpen(true);
    setFormErrors({});
  };

  const handleCloseAddDialog = () => {
    setIsAddDialogOpen(false);
    setFormData({
      studentId: '',
      firstName: '',
      lastName: '',
      dateOfBirth: undefined,
      gender: 'male',
      bloodGroup: '',
      address: '',
      phone: '',
      email: '',
      emergencyContact: '',
      emergencyPhone: '',
      classId: '',
      admissionDate: undefined,
    });
    setFormErrors({});
  };
  const columns: ColumnDef<Student>[] = useMemo(() => [
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
                {student.firstName?.[0] || ''}{student.lastName?.[0] || ''}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{student.firstName} {student.lastName}</p>
              <p className="text-sm text-muted-foreground">{student.studentId || 'N/A'}</p>
            </div>
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
            {classId ? `Class ${classId}` : 'N/A'}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'contact',
      header: 'Contact',
      cell: ({ row }) => {
        const student = row.original;
        return (
          <div>
            <p className="text-sm">{student.phone || 'N/A'}</p>
            {student.email && (
              <p className="text-sm text-muted-foreground">{student.email}</p>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'balance',
      header: 'Balance',
      cell: ({ row }) => {
        const balance = studentBalances[row.original.id] || 0;
        return (
          <div className="text-right">
            <p className={`font-medium ${balance > 0 ? 'text-destructive' : 'text-green-600'}`}>
              KES {balance.toLocaleString()}
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
                onClick={() => handleDelete(student.id)}
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
  ], [studentBalances, handleDelete]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Students</h1>
          <p className="text-muted-foreground">
            Manage student records and information
            {pagination && (
              <span className="ml-2">
                ({pagination.total || students.length} total)
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push('/admin/students/import')}>
            <Upload className="mr-2 h-4 w-4" />
            Import CSV
          </Button>
          <Button onClick={handleOpenAddDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Add Student
          </Button>
        </div>
      </div>

      {/* Search Input */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search students by name, ID, email, or phone..."
            value={localSearch}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        {loading && (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Students Table */}
      <DataTable
        columns={columns}
        data={students}
        searchKey="firstName"
        searchPlaceholder="Filter in current page..."
        showSearch={false}
        showColumnToggle={true}
        showPagination={false}
        showExport={true}
        loading={loading}
        onRowClick={(student: Student) => {
          console.log('Row clicked:', student);
        }}
        onSelectionChange={(selectedStudents: Student[]) => {
          console.log('Selected students:', selectedStudents);
        }}
      />

      {/* Server-side Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, pagination.total)} of {pagination.total} students
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(1)}
              disabled={page === 1 || loading}
            >
              First
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={page === 1 || loading}
            >
              Previous
            </Button>
            <span className="text-sm">
              Page {page} of {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={page >= pagination.totalPages || loading}
            >
              Next
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(pagination.totalPages)}
              disabled={page >= pagination.totalPages || loading}
            >
              Last
            </Button>
          </div>
        </div>
      )}

      {/* Add Student Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Student</DialogTitle>
            <DialogDescription>
              Fill in the student information below. Fields marked with * are required.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                name="studentId"
                label="Student ID"
                type="text"
                placeholder="Enter student ID"
                required
                value={formData.studentId}
                onChange={(value) => handleFieldChange('studentId', value)}
                error={formErrors.studentId}
              />
              <FormField
                name="classId"
                label="Class"
                type="select"
                placeholder="Select class"
                required
                value={formData.classId}
                onChange={(value) => handleFieldChange('classId', value)}
                options={classes.map((cls) => ({ label: cls.name, value: cls.id }))}
                error={formErrors.classId}
              />
              <FormField
                name="section"
                label="Section"
                type="select"
                placeholder="Select section"
                required
                value={formData.section}
                onChange={(value) => handleFieldChange('section', value)}
                options={[
                  { label: 'A', value: 'A' },
                  { label: 'B', value: 'B' },
                  { label: 'C', value: 'C' },
                  { label: 'D', value: 'D' },
                  { label: 'E', value: 'E' },
                ]}
                error={formErrors.section}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                name="rollNumber"
                label="Roll Number"
                type="text"
                placeholder="Enter roll number"
                required
                value={formData.rollNumber}
                onChange={(value) => handleFieldChange('rollNumber', value)}
                error={formErrors.rollNumber}
              />
              <FormField
                name="firstName"
                label="First Name"
                type="text"
                placeholder="Enter first name"
                required
                value={formData.firstName}
                onChange={(value) => handleFieldChange('firstName', value)}
                error={formErrors.firstName}
              />
              <FormField
                name="lastName"
                label="Last Name"
                type="text"
                placeholder="Enter last name"
                required
                value={formData.lastName}
                onChange={(value) => handleFieldChange('lastName', value)}
                error={formErrors.lastName}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                name="dateOfBirth"
                label="Date of Birth"
                type="date"
                placeholder="Select date of birth"
                required
                value={formData.dateOfBirth}
                onChange={(value) => handleFieldChange('dateOfBirth', value)}
                error={formErrors.dateOfBirth}
              />
              <FormField
                name="gender"
                label="Gender"
                type="select"
                placeholder="Select gender"
                required
                value={formData.gender}
                onChange={(value) => handleFieldChange('gender', value)}
                options={[
                  { label: 'Male', value: 'male' },
                  { label: 'Female', value: 'female' },
                  { label: 'Other', value: 'other' },
                ]}
                error={formErrors.gender}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                name="bloodGroup"
                label="Blood Group"
                type="text"
                placeholder="e.g., A+, B-, O+"
                value={formData.bloodGroup}
                onChange={(value) => handleFieldChange('bloodGroup', value)}
                error={formErrors.bloodGroup}
              />
              <FormField
                name="admissionDate"
                label="Admission Date"
                type="date"
                placeholder="Select admission date"
                required
                value={formData.admissionDate}
                onChange={(value) => handleFieldChange('admissionDate', value)}
                error={formErrors.admissionDate}
              />
            </div>

            <FormField
              name="address"
              label="Address"
              type="textarea"
              placeholder="Enter address"
              required
              value={formData.address}
              onChange={(value) => handleFieldChange('address', value)}
              error={formErrors.address}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                name="phone"
                label="Phone Number"
                type="tel"
                placeholder="Enter phone number (must start with 1-9)"
                required
                value={formData.phone}
                onChange={(value) => handleFieldChange('phone', value)}
                error={formErrors.phone}
                helperText="Phone number should start with 1-9 (leading zeros will be removed)"
              />
              <FormField
                name="email"
                label="Email"
                type="email"
                placeholder="Enter email (optional)"
                value={formData.email}
                onChange={(value) => handleFieldChange('email', value)}
                error={formErrors.email}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                name="emergencyContact"
                label="Emergency Contact Name"
                type="text"
                placeholder="Enter emergency contact name"
                required
                value={formData.emergencyContact}
                onChange={(value) => handleFieldChange('emergencyContact', value)}
                error={formErrors.emergencyContact}
              />
              <FormField
                name="emergencyPhone"
                label="Emergency Phone"
                type="tel"
                placeholder="Enter emergency phone (must start with 1-9)"
                required
                value={formData.emergencyPhone}
                onChange={(value) => handleFieldChange('emergencyPhone', value)}
                error={formErrors.emergencyPhone}
                helperText="Phone number should start with 1-9 (leading zeros will be removed)"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCloseAddDialog}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button onClick={handleAddStudent} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Student
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

