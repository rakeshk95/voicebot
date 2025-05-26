
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, BarChart, Activity, Phone, Clock, TrendingUp, Target, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Dashboard = () => {
  const stats = [
    { title: 'Total Calls Today', value: '1,247', change: '+12%', icon: Phone, color: 'text-blue-600' },
    { title: 'Active Campaigns', value: '8', change: '+2', icon: BarChart, color: 'text-green-600' },
    { title: 'Success Rate', value: '87.3%', change: '+2.1%', icon: Target, color: 'text-purple-600' },
    { title: 'Avg Call Duration', value: '2:34', change: '+8s', icon: Clock, color: 'text-orange-600' },
    { title: 'Total Users Reached', value: '12,483', change: '+5.2%', icon: Users, color: 'text-red-600' },
    { title: 'Conversion Rate', value: '4.2%', change: '+0.3%', icon: TrendingUp, color: 'text-indigo-600' },
    { title: 'AI Efficiency', value: '94%', change: '+1.5%', icon: Zap, color: 'text-yellow-600' },
    { title: 'Revenue Generated', value: '$45,231', change: '+18%', icon: Activity, color: 'text-green-700' },
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

  const callInsights = [
    { time: '9:00 AM', calls: 45, success: 38, sentiment: 'positive' },
    { time: '10:00 AM', calls: 67, success: 58, sentiment: 'positive' },
    { time: '11:00 AM', calls: 89, success: 76, sentiment: 'positive' },
    { time: '12:00 PM', calls: 123, success: 98, sentiment: 'neutral' },
    { time: '1:00 PM', calls: 78, success: 65, sentiment: 'positive' },
    { time: '2:00 PM', calls: 145, success: 127, sentiment: 'positive' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">VoiceBot Dashboard</h1>
          <p className="text-muted-foreground">Monitor your AI voice campaigns and call performance</p>
        </div>
        <Button className="bg-primary">
          <Phone className="w-4 h-4 mr-2" />
          Start New Campaign
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.title} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-green-600">{stat.change}</p>
                </div>
                <stat.icon className={`w-8 h-8 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Real-time Campaign Activity */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="w-5 h-5" />
              <span>Real-time Campaign Activity</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentCampaigns.map((campaign, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg bg-gradient-to-r from-slate-50 to-white">
                  <div className="flex items-center space-x-4">
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

        {/* Call Performance Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart className="w-5 h-5" />
              <span>Today's Performance</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Peak Call Time</span>
                <span className="text-sm">2:00 PM</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '78%' }}></div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">AI Response Quality</span>
                <span className="text-sm">96%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '96%' }}></div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Customer Satisfaction</span>
                <span className="text-sm">4.7/5</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-purple-500 h-2 rounded-full" style={{ width: '94%' }}></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Hourly Call Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Hourly Call Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {callInsights.map((insight, index) => (
              <div key={index} className="text-center p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                <div className="text-lg font-bold">{insight.calls}</div>
                <div className="text-sm text-muted-foreground">{insight.time}</div>
                <div className="text-xs text-green-600">{insight.success} successful</div>
                <div className={`text-xs mt-1 ${
                  insight.sentiment === 'positive' ? 'text-green-600' : 'text-yellow-600'
                }`}>
                  {insight.sentiment}
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
