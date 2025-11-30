'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
import { MoreHorizontal, Eye, Edit, Trash2, Plus, BookOpen, Loader2, Search, Users } from 'lucide-react';
import { Class, BackendStudent, ApiResponse, ApiError, PaginatedResponse } from '@/lib/types';
import { classesApi } from '@/lib/api';
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
import { createClassSchema } from '@/lib/validations';
import { format } from 'date-fns';

// Backend class type
type BackendClass = {
  id?: number | string;
  name?: string;
  grade?: number;
  grade_level?: number;
  section?: string;
  academic_year_id?: string;
  academicYearId?: string;
  academic_year?: string | {
    id?: number | string;
    name?: string;
    start_date?: string;
    end_date?: string;
    is_active?: boolean;
    created_at?: string;
    updated_at?: string;
  };
  created_at?: string;
  updated_at?: string;
};

// Transform backend class data to frontend format
const transformClass = (backendClass: BackendClass): Class => {
  return {
    id: backendClass.id?.toString() || '',
    name: backendClass.name || '',
    grade: parseInt(backendClass.grade || backendClass.grade_level || 1),
    section: backendClass.section || '',
    academicYearId: backendClass.academic_year_id || backendClass.academicYearId || backendClass.academic_year || '',
    academicYear: backendClass.academic_year ? {
      id: backendClass.academic_year.id?.toString() || backendClass.academic_year || '',
      name: backendClass.academic_year.name || backendClass.academic_year || '',
      startDate: backendClass.academic_year.start_date ? new Date(backendClass.academic_year.start_date) : new Date(),
      endDate: backendClass.academic_year.end_date ? new Date(backendClass.academic_year.end_date) : new Date(),
      isActive: backendClass.academic_year.is_active !== false,
      createdAt: backendClass.academic_year.created_at ? new Date(backendClass.academic_year.created_at) : new Date(),
      updatedAt: backendClass.academic_year.updated_at ? new Date(backendClass.academic_year.updated_at) : new Date(),
    } : undefined,
    createdAt: backendClass.created_at ? new Date(backendClass.created_at) : new Date(),
    updatedAt: backendClass.updated_at ? new Date(backendClass.updated_at) : new Date(),
  };
};

interface CreateClassForm {
  name: string;
  grade: number;
  section: string;
  academicYearId: string;
}

