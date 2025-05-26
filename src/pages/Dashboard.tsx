
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, BarChart, Activity, Phone, Clock, TrendingUp, Target, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LineChart, Line, AreaChart, Area, BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const Dashboard = () => {
  const stats = [
    { title: 'Total Calls Today', value: '1,247', change: '+12%', icon: Phone, color: 'text-blue-600' },
    { title: 'Active Campaigns', value: '8', change: '+2', icon: BarChart, color: 'text-green-600' },
    { title: 'Success Rate', value: '87.3%', change: '+2.1%', icon: Target, color: 'text-purple-600' },
    { title: 'Avg Call Duration', value: '2:34', change: '+8s', icon: Clock, color: 'text-orange-600' },
  ];

  const recentCampaigns = [
    { 
      name: 'Summer Sale 2024', 
      status: 'Active', 
      callsToday: 342,
      successRate: '89%',
      sentiment: 'Positive',
      nextCall: '2 mins'
    },
    { 
      name: 'Product Launch', 
      status: 'Active', 
      callsToday: 156,
      successRate: '76%',
      sentiment: 'Neutral',
      nextCall: '5 mins'
    },
    { 
      name: 'Customer Survey', 
      status: 'Paused', 
      callsToday: 0,
      successRate: '92%',
      sentiment: 'Positive',
      nextCall: 'Paused'
    },
  ];

  const hourlyData = [
    { time: '9AM', calls: 45, success: 38, revenue: 1200 },
    { time: '10AM', calls: 67, success: 58, revenue: 1800 },
    { time: '11AM', calls: 89, success: 76, revenue: 2400 },
    { time: '12PM', calls: 123, success: 98, revenue: 3200 },
    { time: '1PM', calls: 78, success: 65, revenue: 2100 },
    { time: '2PM', calls: 145, success: 127, revenue: 4100 },
    { time: '3PM', calls: 112, success: 94, revenue: 3100 },
    { time: '4PM', calls: 98, success: 82, revenue: 2700 },
  ];

  const campaignPerformance = [
    { name: 'Summer Sale', calls: 2400, success: 2000, conversion: 83 },
    { name: 'Product Launch', calls: 1398, success: 1100, conversion: 79 },
    { name: 'Newsletter', calls: 9800, success: 8200, conversion: 84 },
    { name: 'Survey', calls: 3908, success: 3200, conversion: 82 },
    { name: 'Follow-up', calls: 4800, success: 4100, conversion: 85 },
  ];

  const sentimentData = [
    { name: 'Positive', value: 73, color: '#10b981' },
    { name: 'Neutral', value: 19, color: '#f59e0b' },
    { name: 'Negative', value: 8, color: '#ef4444' },
  ];

  const weeklyTrends = [
    { day: 'Mon', calls: 1200, revenue: 15400 },
    { day: 'Tue', calls: 1350, revenue: 17200 },
    { day: 'Wed', calls: 1100, revenue: 14100 },
    { day: 'Thu', calls: 1450, revenue: 18900 },
    { day: 'Fri', calls: 1600, revenue: 21200 },
    { day: 'Sat', calls: 800, revenue: 10400 },
    { day: 'Sun', calls: 600, revenue: 7800 },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button className="bg-primary">
          <Phone className="w-4 h-4 mr-2" />
          Start New Campaign
        </Button>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-xl font-bold">{stat.value}</p>
                  <p className="text-xs text-green-600">{stat.change}</p>
                </div>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Hourly Call Performance */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Today's Call Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="calls" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                <Area type="monotone" dataKey="success" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Campaign Performance */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Campaign Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <RechartsBarChart data={campaignPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="calls" fill="#3b82f6" />
                <Bar dataKey="success" fill="#10b981" />
              </RechartsBarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Weekly Revenue Trend */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Weekly Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={weeklyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} />
                <Line type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={3} dot={{ fill: '#8b5cf6' }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Sentiment Analysis */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Call Sentiment Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={sentimentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {sentimentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value}%`, 'Percentage']} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center space-x-4 mt-4">
              {sentimentData.map((item, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-sm">{item.name}: {item.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Real-time Campaign Activity */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center space-x-2 text-lg">
            <Activity className="w-5 h-5" />
            <span>Real-time Campaign Activity</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentCampaigns.map((campaign, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg bg-gradient-to-r from-slate-50 to-white">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    campaign.status === 'Active' ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                  }`}></div>
                  <div>
                    <h4 className="font-medium">{campaign.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {campaign.callsToday} calls today • {campaign.successRate} success • Next: {campaign.nextCall}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    campaign.sentiment === 'Positive' ? 'bg-green-100 text-green-800' :
                    campaign.sentiment === 'Neutral' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {campaign.sentiment}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    campaign.status === 'Active' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {campaign.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
