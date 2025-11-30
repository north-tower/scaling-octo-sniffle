'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/tables/DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Plus, BookOpen, Loader2, Search, ArrowLeft, Shield } from 'lucide-react';
import { feeStructuresApi } from '@/lib/api';
import { useApi } from '@/hooks/useApi';
import { useDebounce } from '@/hooks/useDebounce';
import { BackendFeeStructure } from '@/lib/types';
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

interface FeeAssignment {
  id: string;
  student: {
    id: string;
    student_id: string;
    first_name: string;
    last_name: string;
    class: string;
    section: string;
    roll_number: string;
  };
  feeStructure: {
    id: string;
    class: string;
    fee_type: string;
    amount: string;
    academic_year: string;
    due_date: string;
  };
  status: string;
  created_at: string;
  waived_reason?: string;
  waived_date?: string;
}

export default function FeeAssignmentsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');
  const [assignments, setAssignments] = useState<FeeAssignment[]>([]);
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null>(null);
  const [localSearch, setLocalSearch] = useState('');
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isWaiveDialogOpen, setIsWaiveDialogOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<FeeAssignment | null>(null);
  const [waiveReason, setWaiveReason] = useState('');
  const [assignClass, setAssignClass] = useState('');
  const [assignStudentIds, setAssignStudentIds] = useState('');
  const [selectedFeeStructureId, setSelectedFeeStructureId] = useState('');
  const [feeStructures, setFeeStructures] = useState<Array<{ id: string; name: string }>>([]);
  const [assigning, setAssigning] = useState(false);
  const [waiving, setWaiving] = useState(false);

  // Hardcoded classes
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

  // Debounce search
  const debouncedSearch = useDebounce(search, 500);

  // Fetch fee structures for assignment dropdown
  const { loading: feeStructuresLoading, execute: fetchFeeStructures } = useApi<{ feeStructures: BackendFeeStructure[] } | { data: { feeStructures: BackendFeeStructure[] } } | { data: BackendFeeStructure[] } | BackendFeeStructure[]>(
    () => feeStructuresApi.getAll({ limit: 100 }),
    {
      onSuccess: (response) => {
        let feeStructuresData: BackendFeeStructure[] = [];
        if (response && typeof response === 'object' && 'feeStructures' in response && Array.isArray(response.feeStructures)) {
          feeStructuresData = response.feeStructures;
        } else if (response && typeof response === 'object' && 'data' in response) {
          if (Array.isArray(response.data)) {
            feeStructuresData = response.data;
          } else if (response.data && typeof response.data === 'object' && 'feeStructures' in response.data && Array.isArray(response.data.feeStructures)) {
            feeStructuresData = response.data.feeStructures;
          }
        } else if (Array.isArray(response)) {
          feeStructuresData = response;
        }

        const formatted = feeStructuresData.map((fs: BackendFeeStructure) => ({
          id: fs.id?.toString() || '',
          name: `${fs.fee_type || 'Fee'} - Class ${fs.class || ''} - KES ${parseFloat(fs.amount || '0').toLocaleString()}`,
        }));
        setFeeStructures(formatted);
      },
    }
  );

  // Fetch assignments
  type AssignmentsResponse = {
    assignments: FeeAssignment[];
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  } | {
    data: {
      assignments: FeeAssignment[];
      pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    };
  } | {
    data: FeeAssignment[];
  } | FeeAssignment[];

  const { loading, execute: fetchAssignments } = useApi<AssignmentsResponse>(
    (params: { page?: number; limit?: number; search?: string }) => feeStructuresApi.getAssignments(params),
    {
      onSuccess: (response) => {
        let assignmentsData: FeeAssignment[] = [];
        let paginationData: { page: number; limit: number; total: number; totalPages: number } | null = null;

        if (response && typeof response === 'object' && 'assignments' in response && Array.isArray(response.assignments)) {
          assignmentsData = response.assignments;
          paginationData = response.pagination || null;
        } else if (response && typeof response === 'object' && 'data' in response) {
          if (Array.isArray(response.data)) {
            assignmentsData = response.data;
          } else if (response.data && typeof response.data === 'object' && 'assignments' in response.data && Array.isArray(response.data.assignments)) {
            assignmentsData = response.data.assignments;
            paginationData = response.data.pagination || null;
          }
        } else if (Array.isArray(response)) {
          assignmentsData = response;
        }

        setAssignments(assignmentsData);
        if (paginationData) {
          setPagination(paginationData);
        }
      },
      onError: (error) => {
        console.error('Failed to fetch assignments:', error);
        setAssignments([]);
      },
    }
  );

  // Fetch on mount and when params change
  useEffect(() => {
    fetchAssignments({ page, limit, search: debouncedSearch });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, debouncedSearch]);

  // Fetch fee structures on mount
  useEffect(() => {
    fetchFeeStructures();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = (value: string) => {
    setLocalSearch(value);
    setSearch(value);
    setPage(1);
  };

  const handleAssign = async () => {
    if (!selectedFeeStructureId) {
      toast.error('Please select a fee structure');
      return;
    }

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
        id: selectedFeeStructureId,
        ...assignData,
      });

      if (response.success) {
        toast.success(`Fee structure assigned to ${response.data?.totalAssigned || 0} students`);
        setIsAssignDialogOpen(false);
        setAssignClass('');
        setAssignStudentIds('');
        setSelectedFeeStructureId('');
        fetchAssignments({ page, limit, search: debouncedSearch });
      }
    } catch (error) {
      console.error('Failed to assign fee structure:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to assign fee structure';
      toast.error(errorMessage);
    } finally {
      setAssigning(false);
    }
  };

  const handleWaive = async () => {
    if (!selectedAssignment) return;

    setWaiving(true);

    try {
      const response = await feeStructuresApi.waiveAssignment(selectedAssignment.id, waiveReason);
      
      if (response.success) {
        toast.success('Fee assignment waived successfully');
        setIsWaiveDialogOpen(false);
        setWaiveReason('');
        setSelectedAssignment(null);
        fetchAssignments({ page, limit, search: debouncedSearch });
      }
    } catch (error) {
      console.error('Failed to waive assignment:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to waive assignment';
      toast.error(errorMessage);
    } finally {
      setWaiving(false);
    }
  };

  const columns: ColumnDef<FeeAssignment>[] = useMemo(() => [
    {
      accessorKey: 'student',
      header: 'Student',
      cell: ({ row }) => {
        const student = row.original.student;
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback>
                {student?.first_name?.[0] || ''}{student?.last_name?.[0] || ''}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">
                {student?.first_name || ''} {student?.last_name || ''}
              </p>
              <p className="text-sm text-muted-foreground">
                ID: {student?.student_id || 'N/A'} | Roll: {student?.roll_number || 'N/A'}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'feeStructure',
      header: 'Fee Structure',
      cell: ({ row }) => {
        const feeStructure = row.original.feeStructure;
        return (
          <div>
            <p className="font-medium capitalize">{feeStructure?.fee_type || 'N/A'}</p>
            <p className="text-sm text-muted-foreground">
              Class {feeStructure?.class || 'N/A'} | KES {parseFloat(feeStructure?.amount || 0).toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">
              Academic Year: {feeStructure?.academic_year || 'N/A'}
            </p>
          </div>
        );
      },
    },
    {
      accessorKey: 'class',
      header: 'Class',
      cell: ({ row }) => {
        const student = row.original.student;
        return (
          <Badge variant="secondary">
            {student?.class || 'N/A'} - {student?.section || 'N/A'}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'dueDate',
      header: 'Due Date',
      cell: ({ row }) => {
        const dueDate = row.original.feeStructure?.due_date;
        return (
          <div>
            {dueDate ? (
              <p className="text-sm">{new Date(dueDate).toLocaleDateString()}</p>
            ) : (
              <p className="text-sm text-muted-foreground">N/A</p>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.status;
        return (
          <Badge variant={status === 'waived' ? 'secondary' : 'default'}>
            {status === 'waived' ? 'Waived' : 'Active'}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Assigned On',
      cell: ({ row }) => {
        const createdAt = row.original.created_at;
        return (
          <div>
            {createdAt ? (
              <p className="text-sm">{new Date(createdAt).toLocaleDateString()}</p>
            ) : (
              <p className="text-sm text-muted-foreground">N/A</p>
            )}
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const assignment = row.original;

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
              {assignment.status !== 'waived' && (
                <>
                  <DropdownMenuItem
                    onClick={() => {
                      setSelectedAssignment(assignment);
                      setIsWaiveDialogOpen(true);
                    }}
                  >
                    <Shield className="mr-2 h-4 w-4" />
                    Waive Fee
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              {assignment.waived_reason && (
                <div className="px-2 py-1.5 text-sm">
                  <p className="font-medium">Waived Reason:</p>
                  <p className="text-muted-foreground text-xs">{assignment.waived_reason}</p>
                  {assignment.waived_date && (
                    <p className="text-muted-foreground text-xs mt-1">
                      On: {new Date(assignment.waived_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ], []);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/admin/fees')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Fee Assignments</h1>
            <p className="text-muted-foreground">
              Manage fee structure assignments to students
              {pagination && (
                <span className="ml-2">
                  ({pagination.total || assignments.length} total)
                </span>
              )}
            </p>
          </div>
        </div>
        <Button onClick={() => setIsAssignDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Assign Fee Structure
        </Button>
      </div>

      {/* Search Input */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search assignments..."
            value={localSearch}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        {loading && (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Assignments Table */}
      <DataTable
        columns={columns}
        data={assignments}
        searchKey="student"
        searchPlaceholder="Filter in current page..."
        showSearch={false}
        showColumnToggle={true}
        showPagination={false}
        showExport={true}
        loading={loading}
      />

      {/* Server-side Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, pagination.total)} of {pagination.total} assignments
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

      {/* Assign Fee Structure Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Assign Fee Structure to Students</DialogTitle>
            <DialogDescription>
              Assign a fee structure to students by class or individual selection
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <FormField
              name="feeStructure"
              label="Fee Structure"
              type="select"
              placeholder="Select fee structure"
              required
              value={selectedFeeStructureId || undefined}
              onChange={(value) => setSelectedFeeStructureId(value)}
              options={feeStructures.map((fs) => ({ label: fs.name, value: fs.id }))}
              disabled={feeStructuresLoading}
            />

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
                  if (value) setAssignStudentIds('');
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
                  if (e.target.value.trim()) setAssignClass('');
                }}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAssignDialogOpen(false);
                setAssignClass('');
                setAssignStudentIds('');
                setSelectedFeeStructureId('');
              }}
              disabled={assigning}
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

      {/* Waive Assignment Dialog */}
      <Dialog open={isWaiveDialogOpen} onOpenChange={setIsWaiveDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Waive Fee Assignment</DialogTitle>
            <DialogDescription>
              Waive this fee assignment for the student. This will set the balance to zero.
            </DialogDescription>
          </DialogHeader>

          {selectedAssignment && (
            <div className="space-y-4 py-4">
              <div className="rounded-lg border p-4 bg-muted/50">
                <p className="text-sm font-medium mb-2">Student:</p>
                <p className="text-sm">
                  {selectedAssignment.student?.first_name} {selectedAssignment.student?.last_name}
                </p>
                <p className="text-sm font-medium mb-2 mt-3">Fee Structure:</p>
                <p className="text-sm capitalize">
                  {selectedAssignment.feeStructure?.fee_type} - Class {selectedAssignment.feeStructure?.class} - 
                  KES {parseFloat(selectedAssignment.feeStructure?.amount || 0).toLocaleString()}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Reason for Waiving (Optional)</Label>
                <Textarea
                  placeholder="Enter reason for waiving this fee..."
                  className="min-h-[100px]"
                  value={waiveReason}
                  onChange={(e) => setWaiveReason(e.target.value)}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsWaiveDialogOpen(false);
                setWaiveReason('');
                setSelectedAssignment(null);
              }}
              disabled={waiving}
            >
              Cancel
            </Button>
            <Button onClick={handleWaive} disabled={waiving} variant="destructive">
              {waiving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Waiving...
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Waive Fee
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

