'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { paymentsApi, studentsApi, feeStructuresApi } from '@/lib/api';
import { useApi } from '@/hooks/useApi';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FormField } from '@/components/forms/FormField';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';

export default function RecordPaymentPage() {
  const router = useRouter();
  const [students, setStudents] = useState<Array<{ id: string; name: string }>>([]);
  const [feeStructures, setFeeStructures] = useState<Array<{ id: string; name: string; amount: number }>>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [selectedFeeStructure, setSelectedFeeStructure] = useState<string>('');
  const [selectedFeeStructureDetails, setSelectedFeeStructureDetails] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    student_id: '',
    fee_structure_id: '',
    amount_paid: '',
    payment_method: 'cash',
    payment_date: new Date().toISOString().split('T')[0],
    transaction_id: '',
    notes: '',
    bank_reference: '',
    cheque_number: '',
    cheque_date: '',
    bank_name: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Fetch students and fee structures
  const { loading: studentsLoading, execute: fetchStudents } = useApi(
    () => studentsApi.getAll({ limit: 100 }),
    {
      onSuccess: (response: any) => {
        let studentsData = [];
        if (response?.students) {
          studentsData = response.students;
        } else if (response?.data?.students) {
          studentsData = response.data.students;
        } else if (response?.data && Array.isArray(response.data)) {
          studentsData = response.data;
        }

        const formatted = studentsData.map((s: any) => ({
          id: s.id?.toString() || '',
          name: `${s.first_name || ''} ${s.last_name || ''} (${s.student_id || ''}) - Class ${s.class || ''}`,
        }));
        setStudents(formatted);
      },
    }
  );

  const { loading: feeStructuresLoading, execute: fetchFeeStructures } = useApi(
    () => feeStructuresApi.getAll({ limit: 100 }),
    {
      onSuccess: (response: any) => {
        let feeStructuresData = [];
        if (response?.feeStructures) {
          feeStructuresData = response.feeStructures;
        } else if (response?.data?.feeStructures) {
          feeStructuresData = response.data.feeStructures;
        } else if (response?.data && Array.isArray(response.data)) {
          feeStructuresData = response.data;
        }

        const formatted = feeStructuresData.map((fs: any) => ({
          id: fs.id?.toString() || '',
          name: `${fs.fee_type || 'Fee'} - Class ${fs.class || ''} - KES ${parseFloat(fs.amount || 0).toLocaleString()}`,
          amount: parseFloat(fs.amount || 0),
        }));
        setFeeStructures(formatted);
      },
    }
  );

  // Fetch on mount
  useEffect(() => {
    fetchStudents();
    fetchFeeStructures();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch fee structure details when selected
  useEffect(() => {
    if (selectedFeeStructure) {
      const fetchFeeStructureDetails = async () => {
        try {
          const response = await feeStructuresApi.getById(selectedFeeStructure);
          if (response.success && response.data) {
            const fs = response.data.feeStructure || response.data;
            setSelectedFeeStructureDetails(fs);
            // Auto-fill amount if not already set
            if (!formData.amount_paid && fs.amount) {
              setFormData((prev) => ({ ...prev, amount_paid: fs.amount.toString() }));
            }
          }
        } catch (error) {
          console.error('Failed to fetch fee structure details:', error);
        }
      };
      fetchFeeStructureDetails();
    } else {
      setSelectedFeeStructureDetails(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFeeStructure]);

  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }

    // Update selected values for dependent fields
    if (field === 'student_id') {
      setSelectedStudent(value);
    }
    if (field === 'fee_structure_id') {
      setSelectedFeeStructure(value);
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.student_id) {
      errors.student_id = 'Student is required';
    }
    if (!formData.fee_structure_id) {
      errors.fee_structure_id = 'Fee structure is required';
    }
    if (!formData.amount_paid || parseFloat(formData.amount_paid) <= 0) {
      errors.amount_paid = 'Amount must be greater than 0';
    }
    if (!formData.payment_date) {
      errors.payment_date = 'Payment date is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      setIsConfirmDialogOpen(true);
    }
  };

  const handleConfirmSubmit = async () => {
    setIsSubmitting(true);

    try {
      // Transform to backend format
      const backendData: any = {
        student_id: parseInt(formData.student_id),
        fee_structure_id: parseInt(formData.fee_structure_id),
        amount_paid: parseFloat(formData.amount_paid),
        payment_method: formData.payment_method,
        payment_date: formData.payment_date,
      };

      if (formData.transaction_id) backendData.transaction_id = formData.transaction_id;
      if (formData.notes) backendData.notes = formData.notes;
      if (formData.bank_reference) backendData.bank_reference = formData.bank_reference;
      if (formData.cheque_number) backendData.cheque_number = formData.cheque_number;
      if (formData.cheque_date) backendData.cheque_date = formData.cheque_date;
      if (formData.bank_name) backendData.bank_name = formData.bank_name;

      const response = await paymentsApi.create(backendData);

      if (response.success) {
        toast.success('Payment recorded successfully');
        setIsConfirmDialogOpen(false);
        // Reset form
        setFormData({
          student_id: '',
          fee_structure_id: '',
          amount_paid: '',
          payment_method: 'cash',
          payment_date: new Date().toISOString().split('T')[0],
          transaction_id: '',
          notes: '',
          bank_reference: '',
          cheque_number: '',
          cheque_date: '',
          bank_name: '',
        });
        setSelectedStudent('');
        setSelectedFeeStructure('');
        setSelectedFeeStructureDetails(null);
        setFormErrors({});
        // Optionally redirect to payments list
        // router.push('/admin/payments');
      }
    } catch (error: any) {
      console.error('Failed to create payment:', error);
      toast.error(error?.message || 'Failed to record payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateLateFee = (): number => {
    if (!selectedFeeStructureDetails || !formData.payment_date) return 0;
    
    const dueDate = new Date(selectedFeeStructureDetails.due_date);
    const paymentDate = new Date(formData.payment_date);
    const isOverdue = paymentDate > dueDate;
    
    if (isOverdue && selectedFeeStructureDetails.late_fee_amount) {
      return parseFloat(selectedFeeStructureDetails.late_fee_amount);
    }
    return 0;
  };

  const lateFee = calculateLateFee();
  const totalAmount = parseFloat(formData.amount_paid || '0') + lateFee;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/admin/payments')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Record Payment</h1>
            <p className="text-muted-foreground">
              Record a new payment transaction
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Form */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment Information</CardTitle>
              <CardDescription>
                Enter the payment details below. Fields marked with * are required.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Student and Fee Structure */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  name="student_id"
                  label="Student *"
                  type="select"
                  placeholder="Select student"
                  required
                  value={formData.student_id || undefined}
                  onChange={(value) => handleFieldChange('student_id', value)}
                  options={students.map((s) => ({ label: s.name, value: s.id }))}
                  disabled={studentsLoading}
                  error={formErrors.student_id}
                />
                <FormField
                  name="fee_structure_id"
                  label="Fee Structure *"
                  type="select"
                  placeholder="Select fee structure"
                  required
                  value={formData.fee_structure_id || undefined}
                  onChange={(value) => handleFieldChange('fee_structure_id', value)}
                  options={feeStructures.map((fs) => ({ label: fs.name, value: fs.id }))}
                  disabled={feeStructuresLoading}
                  error={formErrors.fee_structure_id}
                />
              </div>

              {/* Fee Structure Details */}
              {selectedFeeStructureDetails && (
                <Alert>
                  <AlertDescription>
                    <div className="space-y-1">
                      <p className="font-medium">
                        {selectedFeeStructureDetails.fee_type?.charAt(0).toUpperCase()}
                        {selectedFeeStructureDetails.fee_type?.slice(1)} Fee
                      </p>
                      <p className="text-sm">
                        Amount: KES {parseFloat(selectedFeeStructureDetails.amount || 0).toLocaleString()}
                      </p>
                      {selectedFeeStructureDetails.due_date && (
                        <p className="text-sm">
                          Due Date: {new Date(selectedFeeStructureDetails.due_date).toLocaleDateString()}
                        </p>
                      )}
                      {selectedFeeStructureDetails.late_fee_amount && (
                        <p className="text-sm">
                          Late Fee: KES {parseFloat(selectedFeeStructureDetails.late_fee_amount || 0).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Amount and Payment Method */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  name="amount_paid"
                  label="Amount Paid (KES) *"
                  type="number"
                  placeholder="Enter amount"
                  required
                  value={formData.amount_paid}
                  onChange={(value) => handleFieldChange('amount_paid', value)}
                  error={formErrors.amount_paid}
                />
                <FormField
                  name="payment_method"
                  label="Payment Method *"
                  type="select"
                  placeholder="Select payment method"
                  required
                  value={formData.payment_method}
                  onChange={(value) => handleFieldChange('payment_method', value)}
                  options={[
                    { label: 'Cash', value: 'cash' },
                    { label: 'Bank Transfer', value: 'bank_transfer' },
                    { label: 'Cheque', value: 'cheque' },
                    { label: 'Online', value: 'online' },
                    { label: 'Card', value: 'card' },
                    { label: 'Other', value: 'other' },
                  ]}
                  error={formErrors.payment_method}
                />
              </div>

              {/* Payment Date and Transaction ID */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  name="payment_date"
                  label="Payment Date *"
                  type="date"
                  placeholder="Select payment date"
                  required
                  value={formData.payment_date}
                  onChange={(value) => handleFieldChange('payment_date', value)}
                  error={formErrors.payment_date}
                />
                <FormField
                  name="transaction_id"
                  label="Transaction ID (Optional)"
                  type="text"
                  placeholder="Enter transaction ID"
                  value={formData.transaction_id}
                  onChange={(value) => handleFieldChange('transaction_id', value)}
                  error={formErrors.transaction_id}
                />
              </div>

              {/* Bank Transfer Fields */}
              {formData.payment_method === 'bank_transfer' && (
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    name="bank_reference"
                    label="Bank Reference"
                    type="text"
                    placeholder="Enter bank reference"
                    value={formData.bank_reference}
                    onChange={(value) => handleFieldChange('bank_reference', value)}
                  />
                  <FormField
                    name="bank_name"
                    label="Bank Name"
                    type="text"
                    placeholder="Enter bank name"
                    value={formData.bank_name}
                    onChange={(value) => handleFieldChange('bank_name', value)}
                  />
                </div>
              )}

              {/* Cheque Fields */}
              {formData.payment_method === 'cheque' && (
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    name="cheque_number"
                    label="Cheque Number"
                    type="text"
                    placeholder="Enter cheque number"
                    value={formData.cheque_number}
                    onChange={(value) => handleFieldChange('cheque_number', value)}
                  />
                  <FormField
                    name="cheque_date"
                    label="Cheque Date"
                    type="date"
                    placeholder="Select cheque date"
                    value={formData.cheque_date}
                    onChange={(value) => handleFieldChange('cheque_date', value)}
                  />
                </div>
              )}

              {/* Notes */}
              <div className="space-y-2">
                <Label>Notes (Optional)</Label>
                <Textarea
                  placeholder="Enter any additional notes..."
                  className="min-h-[100px]"
                  value={formData.notes}
                  onChange={(e) => handleFieldChange('notes', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Amount Paid:</span>
                  <span className="font-medium">
                    {formData.amount_paid ? `KES ${parseFloat(formData.amount_paid || '0').toLocaleString()}` : '-'}
                  </span>
                </div>
                {lateFee > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Late Fee:</span>
                    <span className="font-medium text-destructive">KES {lateFee.toLocaleString()}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between">
                  <span className="font-medium">Total Amount:</span>
                  <span className="font-bold text-lg">
                    {formData.amount_paid ? `KES ${totalAmount.toLocaleString()}` : '-'}
                  </span>
                </div>
              </div>

              {selectedFeeStructureDetails && formData.amount_paid && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Fee Details:</p>
                    <div className="text-xs space-y-1 text-muted-foreground">
                      <p>Fee Type: {selectedFeeStructureDetails.fee_type?.charAt(0).toUpperCase()}{selectedFeeStructureDetails.fee_type?.slice(1)}</p>
                      <p>Class: {selectedFeeStructureDetails.class}</p>
                      <p>Academic Year: {selectedFeeStructureDetails.academic_year}</p>
                      {selectedFeeStructureDetails.due_date && (
                        <p>
                          Due Date: {new Date(selectedFeeStructureDetails.due_date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </>
              )}

              {formData.payment_date && selectedFeeStructureDetails?.due_date && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Payment Status:</p>
                    {new Date(formData.payment_date) > new Date(selectedFeeStructureDetails.due_date) ? (
                      <p className="text-xs text-destructive font-medium">
                        Payment is overdue
                      </p>
                    ) : (
                      <p className="text-xs text-green-600 font-medium">
                        Payment is on time
                      </p>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="space-y-2">
            <Button
              onClick={handleSubmit}
              className="w-full"
              size="lg"
              disabled={isSubmitting || studentsLoading || feeStructuresLoading}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Recording...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Record Payment
                </>
              )}
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push('/admin/payments')}
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Payment</DialogTitle>
            <DialogDescription>
              Please review the payment details before submitting.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="rounded-lg border p-4 bg-muted/50 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Student:</span>
                <span className="text-sm font-medium">
                  {students.find((s) => s.id === formData.student_id)?.name || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Fee Structure:</span>
                <span className="text-sm font-medium">
                  {feeStructures.find((fs) => fs.id === formData.fee_structure_id)?.name || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Amount Paid:</span>
                <span className="text-sm font-medium">
                  KES {parseFloat(formData.amount_paid || '0').toLocaleString()}
                </span>
              </div>
              {lateFee > 0 && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Late Fee:</span>
                  <span className="text-sm font-medium text-destructive">
                    KES {lateFee.toLocaleString()}
                  </span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm font-medium">Total Amount:</span>
                <span className="text-sm font-bold">
                  KES {totalAmount.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Payment Method:</span>
                <span className="text-sm font-medium">
                  {formData.payment_method?.replace('_', ' ').toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Payment Date:</span>
                <span className="text-sm font-medium">
                  {formData.payment_date ? new Date(formData.payment_date).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsConfirmDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Recording...
                </>
              ) : (
                'Confirm & Record Payment'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}