export default function ClassesPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [classes, setClasses] = useState<Class[]>([]);
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isStudentsDialogOpen, setIsStudentsDialogOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [classStudents, setClassStudents] = useState<BackendStudent[]>([]);
  const [formData, setFormData] = useState<Partial<CreateClassForm>>({
    name: '',
    grade: 1,
    section: '',
    academicYearId: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Hardcoded academic years
  const [academicYears] = useState<string[]>([
    '2023-2024',
    '2024-2025',
    '2025-2026',
    '2026-2027',
  ]);

  // Debounce search to avoid too many API calls
  const debouncedSearch = useDebounce(search, 500);

  // Fetch classes
  const { loading, execute: fetchClasses } = useApi<{ classes: BackendClass[]; pagination?: { page: number; limit: number; total: number; totalPages: number } } | BackendClass[]>(
    (params: { page?: number; limit?: number; search?: string }) => classesApi.getAll(params),
    {
      onSuccess: (response) => {
        // Handle different response structures
        let classesData: BackendClass[] = [];
        let paginationData: { page: number; limit: number; total: number; totalPages: number } | null = null;

        if (response && typeof response === 'object' && 'classes' in response && Array.isArray(response.classes)) {
          classesData = response.classes;
          paginationData = response.pagination || null;
        } else if (Array.isArray(response)) {
          classesData = response;
        }

        if (classesData && classesData.length > 0) {
          const transformed = classesData.map(transformClass);
          setClasses(transformed);
          if (paginationData) {
            setPagination(paginationData);
          }
        } else {
          setClasses([]);
        }
      },
      onError: (error) => {
        console.error('Failed to fetch classes:', error);
        setClasses([]);
      },
    }
  );

  // Fetch students for a class
  const { loading: studentsLoading, execute: fetchClassStudents } = useApi<{ students: BackendStudent[] } | BackendStudent[]>(
    (id: string) => classesApi.getStudents(id),
    {
      onSuccess: (response) => {
        let studentsData: BackendStudent[] = [];
        if (response && typeof response === 'object' && 'students' in response && Array.isArray(response.students)) {
          studentsData = response.students;
        } else if (Array.isArray(response)) {
          studentsData = response;
        }
        setClassStudents(studentsData);
      },
      onError: (error) => {
        console.error('Failed to fetch class students:', error);
        setClassStudents([]);
      },
    }
  );

  // Create class
  const { execute: createClass } = useApi<unknown, { name: string; grade: number; section: string; academic_year_id: string }>(
    (data: { name: string; grade: number; section: string; academic_year_id: string }) => classesApi.create(data),
    {
      onSuccess: () => {
        toast.success('Class created successfully');
        setIsAddDialogOpen(false);
        resetForm();
        fetchClasses({ page, limit, search: debouncedSearch });
      },
      onError: (error: ApiError) => {
        toast.error(error?.message || 'Failed to create class');
      },
    }
  );

  // Update class
  const { execute: updateClass } = useApi<unknown, { id: string; data: { name: string; grade: number; section: string; academic_year_id: string } }>(
    (data: { id: string; data: { name: string; grade: number; section: string; academic_year_id: string } }) => classesApi.update(data.id, data.data),
    {
      onSuccess: () => {
        toast.success('Class updated successfully');
        setIsEditDialogOpen(false);
        resetForm();
        fetchClasses({ page, limit, search: debouncedSearch });
      },
      onError: (error: ApiError) => {
        toast.error(error?.message || 'Failed to update class');
      },
    }
  );

  // Delete class
  const { execute: deleteClass } = useApi(
    (id: string) => classesApi.delete(id),
    {
      onSuccess: () => {
        toast.success('Class deleted successfully');
        fetchClasses({ page, limit, search: debouncedSearch });
      },
      onError: (error: ApiError) => {
        toast.error(error?.message || 'Failed to delete class');
      },
    }
  );

  // Fetch classes when page, limit, or search changes
  useEffect(() => {
    fetchClasses({ page, limit, search: debouncedSearch });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, debouncedSearch]);

  // Filter classes locally based on search
  const filteredClasses = useMemo(() => {
    if (!search) return classes;
    const searchLower = search.toLowerCase();
    return classes.filter(cls =>
      cls.name.toLowerCase().includes(searchLower) ||
      cls.section.toLowerCase().includes(searchLower) ||
      cls.grade.toString().includes(searchLower)
    );
  }, [classes, search]);

  const resetForm = () => {
    setFormData({
      name: '',
      grade: 1,
      section: '',
      academicYearId: '',
    });
    setFormErrors({});
  };

  const handleAdd = () => {
    resetForm();
    setIsAddDialogOpen(true);
  };

  const handleEdit = (cls: Class) => {
    setFormData({
      name: cls.name,
      grade: cls.grade,
      section: cls.section,
      academicYearId: cls.academicYearId,
    });
    setSelectedClass(cls);
    setIsEditDialogOpen(true);
  };

  const handleView = (cls: Class) => {
    setSelectedClass(cls);
    setIsViewDialogOpen(true);
  };

  const handleViewStudents = (cls: Class) => {
    setSelectedClass(cls);
    setIsStudentsDialogOpen(true);
    fetchClassStudents(cls.id);
  };

  const handleDelete = (cls: Class) => {
    if (window.confirm(`Are you sure you want to delete ${cls.name}?`)) {
      deleteClass(cls.id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    // Validate form
    const validation = createClassSchema.safeParse(formData);
    if (!validation.success) {
      const errors: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0]) {
          errors[err.path[0].toString()] = err.message;
        }
      });
      setFormErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: formData.name || '',
        grade: formData.grade || 1,
        section: formData.section || '',
        academic_year_id: formData.academicYearId || '',
      };

      if (selectedClass) {
        await updateClass({ id: selectedClass.id, data: payload });
      } else {
        await createClass(payload);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setSubmitting(false);
    }
  };

  // Table columns
  const columns: ColumnDef<Class>[] = useMemo(() => [
    {
      accessorKey: 'name',
      header: 'Class Name',
      cell: ({ row }) => {
        const cls = row.original;
        return (
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="font-medium">{cls.name}</p>
              <p className="text-sm text-muted-foreground">
                Grade {cls.grade} - Section {cls.section}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'grade',
      header: 'Grade',
      cell: ({ row }) => {
        return <Badge variant="secondary">Grade {row.original.grade}</Badge>;
      },
    },
    {
      accessorKey: 'section',
      header: 'Section',
      cell: ({ row }) => {
        return <Badge variant="outline">{row.original.section}</Badge>;
      },
    },
    {
      accessorKey: 'academicYear',
      header: 'Academic Year',
      cell: ({ row }) => {
        const academicYear = row.original.academicYear?.name || row.original.academicYearId || 'N/A';
        return <span className="text-sm">{academicYear}</span>;
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ row }) => {
        return (
          <span className="text-sm text-muted-foreground">
            {format(new Date(row.original.createdAt), 'MMM dd, yyyy')}
          </span>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const cls = row.original;
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
              <DropdownMenuItem onClick={() => handleView(cls)}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleViewStudents(cls)}>
                <Users className="mr-2 h-4 w-4" />
                View Students
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleEdit(cls)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleDelete(cls)}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ], [handleView, handleViewStudents, handleEdit, handleDelete]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Classes</h1>
          <p className="text-muted-foreground">
            Manage classes and sections
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add Class
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search classes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Classes Table */}
      <div className="rounded-md border">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={filteredClasses}
            pagination={pagination}
            onPageChange={setPage}
            onLimitChange={setLimit}
          />
        )}
      </div>

      {/* Add Class Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Class</DialogTitle>
            <DialogDescription>
              Create a new class with grade and section
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <FormField
                name="name"
                label="Class Name"
                value={formData.name}
                onChange={(value) => setFormData({ ...formData, name: value })}
                error={formErrors.name}
                required
              />
              <FormField
                name="grade"
                label="Grade"
                type="number"
                value={formData.grade?.toString()}
                onChange={(value) => setFormData({ ...formData, grade: parseInt(value) || 1 })}
                error={formErrors.grade}
                required
              />
              <FormField
                name="section"
                label="Section"
                value={formData.section}
                onChange={(value) => setFormData({ ...formData, section: value })}
                error={formErrors.section}
                required
              />
              <FormField
                name="academicYearId"
                label="Academic Year"
                value={formData.academicYearId || undefined}
                onChange={(value) => setFormData({ ...formData, academicYearId: value === 'all' ? '' : value || '' })}
                type="select"
                options={[
                  ...academicYears.map(year => ({ value: year, label: year }))
                ]}
                error={formErrors.academicYearId}
                required
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Create Class
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Class Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Class</DialogTitle>
            <DialogDescription>
              Update class information
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <FormField
                name="name"
                label="Class Name"
                value={formData.name}
                onChange={(value) => setFormData({ ...formData, name: value })}
                error={formErrors.name}
                required
              />
              <FormField
                name="grade"
                label="Grade"
                type="number"
                value={formData.grade?.toString()}
                onChange={(value) => setFormData({ ...formData, grade: parseInt(value) || 1 })}
                error={formErrors.grade}
                required
              />
              <FormField
                name="section"
                label="Section"
                value={formData.section}
                onChange={(value) => setFormData({ ...formData, section: value })}
                error={formErrors.section}
                required
              />
              <FormField
                name="academicYearId"
                label="Academic Year"
                value={formData.academicYearId || undefined}
                onChange={(value) => setFormData({ ...formData, academicYearId: value === 'all' ? '' : value || '' })}
                type="select"
                options={[
                  ...academicYears.map(year => ({ value: year, label: year }))
                ]}
                error={formErrors.academicYearId}
                required
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Update Class
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Class Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Class Details</DialogTitle>
            <DialogDescription>
              View class information
            </DialogDescription>
          </DialogHeader>
          {selectedClass && (
            <div className="space-y-4 py-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Class Name</Label>
                <p className="text-lg font-semibold">{selectedClass.name}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Grade</Label>
                <p className="text-lg">Grade {selectedClass.grade}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Section</Label>
                <p className="text-lg">{selectedClass.section}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Academic Year</Label>
                <p className="text-lg">
                  {selectedClass.academicYear?.name || selectedClass.academicYearId || 'N/A'}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Created At</Label>
                <p className="text-lg">
                  {format(new Date(selectedClass.createdAt), 'MMM dd, yyyy')}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Students Dialog */}
      <Dialog open={isStudentsDialogOpen} onOpenChange={setIsStudentsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Students in {selectedClass?.name}</DialogTitle>
            <DialogDescription>
              List of students enrolled in this class
            </DialogDescription>
          </DialogHeader>
          {studentsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : classStudents.length > 0 ? (
            <div className="space-y-2 py-4">
              {classStudents.map((student: BackendStudent) => (
                <div key={student.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">
                      {student.first_name || student.firstName} {student.last_name || student.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      ID: {student.student_id || student.studentId} | Roll: {student.roll_number || student.rollNumber || 'N/A'}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsStudentsDialogOpen(false);
                      router.push(`/admin/students?id=${student.id}`);
                    }}
                  >
                    View
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No students found in this class
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsStudentsDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}




