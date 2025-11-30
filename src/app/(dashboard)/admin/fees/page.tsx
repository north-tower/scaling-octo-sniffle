'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
import { MoreHorizontal, Eye, Edit, Trash2, Plus, BookOpen, Loader2, Search, AlertCircle } from 'lucide-react';
import { FeeStructure, CreateFeeStructureForm, BackendFeeStructure } from '@/lib/types';
import { feeStructuresApi } from '@/lib/api';
import { useApi } from '@/hooks/useApi';
import { useDebounce } from '@/hooks/useDebounce';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
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
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Transform backend fee structure data to frontend format
const transformFeeStructure = (backendFee: BackendFeeStructure): FeeStructure => {
  return {
    id: backendFee.id?.toString() || '',
    name: backendFee.name || `${backendFee.fee_type || ''} - Class ${backendFee.class || ''}`,
    description: backendFee.description || '',
    amount: parseFloat(backendFee.amount || 0),
    feeType: backendFee.fee_type || 'other',
    classId: backendFee.class?.toString() || '',
    academicYearId: backendFee.academic_year || '',
    dueDate: backendFee.due_date ? new Date(backendFee.due_date) : new Date(),
    lateFeeAmount: backendFee.late_fee_amount ? parseFloat(backendFee.late_fee_amount) : undefined,
    lateFeeDays: backendFee.late_fee_days,
    isRecurring: backendFee.is_recurring || false,
    recurringInterval: backendFee.recurring_interval,
    isActive: backendFee.is_active !== false,
    createdAt: backendFee.created_at ? new Date(backendFee.created_at) : new Date(),
    updatedAt: backendFee.updated_at ? new Date(backendFee.updated_at) : new Date(),
  };
};

