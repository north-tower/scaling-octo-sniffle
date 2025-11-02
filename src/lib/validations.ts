import { z } from 'zod';

// Authentication Schemas
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Student Schemas
export const createStudentSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  dateOfBirth: z.date({
    required_error: 'Date of birth is required',
  }),
  gender: z.enum(['male', 'female', 'other'], {
    required_error: 'Gender is required',
  }),
  bloodGroup: z.string().optional(),
  address: z.string().min(1, 'Address is required'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  emergencyContact: z.string().min(1, 'Emergency contact is required'),
  emergencyPhone: z.string().min(10, 'Emergency phone must be at least 10 digits'),
  classId: z.string().min(1, 'Class is required'),
  parentId: z.string().optional(),
  admissionDate: z.date({
    required_error: 'Admission date is required',
  }),
});

export const updateStudentSchema = createStudentSchema.partial();

// Parent Schemas
export const createParentSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  occupation: z.string().optional(),
  address: z.string().min(1, 'Address is required'),
  relationship: z.enum(['father', 'mother', 'guardian', 'other'], {
    required_error: 'Relationship is required',
  }),
});

export const updateParentSchema = createParentSchema.partial();

// Fee Structure Schemas
export const createFeeStructureSchema = z.object({
  name: z.string().min(1, 'Fee name is required'),
  description: z.string().optional(),
  amount: z.number().min(0, 'Amount must be positive'),
  feeType: z.enum(['tuition', 'transport', 'library', 'sports', 'exam', 'other'], {
    required_error: 'Fee type is required',
  }),
  classId: z.string().min(1, 'Class is required'),
  academicYearId: z.string().min(1, 'Academic year is required'),
  dueDate: z.date({
    required_error: 'Due date is required',
  }),
  lateFeeAmount: z.number().min(0, 'Late fee amount must be positive').optional(),
  lateFeeDays: z.number().min(0, 'Late fee days must be positive').optional(),
  isRecurring: z.boolean().default(false),
  recurringInterval: z.enum(['monthly', 'quarterly', 'yearly']).optional(),
});

export const updateFeeStructureSchema = createFeeStructureSchema.partial();

// Payment Schemas
export const createPaymentSchema = z.object({
  studentId: z.string().min(1, 'Student is required'),
  feeIds: z.array(z.string()).min(1, 'At least one fee is required'),
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  paymentMethod: z.enum(['cash', 'bank_transfer', 'cheque', 'online', 'card'], {
    required_error: 'Payment method is required',
  }),
  paymentDate: z.date({
    required_error: 'Payment date is required',
  }),
  referenceNumber: z.string().optional(),
  notes: z.string().optional(),
});

export const updatePaymentSchema = createPaymentSchema.partial();

// Fee Assignment Schema
export const assignFeesSchema = z.object({
  feeStructureIds: z.array(z.string()).min(1, 'At least one fee structure is required'),
  studentIds: z.array(z.string()).min(1, 'At least one student is required'),
  dueDate: z.date({
    required_error: 'Due date is required',
  }),
});

// Class Schema
export const createClassSchema = z.object({
  name: z.string().min(1, 'Class name is required'),
  grade: z.number().min(1, 'Grade must be at least 1'),
  section: z.string().min(1, 'Section is required'),
  academicYearId: z.string().min(1, 'Academic year is required'),
});

export const updateClassSchema = createClassSchema.partial();

// Academic Year Schema
export const createAcademicYearSchema = z.object({
  name: z.string().min(1, 'Academic year name is required'),
  startDate: z.date({
    required_error: 'Start date is required',
  }),
  endDate: z.date({
    required_error: 'End date is required',
  }),
}).refine((data) => data.endDate > data.startDate, {
  message: "End date must be after start date",
  path: ["endDate"],
});

export const updateAcademicYearSchema = createAcademicYearSchema.partial();

// Search and Filter Schemas
export const searchParamsSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  filters: z.record(z.any()).optional(),
});

// Report Schemas
export const reportParamsSchema = z.object({
  startDate: z.date({
    required_error: 'Start date is required',
  }),
  endDate: z.date({
    required_error: 'End date is required',
  }),
  classId: z.string().optional(),
  feeType: z.string().optional(),
  paymentMethod: z.string().optional(),
}).refine((data) => data.endDate >= data.startDate, {
  message: "End date must be after or equal to start date",
  path: ["endDate"],
});

// File Upload Schema
export const fileUploadSchema = z.object({
  file: z.instanceof(File, {
    message: 'File is required',
  }),
  type: z.enum(['birth_certificate', 'admission_form', 'photo', 'medical_certificate', 'other']),
  studentId: z.string().min(1, 'Student ID is required'),
});

