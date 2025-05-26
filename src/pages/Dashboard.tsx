
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Phone, Clock, Target, TrendingUp } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const Dashboard = () => {
  const stats = [
    { title: 'Total Calls Today', value: '1,247', change: '+12%', icon: Phone, color: 'text-blue-600' },
    { title: 'Active Campaigns', value: '8', change: '+2', icon: TrendingUp, color: 'text-green-600' },
    { title: 'Success Rate', value: '87.3%', change: '+2.1%', icon: Target, color: 'text-purple-600' },
    { title: 'Avg Call Duration', value: '2:34', change: '+8s', icon: Clock, color: 'text-orange-600' },
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

  const callOutcomes = [
    { name: 'Successful', value: 73, color: '#10b981' },
    { name: 'No Answer', value: 19, color: '#f59e0b' },
    { name: 'Failed', value: 8, color: '#ef4444' },
  ];

  const weeklyTrends = [
    { day: 'Mon', calls: 1200, campaigns: 6 },
    { day: 'Tue', calls: 1350, campaigns: 7 },
    { day: 'Wed', calls: 1100, campaigns: 5 },
    { day: 'Thu', calls: 1450, campaigns: 8 },
    { day: 'Fri', calls: 1600, campaigns: 9 },
    { day: 'Sat', calls: 800, campaigns: 4 },
    { day: 'Sun', calls: 600, campaigns: 3 },
  ];

  return (
    <div className="space-y-6">
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hourly Call Performance */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Today's Call Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
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
            <ResponsiveContainer width="100%" height={280}>
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

        {/* Weekly Call Trends */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Weekly Call Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={weeklyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="calls" stroke="#8b5cf6" strokeWidth={3} dot={{ fill: '#8b5cf6' }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Call Outcomes */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Call Outcomes</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={callOutcomes}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {callOutcomes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value}%`, 'Percentage']} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center space-x-4 mt-4">
              {callOutcomes.map((item, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-sm">{item.name}: {item.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