export default function FeeStructuresPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null>(null);
  const [localSearch, setLocalSearch] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedFeeStructure, setSelectedFeeStructure] = useState<FeeStructure | null>(null);
  const [formData, setFormData] = useState<Partial<CreateFeeStructureForm>>({
    name: '',
    description: '',
    amount: 0,
    feeType: 'tuition',
    classId: '',
    academicYearId: '',
    dueDate: undefined,
    lateFeeAmount: 0,
    lateFeeDays: 0,
    isRecurring: false,
    recurringInterval: 'monthly',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

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
  ]);

  // Debounce search to avoid too many API calls
  const debouncedSearch = useDebounce(search, 500);

  // Fetch fee structures
  type FeeStructuresResponse = {
    feeStructures: BackendFeeStructure[];
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  } | {
    data: {
      feeStructures: BackendFeeStructure[];
      pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    };
  } | {
    data: BackendFeeStructure[];
  } | BackendFeeStructure[];

  const { loading, execute: fetchFeeStructures } = useApi<FeeStructuresResponse>(
    (params: { page?: number; limit?: number; search?: string }) => feeStructuresApi.getAll(params),
    {
      onSuccess: (response) => {
        // Handle different response structures
        let feeStructuresData: BackendFeeStructure[] = [];
        let paginationData: { page: number; limit: number; total: number; totalPages: number } | null = null;

        if (response && typeof response === 'object' && 'feeStructures' in response && Array.isArray(response.feeStructures)) {
          feeStructuresData = response.feeStructures;
          paginationData = response.pagination || null;
        } else if (response && typeof response === 'object' && 'data' in response) {
          if (Array.isArray(response.data)) {
            feeStructuresData = response.data;
          } else if (response.data && typeof response.data === 'object' && 'feeStructures' in response.data && Array.isArray(response.data.feeStructures)) {
            feeStructuresData = response.data.feeStructures;
            paginationData = response.data.pagination || null;
          } else if (response.data && typeof response.data === 'object' && 'data' in response.data && Array.isArray(response.data.data)) {
            feeStructuresData = response.data.data;
            paginationData = response.data.pagination || null;
          }
        } else if (Array.isArray(response)) {
          feeStructuresData = response;
        }

        if (feeStructuresData && feeStructuresData.length > 0) {
          const transformed = feeStructuresData.map(transformFeeStructure);
          setFeeStructures(transformed);
          if (paginationData) {
            setPagination(paginationData);
          }
        } else {
          setFeeStructures([]);
        }
      },
      onError: (error) => {
        console.error('Failed to fetch fee structures:', error);
        setFeeStructures([]);
      },
    }
  );

  // Fetch fee structures on mount and when params change
  useEffect(() => {
    fetchFeeStructures({ page, limit, search: debouncedSearch });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, debouncedSearch]);

  const handleSearch = (value: string) => {
    setLocalSearch(value);
    setSearch(value);
    setPage(1); // Reset to first page on new search
  };

  const handleDelete = useCallback(async (feeStructureId: string) => {
    if (confirm('Are you sure you want to delete this fee structure?')) {
      try {
        await feeStructuresApi.delete(feeStructureId);
        toast.success('Fee structure deleted successfully');
        // Refresh the list
        fetchFeeStructures({ page, limit, search: debouncedSearch });
      } catch (error) {
        console.error('Failed to delete fee structure:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to delete fee structure';
        toast.error(errorMessage);
      }
    }
  }, [fetchFeeStructures, page, limit, debouncedSearch]);

  // Handle form field changes
  const handleFieldChange = (field: keyof CreateFeeStructureForm, value: string | number | boolean | Date | undefined) => {
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

  // Handle create fee structure
  const handleCreate = async () => {
    // Validate required fields
    if (!formData.classId || !formData.academicYearId || !formData.dueDate || !formData.amount || formData.amount <= 0) {
      const errors: Record<string, string> = {};
      if (!formData.classId) errors.classId = 'Class is required';
      if (!formData.academicYearId) errors.academicYearId = 'Academic year is required';
      if (!formData.dueDate) errors.dueDate = 'Due date is required';
      if (!formData.amount || formData.amount <= 0) errors.amount = 'Amount must be greater than 0';
      setFormErrors(errors);
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    setFormErrors({});

    try {
      // Transform to backend format
      const backendData: {
        class: string;
        fee_type: string;
        amount: string;
        academic_year: string;
        due_date: string | Date;
        description: string | null;
        late_fee_amount: string | null;
        late_fee_days: number | null;
        is_recurring: boolean;
        recurring_interval: string | null;
        is_active: boolean;
      } = {
        class: formData.classId,
        fee_type: formData.feeType || 'tuition',
        amount: formData.amount?.toString() || '0',
        academic_year: formData.academicYearId,
        due_date: formData.dueDate?.toISOString().split('T')[0] || formData.dueDate,
        description: formData.description || null,
        late_fee_amount: formData.lateFeeAmount && formData.lateFeeAmount > 0 ? formData.lateFeeAmount.toString() : null,
        late_fee_days: formData.lateFeeDays || null,
        is_recurring: formData.isRecurring || false,
        recurring_interval: formData.isRecurring ? (formData.recurringInterval || 'monthly') : null,
        is_active: true,
      };

      const response = await feeStructuresApi.create(backendData);
      
      if (response.success) {
        toast.success('Fee structure created successfully');
        setIsAddDialogOpen(false);
        resetForm();
        fetchFeeStructures({ page, limit, search: debouncedSearch });
      }
    } catch (error) {
      const apiError = error as { details?: Record<string, string>; message?: string };
      if (apiError.details) {
        setFormErrors(apiError.details);
        toast.error(apiError.message || 'Failed to create fee structure');
      } else {
        toast.error(apiError.message || 'Failed to create fee structure');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Handle update fee structure
  const handleUpdate = async () => {
    if (!selectedFeeStructure) return;

    // Validate required fields
    if (!formData.classId || !formData.academicYearId || !formData.dueDate || !formData.amount || formData.amount <= 0) {
      const errors: Record<string, string> = {};
      if (!formData.classId) errors.classId = 'Class is required';
      if (!formData.academicYearId) errors.academicYearId = 'Academic year is required';
      if (!formData.dueDate) errors.dueDate = 'Due date is required';
      if (!formData.amount || formData.amount <= 0) errors.amount = 'Amount must be greater than 0';
      setFormErrors(errors);
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    setFormErrors({});

    try {
      // Transform to backend format
      const backendData: {
        class: string;
        fee_type: string;
        amount: string;
        academic_year: string;
        due_date: string | Date;
        description: string | null;
        late_fee_amount: string | null;
        late_fee_days: number | null;
        is_recurring: boolean;
        recurring_interval: string | null;
        is_active: boolean;
      } = {
        class: formData.classId,
        fee_type: formData.feeType || 'tuition',
        amount: formData.amount?.toString() || '0',
        academic_year: formData.academicYearId,
        due_date: formData.dueDate?.toISOString().split('T')[0] || formData.dueDate,
        description: formData.description || null,
        late_fee_amount: formData.lateFeeAmount && formData.lateFeeAmount > 0 ? formData.lateFeeAmount.toString() : null,
        late_fee_days: formData.lateFeeDays || null,
        is_recurring: formData.isRecurring || false,
        recurring_interval: formData.isRecurring ? (formData.recurringInterval || 'monthly') : null,
        is_active: formData.isActive !== undefined ? formData.isActive : true,
      };

      const response = await feeStructuresApi.update(selectedFeeStructure.id, backendData);
      
      if (response.success) {
        toast.success('Fee structure updated successfully');
        setIsEditDialogOpen(false);
        resetForm();
        setSelectedFeeStructure(null);
        fetchFeeStructures({ page, limit, search: debouncedSearch });
      }
    } catch (error) {
      const apiError = error as { details?: Record<string, string>; message?: string };
      if (apiError.details) {
        setFormErrors(apiError.details);
        toast.error(apiError.message || 'Failed to update fee structure');
      } else {
        toast.error(apiError.message || 'Failed to update fee structure');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      amount: 0,
      feeType: 'tuition',
      classId: '',
      academicYearId: '',
      dueDate: undefined,
      lateFeeAmount: 0,
      lateFeeDays: 0,
      isRecurring: false,
      recurringInterval: 'monthly',
    });
    setFormErrors({});
  };

  // Open add dialog
  const handleOpenAddDialog = () => {
    resetForm();
    setIsAddDialogOpen(true);
  };

  // Open edit dialog
  const handleOpenEditDialog = (feeStructure: FeeStructure) => {
    setSelectedFeeStructure(feeStructure);
    setFormData({
      name: feeStructure.name,
      description: feeStructure.description,
      amount: feeStructure.amount,
      feeType: feeStructure.feeType,
      classId: feeStructure.classId,
      academicYearId: feeStructure.academicYearId,
      dueDate: feeStructure.dueDate,
      lateFeeAmount: feeStructure.lateFeeAmount,
      lateFeeDays: feeStructure.lateFeeDays,
      isRecurring: feeStructure.isRecurring,
      recurringInterval: feeStructure.recurringInterval,
      isActive: feeStructure.isActive,
    });
    setFormErrors({});
    setIsEditDialogOpen(true);
  };

  // Open view dialog
  const handleOpenViewDialog = (feeStructure: FeeStructure) => {
    setSelectedFeeStructure(feeStructure);
    setIsViewDialogOpen(true);
  };

  // Open assign dialog
  const handleOpenAssignDialog = (feeStructure: FeeStructure) => {
    setSelectedFeeStructure(feeStructure);
    setIsAssignDialogOpen(true);
  };

  // Assign fee structure to students
  const [assignClass, setAssignClass] = useState('');
  const [assignStudentIds, setAssignStudentIds] = useState('');
  const [assigning, setAssigning] = useState(false);

  const handleAssign = async () => {
    if (!selectedFeeStructure) return;

    if (!assignClass && !assignStudentIds.trim()) {
      toast.error('Please select a class or enter student IDs');
      return;
    }

    setAssigning(true);

    try {
      const assignData: { class?: string; student_ids?: string[] } = {};
      
      if (assignClass) {
        assignData.class = assignClass;
      } else if (assignStudentIds.trim()) {
        const studentIds = assignStudentIds.split(',').map(id => id.trim()).filter(id => id);
        assignData.student_ids = studentIds;
      }

      const response = await feeStructuresApi.assignToStudents({
        id: selectedFeeStructure.id,
        ...assignData,
      });

      if (response.success) {
        toast.success(`Fee structure assigned to ${response.data?.totalAssigned || 0} students`);
        setIsAssignDialogOpen(false);
        setAssignClass('');
        setAssignStudentIds('');
        fetchFeeStructures({ page, limit, search: debouncedSearch });
      }
    } catch (error) {
      console.error('Failed to assign fee structure:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to assign fee structure';
      toast.error(errorMessage);
    } finally {
      setAssigning(false);
    }
  };
  const columns: ColumnDef<FeeStructure>[] = useMemo(() => [
    {
      accessorKey: 'name',
      header: 'Fee Structure',
      cell: ({ row }) => {
        const fee = row.original;
        const displayName = fee.name || `${fee.feeType.charAt(0).toUpperCase() + fee.feeType.slice(1)} - Class ${fee.classId}`;
        return (
          <div>
            <p className="font-medium">{displayName}</p>
            {fee.description && (
              <p className="text-sm text-muted-foreground">{fee.description}</p>
            )}
            {fee.academicYearId && (
              <p className="text-xs text-muted-foreground">Academic Year: {fee.academicYearId}</p>
            )}
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
            <p className="font-medium">KES {amount.toLocaleString()}</p>
            {row.original.lateFeeAmount && (
              <p className="text-xs text-muted-foreground">
                Late fee: KES {row.original.lateFeeAmount}
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
                onClick={() => handleOpenViewDialog(feeStructure)}
              >
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleOpenEditDialog(feeStructure)}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit Structure
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleOpenAssignDialog(feeStructure)}
              >
                <BookOpen className="mr-2 h-4 w-4" />
                Assign to Students
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleDelete(feeStructure.id)}
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
  ], [handleDelete]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fee Structures</h1>
          <p className="text-muted-foreground">
            Manage fee structures and assign them to students
            {pagination && (
              <span className="ml-2">
                ({pagination.total || feeStructures.length} total)
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push('/admin/fees/assign')}>
            <BookOpen className="mr-2 h-4 w-4" />
            View Assignments
          </Button>
          <Button variant="outline" onClick={() => router.push('/admin/fees/outstanding')}>
            <AlertCircle className="mr-2 h-4 w-4" />
            Outstanding Fees
          </Button>
          <Button onClick={handleOpenAddDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Add Fee Structure
          </Button>
        </div>
      </div>

      {/* Search Input */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search fee structures..."
            value={localSearch}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        {loading && (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Fee Structures Table */}
      <DataTable
        columns={columns}
        data={feeStructures}
        searchKey="name"
        searchPlaceholder="Filter in current page..."
        showSearch={false}
        showColumnToggle={true}
        showPagination={false}
        showExport={true}
        loading={loading}
        onRowClick={(feeStructure) => {
          console.log('Row clicked:', feeStructure);
        }}
        onSelectionChange={(selectedFeeStructures) => {
          console.log('Selected fee structures:', selectedFeeStructures);
        }}
      />

      {/* Server-side Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, pagination.total)} of {pagination.total} fee structures
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

      {/* Add Fee Structure Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Fee Structure</DialogTitle>
            <DialogDescription>
              Create a new fee structure. Fields marked with * are required.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                name="feeType"
                label="Fee Type"
                type="select"
                placeholder="Select fee type"
                required
                value={formData.feeType}
                onChange={(value) => handleFieldChange('feeType', value)}
                options={[
                  { label: 'Tuition', value: 'tuition' },
                  { label: 'Transport', value: 'transport' },
                  { label: 'Library', value: 'library' },
                  { label: 'Exam', value: 'exam' },
                  { label: 'Sports', value: 'sports' },
                  { label: 'Lab', value: 'lab' },
                  { label: 'Other', value: 'other' },
                ]}
                error={formErrors.feeType}
              />
              <FormField
                name="classId"
                label="Class"
                type="select"
                placeholder="Select class"
                required
                value={formData.classId || undefined}
                onChange={(value) => handleFieldChange('classId', value)}
                options={classes.map((cls) => ({ label: cls.name, value: cls.id }))}
                error={formErrors.classId}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                name="academicYearId"
                label="Academic Year"
                type="select"
                placeholder="Select academic year"
                required
                value={formData.academicYearId || undefined}
                onChange={(value) => handleFieldChange('academicYearId', value)}
                options={academicYears.map((year) => ({ label: year, value: year }))}
                error={formErrors.academicYearId}
              />
              <FormField
                name="amount"
                label="Amount (KES)"
                type="number"
                placeholder="Enter amount"
                required
                value={formData.amount?.toString()}
                onChange={(value) => handleFieldChange('amount', parseFloat(value) || 0)}
                error={formErrors.amount}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                name="dueDate"
                label="Due Date"
                type="date"
                placeholder="Select due date"
                required
                value={formData.dueDate}
                onChange={(value) => handleFieldChange('dueDate', value)}
                error={formErrors.dueDate}
              />
              <FormField
                name="lateFeeAmount"
                label="Late Fee Amount (KES)"
                type="number"
                placeholder="Enter late fee amount"
                value={formData.lateFeeAmount?.toString()}
                onChange={(value) => handleFieldChange('lateFeeAmount', parseFloat(value) || 0)}
                error={formErrors.lateFeeAmount}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                name="lateFeeDays"
                label="Late Fee Days (Grace Period)"
                type="number"
                placeholder="Enter grace period in days"
                value={formData.lateFeeDays?.toString()}
                onChange={(value) => handleFieldChange('lateFeeDays', parseInt(value) || 0)}
                error={formErrors.lateFeeDays}
              />
              <div className="space-y-2">
                <Label>Recurring Fee</Label>
                <FormField
                  name="isRecurring"
                  label="Is Recurring"
                  type="switch"
                  value={formData.isRecurring}
                  onChange={(value) => handleFieldChange('isRecurring', value)}
                />
              </div>
            </div>

            {formData.isRecurring && (
              <FormField
                name="recurringInterval"
                label="Recurring Interval"
                type="select"
                placeholder="Select interval"
                value={formData.recurringInterval || undefined}
                onChange={(value) => handleFieldChange('recurringInterval', value)}
                options={[
                  { label: 'Monthly', value: 'monthly' },
                  { label: 'Quarterly', value: 'quarterly' },
                  { label: 'Yearly', value: 'yearly' },
                ]}
                error={formErrors.recurringInterval}
              />
            )}

            <FormField
              name="description"
              label="Description"
              type="textarea"
              placeholder="Enter description (optional)"
              value={formData.description}
              onChange={(value) => handleFieldChange('description', value)}
              error={formErrors.description}
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddDialogOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Fee Structure
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Fee Structure Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Fee Structure</DialogTitle>
            <DialogDescription>
              Update the fee structure information. Fields marked with * are required.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                name="feeType"
                label="Fee Type"
                type="select"
                placeholder="Select fee type"
                required
                value={formData.feeType}
                onChange={(value) => handleFieldChange('feeType', value)}
                options={[
                  { label: 'Tuition', value: 'tuition' },
                  { label: 'Transport', value: 'transport' },
                  { label: 'Library', value: 'library' },
                  { label: 'Exam', value: 'exam' },
                  { label: 'Sports', value: 'sports' },
                  { label: 'Lab', value: 'lab' },
                  { label: 'Other', value: 'other' },
                ]}
                error={formErrors.feeType}
              />
              <FormField
                name="classId"
                label="Class"
                type="select"
                placeholder="Select class"
                required
                value={formData.classId || undefined}
                onChange={(value) => handleFieldChange('classId', value)}
                options={classes.map((cls) => ({ label: cls.name, value: cls.id }))}
                error={formErrors.classId}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                name="academicYearId"
                label="Academic Year"
                type="select"
                placeholder="Select academic year"
                required
                value={formData.academicYearId || undefined}
                onChange={(value) => handleFieldChange('academicYearId', value)}
                options={academicYears.map((year) => ({ label: year, value: year }))}
                error={formErrors.academicYearId}
              />
              <FormField
                name="amount"
                label="Amount (KES)"
                type="number"
                placeholder="Enter amount"
                required
                value={formData.amount?.toString()}
                onChange={(value) => handleFieldChange('amount', parseFloat(value) || 0)}
                error={formErrors.amount}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                name="dueDate"
                label="Due Date"
                type="date"
                placeholder="Select due date"
                required
                value={formData.dueDate}
                onChange={(value) => handleFieldChange('dueDate', value)}
                error={formErrors.dueDate}
              />
              <FormField
                name="lateFeeAmount"
                label="Late Fee Amount (KES)"
                type="number"
                placeholder="Enter late fee amount"
                value={formData.lateFeeAmount?.toString()}
                onChange={(value) => handleFieldChange('lateFeeAmount', parseFloat(value) || 0)}
                error={formErrors.lateFeeAmount}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                name="lateFeeDays"
                label="Late Fee Days (Grace Period)"
                type="number"
                placeholder="Enter grace period in days"
                value={formData.lateFeeDays?.toString()}
                onChange={(value) => handleFieldChange('lateFeeDays', parseInt(value) || 0)}
                error={formErrors.lateFeeDays}
              />
              <div className="space-y-2">
                <Label>Recurring Fee</Label>
                <FormField
                  name="isRecurring"
                  label="Is Recurring"
                  type="switch"
                  value={formData.isRecurring}
                  onChange={(value) => handleFieldChange('isRecurring', value)}
                />
              </div>
            </div>

            {formData.isRecurring && (
              <FormField
                name="recurringInterval"
                label="Recurring Interval"
                type="select"
                placeholder="Select interval"
                value={formData.recurringInterval || undefined}
                onChange={(value) => handleFieldChange('recurringInterval', value)}
                options={[
                  { label: 'Monthly', value: 'monthly' },
                  { label: 'Quarterly', value: 'quarterly' },
                  { label: 'Yearly', value: 'yearly' },
                ]}
                error={formErrors.recurringInterval}
              />
            )}

            <FormField
              name="description"
              label="Description"
              type="textarea"
              placeholder="Enter description (optional)"
              value={formData.description}
              onChange={(value) => handleFieldChange('description', value)}
              error={formErrors.description}
            />

            <div className="space-y-2">
              <Label>Status</Label>
              <FormField
                name="isActive"
                label="Active"
                type="switch"
                value={formData.isActive !== false}
                onChange={(value) => handleFieldChange('isActive', value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Edit className="mr-2 h-4 w-4" />
                  Update Fee Structure
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Fee Structure Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Fee Structure Details</DialogTitle>
            <DialogDescription>
              View detailed information about the fee structure
            </DialogDescription>
          </DialogHeader>

          {selectedFeeStructure && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Fee Type</Label>
                  <p className="font-medium capitalize">{selectedFeeStructure.feeType}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Class</Label>
                  <p className="font-medium">Class {selectedFeeStructure.classId}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Academic Year</Label>
                  <p className="font-medium">{selectedFeeStructure.academicYearId}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Amount</Label>
                  <p className="font-medium">KES {selectedFeeStructure.amount.toLocaleString()}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Due Date</Label>
                  <p className="font-medium">{selectedFeeStructure.dueDate.toLocaleDateString()}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <Badge variant={selectedFeeStructure.isActive ? 'default' : 'secondary'}>
                    {selectedFeeStructure.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>

              {selectedFeeStructure.lateFeeAmount && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Late Fee Amount</Label>
                    <p className="font-medium">KES {selectedFeeStructure.lateFeeAmount.toLocaleString()}</p>
                  </div>
                  {selectedFeeStructure.lateFeeDays && (
                    <div>
                      <Label className="text-muted-foreground">Grace Period</Label>
                      <p className="font-medium">{selectedFeeStructure.lateFeeDays} days</p>
                    </div>
                  )}
                </div>
              )}

              <div>
                <Label className="text-muted-foreground">Recurring</Label>
                <p className="font-medium">
                  {selectedFeeStructure.isRecurring 
                    ? `${selectedFeeStructure.recurringInterval || 'N/A'}` 
                    : 'One-time'}
                </p>
              </div>

              {selectedFeeStructure.description && (
                <div>
                  <Label className="text-muted-foreground">Description</Label>
                  <p className="font-medium">{selectedFeeStructure.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Created At</Label>
                  <p className="font-medium">{selectedFeeStructure.createdAt.toLocaleDateString()}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Updated At</Label>
                  <p className="font-medium">{selectedFeeStructure.updatedAt.toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
            {selectedFeeStructure && (
              <Button onClick={() => {
                setIsViewDialogOpen(false);
                handleOpenEditDialog(selectedFeeStructure);
              }}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Fee Structure Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Assign Fee Structure to Students</DialogTitle>
            <DialogDescription>
              Assign this fee structure to students by class or individual selection
            </DialogDescription>
          </DialogHeader>

          {selectedFeeStructure && (
            <div className="space-y-4 py-4">
              <div className="rounded-lg border p-4 bg-muted/50">
                <p className="text-sm font-medium mb-2">Fee Structure:</p>
                <p className="text-sm">
                  {selectedFeeStructure.feeType.charAt(0).toUpperCase() + selectedFeeStructure.feeType.slice(1)} - 
                  Class {selectedFeeStructure.classId} - 
                  KES {selectedFeeStructure.amount.toLocaleString()}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Assign to Class</Label>
                <FormField
                  name="assignClass"
                  label="Class"
                  type="select"
                  placeholder="Select class"
                  value={assignClass || undefined}
                  onChange={(value) => {
                    setAssignClass(value);
                    if (value) setAssignStudentIds(''); // Clear student IDs if class is selected
                  }}
                  options={classes.map((cls) => ({ label: cls.name, value: cls.id }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Or Assign to Specific Students</Label>
                <Textarea
                  placeholder="Enter student IDs separated by commas (e.g., 1,2,3)"
                  className="min-h-[100px]"
                  value={assignStudentIds}
                  onChange={(e) => {
                    setAssignStudentIds(e.target.value);
                    if (e.target.value.trim()) setAssignClass(''); // Clear class if student IDs are entered
                  }}
                />
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Note</AlertTitle>
                <AlertDescription>
                  You can assign this fee structure to all students in a class or to specific students by their IDs.
                </AlertDescription>
              </Alert>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAssignDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleAssign} disabled={assigning}>
              {assigning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Assigning...
                </>
              ) : (
                <>
                  <BookOpen className="mr-2 h-4 w-4" />
                  Assign to Students
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

