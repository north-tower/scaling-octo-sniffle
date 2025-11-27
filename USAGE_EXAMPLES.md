# API Usage Examples

This document provides practical examples of how to use the backend API integration in your components.

## Table of Contents

1. [Basic API Calls](#basic-api-calls)
2. [Using React Hooks](#using-react-hooks)
3. [Authentication](#authentication)
4. [Student Management](#student-management)
5. [Payment Processing](#payment-processing)
6. [Dashboard Data](#dashboard-data)
7. [Error Handling](#error-handling)
8. [Advanced Patterns](#advanced-patterns)

## Basic API Calls

### Simple GET Request

```typescript
import { studentsApi } from '@/lib/api';

async function fetchStudents() {
  try {
    const response = await studentsApi.getAll({ page: 1, limit: 10 });
    
    if (response.success) {
      console.log('Students:', response.data);
      return response.data;
    }
  } catch (error) {
    console.error('Failed to fetch students:', error);
  }
}
```

### POST Request with Data

```typescript
import { paymentsApi } from '@/lib/api';

async function createPayment() {
  try {
    const paymentData = {
      studentId: 'student-123',
      feeIds: ['fee-1', 'fee-2'],
      amount: 5000,
      paymentMethod: 'cash',
      paymentDate: new Date(),
    };
    
    const response = await paymentsApi.create(paymentData);
    
    if (response.success) {
      console.log('Payment created:', response.data);
      return response.data;
    }
  } catch (error) {
    console.error('Failed to create payment:', error);
  }
}
```

## Using React Hooks

### useApi Hook - Basic Usage

```typescript
'use client';

import { useEffect } from 'react';
import { studentsApi } from '@/lib/api';
import { useApi } from '@/hooks/useApi';

function StudentList() {
  const { data, loading, error, execute } = useApi(studentsApi.getAll);

  useEffect(() => {
    execute({ page: 1, limit: 10 });
  }, [execute]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {data?.students?.map(student => (
        <div key={student.id}>{student.firstName}</div>
      ))}
    </div>
  );
}
```

### useApi Hook - With Callbacks

```typescript
const { data, loading, execute } = useApi(studentsApi.create, {
  onSuccess: (data) => {
    console.log('Student created:', data);
    toast.success('Student created successfully!');
    router.push('/students');
  },
  onError: (error) => {
    console.error('Failed to create student:', error);
  },
});
```

### useFormApi Hook - Form Submission

```typescript
import { useForm } from 'react-hook-form';
import { useFormApi } from '@/hooks/useApi';
import { studentsApi } from '@/lib/api';

function CreateStudentForm() {
  const { register, handleSubmit } = useForm();
  
  const { loading, submit } = useFormApi(studentsApi.create, {
    successMessage: 'Student created successfully!',
    onSuccess: () => {
      router.push('/students');
    },
  });

  const onSubmit = async (data) => {
    await submit(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('firstName')} />
      <button type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Create Student'}
      </button>
    </form>
  );
}
```

## Authentication

### Login

```typescript
import { useAuth } from '@/store/auth';
import { useRouter } from 'next/navigation';

function LoginForm() {
  const { login, isLoading } = useAuth();
  const router = useRouter();

  const handleLogin = async (email: string, password: string) => {
    try {
      await login({ email, password });
      router.push('/admin/dashboard');
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      handleLogin('admin@school.com', 'admin123');
    }}>
      {/* Form fields */}
    </form>
  );
}
```

### Logout

```typescript
import { useAuth } from '@/store/auth';

function LogoutButton() {
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return <button onClick={handleLogout}>Logout</button>;
}
```

### Check Authentication

```typescript
import { useAuth } from '@/store/auth';

function ProtectedComponent() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <div>Please login to continue</div>;
  }

  return <div>Welcome, {user?.firstName}!</div>;
}
```

## Student Management

### Fetch Students with Pagination

```typescript
function StudentList() {
  const [page, setPage] = useState(1);
  const { data, loading, execute } = useApi(studentsApi.getAll);

  useEffect(() => {
    execute({ page, limit: 10 });
  }, [page, execute]);

  return (
    <div>
      {data?.students?.map(student => (
        <StudentCard key={student.id} student={student} />
      ))}
      
      <Pagination
        page={page}
        totalPages={data?.pagination?.totalPages}
        onPageChange={setPage}
      />
    </div>
  );
}
```

### Search Students

```typescript
function StudentSearch() {
  const [search, setSearch] = useState('');
  const { data, loading, execute } = useApi(studentsApi.getAll);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    execute({ page: 1, limit: 10, search });
  };

  return (
    <form onSubmit={handleSearch}>
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search students..."
      />
      <button type="submit">Search</button>
    </form>
  );
}
```

### Create Student

```typescript
function CreateStudent() {
  const { loading, submit } = useFormApi(studentsApi.create, {
    successMessage: 'Student created successfully!',
  });

  const handleSubmit = async (data) => {
    const success = await submit({
      studentId: 'STU2024001',
      firstName: data.firstName,
      lastName: data.lastName,
      dateOfBirth: new Date(data.dateOfBirth),
      gender: data.gender,
      address: data.address,
      phone: data.phone,
      email: data.email,
      emergencyContact: data.emergencyContact,
      emergencyPhone: data.emergencyPhone,
      classId: data.classId,
      admissionDate: new Date(),
    });

    if (success) {
      router.push('/students');
    }
  };

  return <StudentForm onSubmit={handleSubmit} loading={loading} />;
}
```

### Update Student

```typescript
function EditStudent({ studentId }: { studentId: string }) {
  const { data: student, loading: fetchLoading } = useApi(
    studentsApi.getById,
    { immediate: true }
  );

  const { loading: updateLoading, submit } = useFormApi(
    (data) => studentsApi.update(studentId, data),
    { successMessage: 'Student updated successfully!' }
  );

  useEffect(() => {
    studentsApi.getById(studentId);
  }, [studentId]);

  if (fetchLoading) return <div>Loading...</div>;

  return (
    <StudentForm
      defaultValues={student}
      onSubmit={submit}
      loading={updateLoading}
    />
  );
}
```

### Get Student Fees

```typescript
function StudentFees({ studentId }: { studentId: string }) {
  const { data, loading, execute } = useApi(studentsApi.getFees);

  useEffect(() => {
    execute(studentId);
  }, [studentId, execute]);

  if (loading) return <div>Loading fees...</div>;

  return (
    <div>
      {data?.fees?.map(fee => (
        <FeeCard key={fee.id} fee={fee} />
      ))}
    </div>
  );
}
```

## Payment Processing

### Create Payment

```typescript
function RecordPayment() {
  const { loading, submit } = useFormApi(paymentsApi.create, {
    successMessage: 'Payment recorded successfully!',
  });

  const handleSubmit = async (data) => {
    await submit({
      studentId: data.studentId,
      feeIds: data.feeIds,
      amount: parseFloat(data.amount),
      paymentMethod: data.paymentMethod,
      paymentDate: new Date(),
      referenceNumber: data.referenceNumber,
      notes: data.notes,
    });
  };

  return <PaymentForm onSubmit={handleSubmit} loading={loading} />;
}
```

### Get Payment History

```typescript
function PaymentHistory({ studentId }: { studentId: string }) {
  const { data, loading, execute } = useApi(studentsApi.getPayments);

  useEffect(() => {
    execute(studentId);
  }, [studentId, execute]);

  return (
    <div>
      {data?.payments?.map(payment => (
        <PaymentCard key={payment.id} payment={payment} />
      ))}
    </div>
  );
}
```

### Download Receipt

```typescript
function DownloadReceipt({ paymentId }: { paymentId: string }) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await paymentsApi.getReceipt(paymentId);
      toast.success('Receipt downloaded!');
    } catch (error) {
      toast.error('Failed to download receipt');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <button onClick={handleDownload} disabled={downloading}>
      {downloading ? 'Downloading...' : 'Download Receipt'}
    </button>
  );
}
```

## Dashboard Data

### Fetch Dashboard Stats

```typescript
function DashboardStats() {
  const { data, loading, execute } = useApi(dashboardApi.getStats, {
    immediate: true,
  });

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      execute();
    }, 30000);
    return () => clearInterval(interval);
  }, [execute]);

  if (loading && !data) return <div>Loading stats...</div>;

  return (
    <div className="grid grid-cols-4 gap-4">
      <StatCard
        title="Total Students"
        value={data?.totalStudents}
        icon={<Users />}
      />
      <StatCard
        title="Total Collection"
        value={`₹${data?.totalCollection?.toLocaleString()}`}
        icon={<DollarSign />}
      />
      <StatCard
        title="Pending Dues"
        value={`₹${data?.pendingDues?.toLocaleString()}`}
        icon={<AlertCircle />}
      />
      <StatCard
        title="Defaulters"
        value={data?.defaultersCount}
        icon={<TrendingDown />}
      />
    </div>
  );
}
```

### Recent Payments

```typescript
function RecentPayments() {
  const { data, loading } = useApi(dashboardApi.getRecentPayments, {
    immediate: true,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Payments</CardTitle>
      </CardHeader>
      <CardContent>
        {data?.payments?.map(payment => (
          <div key={payment.id}>
            <span>{payment.studentName}</span>
            <span>₹{payment.amount}</span>
            <span>{new Date(payment.createdAt).toLocaleDateString()}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
```

## Error Handling

### Global Error Handling

The API client automatically handles errors and shows toast notifications. You can add custom error handling:

```typescript
const { data, error, execute } = useApi(studentsApi.getAll, {
  onError: (error) => {
    // Custom error handling
    if (error.statusCode === 404) {
      console.log('No students found');
    } else if (error.statusCode === 500) {
      console.log('Server error, please try again');
    }
  },
});
```

### Try-Catch Pattern

```typescript
async function handleAction() {
  try {
    const response = await studentsApi.create(studentData);
    
    if (response.success) {
      toast.success('Success!');
    }
  } catch (error: any) {
    // Error is already shown via toast
    // Add custom handling if needed
    console.error('Action failed:', error);
    
    if (error.statusCode === 400) {
      // Handle validation errors
    }
  }
}
```

## Advanced Patterns

### Optimistic Updates

```typescript
function DeleteStudent({ studentId }: { studentId: string }) {
  const [students, setStudents] = useState([]);

  const handleDelete = async () => {
    // Optimistically remove from UI
    setStudents(prev => prev.filter(s => s.id !== studentId));

    try {
      await studentsApi.delete(studentId);
      toast.success('Student deleted');
    } catch (error) {
      // Revert on error
      execute(); // Refetch students
      toast.error('Failed to delete student');
    }
  };

  return <button onClick={handleDelete}>Delete</button>;
}
```

### Debounced Search

```typescript
import { useDebouncedCallback } from 'use-debounce';

function SearchStudents() {
  const [search, setSearch] = useState('');
  const { execute } = useApi(studentsApi.getAll);

  const debouncedSearch = useDebouncedCallback((value) => {
    execute({ page: 1, limit: 10, search: value });
  }, 500);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);
    debouncedSearch(value);
  };

  return (
    <input
      value={search}
      onChange={handleSearchChange}
      placeholder="Search..."
    />
  );
}
```

### Infinite Scroll

```typescript
function InfiniteStudentList() {
  const [page, setPage] = useState(1);
  const [allStudents, setAllStudents] = useState([]);
  const { data, loading, execute } = useApi(studentsApi.getAll);

  useEffect(() => {
    execute({ page, limit: 20 });
  }, [page, execute]);

  useEffect(() => {
    if (data?.students) {
      setAllStudents(prev => [...prev, ...data.students]);
    }
  }, [data]);

  const loadMore = () => {
    if (!loading) {
      setPage(prev => prev + 1);
    }
  };

  return (
    <div>
      {allStudents.map(student => (
        <StudentCard key={student.id} student={student} />
      ))}
      <button onClick={loadMore} disabled={loading}>
        {loading ? 'Loading...' : 'Load More'}
      </button>
    </div>
  );
}
```

### Parallel Requests

```typescript
function DashboardOverview() {
  const [data, setData] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [stats, payments, dues] = await Promise.all([
          dashboardApi.getStats(),
          dashboardApi.getRecentPayments(),
          dashboardApi.getUpcomingDues(),
        ]);

        setData({
          stats: stats.data,
          payments: payments.data,
          dues: dues.data,
        });
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <Stats data={data.stats} />
      <RecentPayments data={data.payments} />
      <UpcomingDues data={data.dues} />
    </div>
  );
}
```

## Best Practices

1. **Use hooks for cleaner code**: Prefer `useApi` and `useFormApi` over direct API calls
2. **Handle loading states**: Always show loading indicators
3. **Handle errors gracefully**: Provide fallback UI for errors
4. **Optimize re-renders**: Use `useCallback` and `useMemo` where appropriate
5. **Cache data**: Consider using React Query or SWR for advanced caching
6. **Type safety**: Always use TypeScript types from `src/lib/types.ts`
7. **Validate forms**: Use Zod schemas from `src/lib/validations.ts`
8. **Show feedback**: Use toast notifications for user feedback

## See Also

- [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md) - Detailed API documentation
- [QUICK_START.md](QUICK_START.md) - Quick setup guide
- [src/lib/api-examples.ts](src/lib/api-examples.ts) - More API examples
- [src/components/examples/](src/components/examples/) - Example components
