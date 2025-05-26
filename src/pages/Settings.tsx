
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

const Settings = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Account Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Account Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="company-name">Company Name</Label>
              <Input id="company-name" defaultValue="AI Platform Inc." />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" defaultValue="admin@aiplatform.com" />
            </div>
            <div>
              <Label htmlFor="timezone">Timezone</Label>
              <Input id="timezone" defaultValue="UTC-8 (Pacific Time)" />
            </div>
            <Button>Save Changes</Button>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="email-notifications">Email Notifications</Label>
              <Switch id="email-notifications" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="campaign-alerts">Campaign Alerts</Label>
              <Switch id="campaign-alerts" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="user-activity">User Activity</Label>
              <Switch id="user-activity" />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="weekly-reports">Weekly Reports</Label>
              <Switch id="weekly-reports" defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* API Settings */}
        <Card>
          <CardHeader>
            <CardTitle>API Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="api-key">API Key</Label>
              <div className="flex space-x-2">
                <Input id="api-key" type="password" defaultValue="pk_test_..." readOnly />
                <Button variant="outline">Regenerate</Button>
              </div>
            </div>
            <div>
              <Label htmlFor="webhook-url">Webhook URL</Label>
              <Input id="webhook-url" placeholder="https://yoursite.com/webhook" />
            </div>
            <Button>Update API Settings</Button>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Security</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="two-factor">Two-Factor Authentication</Label>
              <Switch id="two-factor" />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="session-timeout">Auto Session Timeout</Label>
              <Switch id="session-timeout" defaultChecked />
            </div>
            <Button variant="outline">Change Password</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
