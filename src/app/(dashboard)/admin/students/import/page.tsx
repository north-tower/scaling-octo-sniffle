'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, FileText, Download, Loader2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { studentsApi } from '@/lib/api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface CSVRow {
  student_id: string;
  first_name: string;
  last_name: string;
  class: string;
  section: string;
  roll_number: string;
  date_of_birth: string;
  gender: string;
  blood_group?: string;
  address: string;
  phone: string;
  email?: string;
  emergency_contact: string;
  emergency_phone: string;
  admission_date: string;
}

interface ParsedStudent {
  student_id: string;
  first_name: string;
  last_name: string;
  class: string;
  section: string;
  roll_number: string;
  date_of_birth: string;
  gender: 'male' | 'female' | 'other';
  blood_group?: string;
  address: string;
  phone: string;
  email?: string;
  emergency_contact: string;
  emergency_phone: string;
  admission_date: string;
  errors?: string[];
}

export default function ImportStudentsPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedStudent[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResults, setImportResults] = useState<{
    success: number;
    failed: number;
    errors: Array<{ row: number; errors: string[] }>;
  } | null>(null);

  // Parse CSV file
  const parseCSV = useCallback((csvText: string): ParsedStudent[] => {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      throw new Error('CSV file must have at least a header row and one data row');
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
    const students: ParsedStudent[] = [];
    const errors: Array<{ row: number; errors: string[] }> = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      const row: any = {};
      const rowErrors: string[] = [];

      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });

      // Validate required fields
      if (!row.student_id) rowErrors.push('Student ID is required');
      if (!row.first_name) rowErrors.push('First name is required');
      if (!row.last_name) rowErrors.push('Last name is required');
      if (!row.class) rowErrors.push('Class is required');
      if (!row.section) rowErrors.push('Section is required');
      if (!row.roll_number) rowErrors.push('Roll number is required');
      if (!row.phone) rowErrors.push('Phone is required');
      if (!row.emergency_contact) rowErrors.push('Emergency contact is required');
      if (!row.emergency_phone) rowErrors.push('Emergency phone is required');
      if (!row.address) rowErrors.push('Address is required');
      if (!row.date_of_birth) rowErrors.push('Date of birth is required');
      if (!row.admission_date) rowErrors.push('Admission date is required');

      // Validate gender
      if (row.gender && !['male', 'female', 'other'].includes(row.gender.toLowerCase())) {
        rowErrors.push('Gender must be male, female, or other');
      }

      // Validate phone format (must start with 1-9, not 0)
      if (row.phone) {
        const cleanPhone = row.phone.replace(/\D/g, '').replace(/^0+/, '');
        if (!/^[1-9]/.test(cleanPhone)) {
          rowErrors.push('Phone number must start with 1-9 (not 0)');
        }
      }

      if (row.emergency_phone) {
        const cleanEmergencyPhone = row.emergency_phone.replace(/\D/g, '').replace(/^0+/, '');
        if (!/^[1-9]/.test(cleanEmergencyPhone)) {
          rowErrors.push('Emergency phone number must start with 1-9 (not 0)');
        }
      }

      // Validate email format if provided
      if (row.email && row.email.trim() !== '') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(row.email)) {
          rowErrors.push('Invalid email format');
        }
      }

      const student: ParsedStudent = {
        student_id: row.student_id || '',
        first_name: row.first_name || '',
        last_name: row.last_name || '',
        class: row.class || '',
        section: row.section || '',
        roll_number: row.roll_number || '',
        date_of_birth: row.date_of_birth || '',
        gender: (row.gender?.toLowerCase() || 'male') as 'male' | 'female' | 'other',
        blood_group: row.blood_group || undefined,
        address: row.address || '',
        phone: row.phone ? row.phone.replace(/\D/g, '').replace(/^0+/, '') : '',
        email: row.email || undefined,
        emergency_contact: row.emergency_contact || '',
        emergency_phone: row.emergency_phone ? row.emergency_phone.replace(/\D/g, '').replace(/^0+/, '') : '',
        admission_date: row.admission_date || '',
        errors: rowErrors.length > 0 ? rowErrors : undefined,
      };

      students.push(student);
      if (rowErrors.length > 0) {
        errors.push({ row: i + 1, errors: rowErrors });
      }
    }

    if (errors.length > 0) {
      toast.warning(`Found ${errors.length} row(s) with validation errors`);
    }

    return students;
  }, []);

  // Handle file upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file');
      return;
    }

    setFile(selectedFile);
    setIsProcessing(true);
    setImportResults(null);

    try {
      const text = await selectedFile.text();
      const parsed = parseCSV(text);
      setParsedData(parsed);
      toast.success(`Successfully parsed ${parsed.length} student(s)`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to parse CSV file');
      setFile(null);
      setParsedData([]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Download sample CSV
  const downloadSampleCSV = () => {
    const sampleData = `student_id,first_name,last_name,class,section,roll_number,date_of_birth,gender,blood_group,address,phone,email,emergency_contact,emergency_phone,admission_date
STU001,John,Doe,1,A,1,2010-01-15,male,A+,123 Main Street,799229340,john.doe@example.com,Jane Doe,799229341,2024-01-10
STU002,Jane,Smith,1,B,2,2010-03-20,female,B+,456 Oak Avenue,799229342,jane.smith@example.com,John Smith,799229343,2024-01-10
STU003,Bob,Johnson,2,A,1,2009-05-10,male,O+,789 Pine Road,799229344,bob.johnson@example.com,Mary Johnson,799229345,2024-01-10
STU004,Alice,Williams,2,B,3,2009-07-25,female,AB-,321 Elm Street,799229346,alice.williams@example.com,David Williams,799229347,2024-01-10
STU005,Charlie,Brown,3,A,5,2008-09-30,male,A-,654 Maple Drive,799229348,charlie.brown@example.com,Sarah Brown,799229349,2024-01-10`;

    const blob = new Blob([sampleData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'students_import_sample.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    toast.success('Sample CSV file downloaded');
  };

  // Import students
  const handleImport = async () => {
    if (parsedData.length === 0) {
      toast.error('No data to import');
      return;
    }

    // Check for validation errors
    const rowsWithErrors = parsedData.filter(s => s.errors && s.errors.length > 0);
    if (rowsWithErrors.length > 0) {
      toast.error(`Please fix ${rowsWithErrors.length} row(s) with errors before importing`);
      return;
    }

    setIsImporting(true);
    setImportResults(null);

    let successCount = 0;
    let failedCount = 0;
    const errors: Array<{ row: number; errors: string[] }> = [];

    // Import students one by one
    for (let i = 0; i < parsedData.length; i++) {
      const student = parsedData[i];
      try {
        // Clean phone numbers
        const cleanPhone = student.phone.replace(/\D/g, '').replace(/^0+/, '');
        const cleanEmergencyPhone = student.emergency_phone.replace(/\D/g, '').replace(/^0+/, '');

        const backendData: any = {
          student_id: student.student_id,
          first_name: student.first_name,
          last_name: student.last_name,
          class: student.class,
          section: student.section,
          roll_number: student.roll_number,
          date_of_birth: student.date_of_birth,
          gender: student.gender,
          blood_group: student.blood_group || null,
          address: student.address,
          phone: cleanPhone,
          email: student.email || null,
          emergency_contact: student.emergency_contact,
          emergency_phone: cleanEmergencyPhone,
          admission_date: student.admission_date,
        };

        const response = await studentsApi.create(backendData);
        
        if (response.success) {
          successCount++;
        } else {
          failedCount++;
          errors.push({
            row: i + 2, // +2 because row 1 is header, and arrays are 0-indexed
            errors: [response.message || 'Failed to create student'],
          });
        }
      } catch (error: any) {
        failedCount++;
        const errorMessages = error.details 
          ? Object.values(error.details).flat()
          : [error.message || 'Failed to create student'];
        errors.push({
          row: i + 2,
          errors: errorMessages,
        });
      }
    }

    setImportResults({
      success: successCount,
      failed: failedCount,
      errors,
    });

    if (successCount > 0) {
      toast.success(`Successfully imported ${successCount} student(s)`);
    }
    if (failedCount > 0) {
      toast.error(`Failed to import ${failedCount} student(s)`);
    }

    setIsImporting(false);
  };

  const validRows = parsedData.filter(s => !s.errors || s.errors.length === 0);
  const invalidRows = parsedData.filter(s => s.errors && s.errors.length > 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Import Students</h1>
          <p className="text-muted-foreground">
            Upload a CSV file to import multiple students at once
          </p>
        </div>
        <Button variant="outline" onClick={() => router.push('/admin/students')}>
          Back to Students
        </Button>
      </div>

      {/* Instructions Card */}
      <Card>
        <CardHeader>
          <CardTitle>Import Instructions</CardTitle>
          <CardDescription>
            Follow these steps to import students from a CSV file
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Download the sample CSV file to see the required format</li>
            <li>Fill in the student information following the sample format</li>
            <li>Ensure all required fields are filled (marked with * in the sample)</li>
            <li>Phone numbers must start with 1-9 (leading zeros will be removed)</li>
            <li>Upload your CSV file and review the parsed data</li>
            <li>Fix any validation errors before importing</li>
            <li>Click "Import Students" to add all valid students</li>
          </ol>
          <div className="flex gap-2">
            <Button variant="outline" onClick={downloadSampleCSV}>
              <Download className="mr-2 h-4 w-4" />
              Download Sample CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* File Upload Card */}
      <Card>
        <CardHeader>
          <CardTitle>Upload CSV File</CardTitle>
          <CardDescription>
            Select a CSV file containing student data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
                id="csv-upload"
                disabled={isProcessing || isImporting}
              />
              <label htmlFor="csv-upload">
                <Button
                  variant="outline"
                  asChild
                  disabled={isProcessing || isImporting}
                >
                  <span>
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Choose CSV File
                      </>
                    )}
                  </span>
                </Button>
              </label>
            </div>
            {file && (
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{file.name}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Import Results */}
      {importResults && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Import Complete</AlertTitle>
          <AlertDescription>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>Successfully imported: {importResults.success} student(s)</span>
              </div>
              {importResults.failed > 0 && (
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <span>Failed to import: {importResults.failed} student(s)</span>
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Parsed Data Preview */}
      {parsedData.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Preview Data</CardTitle>
                <CardDescription>
                  Review the parsed data before importing. {validRows.length} valid, {invalidRows.length} with errors
                </CardDescription>
              </div>
              <Button
                onClick={handleImport}
                disabled={isImporting || invalidRows.length > 0}
              >
                {isImporting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Import Students ({validRows.length})
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Row</TableHead>
                    <TableHead>Student ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Section</TableHead>
                    <TableHead>Roll #</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedData.map((student, index) => (
                    <TableRow
                      key={index}
                      className={student.errors ? 'bg-red-50 dark:bg-red-950/20' : ''}
                    >
                      <TableCell>{index + 2}</TableCell>
                      <TableCell>{student.student_id}</TableCell>
                      <TableCell>
                        {student.first_name} {student.last_name}
                      </TableCell>
                      <TableCell>{student.class}</TableCell>
                      <TableCell>{student.section}</TableCell>
                      <TableCell>{student.roll_number}</TableCell>
                      <TableCell>{student.phone}</TableCell>
                      <TableCell>
                        {student.errors ? (
                          <Badge variant="destructive">
                            {student.errors.length} error(s)
                          </Badge>
                        ) : (
                          <Badge variant="default">Valid</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Show errors for invalid rows */}
            {invalidRows.length > 0 && (
              <div className="mt-4 space-y-2">
                <h4 className="font-semibold text-destructive">Validation Errors:</h4>
                {parsedData.map((student, index) => {
                  if (!student.errors || student.errors.length === 0) return null;
                  return (
                    <div key={index} className="text-sm text-destructive">
                      <strong>Row {index + 2}:</strong> {student.errors.join(', ')}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Show import errors */}
            {importResults && importResults.errors.length > 0 && (
              <div className="mt-4 space-y-2">
                <h4 className="font-semibold text-destructive">Import Errors:</h4>
                {importResults.errors.map((error, index) => (
                  <div key={index} className="text-sm text-destructive">
                    <strong>Row {error.row}:</strong> {error.errors.join(', ')}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}



