import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Zap,
  Plus,
  Play,
  Pause,
  Edit,
  Trash2,
  ArrowRight,
  Clock,
  Phone,
  MessageSquare,
  Mail,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Users,
  Calendar
} from 'lucide-react';

interface Automation {
  id: string;
  name: string;
  description: string;
  trigger: {
    type: string;
    icon: any;
    label: string;
  };
  actions: Array<{
    type: string;
    icon: any;
    label: string;
  }>;
  status: 'active' | 'paused' | 'draft';
  executionCount: number;
  successRate: number;
  lastRun: Date | null;
}

const Automations: React.FC = () => {
  const [automations, setAutomations] = useState<Automation[]>([
    {
      id: '1',
      name: 'Post-Call Follow-up',
      description: 'Send WhatsApp message and email after successful call',
      trigger: {
        type: 'call_completed',
        icon: Phone,
        label: 'Call Completed'
      },
      actions: [
        { type: 'whatsapp', icon: MessageSquare, label: 'Send WhatsApp' },
        { type: 'email', icon: Mail, label: 'Send Email' },
        { type: 'crm_update', icon: Users, label: 'Update CRM' }
      ],
      status: 'active',
      executionCount: 1245,
      successRate: 94,
      lastRun: new Date(Date.now() - 3600000)
    },
    {
      id: '2',
      name: 'Failed Call Recovery',
      description: 'Schedule retry and send SMS for failed calls',
      trigger: {
        type: 'call_failed',
        icon: AlertCircle,
        label: 'Call Failed'
      },
      actions: [
        { type: 'schedule_retry', icon: Clock, label: 'Schedule Retry' },
        { type: 'sms', icon: MessageSquare, label: 'Send SMS' },
        { type: 'notify_team', icon: Users, label: 'Notify Team' }
      ],
      status: 'active',
      executionCount: 342,
      successRate: 78,
      lastRun: new Date(Date.now() - 7200000)
    },
    {
      id: '3',
      name: 'Appointment Confirmation',
      description: 'Send reminder series before appointments',
      trigger: {
        type: 'appointment_booked',
        icon: Calendar,
        label: 'Appointment Booked'
      },
      actions: [
        { type: 'email', icon: Mail, label: 'Send Confirmation' },
        { type: 'sms_reminder', icon: MessageSquare, label: 'SMS Reminder (24h)' },
        { type: 'call_reminder', icon: Phone, label: 'Call Reminder (1h)' }
      ],
      status: 'active',
      executionCount: 892,
      successRate: 92,
      lastRun: new Date(Date.now() - 86400000)
    },
    {
      id: '4',
      name: 'Campaign Performance Alert',
      description: 'Notify team when campaign reaches milestones',
      trigger: {
        type: 'campaign_milestone',
        icon: TrendingUp,
        label: 'Campaign Milestone'
      },
      actions: [
        { type: 'slack', icon: MessageSquare, label: 'Post to Slack' },
        { type: 'email_report', icon: Mail, label: 'Send Report' }
      ],
      status: 'active',
      executionCount: 45,
      successRate: 100,
      lastRun: new Date(Date.now() - 172800000)
    },
    {
      id: '5',
      name: 'Lead Qualification',
      description: 'Auto-qualify leads and assign to sales team',
      trigger: {
        type: 'call_completed',
        icon: Phone,
        label: 'Call Completed'
      },
      actions: [
        { type: 'score_lead', icon: TrendingUp, label: 'Score Lead' },
        { type: 'crm_update', icon: Users, label: 'Update CRM' },
        { type: 'assign_sales', icon: Users, label: 'Assign to Sales' }
      ],
      status: 'paused',
      executionCount: 567,
      successRate: 85,
      lastRun: new Date(Date.now() - 259200000)
    }
  ]);

  const toggleAutomation = (id: string) => {
    setAutomations(prev => prev.map(auto =>
      auto.id === id
        ? { ...auto, status: auto.status === 'active' ? 'paused' : 'active' }
        : auto
    ));
  };

  const stats = [
    { label: 'Active Automations', value: automations.filter(a => a.status === 'active').length.toString(), icon: Zap },
    { label: 'Total Executions', value: automations.reduce((sum, a) => sum + a.executionCount, 0).toLocaleString(), icon: Play },
    { label: 'Avg Success Rate', value: `${Math.round(automations.reduce((sum, a) => sum + a.successRate, 0) / automations.length)}%`, icon: CheckCircle2 },
    { label: 'Time Saved', value: '245h', icon: Clock }
  ];

  const automationTemplates = [
    {
      name: 'Welcome Series',
      description: 'Automated onboarding sequence for new customers',
      icon: Users
    },
    {
      name: 'Re-engagement Campaign',
      description: 'Win back inactive customers with targeted outreach',
      icon: TrendingUp
    },
    {
      name: 'Survey & Feedback',
      description: 'Collect feedback after customer interactions',
      icon: MessageSquare
    },
    {
      name: 'Payment Reminders',
      description: 'Automated payment reminder sequence',
      icon: Clock
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl shadow-lg">
              <Zap className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Automations</h1>
              <p className="text-gray-500">Automate your workflows and save time</p>
            </div>
          </div>
          <Button className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700">
            <Plus className="h-4 w-4 mr-2" />
            Create Automation
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <Card key={index} className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <stat.icon className="h-5 w-5 text-orange-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-sm text-gray-500">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Active Automations */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Your Automations</h2>
          <div className="grid grid-cols-1 gap-4">
            {automations.map((automation) => (
              <Card key={automation.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{automation.name}</h3>
                        <Badge className={
                          automation.status === 'active' 
                            ? 'bg-emerald-100 text-emerald-700' 
                            : automation.status === 'paused'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-gray-100 text-gray-700'
                        }>
                          {automation.status === 'active' && <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse"></div>}
                          {automation.status.charAt(0).toUpperCase() + automation.status.slice(1)}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-4">{automation.description}</p>

                      {/* Automation Flow */}
                      <div className="flex items-center gap-2 flex-wrap mb-4">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg border border-blue-200">
                          <automation.trigger.icon className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-900">{automation.trigger.label}</span>
                        </div>
                        <ArrowRight className="h-4 w-4 text-gray-400" />
                        {automation.actions.map((action, idx) => (
                          <React.Fragment key={idx}>
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 rounded-lg border border-orange-200">
                              <action.icon className="h-4 w-4 text-orange-600" />
                              <span className="text-sm font-medium text-orange-900">{action.label}</span>
                            </div>
                            {idx < automation.actions.length - 1 && (
                              <ArrowRight className="h-4 w-4 text-gray-400" />
                            )}
                          </React.Fragment>
                        ))}
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-6 text-sm">
                        <div>
                          <span className="text-gray-500">Executions:</span>
                          <span className="font-medium text-gray-900 ml-1">{automation.executionCount.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Success Rate:</span>
                          <span className="font-medium text-green-600 ml-1">{automation.successRate}%</span>
                        </div>
                        {automation.lastRun && (
                          <div>
                            <span className="text-gray-500">Last Run:</span>
                            <span className="font-medium text-gray-900 ml-1">
                              {automation.lastRun.toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 ml-4">
                      <Switch
                        checked={automation.status === 'active'}
                        onCheckedChange={() => toggleAutomation(automation.id)}
                      />
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Automation Templates */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Automation Templates</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {automationTemplates.map((template, index) => (
              <Card key={index} className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="p-3 bg-gradient-to-br from-orange-100 to-red-100 rounded-lg w-fit">
                    <template.icon className="h-6 w-6 text-orange-600" />
                  </div>
                  <CardTitle className="text-base mt-3">{template.name}</CardTitle>
                  <CardDescription className="text-sm">{template.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Use Template
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Automations;

