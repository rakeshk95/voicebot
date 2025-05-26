
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { BarChart, Users, Activity, Settings } from 'lucide-react';

const Campaigns = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const campaigns = [
    {
      id: 1,
      name: 'Summer Sale 2024',
      description: 'Promotional campaign for summer products',
      status: 'Active',
      users: 2350,
      conversion: 4.2,
      revenue: 12450,
      created: '2024-01-15'
    },
    {
      id: 2,
      name: 'Product Launch',
      description: 'New product introduction campaign',
      status: 'Draft',
      users: 0,
      conversion: 0,
      revenue: 0,
      created: '2024-01-20'
    },
    {
      id: 3,
      name: 'Newsletter Campaign',
      description: 'Monthly newsletter with updates',
      status: 'Completed',
      users: 1840,
      conversion: 2.8,
      revenue: 8200,
      created: '2024-01-10'
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
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Campaigns</h1>
        <Button className="bg-primary">Create New Campaign</Button>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center space-x-4">
        <Input
          placeholder="Search campaigns..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Button variant="outline">Filter</Button>
        <Button variant="outline">Sort</Button>
      </div>

      {/* Campaigns Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredCampaigns.map((campaign) => (
          <Card key={campaign.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{campaign.name}</CardTitle>
                <Badge className={getStatusColor(campaign.status)}>
                  {campaign.status}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{campaign.description}</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span>{campaign.users.toLocaleString()} users</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <BarChart className="w-4 h-4 text-muted-foreground" />
                    <span>{campaign.conversion}% conv.</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Activity className="w-4 h-4 text-muted-foreground" />
                    <span>${campaign.revenue.toLocaleString()}</span>
                  </div>
                  <div className="text-muted-foreground">
                    {new Date(campaign.created).toLocaleDateString()}
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    View Details
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Settings className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Campaigns;
