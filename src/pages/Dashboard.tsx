
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Phone, Clock, Target, TrendingUp, Users, PhoneCall } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const Dashboard = () => {
  const stats = [
    { title: 'Total Calls Today', value: '1,247', change: '+12%', icon: Phone, color: 'from-blue-500 to-blue-600', textColor: 'text-blue-600' },
    { title: 'Active Campaigns', value: '8', change: '+2', icon: TrendingUp, color: 'from-green-500 to-green-600', textColor: 'text-green-600' },
    { title: 'Success Rate', value: '87.3%', change: '+2.1%', icon: Target, color: 'from-purple-500 to-purple-600', textColor: 'text-purple-600' },
    { title: 'Avg Call Duration', value: '2:34', change: '+8s', icon: Clock, color: 'from-orange-500 to-orange-600', textColor: 'text-orange-600' },
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
    <div className="space-y-8 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-2xl shadow-xl">
        <div className="flex items-center space-x-4">
          <div className="bg-white/20 p-3 rounded-xl">
            <PhoneCall className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Voice Campaign Dashboard</h1>
            <p className="text-blue-100 mt-1">Real-time insights and performance metrics</p>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.title} className="relative overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <div className={`absolute inset-0 bg-gradient-to-r ${stat.color} opacity-5`}></div>
            <CardContent className="p-6 relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-2">{stat.title}</p>
                  <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
                  <p className="text-sm text-green-600 font-medium mt-1">{stat.change}</p>
                </div>
                <div className={`p-4 rounded-2xl bg-gradient-to-r ${stat.color} shadow-lg`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Hourly Call Performance */}
        <Card className="border-0 shadow-xl">
          <CardHeader className="pb-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-xl">
            <CardTitle className="text-xl font-bold text-slate-800 flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Today's Call Performance</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={hourlyData}>
                <defs>
                  <linearGradient id="callsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="successGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="time" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: 'none', 
                    borderRadius: '12px', 
                    boxShadow: '0 10px 40px rgba(0,0,0,0.1)' 
                  }} 
                />
                <Area type="monotone" dataKey="calls" stackId="1" stroke="#3b82f6" fill="url(#callsGradient)" strokeWidth={2} />
                <Area type="monotone" dataKey="success" stackId="1" stroke="#10b981" fill="url(#successGradient)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Campaign Performance */}
        <Card className="border-0 shadow-xl">
          <CardHeader className="pb-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-t-xl">
            <CardTitle className="text-xl font-bold text-slate-800 flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Campaign Performance</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <RechartsBarChart data={campaignPerformance}>
                <defs>
                  <linearGradient id="barGradient1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.6}/>
                  </linearGradient>
                  <linearGradient id="barGradient2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.6}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: 'none', 
                    borderRadius: '12px', 
                    boxShadow: '0 10px 40px rgba(0,0,0,0.1)' 
                  }} 
                />
                <Bar dataKey="calls" fill="url(#barGradient1)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="success" fill="url(#barGradient2)" radius={[4, 4, 0, 0]} />
              </RechartsBarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Weekly Call Trends */}
        <Card className="border-0 shadow-xl">
          <CardHeader className="pb-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-t-xl">
            <CardTitle className="text-xl font-bold text-slate-800 flex items-center space-x-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span>Weekly Call Trends</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={weeklyTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="day" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: 'none', 
                    borderRadius: '12px', 
                    boxShadow: '0 10px 40px rgba(0,0,0,0.1)' 
                  }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="calls" 
                  stroke="#8b5cf6" 
                  strokeWidth={4} 
                  dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 6 }} 
                  activeDot={{ r: 8, stroke: '#8b5cf6', strokeWidth: 2, fill: 'white' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Call Outcomes */}
        <Card className="border-0 shadow-xl">
          <CardHeader className="pb-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-t-xl">
            <CardTitle className="text-xl font-bold text-slate-800 flex items-center space-x-2">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span>Call Outcomes</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={callOutcomes}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="white"
                  strokeWidth={3}
                >
                  {callOutcomes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => [`${value}%`, 'Percentage']}
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: 'none', 
                    borderRadius: '12px', 
                    boxShadow: '0 10px 40px rgba(0,0,0,0.1)' 
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center space-x-6 mt-6">
              {callOutcomes.map((item, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div 
                    className="w-4 h-4 rounded-full shadow-sm" 
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <span className="text-sm font-medium text-slate-700">
                    {item.name}: {item.value}%
                  </span>
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
