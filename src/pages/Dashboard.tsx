
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, BarChart, Activity, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Dashboard = () => {
  const stats = [
    { title: 'Total Users', value: '12,483', change: '+12%', icon: Users },
    { title: 'Active Campaigns', value: '23', change: '+5%', icon: BarChart },
    { title: 'Conversion Rate', value: '3.2%', change: '+0.5%', icon: Activity },
    { title: 'Revenue', value: '$45,231', change: '+18%', icon: User },
  ];

  const recentCampaigns = [
    { name: 'Summer Sale 2024', status: 'Active', users: 2350, conversion: '4.2%' },
    { name: 'Product Launch', status: 'Draft', users: 0, conversion: '0%' },
    { name: 'Newsletter Campaign', status: 'Completed', users: 1840, conversion: '2.8%' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <Button className="bg-primary">Create Campaign</Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-green-600">{stat.change}</p>
                </div>
                <stat.icon className="w-8 h-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentCampaigns.map((campaign) => (
                <div key={campaign.name} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{campaign.name}</h4>
                    <p className="text-sm text-muted-foreground">{campaign.users} users • {campaign.conversion} conversion</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    campaign.status === 'Active' ? 'bg-green-100 text-green-800' :
                    campaign.status === 'Draft' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {campaign.status}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Campaign Success Rate</span>
                <span className="font-medium">78%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-primary h-2 rounded-full" style={{ width: '78%' }}></div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm">User Engagement</span>
                <span className="font-medium">85%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '85%' }}></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
