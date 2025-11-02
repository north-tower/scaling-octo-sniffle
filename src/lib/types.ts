// Core Types and Interfaces for Fee Management System

export type UserRole = 'admin' | 'student' | 'parent' | 'accountant';

export type PaymentStatus = 'pending' | 'paid' | 'overdue' | 'cancelled';

export type PaymentMethod = 'cash' | 'bank_transfer' | 'cheque' | 'online' | 'card';

export type FeeType = 'tuition' | 'transport' | 'library' | 'sports' | 'exam' | 'other';

export type AcademicYear = {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type Class = {
  id: string;
  name: string;
  grade: number;
  section: string;
  academicYearId: string;
  academicYear?: AcademicYear;
  createdAt: Date;
  updatedAt: Date;
};

export type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  avatar?: string;
  phone?: string;
  address?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type Student = {
  id: string;
  studentId: string; // Unique student identifier
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  gender: 'male' | 'female' | 'other';
  bloodGroup?: string;
  address: string;
  phone: string;
  email?: string;
  emergencyContact: string;
  emergencyPhone: string;
  classId: string;
  class?: Class;
  parentId?: string;
  parent?: Parent;
  admissionDate: Date;
  isActive: boolean;
  avatar?: string;
  documents?: Document[];
  createdAt: Date;
  updatedAt: Date;
};

export type Parent = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  occupation?: string;
  address: string;
  relationship: 'father' | 'mother' | 'guardian' | 'other';
  students: Student[];
  createdAt: Date;
  updatedAt: Date;
};

export type Document = {
  id: string;
  name: string;
  type: 'birth_certificate' | 'admission_form' | 'photo' | 'medical_certificate' | 'other';
  url: string;
  studentId: string;
  uploadedAt: Date;
};

export type FeeStructure = {
  id: string;
  name: string;
  description?: string;
  amount: number;
  feeType: FeeType;
  classId: string;
  class?: Class;
  academicYearId: string;
  academicYear?: AcademicYear;
  dueDate: Date;
  lateFeeAmount?: number;
  lateFeeDays?: number;
  isRecurring: boolean;
  recurringInterval?: 'monthly' | 'quarterly' | 'yearly';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type Fee = {
  id: string;
  studentId: string;
  student?: Student;
  feeStructureId: string;
  feeStructure?: FeeStructure;
  amount: number;
  dueDate: Date;
  status: PaymentStatus;
  paidAmount: number;
  remainingAmount: number;
  lateFeeAmount?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type Payment = {
  id: string;
  feeId: string;
  fee?: Fee;
  studentId: string;
  student?: Student;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentDate: Date;
  receiptNumber: string;
  referenceNumber?: string;
  notes?: string;
  receiptUrl?: string;
  recordedBy: string;
  recordedByUser?: User;
  createdAt: Date;
  updatedAt: Date;
};

export type PaymentReceipt = {
  id: string;
  paymentId: string;
  payment?: Payment;
  receiptNumber: string;
  pdfUrl: string;
  generatedAt: Date;
};

// Dashboard Statistics Types
export type DashboardStats = {
  totalStudents: number;
  totalFees: number;
  collectedAmount: number;
  pendingAmount: number;
  overdueAmount: number;
  defaultersCount: number;
  monthlyCollection: MonthlyCollection[];
  feeTypeBreakdown: FeeTypeBreakdown[];
  classWiseCollection: ClassWiseCollection[];
};

export type MonthlyCollection = {
  month: string;
  amount: number;
  count: number;
};

export type FeeTypeBreakdown = {
  feeType: FeeType;
  amount: number;
  count: number;
};

export type ClassWiseCollection = {
  className: string;
  totalAmount: number;
  collectedAmount: number;
  pendingAmount: number;
};

// Report Types
export type FeeCollectionReport = {
  startDate: Date;
  endDate: Date;
  totalCollected: number;
  totalPending: number;
  payments: Payment[];
  summary: {
    byClass: ClassWiseCollection[];
    byFeeType: FeeTypeBreakdown[];
    byMonth: MonthlyCollection[];
  };
};

export type OutstandingFeesReport = {
  totalOutstanding: number;
  students: Array<{
    student: Student;
    fees: Fee[];
    totalOutstanding: number;
  }>;
};

export type PaymentHistoryReport = {
  startDate: Date;
  endDate: Date;
  payments: Payment[];
  summary: {
    totalAmount: number;
    totalCount: number;
    byMethod: Array<{
      method: PaymentMethod;
      amount: number;
      count: number;
    }>;
  };
};

export type DefaultersReport = {
  overdueFees: Array<{
    fee: Fee;
    daysOverdue: number;
    lateFeeAmount: number;
  }>;
  totalOverdueAmount: number;
  totalLateFeeAmount: number;
};

// Form Types
export type CreateStudentForm = {
  studentId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  gender: 'male' | 'female' | 'other';
  bloodGroup?: string;
  address: string;
  phone: string;
  email?: string;
  emergencyContact: string;
  emergencyPhone: string;
  classId: string;
  parentId?: string;
  admissionDate: Date;
};

export type UpdateStudentForm = Partial<CreateStudentForm>;

export type CreateParentForm = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  occupation?: string;
  address: string;
  relationship: 'father' | 'mother' | 'guardian' | 'other';
};

export type CreateFeeStructureForm = {
  name: string;
  description?: string;
  amount: number;
  feeType: FeeType;
  classId: string;
  academicYearId: string;
  dueDate: Date;
  lateFeeAmount?: number;
  lateFeeDays?: number;
  isRecurring: boolean;
  recurringInterval?: 'monthly' | 'quarterly' | 'yearly';
};

export type CreatePaymentForm = {
  studentId: string;
  feeIds: string[];
  amount: number;
  paymentMethod: PaymentMethod;
  paymentDate: Date;
  referenceNumber?: string;
  notes?: string;
};

export type AssignFeesForm = {
  feeStructureIds: string[];
  studentIds: string[];
  dueDate: Date;
};

// API Response Types
export type ApiResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
};