// Settings Schemas
export const appSettingsSchema = z.object({
  schoolName: z.string().min(1, 'School name is required'),
  schoolLogo: z.string().optional(),
  schoolAddress: z.string().min(1, 'School address is required'),
  schoolPhone: z.string().min(1, 'School phone is required'),
  schoolEmail: z.string().email('Invalid email address'),
  currency: z.string().min(1, 'Currency is required'),
  timezone: z.string().min(1, 'Timezone is required'),
  academicYear: z.string().min(1, 'Academic year is required'),
  lateFeePercentage: z.number().min(0).max(100, 'Late fee percentage must be between 0 and 100'),
  receiptPrefix: z.string().min(1, 'Receipt prefix is required'),
  autoGenerateReceipts: z.boolean().default(true),
});

export const userSettingsSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).default('system'),
  language: z.string().default('en'),
  notifications: z.object({
    email: z.boolean().default(true),
    sms: z.boolean().default(false),
    push: z.boolean().default(true),
  }),
  dashboard: z.object({
    defaultView: z.enum(['overview', 'detailed']).default('overview'),
    refreshInterval: z.number().min(30).max(300).default(60),
  }),
});

// Bulk Operations Schema
export const bulkUpdateSchema = z.object({
  ids: z.array(z.string()).min(1, 'At least one item is required'),
  updates: z.record(z.any()),
});

export const bulkDeleteSchema = z.object({
  ids: z.array(z.string()).min(1, 'At least one item is required'),
});

// Export Schema
export const exportOptionsSchema = z.object({
  format: z.enum(['pdf', 'excel', 'csv']),
  includeCharts: z.boolean().default(false),
  dateRange: z.object({
    start: z.date(),
    end: z.date(),
  }).optional(),
  filters: z.record(z.any()).optional(),
});

// Notification Schema
export const createNotificationSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  message: z.string().min(1, 'Message is required'),
  type: z.enum(['info', 'success', 'warning', 'error']).default('info'),
  userId: z.string().min(1, 'User ID is required'),
});

// Form validation helpers
export const validateEmail = (email: string): boolean => {
  return z.string().email().safeParse(email).success;
};

export const validatePhone = (phone: string): boolean => {
  return z.string().min(10).safeParse(phone).success;
};

export const validateAmount = (amount: number): boolean => {
  return z.number().min(0).safeParse(amount).success;
};

// Custom validation functions
export const validateStudentId = (studentId: string): boolean => {
  // Custom validation for student ID format (e.g., STU2024001)
  const studentIdRegex = /^STU\d{6}$/;
  return studentIdRegex.test(studentId);
};

export const validateReceiptNumber = (receiptNumber: string): boolean => {
  // Custom validation for receipt number format (e.g., RCP2024001)
  const receiptRegex = /^RCP\d{6}$/;
  return receiptRegex.test(receiptNumber);
};

// Schema for form field validation
export const fieldValidationSchema = z.object({
  required: z.boolean().default(false),
  minLength: z.number().optional(),
  maxLength: z.number().optional(),
  pattern: z.string().optional(),
  customValidator: z.function().optional(),
});

// Type exports for use in components
export type LoginFormData = z.infer<typeof loginSchema>;
export type CreateStudentFormData = z.infer<typeof createStudentSchema>;
export type UpdateStudentFormData = z.infer<typeof updateStudentSchema>;
export type CreateParentFormData = z.infer<typeof createParentSchema>;
export type UpdateParentFormData = z.infer<typeof updateParentSchema>;
export type CreateFeeStructureFormData = z.infer<typeof createFeeStructureSchema>;
export type UpdateFeeStructureFormData = z.infer<typeof updateFeeStructureSchema>;
export type CreatePaymentFormData = z.infer<typeof createPaymentSchema>;
export type UpdatePaymentFormData = z.infer<typeof updatePaymentSchema>;
export type AssignFeesFormData = z.infer<typeof assignFeesSchema>;
export type CreateClassFormData = z.infer<typeof createClassSchema>;
export type UpdateClassFormData = z.infer<typeof updateClassSchema>;
export type CreateAcademicYearFormData = z.infer<typeof createAcademicYearSchema>;
export type UpdateAcademicYearFormData = z.infer<typeof updateAcademicYearSchema>;
export type SearchParamsData = z.infer<typeof searchParamsSchema>;
export type ReportParamsData = z.infer<typeof reportParamsSchema>;
export type FileUploadFormData = z.infer<typeof fileUploadSchema>;
export type AppSettingsFormData = z.infer<typeof appSettingsSchema>;
export type UserSettingsFormData = z.infer<typeof userSettingsSchema>;
export type BulkUpdateFormData = z.infer<typeof bulkUpdateSchema>;
export type BulkDeleteFormData = z.infer<typeof bulkDeleteSchema>;
export type ExportOptionsFormData = z.infer<typeof exportOptionsSchema>;
export type CreateNotificationFormData = z.infer<typeof createNotificationSchema>;
export type FieldValidationData = z.infer<typeof fieldValidationSchema>;

