'use client';

import { useState, useEffect } from 'react';
import { studentsApi } from '@/lib/api';
import { useApi } from '@/hooks/useApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Search } from 'lucide-react';

/**
 * Example component showing how to fetch and display students
 * This demonstrates the integration with the backend API
 */
export function StudentListExample() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>(null);

  // Using the useApi hook for cleaner API calls
  const { loading, execute } = useApi(studentsApi.getAll, {
    onSuccess: (response) => {
      setStudents(response.students || []);
      setPagination(response.pagination);
    },
  });

  // Fetch students on mount and when page/search changes
  useEffect(() => {
    execute({ page, limit: 10, search });
  }, [page, search, execute]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1); // Reset to first page on new search
    execute({ page: 1, limit: 10, search });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Students List</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Form */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search students..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button type="submit" disabled={loading}>
            Search
          </Button>
        </form>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Students List */}
        {!loading && students.length > 0 && (
          <div className="space-y-2">
            {students.map((student) => (
              <div
                key={student.id}
                className="p-4 border rounded-lg hover:bg-accent transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">
                      {student.firstName} {student.lastName}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Roll No: {student.rollNumber || student.studentId}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Class: {student.class?.name || 'N/A'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">
                      {student.email}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {student.phone}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && students.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No students found
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setPage(page - 1)}
              disabled={page <= 1 || loading}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => setPage(page + 1)}
              disabled={page >= pagination.totalPages || loading}
            >
              Next
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