export type PaginatedResponse<T> = {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type SearchParams = {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, any>;
};

// Authentication Types
export type LoginForm = {
  email: string;
  password: string;
};

export type AuthUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  avatar?: string;
  token: string;
  refreshToken: string;
  expiresAt: Date;
};

export type AuthState = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
};

// Notification Types
export type Notification = {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: Date;
  userId: string;
};

// File Upload Types
export type FileUpload = {
  file: File;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  url?: string;
  error?: string;
};

// Chart Data Types
export type ChartData = {
  name: string;
  value: number;
  color?: string;
};

export type LineChartData = {
  name: string;
  data: Array<{
    x: string;
    y: number;
  }>;
};

// Table Types
export type TableColumn<T> = {
  key: keyof T;
  title: string;
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
};

export type TableAction<T> = {
  label: string;
  onClick: (row: T) => void;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  icon?: React.ReactNode;
};

// Filter Types
export type FilterOption = {
  label: string;
  value: string;
  count?: number;
};

export type FilterConfig = {
  key: string;
  label: string;
  type: 'select' | 'multiselect' | 'date' | 'daterange' | 'number' | 'text';
  options?: FilterOption[];
  placeholder?: string;
};

// Export Types
export type ExportFormat = 'pdf' | 'excel' | 'csv';

export type ExportOptions = {
  format: ExportFormat;
  includeCharts?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
  filters?: Record<string, any>;
};

// Settings Types
export type AppSettings = {
  schoolName: string;
  schoolLogo?: string;
  schoolAddress: string;
  schoolPhone: string;
  schoolEmail: string;
  currency: string;
  timezone: string;
  academicYear: string;
  lateFeePercentage: number;
  receiptPrefix: string;
  autoGenerateReceipts: boolean;
};

export type UserSettings = {
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  dashboard: {
    defaultView: 'overview' | 'detailed';
    refreshInterval: number;
  };
};

// Error Types
export type ApiError = {
  message: string;
  code?: string;
  details?: Record<string, any>;
  statusCode: number;
};

export type ValidationError = {
  field: string;
  message: string;
};

// Utility Types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Component Props Types
export type BaseComponentProps = {
  className?: string;
  children?: React.ReactNode;
};

export type FormComponentProps<T> = BaseComponentProps & {
  onSubmit: (data: T) => void;
  onCancel?: () => void;
  isLoading?: boolean;
  defaultValues?: Partial<T>;
};

export type TableComponentProps<T> = BaseComponentProps & {
  data: T[];
  columns: TableColumn<T>[];
  actions?: TableAction<T>[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    onPageChange: (page: number) => void;
  };
  loading?: boolean;
  searchable?: boolean;
  filterable?: boolean;
  selectable?: boolean;
  onSelectionChange?: (selectedRows: T[]) => void;
};

export type ChartComponentProps = BaseComponentProps & {
  data: ChartData[] | LineChartData[];
  type: 'bar' | 'line' | 'pie' | 'area';
  title?: string;
  subtitle?: string;
  height?: number;
  showLegend?: boolean;
  showTooltip?: boolean;
};

