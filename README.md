# Fee Management System Frontend

A comprehensive, modern fee management system built with Next.js 14, TypeScript, and Tailwind CSS. This system provides intuitive interfaces for administrators, accountants, students, and parents to manage fee records, payments, and generate reports.

## 🚀 Features

### Core Functionality
- **Multi-role Authentication**: Admin, Accountant, Student, and Parent portals
- **Student Management**: Complete CRUD operations for student records
- **Fee Structure Management**: Flexible fee types and structures
- **Payment Processing**: Record and track payments with multiple methods
- **Comprehensive Reporting**: Generate detailed reports with PDF export
- **Dashboard Analytics**: Real-time statistics and charts
- **Responsive Design**: Mobile-first approach with modern UI/UX

### Technical Features
- **Next.js 14** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **shadcn/ui** component library
- **Zustand** for state management
- **React Hook Form** with Zod validation
- **TanStack Table** for advanced data tables
- **Recharts** for data visualization
- **Axios** for API communication

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Backend API server (see backend repository)

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd fee-management-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Update the environment variables in `.env.local`:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   NEXT_PUBLIC_APP_ENV=development
   NEXTAUTH_SECRET=your-secret-key-here
   NEXTAUTH_URL=http://localhost:3000
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🏗️ Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Authentication routes
│   │   ├── login/
│   │   └── layout.tsx
│   ├── (dashboard)/              # Protected dashboard routes
│   │   ├── admin/                # Admin portal
│   │   ├── student/              # Student portal
│   │   ├── parent/               # Parent portal
│   │   └── layout.tsx
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/                   # Reusable components
│   ├── ui/                       # shadcn/ui components
│   ├── forms/                    # Form components
│   ├── tables/                   # Data table components
│   ├── charts/                   # Chart components
│   ├── layout/                   # Layout components
│   └── shared/                   # Shared components
├── hooks/                        # Custom React hooks
├── lib/                          # Utilities and configurations
│   ├── api.ts                    # API client
│   ├── auth.ts                   # Authentication utilities
│   ├── types.ts                  # TypeScript types
│   ├── validations.ts            # Zod schemas
│   └── utils.ts                  # Utility functions
└── store/                        # State management
    └── auth.ts                   # Authentication store
```

## 🎨 UI Components

### Layout Components
- **Sidebar**: Role-based navigation with collapsible sections
- **Header**: Search, notifications, and user menu
- **Breadcrumbs**: Navigation trail
- **DashboardLayout**: Main layout wrapper

### Form Components
- **FormField**: Reusable form field with validation
- **DataTable**: Advanced table with sorting, filtering, pagination
- **Charts**: Bar, Pie, and Line charts with Recharts

### Shared Components
- **StatsCard**: Dashboard statistics display
- **LoadingSpinner**: Loading states
- **EmptyState**: Empty state handling

## 🔐 Authentication

The system uses JWT-based authentication with role-based access control:

- **Admin**: Full system access
- **Accountant**: Payment and reporting access
- **Student**: Personal fee and payment view
- **Parent**: Children's fee management

### Demo Credentials
```
Admin: admin@school.com / admin123
Student: student@school.com / student123
Parent: parent@school.com / parent123
Accountant: accountant@school.com / accountant123
```

## 📊 Dashboard Features

### Admin Dashboard
- **Statistics Cards**: Total students, fees, collections, defaulters
- **Charts**: Monthly collection trends, fee type breakdown, class-wise data
- **Recent Activities**: Latest payments and registrations
- **Upcoming Dues**: Fees due in next 7 days

### Student Portal
- **Fee Summary**: Personal fee overview
- **Payment History**: Transaction timeline
- **Receipt Download**: Access to payment receipts

### Parent Portal
- **Children Overview**: Multiple children management
- **Combined Summary**: Total fees across children
- **Payment Management**: Make payments on behalf of children

## 🛠️ Development

### Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run type-check   # TypeScript type checking

# Testing
npm run test         # Run tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage
```

### Code Style

The project uses:
- **ESLint** for code linting
- **Prettier** for code formatting
- **TypeScript** for type checking
- **Husky** for git hooks

### Adding New Features

1. **Create Types**: Add interfaces in `src/lib/types.ts`
2. **Add Validation**: Create Zod schemas in `src/lib/validations.ts`
3. **API Integration**: Add API functions in `src/lib/api.ts`
4. **Create Components**: Build reusable components in `src/components/`
5. **Add Pages**: Create pages in `src/app/`

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect Repository**
   - Import project to Vercel
   - Connect your GitHub repository

2. **Configure Environment Variables**
   ```
   NEXT_PUBLIC_API_URL=https://your-api-domain.com/api
   NEXTAUTH_SECRET=your-production-secret
   NEXTAUTH_URL=https://your-domain.com
   ```

3. **Deploy**
   - Vercel will automatically deploy on push to main branch

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- **Netlify**
- **Railway**
- **DigitalOcean App Platform**
- **AWS Amplify**

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:5000/api` |
| `NEXT_PUBLIC_APP_ENV` | Environment | `development` |
| `NEXTAUTH_SECRET` | Auth secret key | Required |
| `NEXTAUTH_URL` | App URL | `http://localhost:3000` |

### Tailwind Configuration

The project uses a custom Tailwind configuration with:
- **CSS Variables** for theming
- **Custom Animations** for smooth transitions
- **Extended Color Palette** for consistent design
- **Responsive Breakpoints** for mobile-first design

## 📱 Responsive Design

The application is fully responsive with:
- **Mobile-first** approach
- **Touch-friendly** interfaces
- **Adaptive layouts** for different screen sizes
- **Progressive Web App** capabilities

## 🧪 Testing

### Test Structure
```
tests/
├── components/           # Component tests
├── pages/               # Page tests
├── hooks/               # Hook tests
└── utils/               # Utility tests
```

### Running Tests
```bash
npm run test              # Run all tests
npm run test:watch        # Watch mode
npm run test:coverage     # Coverage report
```

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit your changes**
   ```bash
   git commit -m 'Add amazing feature'
   ```
4. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open a Pull Request**

### Development Guidelines

- Follow the existing code style
- Write tests for new features
- Update documentation
- Ensure responsive design
- Test across different browsers

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- **Issues**: Create an issue on GitHub
- **Documentation**: Check the wiki
- **Email**: support@feemanagement.com

## 🙏 Acknowledgments

- **shadcn/ui** for the component library
- **Tailwind CSS** for the styling framework
- **Next.js** team for the amazing framework
- **Vercel** for the deployment platform

---

**Built with ❤️ for educational institutions worldwide**