
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Activity, TrendingUp, Brain, Users, Clock } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

const Analytics = () => {
  const conversionFunnelData = [
    { stage: 'Calls Made', value: 10000, percentage: 100 },
    { stage: 'Connected', value: 8500, percentage: 85 },
    { stage: 'Engaged', value: 6800, percentage: 68 },
    { stage: 'Interested', value: 4200, percentage: 42 },
    { stage: 'Converted', value: 1260, percentage: 12.6 },
  ];

  const performanceMetrics = [
    { metric: 'Call Quality', score: 94 },
    { metric: 'Response Time', score: 88 },
    { metric: 'Accuracy', score: 96 },
    { metric: 'Engagement', score: 85 },
    { metric: 'Satisfaction', score: 91 },
    { metric: 'Efficiency', score: 89 },
  ];

  const timeDistribution = [
    { hour: '9AM', inbound: 120, outbound: 340 },
    { hour: '10AM', inbound: 180, outbound: 420 },
    { hour: '11AM', inbound: 220, outbound: 380 },
    { hour: '12PM', inbound: 160, outbound: 290 },
    { hour: '1PM', inbound: 140, outbound: 260 },
    { hour: '2PM', inbound: 200, outbound: 450 },
    { hour: '3PM', inbound: 190, outbound: 380 },
    { hour: '4PM', inbound: 170, outbound: 320 },
    { hour: '5PM', inbound: 130, outbound: 240 },
  ];

  const geographicData = [
    { region: 'North America', calls: 4500, conversion: 14.2, color: '#3b82f6' },
    { region: 'Europe', calls: 3200, conversion: 11.8, color: '#10b981' },
    { region: 'Asia Pacific', calls: 2800, conversion: 13.5, color: '#f59e0b' },
    { region: 'Latin America', calls: 1500, conversion: 9.7, color: '#ef4444' },
    { region: 'Others', calls: 800, conversion: 8.2, color: '#8b5cf6' },
  ];

  const monthlyTrends = [
    { month: 'Jan', calls: 12400, success: 10540, revenue: 125000 },
    { month: 'Feb', calls: 13200, success: 11220, revenue: 142000 },
    { month: 'Mar', calls: 15800, success: 13560, revenue: 168000 },
    { month: 'Apr', calls: 14600, success: 12580, revenue: 156000 },
    { month: 'May', calls: 16900, success: 14720, revenue: 189000 },
    { month: 'Jun', calls: 18200, success: 15860, revenue: 205000 },
  ];

  const campaignROI = [
    { campaign: 'Summer Sale', investment: 25000, revenue: 95000, roi: 280 },
    { campaign: 'Product Launch', investment: 18000, revenue: 62000, roi: 244 },
    { campaign: 'Newsletter', investment: 12000, revenue: 48000, roi: 300 },
    { campaign: 'Survey', investment: 8000, revenue: 24000, roi: 200 },
    { campaign: 'Follow-up', investment: 15000, revenue: 58000, roi: 287 },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Advanced Analytics</h1>
      </div>

      {/* Conversion Funnel & Performance Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5" />
              <span>Conversion Funnel</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {conversionFunnelData.map((stage, index) => (
                <div key={index} className="relative">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium">{stage.stage}</span>
                    <span className="text-sm text-muted-foreground">
                      {stage.value.toLocaleString()} ({stage.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${stage.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center space-x-2">
              <Brain className="w-5 h-5" />
              <span>AI Performance Metrics</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={performanceMetrics}>
                <PolarGrid />
                <PolarAngleAxis dataKey="metric" />
                <PolarRadiusAxis angle={30} domain={[0, 100]} />
                <Radar
                  name="Score"
                  dataKey="score"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trends & Geographic Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center space-x-2">
              <BarChart className="w-5 h-5" />
              <span>6-Month Performance Trend</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value, name) => {
                  if (name === 'revenue') return [`$${value.toLocaleString()}`, 'Revenue'];
                  return [value.toLocaleString(), name === 'calls' ? 'Total Calls' : 'Successful Calls'];
                }} />
                <Area type="monotone" dataKey="calls" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                <Area type="monotone" dataKey="success" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>Geographic Performance</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <RechartsBarChart data={geographicData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="region" type="category" width={100} />
                <Tooltip formatter={(value, name) => [
                  name === 'calls' ? value.toLocaleString() : `${value}%`,
                  name === 'calls' ? 'Total Calls' : 'Conversion Rate'
                ]} />
                <Bar dataKey="calls" fill="#3b82f6" />
              </RechartsBarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Hourly Distribution & Campaign ROI */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center space-x-2">
              <Clock className="w-5 h-5" />
              <span>Hourly Call Distribution</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <RechartsBarChart data={timeDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="inbound" fill="#10b981" name="Inbound" />
                <Bar dataKey="outbound" fill="#3b82f6" name="Outbound" />
              </RechartsBarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center space-x-2">
              <Activity className="w-5 h-5" />
              <span>Campaign ROI Analysis</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <RechartsBarChart data={campaignROI}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="campaign" />
                <YAxis />
                <Tooltip formatter={(value, name) => [
                  name === 'roi' ? `${value}%` : `$${value.toLocaleString()}`,
                  name === 'investment' ? 'Investment' : name === 'revenue' ? 'Revenue' : 'ROI'
                ]} />
                <Bar dataKey="roi" fill="#8b5cf6" />
              </RechartsBarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Performance Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Detailed Campaign Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Campaign</th>
                  <th className="text-left p-2">Investment</th>
                  <th className="text-left p-2">Revenue</th>
                  <th className="text-left p-2">ROI</th>
                  <th className="text-left p-2">Calls</th>
                  <th className="text-left p-2">Conversion</th>
                  <th className="text-left p-2">Performance</th>
                </tr>
              </thead>
              <tbody>
                {campaignROI.map((campaign, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="p-2 font-medium">{campaign.campaign}</td>
                    <td className="p-2">${campaign.investment.toLocaleString()}</td>
                    <td className="p-2">${campaign.revenue.toLocaleString()}</td>
                    <td className="p-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        campaign.roi > 250 ? 'bg-green-100 text-green-800' : 
                        campaign.roi > 200 ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-red-100 text-red-800'
                      }`}>
                        {campaign.roi}%
                      </span>
                    </td>
                    <td className="p-2">{(campaign.revenue / 12).toFixed(0)}</td>
                    <td className="p-2">{((campaign.roi / 10) + 2).toFixed(1)}%</td>
                    <td className="p-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full" 
                          style={{ width: `${Math.min(campaign.roi / 3, 100)}%` }}
                        ></div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Analytics;
