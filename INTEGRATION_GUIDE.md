# Frontend-Backend Integration Guide

## Overview

This guide explains how your Next.js frontend is integrated with the backend API running on `http://localhost:5000`.

## Setup Instructions

### 1. Environment Configuration

Your `.env.local` file is already configured:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### 2. Start the Backend

Make sure your backend server is running on port 5000:

```bash
cd backend
npm run dev
```

The backend should be accessible at `http://localhost:5000`

### 3. Start the Frontend

```bash
npm run dev
```

The frontend will run on `http://localhost:3000`

## Architecture

### API Client (`src/lib/api.ts`)

The API client is built with Axios and includes:

- **Automatic token management**: Tokens are automatically added to requests
- **Token refresh**: Automatically refreshes expired tokens
- **Error handling**: Centralized error handling with toast notifications
- **Request/Response interceptors**: For authentication and error handling

### Authentication Flow

1. **Login** (`/login`)
   - User enters credentials
   - Frontend calls `authApi.login(email, password)`
   - Backend returns user data + JWT token
   - Token is stored in localStorage and cookies
   - User is redirected based on role

2. **Protected Routes**
   - Middleware checks for valid token
   - If no token, redirect to login
   - If token expired, attempt refresh
   - If refresh fails, redirect to login

3. **API Requests**
   - Token automatically added to Authorization header
   - If 401 error, attempt token refresh
   - If refresh succeeds, retry original request
   - If refresh fails, redirect to login

### State Management

Using Zustand for auth state (`src/store/auth.ts`):

```typescript
import { useAuth } from '@/store/auth';

function MyComponent() {
  const { user, isAuthenticated, login, logout } = useAuth();
  
  // Use auth state and methods
}
```

## API Usage Examples

### Authentication

```typescript
import { authApi } from '@/lib/api';

// Login
const response = await authApi.login('admin@school.com', 'admin123');

// Get profile
const profile = await authApi.getProfile();

// Logout
await authApi.logout();
```

### Dashboard

```typescript
import { dashboardApi } from '@/lib/api';

// Get dashboard stats
const stats = await dashboardApi.getStats();

// Get recent payments
const payments = await dashboardApi.getRecentPayments();

// Get upcoming dues
const dues = await dashboardApi.getUpcomingDues();
```

### Students

```typescript
import { studentsApi } from '@/lib/api';

// Get all students with pagination
const students = await studentsApi.getAll({ 
  page: 1, 
  limit: 10, 
  search: 'john' 
});

// Get student by ID
const student = await studentsApi.getById('student-id');

// Create student
const newStudent = await studentsApi.create({
  studentId: 'STU2024001',
  firstName: 'John',
  lastName: 'Doe',
  // ... other fields
});

// Update student
await studentsApi.update('student-id', { phone: '1234567890' });

// Get student fees
const fees = await studentsApi.getFees('student-id');

// Get student payments
const payments = await studentsApi.getPayments('student-id');
```

### Payments

```typescript
import { paymentsApi } from '@/lib/api';

// Create payment
const payment = await paymentsApi.create({
  studentId: 'student-id',
  feeIds: ['fee-id-1', 'fee-id-2'],
  amount: 10000,
  paymentMethod: 'cash',
  paymentDate: new Date(),
  referenceNumber: 'REF123456',
});

// Get payment receipt
await paymentsApi.getReceipt('payment-id');
```

### Fee Structures

```typescript
import { feeStructuresApi } from '@/lib/api';

// Get all fee structures
const feeStructures = await feeStructuresApi.getAll();

// Create fee structure
const newFee = await feeStructuresApi.create({
  name: 'Tuition Fee',
  amount: 50000,
  feeType: 'tuition',
  classId: 'class-id',
  academicYearId: 'year-id',
  dueDate: new Date('2024-04-30'),
});

// Assign fees to students
await feeStructuresApi.assignToStudents({
  feeStructureIds: ['fee-id-1'],
  studentIds: ['student-id-1', 'student-id-2'],
  dueDate: new Date('2024-04-30'),
});
```

### Reports

