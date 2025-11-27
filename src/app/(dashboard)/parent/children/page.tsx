'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Users, 
  Eye, 
  CreditCard,
  Receipt,
  DollarSign,
  AlertTriangle,
  MoreHorizontal,
  Search,
  Loader2,
  GraduationCap,
  FileText,
  TrendingUp
} from 'lucide-react';
import { parentPortalApi } from '@/lib/api';
import { useApi } from '@/hooks/useApi';
import { formatCurrency } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { EmptyState } from '@/components/shared/EmptyState';
import { useDebounce } from '@/hooks/useDebounce';

export default function ParentChildrenPage() {
  const router = useRouter();
  const [children, setChildren] = useState<any[]>([]);
  const [childrenWithBalances, setChildrenWithBalances] = useState<any[]>([]);
  const [localSearch, setLocalSearch] = useState('');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);

  // Fetch summary which includes children with balance info
  const { loading, execute: fetchChildren } = useApi(
    () => parentPortalApi.getSummary(),
    {
      onSuccess: (response: any) => {
        const data = response?.data || response;
        if (data) {
          const childrenList = data.children || [];
          // Summary endpoint returns children with balance info
          setChildren(childrenList);
          setChildrenWithBalances(childrenList);
        }
      },
      onError: (error) => {
        console.error('Failed to fetch children:', error);
        setChildren([]);
        setChildrenWithBalances([]);
      },
    }
  );

  useEffect(() => {
    fetchChildren();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filter children based on search
  const displayChildren = childrenWithBalances.length > 0 ? childrenWithBalances : children;
  const filteredChildren = displayChildren.filter((child: any) => {
    if (!debouncedSearch) return true;
    const searchLower = debouncedSearch.toLowerCase();
    const name = `${child.first_name || ''} ${child.last_name || ''}`.toLowerCase();
    const studentId = (child.student_id || '').toLowerCase();
    const className = (child.class || '').toLowerCase();
    const section = (child.section || '').toLowerCase();
    
    return (
      name.includes(searchLower) ||
      studentId.includes(searchLower) ||
      className.includes(searchLower) ||
      section.includes(searchLower)
    );
  });

  const handleSearch = (value: string) => {
    setLocalSearch(value);
    setSearch(value);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Children</h1>
          <p className="text-muted-foreground">
            View and manage your children's fee information
            {children.length > 0 && (
              <span className="ml-2">({children.length} {children.length === 1 ? 'child' : 'children'})</span>
            )}
          </p>
        </div>
      </div>

      {/* Search Input */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, student ID, class, or section..."
            value={localSearch}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        {loading && (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Children List */}
      {loading && children.length === 0 ? (
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredChildren.length === 0 ? (
        <EmptyState
          title={search ? "No children found" : "No children"}
          description={
            search
              ? "Try adjusting your search criteria"
              : "Please contact the administrator to link your children to your account."
          }
          icon={Users}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredChildren.map((child: any) => {
            // Handle both formats: summary (has 'name') and children (has 'first_name'/'last_name')
            const childName = child.name || `${child.first_name || ''} ${child.last_name || ''}`.trim() || 'Unknown';
            const initials = childName
              .split(' ')
              .map((n: string) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2) || 'C';

            return (
              <Card key={child.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{childName || 'Unknown'}</CardTitle>
                        <CardDescription>
                          ID: {child.student_id || 'N/A'}
                        </CardDescription>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => router.push(`/parent/children/${child.id}`)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push(`/parent/children/${child.id}/fees`)}>
                          <CreditCard className="mr-2 h-4 w-4" />
                          View Fees
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push(`/parent/children/${child.id}/payments`)}>
                          <Receipt className="mr-2 h-4 w-4" />
                          View Payments
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => router.push(`/parent/children/${child.id}/balance`)}>
                          <DollarSign className="mr-2 h-4 w-4" />
                          View Balance
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Class Information */}
                    <div className="flex items-center gap-2 text-sm">
                      <GraduationCap className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Class:</span>
                      <span className="font-medium">
                        {child.class || 'N/A'} {child.section ? `- ${child.section}` : ''}
                      </span>
                      {child.roll_number && (
                        <>
                          <span className="text-muted-foreground">•</span>
                          <span className="text-muted-foreground">Roll:</span>
                          <span className="font-medium">{child.roll_number}</span>
                        </>
                      )}
                    </div>

                    {/* Outstanding Balance */}
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Outstanding:</span>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-lg">
                          {formatCurrency(child.outstandingBalance || 0)}
                        </p>
                        {child.overdueCount > 0 && (
                          <Badge variant="destructive" className="text-xs mt-1">
                            {child.overdueCount} {child.overdueCount === 1 ? 'fee' : 'fees'} overdue
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => router.push(`/parent/children/${child.id}/fees`)}
                      >
                        <CreditCard className="mr-2 h-4 w-4" />
                        Fees
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => router.push(`/parent/children/${child.id}/payments`)}
                      >
                        <Receipt className="mr-2 h-4 w-4" />
                        Payments
                      </Button>
                    </div>

                    {/* View Full Profile Button */}
                    <Button
                      variant="default"
                      className="w-full"
                      onClick={() => router.push(`/parent/children/${child.id}`)}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      View Full Profile
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

