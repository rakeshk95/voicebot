import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FileText,
  Plus,
  Search,
  Copy,
  Edit,
  Trash2,
  Eye,
  Phone,
  MessageSquare,
  Mail,
  Calendar,
  Star,
  TrendingUp
} from 'lucide-react';

interface Template {
  id: string;
  name: string;
  type: 'voice' | 'sms' | 'email' | 'whatsapp';
  category: string;
  content: string;
  variables: string[];
  usageCount: number;
  successRate: number;
  lastUsed: Date;
  isFavorite: boolean;
}

const Templates: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const templates: Template[] = [
    {
      id: '1',
      name: 'Welcome Call Script',
      type: 'voice',
      category: 'Onboarding',
      content: 'Hello {{customer_name}}, welcome to {{company_name}}! I\'m calling to help you get started with your new account...',
      variables: ['customer_name', 'company_name', 'account_type'],
      usageCount: 1245,
      successRate: 87,
      lastUsed: new Date(Date.now() - 86400000),
      isFavorite: true
    },
    {
      id: '2',
      name: 'Appointment Reminder',
      type: 'voice',
      category: 'Reminders',
      content: 'Hi {{customer_name}}, this is a reminder about your appointment on {{appointment_date}} at {{appointment_time}}...',
      variables: ['customer_name', 'appointment_date', 'appointment_time', 'location'],
      usageCount: 3421,
      successRate: 92,
      lastUsed: new Date(Date.now() - 3600000),
      isFavorite: true
    },
    {
      id: '3',
      name: 'Payment Reminder',
      type: 'voice',
      category: 'Collections',
      content: 'Hello {{customer_name}}, we noticed your payment of {{amount}} is due on {{due_date}}...',
      variables: ['customer_name', 'amount', 'due_date', 'invoice_number'],
      usageCount: 892,
      successRate: 78,
      lastUsed: new Date(Date.now() - 7200000),
      isFavorite: false
    },
    {
      id: '4',
      name: 'Survey Call',
      type: 'voice',
      category: 'Feedback',
      content: 'Hi {{customer_name}}, thank you for your recent purchase! We\'d love to hear your feedback...',
      variables: ['customer_name', 'product_name', 'purchase_date'],
      usageCount: 567,
      successRate: 65,
      lastUsed: new Date(Date.now() - 172800000),
      isFavorite: false
    },
    {
      id: '5',
      name: 'Follow-up SMS',
      type: 'sms',
      category: 'Follow-up',
      content: 'Hi {{name}}, thanks for speaking with us! Click here to schedule your next appointment: {{link}}',
      variables: ['name', 'link'],
      usageCount: 2134,
      successRate: 84,
      lastUsed: new Date(Date.now() - 43200000),
      isFavorite: true
    },
    {
      id: '6',
      name: 'Welcome Email',
      type: 'email',
      category: 'Onboarding',
      content: 'Dear {{customer_name}}, welcome to {{company_name}}! We\'re excited to have you on board...',
      variables: ['customer_name', 'company_name'],
      usageCount: 4567,
      successRate: 95,
      lastUsed: new Date(Date.now() - 21600000),
      isFavorite: true
    }
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'voice':
        return <Phone className="h-4 w-4" />;
      case 'sms':
      case 'whatsapp':
        return <MessageSquare className="h-4 w-4" />;
      case 'email':
        return <Mail className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'voice':
        return 'bg-blue-100 text-blue-700';
      case 'sms':
        return 'bg-green-100 text-green-700';
      case 'whatsapp':
        return 'bg-emerald-100 text-emerald-700';
      case 'email':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = [
    { label: 'Total Templates', value: templates.length.toString(), icon: FileText },
    { label: 'Favorite Templates', value: templates.filter(t => t.isFavorite).length.toString(), icon: Star },
    { label: 'Total Usage', value: templates.reduce((sum, t) => sum + t.usageCount, 0).toLocaleString(), icon: TrendingUp },
    { label: 'Avg Success Rate', value: `${Math.round(templates.reduce((sum, t) => sum + t.successRate, 0) / templates.length)}%`, icon: TrendingUp }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
              <FileText className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Templates</h1>
              <p className="text-gray-500">Manage your call, SMS, and email templates</p>
            </div>
          </div>
          <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
            <Plus className="h-4 w-4 mr-2" />
            Create Template
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <Card key={index} className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <stat.icon className="h-5 w-5 text-blue-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-sm text-gray-500">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${getTypeColor(template.type)}`}>
                      {getTypeIcon(template.type)}
                    </div>
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {template.name}
                        {template.isFavorite && <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {template.category}
                        </Badge>
                        <Badge className={`text-xs ${getTypeColor(template.type)}`}>
                          {template.type.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700 line-clamp-2">{template.content}</p>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4">
                    <div>
                      <span className="text-gray-500">Usage:</span>
                      <span className="font-medium text-gray-900 ml-1">{template.usageCount}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Success:</span>
                      <span className="font-medium text-green-600 ml-1">{template.successRate}%</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <Copy className="h-4 w-4 mr-2" />
                    Duplicate
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Templates;

