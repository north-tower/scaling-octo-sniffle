'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft,
  Loader2,
  Download,
  Printer,
  CheckCircle,
  Calendar,
  DollarSign,
  FileText,
  User,
  GraduationCap,
  CreditCard
} from 'lucide-react';
import { parentPortalApi } from '@/lib/api';
import { useApi } from '@/hooks/useApi';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { useRouter, useParams } from 'next/navigation';
import { EmptyState } from '@/components/shared/EmptyState';

export default function ReceiptPage() {
  const router = useRouter();
  const params = useParams();
  const childId = params?.childId as string;
  const paymentId = params?.paymentId as string;
  
  const [receiptData, setReceiptData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Fetch receipt data
  useEffect(() => {
    const fetchReceipt = async () => {
      if (!childId || !paymentId) return;
      
      try {
        setLoading(true);
        const response = await parentPortalApi.getChildReceipt(childId, paymentId);
        const data = response?.data || response;
        if (data) {
          setReceiptData(data);
        }
      } catch (error) {
        console.error('Failed to fetch receipt:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReceipt();
  }, [childId, paymentId]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // For now, just trigger print which allows saving as PDF
    // In a real app, you might want to generate a PDF on the server
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!receiptData || !receiptData.payment) {
    return (
      <div className="space-y-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/parent/children/${childId}`)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <EmptyState
          title="Receipt not found"
          description="The receipt you're looking for doesn't exist or you don't have access to view it."
          icon={FileText}
        />
      </div>
    );
  }

  const { payment, child } = receiptData;
  const paymentDate = payment.payment_date 
    ? new Date(payment.payment_date) 
    : payment.created_at 
    ? new Date(payment.created_at)
    : new Date();
  const feeStructure = payment.feeStructure || {};

  return (
    <div className="space-y-6">
      {/* Action Buttons - Hidden when printing */}
      <div className="flex items-center justify-between print:hidden">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/parent/children/${childId}/payments`)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Payments
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
          <Button onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
        </div>
      </div>

      {/* Receipt Card - Print-friendly */}
      <Card className="max-w-3xl mx-auto print:shadow-none print:border-0">
        <CardContent className="p-8 print:p-8">
          {/* Receipt Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">PAYMENT RECEIPT</h1>
            <p className="text-muted-foreground">Official Payment Confirmation</p>
          </div>

          <Separator className="my-6" />

          {/* Receipt Details */}
          <div className="space-y-6">
            {/* Receipt Number */}
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">Receipt Number</p>
                <p className="text-xl font-bold font-mono">{payment.receipt_number || 'N/A'}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Date</p>
                <p className="text-lg font-semibold">{format(paymentDate, 'PPP')}</p>
              </div>
            </div>

            <Separator />

            {/* Student Information */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <User className="h-4 w-4" />
                Student Information
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Name</p>
                  <p className="font-medium">{child.name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Student ID</p>
                  <p className="font-medium">{child.student_id || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Class</p>
                  <p className="font-medium">
                    {child.class || 'N/A'} {child.section ? `- ${child.section}` : ''}
                  </p>
                </div>
                {child.roll_number && (
                  <div>
                    <p className="text-muted-foreground">Roll Number</p>
                    <p className="font-medium">{child.roll_number}</p>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Payment Details */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Payment Details
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">Fee Type</p>
                    <p className="font-semibold">{feeStructure.fee_type || 'Fee Payment'}</p>
                    {feeStructure.academic_year && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Academic Year: {feeStructure.academic_year}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Amount Paid</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(payment.amount_paid || 0)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Payment Method</p>
                    <p className="font-medium capitalize">{payment.payment_method || 'N/A'}</p>
                  </div>
                  {payment.transaction_id && (
                    <div>
                      <p className="text-muted-foreground">Transaction ID</p>
                      <p className="font-medium font-mono text-xs">{payment.transaction_id}</p>
                    </div>
                  )}
                </div>

                {payment.late_fee_paid && parseFloat(payment.late_fee_paid) > 0 && (
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-muted-foreground">Late Fee</p>
                      <p className="font-semibold text-yellow-800 dark:text-yellow-200">
                        {formatCurrency(payment.late_fee_paid)}
                      </p>
                    </div>
                  </div>
                )}

                {payment.discount_applied && parseFloat(payment.discount_applied) > 0 && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-muted-foreground">Discount Applied</p>
                      <p className="font-semibold text-blue-800 dark:text-blue-200">
                        -{formatCurrency(payment.discount_applied)}
                      </p>
                    </div>
                  </div>
                )}

                {payment.bank_reference && (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Bank Reference</p>
                      <p className="font-medium">{payment.bank_reference}</p>
                    </div>
                    {payment.bank_name && (
                      <div>
                        <p className="text-muted-foreground">Bank Name</p>
                        <p className="font-medium">{payment.bank_name}</p>
                      </div>
                    )}
                  </div>
                )}

                {payment.cheque_number && (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Cheque Number</p>
                      <p className="font-medium">{payment.cheque_number}</p>
                    </div>
                    {payment.cheque_date && (
                      <div>
                        <p className="text-muted-foreground">Cheque Date</p>
                        <p className="font-medium">
                          {format(new Date(payment.cheque_date), 'PPP')}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Payment Summary */}
            <div className="bg-muted p-4 rounded-lg">
              <div className="space-y-2">
                {feeStructure.amount && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Fee Amount:</span>
                    <span className="font-medium">{formatCurrency(feeStructure.amount)}</span>
                  </div>
                )}
                {payment.late_fee_paid && parseFloat(payment.late_fee_paid) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Late Fee:</span>
                    <span className="font-medium">{formatCurrency(payment.late_fee_paid)}</span>
                  </div>
                )}
                {payment.discount_applied && parseFloat(payment.discount_applied) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Discount:</span>
                    <span className="font-medium text-green-600">
                      -{formatCurrency(payment.discount_applied)}
                    </span>
                  </div>
                )}
                <Separator className="my-2" />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total Paid:</span>
                  <span className="text-green-600">{formatCurrency(payment.amount_paid || 0)}</span>
                </div>
              </div>
            </div>

            {payment.notes && (
              <>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Notes</p>
                  <p className="text-sm">{payment.notes}</p>
                </div>
              </>
            )}

            {payment.receivedBy && (
              <>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Received By</p>
                  <p className="text-sm font-medium">
                    {payment.receivedBy.username || payment.receivedBy.email || 'N/A'}
                  </p>
                </div>
              </>
            )}

            <Separator />

            {/* Footer */}
            <div className="text-center text-sm text-muted-foreground pt-4">
              <p>This is an official receipt for the payment made.</p>
              <p className="mt-2">Please keep this receipt for your records.</p>
              <div className="mt-4 flex items-center justify-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="font-medium text-green-600">Payment Verified</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body {
            background: white;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          .print\\:border-0 {
            border: none !important;
          }
          .print\\:p-8 {
            padding: 2rem !important;
          }
        }
      `}</style>
    </div>
  );
}


