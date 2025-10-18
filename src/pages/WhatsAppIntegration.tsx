import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { 
  MessageCircle, 
  Phone, 
  CheckCircle2,
  Settings,
  Users,
  BarChart3,
  MessageSquare,
  Bell,
  Zap,
  Send,
  Calendar,
  Clock,
  TrendingUp,
  AlertCircle,
  Link2,
  Copy,
  ExternalLink,
  Smartphone
} from 'lucide-react';

const WhatsAppIntegration: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);

  const integrationFeatures = [
    {
      title: 'Campaign Notifications',
      description: 'Send campaign updates and call summaries via WhatsApp',
      icon: Bell,
      status: 'available',
      useCase: 'Notify team members about campaign progress and results in real-time'
    },
    {
      title: 'Appointment Reminders',
      description: 'Automated appointment confirmations and reminders',
      icon: Calendar,
      status: 'available',
      useCase: 'Reduce no-shows by 60% with automated WhatsApp reminders'
    },
    {
      title: 'Customer Follow-ups',
      description: 'Send follow-up messages after calls automatically',
      icon: MessageSquare,
      status: 'available',
      useCase: 'Engage customers with personalized follow-ups post-call'
    },
    {
      title: 'Bulk Broadcasting',
      description: 'Send bulk WhatsApp messages to customer lists',
      icon: Users,
      status: 'available',
      useCase: 'Reach thousands of customers with promotional messages'
    },
    {
      title: 'Two-Way Chat',
      description: 'Enable two-way conversations with customers',
      icon: MessageCircle,
      status: 'coming-soon',
      useCase: 'Handle customer queries through WhatsApp Business API'
    },
    {
      title: 'Rich Media Support',
      description: 'Send images, videos, documents, and voice messages',
      icon: Smartphone,
      status: 'available',
      useCase: 'Share brochures, catalogs, and product demos via WhatsApp'
    }
  ];

  const stats = [
    { label: 'Messages Sent', value: '12,453', change: '+23%', icon: Send },
    { label: 'Delivery Rate', value: '98.5%', change: '+2%', icon: CheckCircle2 },
    { label: 'Response Rate', value: '67%', change: '+12%', icon: TrendingUp },
    { label: 'Active Chats', value: '342', change: '+8%', icon: MessageCircle }
  ];

  const useCases = [
    {
      title: 'Post-Call Follow-up',
      description: 'After each voice call, automatically send a WhatsApp message with call summary, next steps, or promotional offers.',
      steps: ['Call completes', 'System triggers WhatsApp', 'Customer receives summary', 'Track engagement']
    },
    {
      title: 'Campaign Launch Alerts',
      description: 'When a new batch calling campaign starts, notify your team members via WhatsApp with campaign details and progress.',
      steps: ['Campaign starts', 'WhatsApp notification sent', 'Team members updated', 'Monitor in real-time']
    },
    {
      title: 'Appointment Booking',
      description: 'Send appointment confirmation via WhatsApp with calendar links, location, and reminder options.',
      steps: ['Appointment booked', 'Confirmation sent', 'Add to calendar', 'Reminder before meeting']
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg">
              <MessageCircle className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">WhatsApp Integration</h1>
              <p className="text-gray-500">Connect with WhatsApp Business API for powerful messaging</p>
            </div>
          </div>
          <Badge className={isConnected ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'}>
            <div className={`w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`}></div>
            {isConnected ? 'Connected' : 'Not Connected'}
          </Badge>
        </div>

        {/* Stats */}
        {isConnected && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <Card key={index} className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <stat.icon className="h-5 w-5 text-green-600" />
                    <Badge variant="outline" className="text-xs text-green-700 border-green-200">
                      {stat.change}
                    </Badge>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                  <div className="text-sm text-gray-500">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Tabs defaultValue="setup" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="setup">Setup & Configuration</TabsTrigger>
            <TabsTrigger value="features">Features & Use Cases</TabsTrigger>
            <TabsTrigger value="templates">Message Templates</TabsTrigger>
          </TabsList>

          {/* Setup Tab */}
          <TabsContent value="setup" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="h-5 w-5 mr-2 text-green-600" />
                  WhatsApp Business API Configuration
                </CardTitle>
                <CardDescription>
                  Connect your WhatsApp Business account to enable messaging features
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="phone-number">Business Phone Number</Label>
                    <Input
                      id="phone-number"
                      placeholder="+1 (555) 123-4567"
                      className="mt-2"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Must be a WhatsApp Business verified number
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="api-key">WhatsApp API Key</Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        id="api-key"
                        type="password"
                        placeholder="Enter your WhatsApp Business API key"
                        className="flex-1"
                      />
                      <Button variant="outline" size="icon">
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="webhook-url">Webhook URL</Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        id="webhook-url"
                        value="https://api.voxiflow.com/webhooks/whatsapp"
                        readOnly
                        className="flex-1"
                      />
                      <Button variant="outline" size="icon">
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Configure this webhook URL in your WhatsApp Business dashboard
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center space-x-3">
                    <AlertCircle className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-blue-900">Need Help Getting Started?</p>
                      <p className="text-sm text-blue-700">View our setup guide for step-by-step instructions</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Guide
                  </Button>
                </div>

                <div className="flex justify-between items-center pt-4 border-t">
                  <Button variant="outline">
                    Test Connection
                  </Button>
                  <Button 
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => setIsConnected(!isConnected)}
                  >
                    <Link2 className="h-4 w-4 mr-2" />
                    {isConnected ? 'Disconnect' : 'Connect WhatsApp'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Features Tab */}
          <TabsContent value="features" className="space-y-6">
            {/* Integration Features */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {integrationFeatures.map((feature, index) => (
                <Card key={index} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <feature.icon className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{feature.title}</CardTitle>
                        </div>
                      </div>
                      <Badge className={feature.status === 'available' ? 'bg-emerald-100 text-emerald-700' : 'bg-yellow-100 text-yellow-700'}>
                        {feature.status === 'available' ? 'Available' : 'Coming Soon'}
                      </Badge>
                    </div>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Use Case:</span> {feature.useCase}
                      </p>
                    </div>
                    {feature.status === 'available' && (
                      <div className="flex items-center justify-between mt-4">
                        <Switch />
                        <Button variant="outline" size="sm">
                          Configure
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Use Cases */}
            <Card>
              <CardHeader>
                <CardTitle>Real-World Use Cases</CardTitle>
                <CardDescription>See how WhatsApp integrates with your voice campaigns</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {useCases.map((useCase, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-2">{useCase.title}</h4>
                      <p className="text-sm text-gray-600 mb-4">{useCase.description}</p>
                      <div className="flex items-center gap-2">
                        {useCase.steps.map((step, stepIndex) => (
                          <React.Fragment key={stepIndex}>
                            <div className="flex items-center gap-2 px-3 py-1 bg-green-50 rounded-full">
                              <span className="text-xs font-medium text-green-700">{stepIndex + 1}</span>
                              <span className="text-xs text-gray-700">{step}</span>
                            </div>
                            {stepIndex < useCase.steps.length - 1 && (
                              <Zap className="h-4 w-4 text-gray-400" />
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Message Templates</CardTitle>
                <CardDescription>Pre-approved templates for WhatsApp Business messaging</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    {
                      name: 'Call Follow-up',
                      content: 'Hi {{name}}, thanks for speaking with us! Here\'s a summary of our conversation: {{summary}}. Reply with any questions!',
                      category: 'Transactional'
                    },
                    {
                      name: 'Appointment Reminder',
                      content: 'Hi {{name}}, reminder: Your appointment is scheduled for {{date}} at {{time}}. Reply CONFIRM to confirm or RESCHEDULE to change.',
                      category: 'Utility'
                    },
                    {
                      name: 'Campaign Update',
                      content: 'Campaign "{{campaign_name}}" update: {{completed}}/{{total}} calls completed. Success rate: {{success_rate}}%',
                      category: 'Marketing'
                    }
                  ].map((template, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-gray-900">{template.name}</h4>
                          <Badge variant="outline" className="text-xs">{template.category}</Badge>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Copy className="h-4 w-4 mr-2" />
                            Copy
                          </Button>
                          <Button variant="outline" size="sm">
                            Edit
                          </Button>
                        </div>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-700 font-mono">{template.content}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <Button className="w-full mt-4 bg-green-600 hover:bg-green-700">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Create New Template
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default WhatsAppIntegration;

