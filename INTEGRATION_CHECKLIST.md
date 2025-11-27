# Integration Checklist

Use this checklist to verify your frontend-backend integration is working correctly.

## ✅ Pre-Integration Setup

- [x] Backend API is available
- [x] Backend runs on `http://localhost:5000`
- [x] Frontend dependencies installed (`npm install`)
- [x] Environment variables configured (`.env.local`)

## ✅ Configuration

- [x] `NEXT_PUBLIC_API_URL` set to `http://localhost:5000/api`
- [x] Backend CORS configured for `http://localhost:3000`
- [x] API client configured (`src/lib/api.ts`)
- [x] Authentication store setup (`src/store/auth.ts`)
- [x] Middleware configured (`src/middleware.ts`)

## ✅ API Integration

- [x] All API endpoints mapped to TypeScript functions
- [x] Authentication API (login, logout, register)
- [x] Students API (CRUD operations)
- [x] Payments API (create, list, receipts)
- [x] Fee Structures API
- [x] Dashboard API
- [x] Reports API
- [x] Classes & Academic Years API

## ✅ Type Safety

- [x] TypeScript types defined (`src/lib/types.ts`)
- [x] API response types
- [x] Form data types
- [x] Authentication types
- [x] Validation schemas (`src/lib/validations.ts`)

## ✅ React Hooks

- [x] `useApi` hook for API calls
- [x] `usePaginatedApi` hook for paginated data
- [x] `useFormApi` hook for form submissions
- [x] `useAuth` hook for authentication

## ✅ Example Components

- [x] Student list example
- [x] Payment form example
- [x] Dashboard stats example
- [x] Connection test page

## ✅ Documentation

- [x] Quick start guide
- [x] Integration guide
- [x] Usage examples
- [x] Integration summary
- [x] README updated

## 🧪 Testing Checklist

### Backend Connection

- [ ] Backend server is running
- [ ] Visit `http://localhost:5000` - should respond
- [ ] Backend health check works
- [ ] CORS headers are correct

### Frontend Connection

- [ ] Frontend server is running
- [ ] Visit `http://localhost:3000` - loads correctly
- [ ] No console errors on page load
- [ ] Environment variables loaded correctly

### Connection Test

- [ ] Visit `/test-connection` page
- [ ] Click "Run Connection Tests"
- [ ] All 4 tests pass:
  - [ ] Backend Connection ✓
  - [ ] Login API ✓
  - [ ] Dashboard Stats API ✓
  - [ ] Students API ✓

### Authentication

- [ ] Visit `/login` page
- [ ] Login form displays correctly
- [ ] Login with `admin@school.com` / `admin123`
- [ ] Redirects to dashboard after login
- [ ] User data stored in localStorage
- [ ] Token stored correctly
- [ ] Logout works correctly
- [ ] Redirects to login after logout

### API Calls

- [ ] Dashboard stats load correctly
- [ ] Students list loads with pagination
- [ ] Search functionality works
- [ ] Create student form works
- [ ] Update student works
- [ ] Payment creation works
- [ ] Fee structures load
- [ ] Reports generate correctly

### Error Handling

- [ ] Network errors show toast notification
- [ ] 401 errors trigger token refresh
- [ ] 403 errors show permission message
- [ ] 500 errors show error message
- [ ] Form validation errors display
- [ ] Loading states show correctly

### UI/UX

- [ ] Loading spinners show during API calls
- [ ] Success messages show after actions
- [ ] Error messages show on failures
- [ ] Forms reset after successful submission
- [ ] Pagination works correctly
- [ ] Search is responsive

## 🔍 Verification Steps

### 1. Backend Verification

```bash
# Check backend is running
curl http://localhost:5000

# Check API endpoint
curl http://localhost:5000/api/health
```

### 2. Frontend Verification

```bash
# Start frontend
npm run dev

# Check environment variables
echo $NEXT_PUBLIC_API_URL
```

### 3. Browser Console Check

Open browser console (F12) and check:

```javascript
// Check API URL
console.log(process.env.NEXT_PUBLIC_API_URL);

// Check localStorage
console.log(localStorage.getItem('authToken'));

// Test API call
import { studentsApi } from '@/lib/api';
studentsApi.getAll({ page: 1, limit: 10 }).then(console.log);
```

### 4. Network Tab Check

1. Open DevTools Network tab
2. Login to the application
3. Verify:
   - [ ] Request goes to correct URL
   - [ ] Request has correct headers
   - [ ] Response is successful (200)
   - [ ] Response has expected data structure

## 🐛 Common Issues & Solutions

### Issue: Backend not connecting

**Symptoms**: Connection refused, CORS errors

**Solutions**:
- [ ] Verify backend is running on port 5000
- [ ] Check `NEXT_PUBLIC_API_URL` in `.env.local`
- [ ] Verify CORS configuration in backend
- [ ] Restart both servers

### Issue: Authentication not working

**Symptoms**: 401 errors, redirect loops

**Solutions**:
- [ ] Clear localStorage: `localStorage.clear()`
- [ ] Clear browser cookies
- [ ] Check token format in backend
- [ ] Verify JWT secret matches

### Issue: API calls failing

**Symptoms**: 404 errors, unexpected responses

**Solutions**:
- [ ] Check API endpoint URLs
- [ ] Verify request payload format
- [ ] Check backend logs for errors
- [ ] Test endpoint with Postman/curl

### Issue: Types not matching

**Symptoms**: TypeScript errors, runtime errors

**Solutions**:
- [ ] Update types in `src/lib/types.ts`
- [ ] Check backend response format
- [ ] Verify API response structure
- [ ] Run `npm run type-check`

## ✅ Final Verification

Once all items are checked:

1. [ ] All tests pass on `/test-connection`
2. [ ] Can login successfully
3. [ ] Dashboard loads with data
4. [ ] Can create/update/delete records
5. [ ] Error handling works correctly
6. [ ] No console errors
7. [ ] All features working as expected

## 🎉 Integration Complete!

If all items are checked, your integration is complete and working correctly!

## 📝 Notes

Add any specific notes or customizations here:

```
Date: _______________
Tested by: _______________
Backend version: _______________
Frontend version: _______________

Additional notes:
_________________________________
_________________________________
_________________________________
```

## 🚀 Next Steps

After completing this checklist:

1. Start building your features
2. Use the example components as reference
3. Follow the patterns in `USAGE_EXAMPLES.md`
4. Keep documentation updated
5. Add tests for critical features

---

**Need help?** Check:
- [QUICK_START.md](QUICK_START.md)
- [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md)
- [USAGE_EXAMPLES.md](USAGE_EXAMPLES.md)
- [INTEGRATION_SUMMARY.md](INTEGRATION_SUMMARY.md)
