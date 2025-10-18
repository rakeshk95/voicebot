import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import WhatsAppNavigation from '@/components/WhatsAppNavigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { 
  MessageSquare, 
  Send, 
  Users, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  XCircle,
  ArrowUp,
  ArrowDown,
  Activity
} from 'lucide-react';
import { WhatsAppBusinessAccount, WhatsAppMessage, WhatsAppCampaign } from '@/types/whatsapp';
import { getWhatsAppBusinessAccounts, getWhatsAppMessages, getWhatsAppCampaigns } from '@/lib/whatsappApi';

interface DashboardStats {
  totalAccounts: number;
  totalCampaigns: number;
  totalMessages: number;
  messagesToday: number;
  messagesThisWeek: number;
  messagesThisMonth: number;
  successRate: number;
  activeCampaigns: number;
  recentMessages: WhatsAppMessage[];
  topAccounts: Array<{
    account: WhatsAppBusinessAccount;
    messageCount: number;
  }>;
}

const WhatsAppDashboard: React.FC = () => {
  const { toast } = useToast();
  const [stats, setStats] = useState<DashboardStats>({
    totalAccounts: 0,
    totalCampaigns: 0,
    totalMessages: 0,
    messagesToday: 0,
    messagesThisWeek: 0,
    messagesThisMonth: 0,
    successRate: 0,
    activeCampaigns: 0,
    recentMessages: [],
    topAccounts: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [accounts, messages, campaigns] = await Promise.all([
        getWhatsAppBusinessAccounts(),
        getWhatsAppMessages(undefined, undefined, undefined, 100, 0),
        getWhatsAppCampaigns()
      ]);

      // Calculate stats
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      const messagesToday = messages.filter(msg => 
        new Date(msg.created_at) >= today
      ).length;

      const messagesThisWeek = messages.filter(msg => 
        new Date(msg.created_at) >= weekAgo
      ).length;

      const messagesThisMonth = messages.filter(msg => 
        new Date(msg.created_at) >= monthAgo
      ).length;

      const successfulMessages = messages.filter(msg => 
        msg.status === 'delivered' || msg.status === 'read'
      ).length;

      const successRate = messages.length > 0 ? (successfulMessages / messages.length) * 100 : 0;

      const activeCampaigns = campaigns.filter(campaign => 
        campaign.status === 'active'
      ).length;

      // Get recent messages (last 10)
      const recentMessages = messages
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10);

      // Calculate top accounts by message count
      const accountMessageCounts = messages.reduce((acc, message) => {
        acc[message.business_account_id] = (acc[message.business_account_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const topAccounts = Object.entries(accountMessageCounts)
        .map(([accountId, count]) => ({
          account: accounts.find(acc => acc.id === accountId)!,
          messageCount: count
        }))
        .filter(item => item.account)
        .sort((a, b) => b.messageCount - a.messageCount)
        .slice(0, 5);

      setStats({
        totalAccounts: accounts.length,
        totalCampaigns: campaigns.length,
        totalMessages: messages.length,
        messagesToday,
        messagesThisWeek,
        messagesThisMonth,
        successRate: Math.round(successRate * 100) / 100,
        activeCampaigns,
        recentMessages,
        topAccounts
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch dashboard data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'read': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDirectionIcon = (direction: string) => {
    return direction === 'outbound' ? 
      <ArrowUp className="h-3 w-3 text-green-600" /> : 
      <ArrowDown className="h-3 w-3 text-blue-600" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading WhatsApp dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <WhatsAppNavigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">WhatsApp Dashboard</h1>
            <p className="text-gray-600 mt-1">Overview of your WhatsApp messaging activity</p>
          </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Accounts</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAccounts}</div>
            <p className="text-xs text-muted-foreground">
              WhatsApp Business Accounts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMessages}</div>
            <p className="text-xs text-muted-foreground">
              All time messages sent
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeCampaigns}</div>
            <p className="text-xs text-muted-foreground">
              Currently running campaigns
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.successRate}%</div>
            <p className="text-xs text-muted-foreground">
              Messages delivered successfully
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Message Activity */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.messagesToday}</div>
            <p className="text-sm text-muted-foreground">Messages sent today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.messagesThisWeek}</div>
            <p className="text-sm text-muted-foreground">Messages sent this week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.messagesThisMonth}</div>
            <p className="text-sm text-muted-foreground">Messages sent this month</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Accounts */}
        <Card>
          <CardHeader>
            <CardTitle>Top Accounts by Messages</CardTitle>
            <CardDescription>
              Business accounts with the most message activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.topAccounts.map((item, index) => (
                <div key={item.account.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-green-600">
                        {index + 1}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{item.account.name}</p>
                      <p className="text-sm text-gray-500">{item.account.phone_number_id}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{item.messageCount}</p>
                    <p className="text-sm text-gray-500">messages</p>
                  </div>
                </div>
              ))}
              
              {stats.topAccounts.length === 0 && (
                <p className="text-center text-gray-500 py-4">
                  No message activity yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Messages */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Messages</CardTitle>
            <CardDescription>
              Latest WhatsApp message activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentMessages.map((message) => (
                <div key={message.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getDirectionIcon(message.direction)}
                    <div>
                      <p className="font-medium">{message.to_number}</p>
                      <p className="text-sm text-gray-500">
                        {message.content ? 
                          (message.content.length > 30 ? 
                            `${message.content.substring(0, 30)}...` : 
                            message.content
                          ) : 
                          `${message.message_type} message`
                        }
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={getStatusColor(message.status)}>
                      {message.status}
                    </Badge>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(message.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              
              {stats.recentMessages.length === 0 && (
                <p className="text-center text-gray-500 py-4">
                  No recent messages
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppDashboard;
