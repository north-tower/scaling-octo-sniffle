/**
 * API Integration Examples
 * 
 * This file contains example usage of all API endpoints
 * Use these examples as reference when implementing features
 */

import {
  authApi,
  studentsApi,
  paymentsApi,
  feeStructuresApi,
  dashboardApi,
  reportsApi,
} from './api';

// ============================================
// Authentication Examples
// ============================================

export const authExamples = {
  // Login user
  login: async () => {
    try {
      const response = await authApi.login('admin@school.com', 'admin123');
      console.log('Login successful:', response.data);
      return response.data;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  },

  // Register new user
  register: async () => {
    try {
      const response = await authApi.register({
        email: 'newuser@school.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        role: 'student',
      });
      console.log('Registration successful:', response.data);
      return response.data;
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  },

  // Get user profile
  getProfile: async () => {
    try {
      const response = await authApi.getProfile();
      console.log('Profile:', response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to get profile:', error);
      throw error;
    }
  },

  // Logout
  logout: async () => {
    try {
      await authApi.logout();
      console.log('Logout successful');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  },
};

// ============================================
// Dashboard Examples
// ============================================

export const dashboardExamples = {
  // Get dashboard statistics
  getStats: async () => {
    try {
      const response = await dashboardApi.getStats();
      console.log('Dashboard stats:', response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to get stats:', error);
      throw error;
    }
  },

  // Get recent payments
  getRecentPayments: async () => {
    try {
      const response = await dashboardApi.getRecentPayments();
      console.log('Recent payments:', response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to get recent payments:', error);
      throw error;
    }
  },

  // Get upcoming dues
  getUpcomingDues: async () => {
    try {
      const response = await dashboardApi.getUpcomingDues();
      console.log('Upcoming dues:', response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to get upcoming dues:', error);
      throw error;
    }
  },

  // Get collection trends
  getCollectionTrends: async () => {
    try {
      const response = await dashboardApi.getCollectionTrends();
      console.log('Collection trends:', response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to get collection trends:', error);
      throw error;
    }
  },
};

// ============================================
// Student Management Examples
// ============================================

export const studentExamples = {
  // Get all students with pagination
  getAllStudents: async (page = 1, limit = 10, search = '') => {
    try {
      const response = await studentsApi.getAll({ page, limit, search });
      console.log('Students:', response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to get students:', error);
      throw error;
    }
  },

  // Get student by ID
  getStudentById: async (id: string) => {
    try {
      const response = await studentsApi.getById(id);
      console.log('Student:', response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to get student:', error);
      throw error;
    }
  },

  // Create new student
  createStudent: async () => {
    try {
      const studentData = {
        studentId: 'STU2024001',
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: new Date('2010-01-01'),
        gender: 'male',
        address: '123 Main St',
        phone: '1234567890',
        email: 'john.doe@example.com',
        emergencyContact: 'Jane Doe',
        emergencyPhone: '0987654321',
        classId: 'class-id-here',
        admissionDate: new Date(),
      };
      const response = await studentsApi.create(studentData);
      console.log('Student created:', response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to create student:', error);
      throw error;
    }
  },

  // Update student
  updateStudent: async (id: string) => {
    try {
      const updateData = {
        phone: '9876543210',
        address: '456 New St',
      };
      const response = await studentsApi.update(id, updateData);
      console.log('Student updated:', response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to update student:', error);
      throw error;
    }
  },

  // Get student fees
  getStudentFees: async (id: string) => {
    try {
      const response = await studentsApi.getFees(id);
      console.log('Student fees:', response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to get student fees:', error);
      throw error;
    }
  },

  // Get student payments
  getStudentPayments: async (id: string) => {
    try {
      const response = await studentsApi.getPayments(id);
      console.log('Student payments:', response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to get student payments:', error);
      throw error;
    }
  },
};

// ============================================
// Fee Structure Examples
// ============================================

export const feeStructureExamples = {
  // Get all fee structures
  getAllFeeStructures: async () => {
    try {
      const response = await feeStructuresApi.getAll();
      console.log('Fee structures:', response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to get fee structures:', error);
      throw error;
    }
  },

  // Create fee structure
  createFeeStructure: async () => {
    try {
      const feeData = {
        name: 'Tuition Fee - Grade 10',
        description: 'Annual tuition fee for grade 10',
        amount: 50000,
        feeType: 'tuition',
        classId: 'class-id-here',
        academicYearId: 'academic-year-id',
        dueDate: new Date('2024-04-30'),
        isRecurring: false,
      };
      const response = await feeStructuresApi.create(feeData);
      console.log('Fee structure created:', response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to create fee structure:', error);
      throw error;
    }
  },

  // Assign fees to students
  assignFeesToStudents: async () => {
    try {
      const assignData = {
        feeStructureIds: ['fee-structure-id-1', 'fee-structure-id-2'],
        studentIds: ['student-id-1', 'student-id-2'],
        dueDate: new Date('2024-04-30'),
      };
      const response = await feeStructuresApi.assignToStudents(assignData);
      console.log('Fees assigned:', response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to assign fees:', error);
      throw error;
    }
  },
};

// ============================================
// Payment Examples
// ============================================

export const paymentExamples = {
  // Get all payments
  getAllPayments: async (filters = {}) => {
    try {
      const response = await paymentsApi.getAll(filters);
      console.log('Payments:', response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to get payments:', error);
      throw error;
    }
  },

  // Create payment
  createPayment: async () => {
    try {
      const paymentData = {
        studentId: 'student-id-here',
        feeIds: ['fee-id-1', 'fee-id-2'],
        amount: 10000,
        paymentMethod: 'cash',
        paymentDate: new Date(),
        referenceNumber: 'REF123456',
        notes: 'Payment for tuition fee',
      };
      const response = await paymentsApi.create(paymentData);
      console.log('Payment created:', response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to create payment:', error);
      throw error;
    }
  },

  // Get payment receipt
  getPaymentReceipt: async (id: string) => {
    try {
      await paymentsApi.getReceipt(id);
      console.log('Receipt downloaded');
    } catch (error) {
      console.error('Failed to download receipt:', error);
      throw error;
    }
  },
};

// ============================================
// Report Examples
// ============================================

export const reportExamples = {
  // Get fee collection report
  getFeeCollectionReport: async () => {
    try {
      const params = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        classId: 'class-id-here', // optional
      };
      const response = await reportsApi.getFeeCollection(params);
      console.log('Fee collection report:', response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to get fee collection report:', error);
      throw error;
    }
  },

  // Get outstanding fees report
  getOutstandingFeesReport: async () => {
    try {
      const response = await reportsApi.getOutstandingFees();
      console.log('Outstanding fees report:', response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to get outstanding fees report:', error);
      throw error;
    }
  },

  // Get defaulters report
  getDefaultersReport: async () => {
    try {
      const response = await reportsApi.getDefaulters();
      console.log('Defaulters report:', response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to get defaulters report:', error);
      throw error;
    }
  },

  // Export report
  exportReport: async () => {
    try {
      const params = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      };
      await reportsApi.exportReport('fee-collection', params, 'pdf');
      console.log('Report exported');
    } catch (error) {
      console.error('Failed to export report:', error);
      throw error;
    }
  },
};

// ============================================
// Testing Connection
// ============================================

export const testConnection = async () => {
  console.log('Testing backend connection...');
  
  try {
    // Test 1: Login
    console.log('\n1. Testing login...');
    await authApi.login('admin@school.com', 'admin123');
    console.log('✓ Login successful');

    // Test 2: Get dashboard stats
    console.log('\n2. Testing dashboard stats...');
    await dashboardApi.getStats();
    console.log('✓ Dashboard stats retrieved');

    // Test 3: Get students
    console.log('\n3. Testing get students...');
    await studentsApi.getAll({ page: 1, limit: 10 });
    console.log('✓ Students retrieved');

    console.log('\n✓ All tests passed! Backend connection is working.');
    return true;
  } catch (error) {
    console.error('\n✗ Connection test failed:', error);
    return false;
  }
};