```typescript
import { reportsApi } from '@/lib/api';

// Fee collection report
const report = await reportsApi.getFeeCollection({
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-12-31'),
});

// Outstanding fees
const outstanding = await reportsApi.getOutstandingFees();

// Defaulters
const defaulters = await reportsApi.getDefaulters();

// Export report
await reportsApi.exportReport('fee-collection', params, 'pdf');
```

## Using React Hooks

### Custom Hook Example

```typescript
import { useState, useEffect } from 'react';
import { studentsApi } from '@/lib/api';

function useStudents(page = 1, limit = 10) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        const response = await studentsApi.getAll({ page, limit });
        setStudents(response.data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [page, limit]);

  return { students, loading, error };
}

// Usage in component
function StudentList() {
  const { students, loading, error } = useStudents(1, 10);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {students.map(student => (
        <div key={student.id}>{student.firstName}</div>
      ))}
    </div>
  );
}
```

## Testing the Connection

Use the test function to verify backend connectivity:

```typescript
import { testConnection } from '@/lib/api-examples';

// In your component or console
testConnection().then(success => {
  if (success) {
    console.log('Backend is connected!');
  } else {
    console.log('Backend connection failed!');
  }
});
```

## Error Handling

The API client automatically handles errors:

- **Network errors**: Shows toast notification
- **401 Unauthorized**: Attempts token refresh, then redirects to login
- **403 Forbidden**: Shows permission error
- **500 Server errors**: Shows error toast

### Custom Error Handling

```typescript
try {
  const response = await studentsApi.create(studentData);
  toast.success('Student created successfully');
} catch (error) {
  // Error is already shown via toast
  // Add custom handling if needed
  console.error('Failed to create student:', error);
}
```

## CORS Configuration

The backend is configured to accept requests from `http://localhost:3000`. If you change the frontend port, update the backend's CORS configuration in `.env`:

```env
CORS_ORIGIN=http://localhost:3000
```

## Available Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register
- `POST /api/auth/logout` - Logout
- `GET /api/auth/profile` - Get profile
- `PUT /api/auth/profile` - Update profile

### Dashboard
- `GET /api/dashboard/stats` - Dashboard statistics
- `GET /api/dashboard/recent-payments` - Recent payments
- `GET /api/dashboard/upcoming-dues` - Upcoming dues
- `GET /api/dashboard/collection-trends` - Collection trends

### Students
- `GET /api/students` - Get all students (with pagination)
- `GET /api/students/:id` - Get student by ID
- `POST /api/students` - Create student
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student
- `GET /api/students/:id/fees` - Get student fees
- `GET /api/students/:id/payments` - Get student payments

### Fee Structures
- `GET /api/fee-structures` - Get all fee structures
- `POST /api/fee-structures` - Create fee structure
- `PUT /api/fee-structures/:id` - Update fee structure
- `DELETE /api/fee-structures/:id` - Delete fee structure
- `POST /api/fee-structures/assign` - Assign fees to students

### Payments
- `GET /api/payments` - Get all payments
- `POST /api/payments` - Create payment
- `GET /api/payments/:id` - Get payment by ID
- `GET /api/payments/:id/receipt` - Download receipt

### Reports
- `GET /api/reports/fee-collection` - Fee collection report
- `GET /api/reports/outstanding-fees` - Outstanding fees report
- `GET /api/reports/defaulters` - Defaulters report

## Troubleshooting

### Backend not responding

1. Check if backend is running: `curl http://localhost:5000/api/health`
2. Check backend logs for errors
3. Verify CORS configuration

### Authentication issues

1. Clear localStorage: `localStorage.clear()`
2. Clear cookies
3. Check token expiration
4. Verify backend JWT configuration

### API errors

1. Check browser console for detailed errors
2. Check Network tab in DevTools
3. Verify request payload matches backend expectations
4. Check backend logs

## Next Steps

1. **Test the connection**: Run `testConnection()` from `api-examples.ts`
2. **Implement features**: Use the API functions in your components
3. **Add error boundaries**: Wrap components with error boundaries
4. **Add loading states**: Show loading indicators during API calls
5. **Add optimistic updates**: Update UI before API response for better UX

## Demo Credentials

Use these credentials to test the application:

- **Admin**: admin@school.com / admin123
- **Student**: student@school.com / student123
- **Parent**: parent@school.com / parent123
- **Accountant**: accountant@school.com / accountant123
