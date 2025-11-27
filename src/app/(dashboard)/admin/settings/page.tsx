'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FormField } from '@/components/forms/FormField';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  Settings, 
  School, 
  User, 
  Bell, 
  Monitor, 
  Globe,
  Save,
  Loader2,
  Building2,
  Mail,
  Phone,
  MapPin,
  DollarSign,
  Clock,
  Calendar,
  Receipt,
  AlertCircle
} from 'lucide-react';
import { settingsApi } from '@/lib/api';
import { useApi } from '@/hooks/useApi';
import { toast } from 'sonner';
import { AppSettings, UserSettings } from '@/lib/types';
import { appSettingsSchema, userSettingsSchema } from '@/lib/validations';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('app');
  
  // App Settings State
  const [appSettings, setAppSettings] = useState<Partial<AppSettings>>({
    schoolName: '',
    schoolLogo: '',
    schoolAddress: '',
    schoolPhone: '',
    schoolEmail: '',
    currency: 'KES',
    timezone: 'Africa/Nairobi',
    academicYear: '',
    lateFeePercentage: 0,
    receiptPrefix: 'REC',
    autoGenerateReceipts: true,
  });

  // User Settings State
  const [userSettings, setUserSettings] = useState<Partial<UserSettings>>({
    theme: 'system',
    language: 'en',
    notifications: {
      email: true,
      sms: false,
      push: true,
    },
    dashboard: {
      defaultView: 'overview',
      refreshInterval: 60,
    },
  });

  const [appFormErrors, setAppFormErrors] = useState<Record<string, string>>({});
  const [userFormErrors, setUserFormErrors] = useState<Record<string, string>>({});
  const [appSubmitting, setAppSubmitting] = useState(false);
  const [userSubmitting, setUserSubmitting] = useState(false);

  // Hardcoded options
  const currencies = [
    { value: 'KES', label: 'KES - Kenyan Shilling' },
    { value: 'USD', label: 'USD - US Dollar' },
    { value: 'EUR', label: 'EUR - Euro' },
    { value: 'GBP', label: 'GBP - British Pound' },
  ];

  const timezones = [
    { value: 'Africa/Nairobi', label: 'Africa/Nairobi (EAT)' },
    { value: 'UTC', label: 'UTC' },
    { value: 'America/New_York', label: 'America/New_York (EST)' },
    { value: 'Europe/London', label: 'Europe/London (GMT)' },
  ];

  const academicYears = [
    '2023-2024',
    '2024-2025',
    '2025-2026',
    '2026-2027',
  ];

  const languages = [
    { value: 'en', label: 'English' },
    { value: 'sw', label: 'Swahili' },
    { value: 'fr', label: 'French' },
  ];

  // Fetch app settings
  const { loading: appLoading, execute: fetchAppSettings } = useApi(
    () => settingsApi.getAppSettings(),
    {
      onSuccess: (response: any) => {
        const data = response?.data || response;
        if (data) {
          setAppSettings({
            schoolName: data.school_name || data.schoolName || '',
            schoolLogo: data.school_logo || data.schoolLogo || '',
            schoolAddress: data.school_address || data.schoolAddress || '',
            schoolPhone: data.school_phone || data.schoolPhone || '',
            schoolEmail: data.school_email || data.schoolEmail || '',
            currency: data.currency || 'KES',
            timezone: data.timezone || 'Africa/Nairobi',
            academicYear: data.academic_year || data.academicYear || '',
            lateFeePercentage: data.late_fee_percentage || data.lateFeePercentage || 0,
            receiptPrefix: data.receipt_prefix || data.receiptPrefix || 'REC',
            autoGenerateReceipts: data.auto_generate_receipts !== false,
          });
        }
      },
      onError: (error) => {
        console.error('Failed to fetch app settings:', error);
      },
    }
  );

  // Fetch user settings
  const { loading: userLoading, execute: fetchUserSettings } = useApi(
    () => settingsApi.getUserSettings(),
    {
      onSuccess: (response: any) => {
        const data = response?.data || response;
        if (data) {
          setUserSettings({
            theme: data.theme || 'system',
            language: data.language || 'en',
            notifications: {
              email: data.notifications?.email !== false,
              sms: data.notifications?.sms || false,
              push: data.notifications?.push !== false,
            },
            dashboard: {
              defaultView: data.dashboard?.default_view || data.dashboard?.defaultView || 'overview',
              refreshInterval: data.dashboard?.refresh_interval || data.dashboard?.refreshInterval || 60,
            },
          });
        }
      },
      onError: (error) => {
        console.error('Failed to fetch user settings:', error);
      },
    }
  );

  // Update app settings
  const { execute: updateAppSettings } = useApi(
    (data: any) => settingsApi.updateAppSettings(data),
    {
      onSuccess: () => {
        toast.success('App settings updated successfully');
        setAppFormErrors({});
      },
      onError: (error: any) => {
        toast.error(error?.message || 'Failed to update app settings');
      },
    }
  );

  // Update user settings
  const { execute: updateUserSettings } = useApi(
    (data: any) => settingsApi.updateUserSettings(data),
    {
      onSuccess: () => {
        toast.success('User settings updated successfully');
        setUserFormErrors({});
      },
      onError: (error: any) => {
        toast.error(error?.message || 'Failed to update user settings');
      },
    }
  );

  // Fetch settings on mount
  useEffect(() => {
    fetchAppSettings();
    fetchUserSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAppSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAppFormErrors({});

    // Validate form
    const validation = appSettingsSchema.safeParse(appSettings);
    if (!validation.success) {
      const errors: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0]) {
          errors[err.path[0].toString()] = err.message;
        }
      });
      setAppFormErrors(errors);
      return;
    }

    setAppSubmitting(true);
    try {
      const payload = {
        school_name: appSettings.schoolName,
        school_logo: appSettings.schoolLogo,
        school_address: appSettings.schoolAddress,
        school_phone: appSettings.schoolPhone,
        school_email: appSettings.schoolEmail,
        currency: appSettings.currency,
        timezone: appSettings.timezone,
        academic_year: appSettings.academicYear,
        late_fee_percentage: appSettings.lateFeePercentage,
        receipt_prefix: appSettings.receiptPrefix,
        auto_generate_receipts: appSettings.autoGenerateReceipts,
      };

      await updateAppSettings(payload);
    } catch (error) {
      console.error('Error updating app settings:', error);
    } finally {
      setAppSubmitting(false);
    }
  };

  const handleUserSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserFormErrors({});

    // Validate form
    const validation = userSettingsSchema.safeParse(userSettings);
    if (!validation.success) {
      const errors: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0]) {
          errors[err.path[0].toString()] = err.message;
        }
      });
      setUserFormErrors(errors);
      return;
    }

    setUserSubmitting(true);
    try {
      const payload = {
        theme: userSettings.theme,
        language: userSettings.language,
        notifications: {
          email: userSettings.notifications?.email,
          sms: userSettings.notifications?.sms,
          push: userSettings.notifications?.push,
        },
        dashboard: {
          default_view: userSettings.dashboard?.defaultView,
          refresh_interval: userSettings.dashboard?.refreshInterval,
        },
      };

      await updateUserSettings(payload);
    } catch (error) {
      console.error('Error updating user settings:', error);
    } finally {
      setUserSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage application and user preferences
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="app">
            <School className="mr-2 h-4 w-4" />
            App Settings
          </TabsTrigger>
          <TabsTrigger value="user">
            <User className="mr-2 h-4 w-4" />
            User Preferences
          </TabsTrigger>
        </TabsList>

        {/* App Settings Tab */}
        <TabsContent value="app" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                School Information
              </CardTitle>
              <CardDescription>
                Configure school details and contact information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAppSettingsSubmit} className="space-y-4">
                <FormField
                  name="schoolName"
                  label="School Name"
                  value={appSettings.schoolName}
                  onChange={(value) => setAppSettings({ ...appSettings, schoolName: value })}
                  error={appFormErrors.schoolName}
                  required
                />

                <FormField
                  name="schoolAddress"
                  label="School Address"
                  value={appSettings.schoolAddress}
                  onChange={(value) => setAppSettings({ ...appSettings, schoolAddress: value })}
                  error={appFormErrors.schoolAddress}
                  required
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    name="schoolPhone"
                    label="School Phone"
                    type="tel"
                    value={appSettings.schoolPhone}
                    onChange={(value) => setAppSettings({ ...appSettings, schoolPhone: value })}
                    error={appFormErrors.schoolPhone}
                    required
                  />

                  <FormField
                    name="schoolEmail"
                    label="School Email"
                    type="email"
                    value={appSettings.schoolEmail}
                    onChange={(value) => setAppSettings({ ...appSettings, schoolEmail: value })}
                    error={appFormErrors.schoolEmail}
                    required
                  />
                </div>

                <FormField
                  name="schoolLogo"
                  label="School Logo URL"
                  value={appSettings.schoolLogo || ''}
                  onChange={(value) => setAppSettings({ ...appSettings, schoolLogo: value })}
                  error={appFormErrors.schoolLogo}
                  placeholder="https://example.com/logo.png"
                />

                <Button type="submit" disabled={appSubmitting || appLoading}>
                  {appSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save School Information
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Application Settings
              </CardTitle>
              <CardDescription>
                Configure currency, timezone, and other application preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAppSettingsSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    name="currency"
                    label="Currency"
                    value={appSettings.currency || undefined}
                    onChange={(value) => setAppSettings({ ...appSettings, currency: value })}
                    type="select"
                    options={currencies}
                    error={appFormErrors.currency}
                    required
                  />

                  <FormField
                    name="timezone"
                    label="Timezone"
                    value={appSettings.timezone || undefined}
                    onChange={(value) => setAppSettings({ ...appSettings, timezone: value })}
                    type="select"
                    options={timezones}
                    error={appFormErrors.timezone}
                    required
                  />
                </div>

                <FormField
                  name="academicYear"
                  label="Default Academic Year"
                  value={appSettings.academicYear || undefined}
                  onChange={(value) => setAppSettings({ ...appSettings, academicYear: value })}
                  type="select"
                  options={academicYears.map(year => ({ value: year, label: year }))}
                  error={appFormErrors.academicYear}
                  required
                />

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Late Fee Percentage</Label>
                      <p className="text-sm text-muted-foreground">
                        Percentage of late fee charged on overdue payments
                      </p>
                    </div>
                    <FormField
                      name="lateFeePercentage"
                      type="number"
                      value={appSettings.lateFeePercentage?.toString()}
                      onChange={(value) => setAppSettings({ ...appSettings, lateFeePercentage: parseFloat(value) || 0 })}
                      error={appFormErrors.lateFeePercentage}
                      className="w-32"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Receipt Prefix</Label>
                      <p className="text-sm text-muted-foreground">
                        Prefix for auto-generated receipt numbers
                      </p>
                    </div>
                    <FormField
                      name="receiptPrefix"
                      value={appSettings.receiptPrefix}
                      onChange={(value) => setAppSettings({ ...appSettings, receiptPrefix: value })}
                      error={appFormErrors.receiptPrefix}
                      className="w-32"
                      required
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Auto-Generate Receipts</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically generate receipt numbers for payments
                      </p>
                    </div>
                    <Switch
                      checked={appSettings.autoGenerateReceipts}
                      onCheckedChange={(checked) => setAppSettings({ ...appSettings, autoGenerateReceipts: checked })}
                    />
                  </div>
                </div>

                <Button type="submit" disabled={appSubmitting || appLoading}>
                  {appSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Application Settings
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* User Settings Tab */}
        <TabsContent value="user" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                Appearance
              </CardTitle>
              <CardDescription>
                Customize your interface appearance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUserSettingsSubmit} className="space-y-4">
                <FormField
                  name="theme"
                  label="Theme"
                  value={userSettings.theme || undefined}
                  onChange={(value) => setUserSettings({ ...userSettings, theme: value as 'light' | 'dark' | 'system' })}
                  type="select"
                  options={[
                    { value: 'light', label: 'Light' },
                    { value: 'dark', label: 'Dark' },
                    { value: 'system', label: 'System' },
                  ]}
                  error={userFormErrors.theme}
                />

                <FormField
                  name="language"
                  label="Language"
                  value={userSettings.language || undefined}
                  onChange={(value) => setUserSettings({ ...userSettings, language: value })}
                  type="select"
                  options={languages}
                  error={userFormErrors.language}
                />

                <Button type="submit" disabled={userSubmitting || userLoading}>
                  {userSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Appearance Settings
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
              </CardTitle>
              <CardDescription>
                Configure notification preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUserSettingsSubmit} className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications via email
                      </p>
                    </div>
                    <Switch
                      checked={userSettings.notifications?.email || false}
                      onCheckedChange={(checked) => setUserSettings({
                        ...userSettings,
                        notifications: { ...userSettings.notifications, email: checked }
                      })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>SMS Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications via SMS
                      </p>
                    </div>
                    <Switch
                      checked={userSettings.notifications?.sms || false}
                      onCheckedChange={(checked) => setUserSettings({
                        ...userSettings,
                        notifications: { ...userSettings.notifications, sms: checked }
                      })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Push Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive push notifications in browser
                      </p>
                    </div>
                    <Switch
                      checked={userSettings.notifications?.push || false}
                      onCheckedChange={(checked) => setUserSettings({
                        ...userSettings,
                        notifications: { ...userSettings.notifications, push: checked }
                      })}
                    />
                  </div>
                </div>

                <Button type="submit" disabled={userSubmitting || userLoading}>
                  {userSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Notification Settings
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Dashboard Preferences
              </CardTitle>
              <CardDescription>
                Customize your dashboard experience
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUserSettingsSubmit} className="space-y-4">
                <FormField
                  name="defaultView"
                  label="Default View"
                  value={userSettings.dashboard?.defaultView || undefined}
                  onChange={(value) => setUserSettings({
                    ...userSettings,
                    dashboard: { ...userSettings.dashboard, defaultView: value as 'overview' | 'detailed' }
                  })}
                  type="select"
                  options={[
                    { value: 'overview', label: 'Overview' },
                    { value: 'detailed', label: 'Detailed' },
                  ]}
                  error={userFormErrors['dashboard.defaultView']}
                />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Refresh Interval (seconds)</Label>
                    <p className="text-sm text-muted-foreground">
                      How often to automatically refresh dashboard data
                    </p>
                  </div>
                  <FormField
                    name="refreshInterval"
                    type="number"
                    value={userSettings.dashboard?.refreshInterval?.toString()}
                    onChange={(value) => setUserSettings({
                      ...userSettings,
                      dashboard: { ...userSettings.dashboard, refreshInterval: parseInt(value) || 60 }
                    })}
                    error={userFormErrors['dashboard.refreshInterval']}
                    className="w-32"
                  />
                </div>

                <Button type="submit" disabled={userSubmitting || userLoading}>
                  {userSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Dashboard Preferences
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}




