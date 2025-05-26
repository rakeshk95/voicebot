
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  BarChart, 
  Users, 
  Activity, 
  Settings, 
  Phone, 
  Upload, 
  Filter,
  Plus,
  Play,
  Pause,
  Edit,
  Trash2,
  Download
} from 'lucide-react';

const Campaigns = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const campaigns = [
    {
      id: 1,
      name: 'Summer Sale 2024',
      description: 'Promotional campaign for summer products',
      status: 'Active',
      type: 'Outbound',
      users: 2350,
      conversion: 4.2,
      totalCalls: 5420,
      successfulCalls: 4180,
      avgDuration: '2:34',
      created: '2024-01-15',
      language: 'English',
      voice: 'Sarah (Female)'
    },
    {
      id: 2,
      name: 'Product Launch',
      description: 'New product introduction campaign',
      status: 'Draft',
      type: 'Inbound',
      users: 0,
      conversion: 0,
      totalCalls: 0,
      successfulCalls: 0,
      avgDuration: '0:00',
      created: '2024-01-20',
      language: 'Spanish',
      voice: 'Alex (Male)'
    },
    {
      id: 3,
      name: 'Newsletter Campaign',
      description: 'Monthly newsletter with updates',
      status: 'Completed',
      type: 'Outbound',
      users: 1840,
      conversion: 2.8,
      totalCalls: 3200,
      successfulCalls: 2880,
      avgDuration: '1:45',
      created: '2024-01-10',
      language: 'English',
      voice: 'Mike (Male)'
    }
  ];

  const filteredCampaigns = campaigns.filter(campaign =>
    campaign.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Draft': return 'bg-yellow-100 text-yellow-800';
      case 'Completed': return 'bg-blue-100 text-blue-800';
      case 'Paused': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const CampaignBuilder = () => (
    <div className="space-y-6">
      <Tabs defaultValue="language" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="language">Language</TabsTrigger>
          <TabsTrigger value="voice">Voice</TabsTrigger>
          <TabsTrigger value="flow">Flow</TabsTrigger>
          <TabsTrigger value="telephony">Telephony</TabsTrigger>
          <TabsTrigger value="post-call">Post Call</TabsTrigger>
        </TabsList>

        <TabsContent value="language" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Language Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="language">Select Language</Label>
                <select className="w-full mt-1 p-2 border rounded-md">
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                </select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="voice" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Voice Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="gender">Gender</Label>
                <select className="w-full mt-1 p-2 border rounded-md">
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                </select>
              </div>
              <div>
                <Label htmlFor="voice-language">Voice Language</Label>
                <select className="w-full mt-1 p-2 border rounded-md">
                  <option value="en-us">English (US)</option>
                  <option value="en-uk">English (UK)</option>
                  <option value="es-es">Spanish (Spain)</option>
                  <option value="es-mx">Spanish (Mexico)</option>
                </select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="flow" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Conversation Flow</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="context">Context</Label>
                <textarea 
                  className="w-full mt-1 p-2 border rounded-md h-24"
                  placeholder="Define the conversation context..."
                />
              </div>
              
              <div>
                <Label>Response Variables</Label>
                <div className="space-y-2 mt-2">
                  <div className="flex space-x-2">
                    <Input placeholder="Key" />
                    <Input placeholder="Value" />
                    <Button variant="outline" size="sm">Add</Button>
                  </div>
                </div>
              </div>

              <div>
                <Label>Custom Variables</Label>
                <div className="space-y-2 mt-2">
                  <div className="flex space-x-2">
                    <Input placeholder="Variable Key" />
                    <Input placeholder="Variable Value" />
                    <Button variant="outline" size="sm">Add</Button>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="knowledge-base">Knowledge Base</Label>
                <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="mt-2">
                    <Button variant="outline">Upload Files</Button>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">Upload documents, PDFs, or text files</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="telephony" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Telephony Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="campaign-type">Campaign Type</Label>
                <select className="w-full mt-1 p-2 border rounded-md">
                  <option value="inbound">Inbound</option>
                  <option value="outbound">Outbound</option>
                </select>
              </div>
              <div>
                <Label htmlFor="phone-number">Phone Number</Label>
                <Input placeholder="+1 (555) 123-4567" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="post-call" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Post Call Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="callback-endpoint">Callback Endpoint</Label>
                <Input placeholder="https://your-api.com/webhook" />
              </div>
              
              <div>
                <Label>Call Categorization</Label>
                <div className="space-y-2 mt-2">
                  <div className="flex space-x-2">
                    <Input placeholder="Category Key" />
                    <Input placeholder="Category Value" />
                    <Button variant="outline" size="sm">Add</Button>
                  </div>
                </div>
              </div>

              <div>
                <Label>Data Extraction</Label>
                <div className="space-y-2 mt-2">
                  <div className="flex space-x-2">
                    <Input placeholder="Data Key" />
                    <Input placeholder="Extraction Rule" />
                    <Button variant="outline" size="sm">Add</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end space-x-2">
        <Button variant="outline">Save Draft</Button>
        <Button>Create Campaign</Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Campaigns</h1>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Upload className="w-4 h-4 mr-2" />
            Bulk Upload
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary">
                <Plus className="w-4 h-4 mr-2" />
                Create Campaign
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Campaign</DialogTitle>
              </DialogHeader>
              <CampaignBuilder />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Campaign Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Campaigns</p>
                <p className="text-2xl font-bold">23</p>
                <p className="text-xs text-green-600">+3 this month</p>
              </div>
              <BarChart className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Campaigns</p>
                <p className="text-2xl font-bold">8</p>
                <p className="text-xs text-green-600">Running now</p>
              </div>
              <Activity className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Calls</p>
                <p className="text-2xl font-bold">15,430</p>
                <p className="text-xs text-green-600">+1,234 today</p>
              </div>
              <Phone className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold">87%</p>
                <p className="text-xs text-green-600">+2% vs last week</p>
              </div>
              <Users className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center space-x-4">
        <Input
          placeholder="Search campaigns..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Button variant="outline">
          <Filter className="w-4 h-4 mr-2" />
          Filter
        </Button>
        <Button variant="outline">Sort</Button>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Campaigns Table */}
      <Card>
        <CardHeader>
          <CardTitle>Campaign Management</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campaign Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Total Calls</TableHead>
                <TableHead>Success Rate</TableHead>
                <TableHead>Avg Duration</TableHead>
                <TableHead>Voice</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCampaigns.map((campaign) => (
                <TableRow key={campaign.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{campaign.name}</div>
                      <div className="text-sm text-muted-foreground">{campaign.description}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(campaign.status)}>
                      {campaign.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{campaign.type}</TableCell>
                  <TableCell>{campaign.totalCalls.toLocaleString()}</TableCell>
                  <TableCell>{campaign.conversion}%</TableCell>
                  <TableCell>{campaign.avgDuration}</TableCell>
                  <TableCell>{campaign.voice}</TableCell>
                  <TableCell>{new Date(campaign.created).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <Phone className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Play className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Settings className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Campaigns;
