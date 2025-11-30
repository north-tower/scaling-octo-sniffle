'use client';

import { DashboardStatsExample } from '@/components/examples/DashboardStatsExample';
import { StudentListExample } from '@/components/examples/StudentListExample';
import { PaymentFormExample } from '@/components/examples/PaymentFormExample';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ExamplesPage() {
  return (
    <div className="container mx-auto py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">API Integration Examples</h1>
        <p className="text-muted-foreground mt-2">
          These examples demonstrate how to use the API hooks and components in your application.
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Dashboard Stats Example</CardTitle>
            <CardDescription>
              Example of fetching and displaying dashboard statistics using the useApi hook
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DashboardStatsExample />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Student List Example</CardTitle>
            <CardDescription>
              Example of fetching and displaying a list of students with pagination
            </CardDescription>
          </CardHeader>
          <CardContent>
            <StudentListExample />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Form Example</CardTitle>
            <CardDescription>
              Example of creating a payment using react-hook-form and the useFormApi hook
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PaymentFormExample />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

