import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { 
  Plug, 
  CheckCircle2,
  Settings,
  Link2,
  Copy,
  ExternalLink,
  AlertCircle,
  ArrowRight,
  Database,
  RefreshCw,
  Zap,
  Calendar,
  Users,
  BarChart3,
  FileText,
  Clock,
  TrendingUp,
  Building2,
  Mail,
  Phone,
  MessageSquare
} from 'lucide-react';

interface Integration {
  id: string;
  name: string;
  logo: string;
  description: string;
  category: string;
  status: 'connected' | 'available' | 'coming-soon';
  features: string[];
  syncOptions: string[];
}

const Integrations: React.FC = () => {
  const [selectedIntegration, setSelectedIntegration] = useState<string | null>(null);

  const integrations: Integration[] = [
    {
      id: 'salesforce',
      name: 'Salesforce',
      logo: '☁️',
      description: 'Sync contacts, leads, and call activities with Salesforce CRM',
      category: 'CRM',
      status: 'available',
      features: [
        'Auto-sync contacts and leads',
        'Log call activities automatically',
        'Create tasks and opportunities',
        'Real-time data synchronization',
        'Custom field mapping'
      ],
      syncOptions: ['Contacts', 'Leads', 'Opportunities', 'Call Logs', 'Tasks']
    },
    {
      id: 'zoho',
      name: 'Zoho CRM',
      logo: '🔷',
      description: 'Integrate with Zoho CRM for seamless contact and deal management',
      category: 'CRM',
      status: 'available',
      features: [
        'Two-way contact synchronization',
        'Automatic call logging',
        'Deal and pipeline tracking',
        'Custom module support',
        'Workflow automation'
      ],
      syncOptions: ['Contacts', 'Deals', 'Accounts', 'Call History', 'Notes']
    },
    {
      id: 'hubspot',
      name: 'HubSpot',
      logo: '🟠',
      description: 'Connect with HubSpot for marketing and sales automation',
      category: 'CRM',
      status: 'available',
      features: [
        'Contact and company sync',
        'Call tracking and analytics',
        'Email and task integration',
        'Deal stage automation',
        'Custom properties mapping'
      ],
      syncOptions: ['Contacts', 'Companies', 'Deals', 'Tasks', 'Calls']
    },
    {
      id: 'google-workspace',
      name: 'Google Workspace',
      logo: '🔵',
      description: 'Sync with Google Contacts and Calendar',
      category: 'Productivity',
      status: 'available',
      features: [
        'Google Contacts sync',
        'Calendar integration',
        'Gmail integration',
        'Google Sheets export',
        'Drive file storage'
      ],
      syncOptions: ['Contacts', 'Calendar', 'Gmail', 'Sheets']
    },
    {
      id: 'slack',
      name: 'Slack',
      logo: '💬',
      description: 'Receive campaign notifications and alerts in Slack',
      category: 'Communication',
      status: 'available',
      features: [
        'Real-time campaign notifications',
        'Call completion alerts',
        'Team collaboration',
        'Custom channel routing',
        'Slash commands'
      ],
      syncOptions: ['Notifications', 'Alerts', 'Reports']
    },
    {
      id: 'microsoft-teams',
      name: 'Microsoft Teams',
      logo: '🟣',
      description: 'Collaborate and receive updates in Microsoft Teams',
      category: 'Communication',
      status: 'available',
      features: [
        'Teams channel notifications',
        'Campaign status updates',
        'File sharing',
        'Bot commands',
        'Meeting integration'
      ],
      syncOptions: ['Notifications', 'Files', 'Meetings']
    },
    {
      id: 'zapier',
      name: 'Zapier',
      logo: '⚡',
      description: 'Connect with 5000+ apps through Zapier workflows',
      category: 'Automation',
      status: 'available',
      features: [
        'Multi-step workflows',
        'Trigger actions on events',
        'Connect any app',
        'Custom logic and filters',
        'Scheduled automation'
      ],
      syncOptions: ['All Events', 'Triggers', 'Actions']
    },
    {
      id: 'pipedrive',
      name: 'Pipedrive',
      logo: '🟢',
      description: 'Sales pipeline management and deal tracking',
      category: 'CRM',
      status: 'coming-soon',
      features: [
        'Deal pipeline sync',
        'Activity tracking',
        'Contact management',
        'Sales forecasting',
        'Report generation'
      ],
      syncOptions: ['Deals', 'Contacts', 'Activities', 'Organizations']
    }
  ];

  const stats = [
    { label: 'Active Integrations', value: '5', icon: Plug },
    { label: 'Synced Records', value: '12,453', icon: Database },
    { label: 'Last Sync', value: '2 min ago', icon: RefreshCw },
    { label: 'Success Rate', value: '99.8%', icon: CheckCircle2 }
  ];

  const syncLogs = [
    { integration: 'Salesforce', action: 'Synced 45 contacts', time: '2 minutes ago', status: 'success' },
    { integration: 'Zoho CRM', action: 'Updated 12 call logs', time: '15 minutes ago', status: 'success' },
    { integration: 'Slack', action: 'Sent campaign notification', time: '1 hour ago', status: 'success' },
    { integration: 'Google Workspace', action: 'Synced calendar events', time: '2 hours ago', status: 'success' }
  ];

  const connectedIntegrations = integrations.filter(i => i.status === 'connected').length;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-lg">
              <Plug className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Integrations</h1>
              <p className="text-gray-500">Connect Voxiflow with your favorite tools</p>
            </div>
          </div>
          <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
            <Zap className="h-4 w-4 mr-2" />
            Browse All Integrations
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <Card key={index} className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <stat.icon className="h-5 w-5 text-purple-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-sm text-gray-500">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="all" className="space-y-6">
          <TabsList>
            <TabsTrigger value="all">All Integrations</TabsTrigger>
            <TabsTrigger value="crm">CRM</TabsTrigger>
            <TabsTrigger value="communication">Communication</TabsTrigger>
            <TabsTrigger value="productivity">Productivity</TabsTrigger>
            <TabsTrigger value="logs">Sync Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {integrations.map((integration) => (
                <Card 
                  key={integration.id} 
                  className="border-0 shadow-sm hover:shadow-lg transition-all cursor-pointer"
                  onClick={() => setSelectedIntegration(integration.id)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="text-4xl">{integration.logo}</div>
                        <div>
                          <CardTitle className="text-lg">{integration.name}</CardTitle>
                          <Badge 
                            variant="outline" 
                            className={`mt-1 text-xs ${
                              integration.status === 'connected' 
                                ? 'bg-emerald-100 text-emerald-700 border-emerald-200' 
                                : integration.status === 'available'
                                ? 'bg-blue-100 text-blue-700 border-blue-200'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {integration.status === 'connected' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                            {integration.status === 'connected' ? 'Connected' : 
                             integration.status === 'available' ? 'Available' : 'Coming Soon'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <CardDescription className="mt-2">{integration.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-2">KEY FEATURES</p>
                      <ul className="space-y-1">
                        {integration.features.slice(0, 3).map((feature, idx) => (
                          <li key={idx} className="text-sm text-gray-600 flex items-start">
                            <CheckCircle2 className="h-4 w-4 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <Button 
                      className={`w-full ${
                        integration.status === 'connected' 
                          ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' 
                          : integration.status === 'available'
                          ? 'bg-purple-600 hover:bg-purple-700'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                      disabled={integration.status === 'coming-soon'}
                    >
                      {integration.status === 'connected' ? (
                        <>
                          <Settings className="h-4 w-4 mr-2" />
                          Configure
                        </>
                      ) : integration.status === 'available' ? (
                        <>
                          <Link2 className="h-4 w-4 mr-2" />
                          Connect
                        </>
                      ) : (
                        <>
                          <Clock className="h-4 w-4 mr-2" />
                          Coming Soon
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="crm" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {integrations.filter(i => i.category === 'CRM').map((integration) => (
                <Card key={integration.id} className="border-0 shadow-sm">
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <div className="text-4xl">{integration.logo}</div>
                      <div>
                        <CardTitle>{integration.name}</CardTitle>
                        <Badge variant="outline" className="mt-1">{integration.status}</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4">{integration.description}</p>
                    <Button className="w-full">
                      <Link2 className="h-4 w-4 mr-2" />
                      Connect
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="communication" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {integrations.filter(i => i.category === 'Communication').map((integration) => (
                <Card key={integration.id} className="border-0 shadow-sm">
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <div className="text-4xl">{integration.logo}</div>
                      <div>
                        <CardTitle>{integration.name}</CardTitle>
                        <Badge variant="outline" className="mt-1">{integration.status}</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4">{integration.description}</p>
                    <Button className="w-full">
                      <Link2 className="h-4 w-4 mr-2" />
                      Connect
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="productivity" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {integrations.filter(i => i.category === 'Productivity').map((integration) => (
                <Card key={integration.id} className="border-0 shadow-sm">
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <div className="text-4xl">{integration.logo}</div>
                      <div>
                        <CardTitle>{integration.name}</CardTitle>
                        <Badge variant="outline" className="mt-1">{integration.status}</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4">{integration.description}</p>
                    <Button className="w-full">
                      <Link2 className="h-4 w-4 mr-2" />
                      Connect
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="logs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Sync Activity</CardTitle>
                <CardDescription>Track integration synchronization and data transfers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {syncLogs.map((log, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className={`p-2 rounded-full ${log.status === 'success' ? 'bg-green-100' : 'bg-red-100'}`}>
                          {log.status === 'success' ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{log.integration}</p>
                          <p className="text-sm text-gray-600">{log.action}</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-500">{log.time}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Integrations;

