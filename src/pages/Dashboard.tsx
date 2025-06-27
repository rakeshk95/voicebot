import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Phone, Clock, BarChart3, Users, TrendingUp, Activity, Brain, Target, Zap } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

const Dashboard = () => {
  const stats = [
    {
      title: "Total Calls",
      value: "2,345",
      icon: Phone,
      description: "Last 30 days",
      trend: "+12.5%",
      color: "from-blue-600 to-blue-400",
    },
    {
      title: "Active Users",
      value: "85",
      icon: Users,
      description: "Currently online",
      trend: "+5.2%",
      color: "from-green-600 to-green-400",
    },
    {
      title: "Success Rate",
      value: "92%",
      icon: Target,
      description: "Call completion rate",
      trend: "+2.3%",
      color: "from-purple-600 to-purple-400",
    },
    {
      title: "Avg. Duration",
      value: "4m 32s",
      icon: Clock,
      description: "Per call",
      trend: "-0.5%",
      color: "from-orange-600 to-orange-400",
    },
  ];

  const activityData = [
    { time: '00:00', calls: 30, success: 25 },
    { time: '03:00', calls: 20, success: 18 },
    { time: '06:00', calls: 15, success: 12 },
    { time: '09:00', calls: 40, success: 35 },
    { time: '12:00', calls: 65, success: 58 },
    { time: '15:00', calls: 55, success: 48 },
    { time: '18:00', calls: 45, success: 40 },
    { time: '21:00', calls: 35, success: 30 },
  ];

  const performanceData = [
    { month: 'Jan', success: 85, failed: 15 },
    { month: 'Feb', success: 88, failed: 12 },
    { month: 'Mar', success: 92, failed: 8 },
    { month: 'Apr', success: 90, failed: 10 },
    { month: 'May', success: 95, failed: 5 },
    { month: 'Jun', success: 93, failed: 7 },
  ];

  const aiMetrics = [
    { name: 'Accuracy', value: 92 },
    { name: 'Response', value: 85 },
    { name: 'Engagement', value: 78 },
    { name: 'Resolution', value: 88 },
  ];

  const COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b'];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.title} className="hover:shadow-lg transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className={`p-3 rounded-lg bg-gradient-to-br ${stat.color}`}>
                  <stat.icon className="h-5 w-5 text-white" />
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  stat.trend.startsWith('+') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {stat.trend}
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-sm font-medium text-muted-foreground">{stat.title}</h3>
                <p className="text-3xl font-bold mt-2">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-500" />
              Call Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activityData}>
                  <defs>
                    <linearGradient id="colorCalls" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="calls" 
                    stroke="#3b82f6" 
                    fillOpacity={1} 
                    fill="url(#colorCalls)" 
                    name="Total Calls"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="success" 
                    stroke="#10b981" 
                    fillOpacity={1} 
                    fill="url(#colorSuccess)" 
                    name="Successful Calls"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-500" />
              Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={aiMetrics}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}%`}
                  >
                    {aiMetrics.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-200 lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              Monthly Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Bar 
                    dataKey="success" 
                    fill="#10b981" 
                    name="Successful" 
                    radius={[4, 4, 0, 0]}
                  >
                    {performanceData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`}
                        fill={`url(#successGradient-${index})`}
                      />
                    ))}
                  </Bar>
                  <Bar 
                    dataKey="failed" 
                    fill="#ef4444" 
                    name="Failed" 
                    radius={[4, 4, 0, 0]}
                  >
                    {performanceData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`}
                        fill={`url(#failedGradient-${index})`}
                      />
                    ))}
                  </Bar>
                  <defs>
                    {performanceData.map((_, index) => (
                      <React.Fragment key={index}>
                        <linearGradient id={`successGradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.4}/>
                        </linearGradient>
                        <linearGradient id={`failedGradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#ef4444" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0.4}/>
                        </linearGradient>
                      </React.Fragment>
                    ))}
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
