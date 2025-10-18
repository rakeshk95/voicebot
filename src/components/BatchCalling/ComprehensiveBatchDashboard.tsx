import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Play, 
  BarChart3, 
  Server, 
  Settings,
  Bell,
  TrendingUp,
  Users,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';

import BatchSummaryPage from './BatchSummaryPage';
import BatchDetailView from './BatchDetailView';
import SystemMonitoring from './SystemMonitoring';
import FastBatchCalling from './FastBatchCalling';

interface Notification {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

const ComprehensiveBatchDashboard: React.FC = () => {
  const [currentView, setCurrentView] = useState<'dashboard' | 'detail' | 'create'>('dashboard');
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { toast } = useToast();

  // Mock notifications - will be replaced with real API calls
  useEffect(() => {
    const mockNotifications: Notification[] = [
      {
        id: 'notif_001',
        type: 'success',
        title: 'Batch Completed',
        message: 'Marketing Campaign Q4 has completed successfully with 73% success rate',
        timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        read: false
      },
      {
        id: 'notif_002',
        type: 'warning',
        title: 'High Failure Rate',
        message: 'Lead Qualification batch has 89% failure rate - consider retrying failed calls',
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        read: false
      },
      {
        id: 'notif_003',
        type: 'info',
        title: 'System Status',
        message: 'RabbitMQ queue depth is normal, all systems operational',
        timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
        read: true
      }
    ];

    setNotifications(mockNotifications);
    setUnreadCount(mockNotifications.filter(n => !n.read).length);
  }, []);

  const handleViewBatchDetails = (batchId: string) => {
    setSelectedBatchId(batchId);
    setCurrentView('detail');
  };

  const handleBackToDashboard = () => {
    setSelectedBatchId(null);
    setCurrentView('dashboard');
  };

  const handleCreateNewBatch = () => {
    setCurrentView('create');
  };

  const handleNotificationClick = (notificationId: string) => {
    setNotifications(notifications.map(notif => 
      notif.id === notificationId ? { ...notif, read: true } : notif
    ));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const handleMarkAllRead = () => {
    setNotifications(notifications.map(notif => ({ ...notif, read: true })));
    setUnreadCount(0);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning': return <XCircle className="h-4 w-4 text-yellow-600" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-600" />;
      default: return <Bell className="h-4 w-4 text-blue-600" />;
    }
  };

  if (currentView === 'detail' && selectedBatchId) {
    return (
      <BatchDetailView 
        batchId={selectedBatchId} 
        onBack={handleBackToDashboard}
      />
    );
  }

  if (currentView === 'create') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={handleBackToDashboard}>
              ← Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Create New Batch</h1>
              <p className="text-muted-foreground">Start a new batch calling operation</p>
            </div>
          </div>
        </div>
        <FastBatchCalling />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Batch Calling Command Center</h1>
          <p className="text-muted-foreground">Comprehensive monitoring and management for all batch operations</p>
        </div>
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <div className="relative">
            <Button variant="outline" className="relative">
              <Bell className="h-4 w-4 mr-2" />
              Notifications
              {unreadCount > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white text-xs">
                  {unreadCount}
                </Badge>
              )}
            </Button>
          </div>
          <Button onClick={handleCreateNewBatch} className="bg-blue-600 hover:bg-blue-700">
            <Play className="h-4 w-4 mr-2" />
            Start New Batch
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Batches</p>
                <p className="text-2xl font-bold">3</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Calls Today</p>
                <p className="text-2xl font-bold">1,247</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold">73.2%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Duration</p>
                <p className="text-2xl font-bold">24.8s</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="batches" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="batches" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Batch Operations</span>
          </TabsTrigger>
          <TabsTrigger value="monitoring" className="flex items-center space-x-2">
            <Server className="h-4 w-4" />
            <span>System Monitoring</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center space-x-2">
            <Bell className="h-4 w-4" />
            <span>Notifications</span>
            {unreadCount > 0 && (
              <Badge className="ml-1 h-4 w-4 flex items-center justify-center p-0 bg-red-500 text-white text-xs">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="batches" className="space-y-4">
          <BatchSummaryPage showHeader={false} />
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-4">
          <SystemMonitoring />
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Notifications & Alerts</CardTitle>
                {unreadCount > 0 && (
                  <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
                    Mark All Read
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {notifications.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Bell className="h-8 w-8 mx-auto mb-2" />
                    <p>No notifications</p>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        notification.read 
                          ? 'bg-muted/30 border-muted' 
                          : 'bg-background border-border hover:bg-muted/50'
                      }`}
                      onClick={() => handleNotificationClick(notification.id)}
                    >
                      <div className="flex items-start space-x-3">
                        {getNotificationIcon(notification.type)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className={`text-sm font-medium ${
                              notification.read ? 'text-muted-foreground' : 'text-foreground'
                            }`}>
                              {notification.title}
                            </h4>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-muted-foreground">
                                {new Date(notification.timestamp).toLocaleString()}
                              </span>
                              {!notification.read && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              )}
                            </div>
                          </div>
                          <p className={`text-sm mt-1 ${
                            notification.read ? 'text-muted-foreground' : 'text-muted-foreground'
                          }`}>
                            {notification.message}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ComprehensiveBatchDashboard;
