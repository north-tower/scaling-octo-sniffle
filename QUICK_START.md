# Quick Start Guide

## Prerequisites

- Node.js installed
- Backend server code
- Frontend code (this project)

## Step 1: Start the Backend

Open a terminal and navigate to your backend folder:

```bash
cd /path/to/backend
npm install  # If not already installed
npm run dev
```

The backend should start on `http://localhost:5000`

Verify it's running by visiting: `http://localhost:5000/api/health`

## Step 2: Start the Frontend

Open a new terminal and navigate to this project:

```bash
npm install  # If not already installed
npm run dev
```

The frontend will start on `http://localhost:3000`

## Step 3: Test the Connection

Visit the test page to verify everything is connected:

```
http://localhost:3000/test-connection
```

Click "Run Connection Tests" to verify:
- ✓ Backend is reachable
- ✓ Login API works
- ✓ Dashboard API works
- ✓ Students API works

## Step 4: Login

Visit the login page:

```
http://localhost:3000/login
```

Use these demo credentials:

**Admin:**
- Email: `admin@school.com`
- Password: `admin123`

**Student:**
- Email: `student@school.com`
- Password: `student123`

## Step 5: Explore the Dashboard

After login, you'll be redirected to the dashboard where you can:
- View statistics
- Manage students
- Process payments
- Generate reports

## Common Issues

### Backend not starting

**Error:** Port 5000 already in use

**Solution:**
```bash
# Find process using port 5000
lsof -i :5000

# Kill the process
kill -9 <PID>
```

### CORS errors

**Error:** CORS policy blocked

**Solution:** Check your backend `.env` file has:
```env
CORS_ORIGIN=http://localhost:3000
```

### Connection refused

**Error:** ERR_CONNECTION_REFUSED

**Solution:**
1. Make sure backend is running
2. Check backend is on port 5000
3. Verify `NEXT_PUBLIC_API_URL` in `.env.local`

### Authentication errors

**Error:** 401 Unauthorized

**Solution:**
1. Clear browser localStorage: `localStorage.clear()`
2. Clear cookies
3. Try logging in again

## API Testing

You can test individual API endpoints using the examples:

```typescript
// In browser console or a test file
import { testConnection } from '@/lib/api-examples';

testConnection();
```

Or test specific endpoints:

```typescript
import { authApi, studentsApi, dashboardApi } from '@/lib/api';

// Test login
await authApi.login('admin@school.com', 'admin123');

// Test dashboard
await dashboardApi.getStats();

// Test students
await studentsApi.getAll({ page: 1, limit: 10 });
```

## Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── (auth)/            # Auth pages (login, register)
│   ├── (dashboard)/       # Dashboard pages
│   └── test-connection/   # Connection test page
├── components/            # React components
├── hooks/                 # Custom React hooks
├── lib/                   # Utilities and API
│   ├── api.ts            # Main API client
│   ├── api-examples.ts   # API usage examples
│   ├── auth.ts           # Auth utilities
│   ├── types.ts          # TypeScript types
│   └── validations.ts    # Form validations
└── store/                # State management
    └── auth.ts           # Auth store (Zustand)
```

## Next Steps

1. ✅ Test connection at `/test-connection`
2. ✅ Login with demo credentials
3. ✅ Explore the dashboard
4. 📝 Start building your features using the API
5. 📚 Read `INTEGRATION_GUIDE.md` for detailed API usage

## Need Help?

- Check `INTEGRATION_GUIDE.md` for detailed documentation
- Look at `src/lib/api-examples.ts` for API usage examples
- Check browser console for error messages
- Verify backend logs for server-side errors

## Development Tips

### Hot Reload

Both frontend and backend support hot reload:
- Frontend: Changes auto-reload
- Backend: Restart on file changes (if using nodemon)

### Debugging

**Frontend:**
- Open browser DevTools (F12)
- Check Console tab for errors
- Check Network tab for API calls

**Backend:**
- Check terminal for error logs
- Add console.log() statements
- Use a debugger (VS Code)

### Testing API Calls

Use the browser console to test API calls:

```javascript
// Get the API client
const { authApi } = await import('@/lib/api');

// Test login
const response = await authApi.login('admin@school.com', 'admin123');
console.log(response);
```

## Production Deployment

When deploying to production:

1. Update `NEXT_PUBLIC_API_URL` to your production backend URL
2. Update backend CORS to allow your production frontend URL
3. Use environment variables for sensitive data
4. Enable HTTPS for both frontend and backend
5. Set secure cookie flags in production

## Support

If you encounter issues:

1. Check this guide first
2. Read `INTEGRATION_GUIDE.md`
3. Check browser console and backend logs
4. Verify all environment variables are set correctly
