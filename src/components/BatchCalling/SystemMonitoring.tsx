import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  Server, 
  Cpu, 
  HardDrive, 
  Network, 
  Users, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Pause,
  Play,
  Square,
  Settings,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Zap
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { 
  getSystemMonitoring,
  getRealTimeMonitoring,
  getSystemMetrics,
  getQueueHealth,
  getWorkerMetrics,
  getSystemAlerts,
  pauseAllWorkers,
  resumeAllWorkers,
  restartAllWorkers,
  scaleWorkers,
  emergencyStopAll
} from '@/lib/batchCallingApi';

interface SystemMonitoringProps {
  refreshInterval?: number;
  autoRefresh?: boolean;
}

export const SystemMonitoring: React.FC<SystemMonitoringProps> = ({ 
  refreshInterval = 10000, 
  autoRefresh = true 
}) => {
  const [monitoringData, setMonitoringData] = useState<any>(null);
  const [realTimeData, setRealTimeData] = useState<any>(null);
  const [systemMetrics, setSystemMetrics] = useState<any>(null);
  const [queueHealth, setQueueHealth] = useState<any>(null);
  const [workerMetrics, setWorkerMetrics] = useState<any>(null);
  const [systemAlerts, setSystemAlerts] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [workerCount, setWorkerCount] = useState(1);
  const { toast } = useToast();
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const realTimeIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchMonitoringData = async () => {
    try {
      setRefreshing(true);
      setError(null);
      
      const [monitoring, metrics, health, workers, alerts] = await Promise.all([
        getSystemMonitoring().catch(() => null),
        getSystemMetrics().catch(() => null),
        getQueueHealth().catch(() => null),
        getWorkerMetrics().catch(() => null),
        getSystemAlerts().catch(() => null)
      ]);

      setMonitoringData(monitoring);
      setSystemMetrics(metrics);
      setQueueHealth(health);
      setWorkerMetrics(workers);
      setSystemAlerts(alerts);
      
    } catch (error) {
      console.error('Error fetching monitoring data:', error);
      setError('Failed to fetch monitoring data');
      toast({
        title: "Error",
        description: "Failed to fetch system monitoring data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchRealTimeData = async () => {
    try {
      const realTime = await getRealTimeMonitoring();
      setRealTimeData(realTime);
    } catch (error) {
      console.error('Error fetching real-time data:', error);
    }
  };

  useEffect(() => {
    fetchMonitoringData();
    
    if (autoRefresh) {
      intervalRef.current = setInterval(fetchMonitoringData, refreshInterval);
      realTimeIntervalRef.current = setInterval(fetchRealTimeData, 3000); // Real-time updates every 3 seconds
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (realTimeIntervalRef.current) clearInterval(realTimeIntervalRef.current);
    };
  }, [refreshInterval, autoRefresh]);

  const handleWorkerControl = async (action: 'pause' | 'resume' | 'restart' | 'scale') => {
    try {
      let result;
      switch (action) {
        case 'pause':
          result = await pauseAllWorkers();
          break;
        case 'resume':
          result = await resumeAllWorkers();
          break;
        case 'restart':
          result = await restartAllWorkers();
          break;
        case 'scale':
          result = await scaleWorkers(workerCount);
          break;
      }

      toast({
        title: "Success",
        description: result.message,
      });

      // Refresh data after action
      await fetchMonitoringData();
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${action} workers`,
        variant: "destructive",
      });
    }
  };

  const handleEmergencyStop = async () => {
    if (window.confirm('Are you sure you want to emergency stop all operations? This action cannot be undone.')) {
      try {
        const result = await emergencyStopAll();
        toast({
          title: "Emergency Stop Executed",
          description: result.message,
          variant: "destructive",
        });
        await fetchMonitoringData();
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to execute emergency stop",
          variant: "destructive",
        });
      }
    }
  };

  const getHealthStatus = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'healthy':
      case 'ok':
      case 'active':
        return { color: 'text-green-600', bg: 'bg-green-100', icon: CheckCircle };
      case 'warning':
      case 'degraded':
        return { color: 'text-yellow-600', bg: 'bg-yellow-100', icon: AlertTriangle };
      case 'error':
      case 'failed':
      case 'inactive':
        return { color: 'text-red-600', bg: 'bg-red-100', icon: XCircle };
      default:
        return { color: 'text-gray-600', bg: 'bg-gray-100', icon: Activity };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span>Loading system monitoring...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-lg font-medium text-red-600 mb-4">
          Unable to load monitoring data
        </div>
        <p className="text-sm text-muted-foreground mb-4">{error}</p>
        <Button onClick={fetchMonitoringData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">System Monitoring</h2>
          <p className="text-muted-foreground">
            Real-time monitoring of RabbitMQ, workers, and system resources
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button onClick={fetchMonitoringData} disabled={refreshing} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* System Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              {monitoringData?.health && (() => {
                const health = getHealthStatus(monitoringData.health.status);
                const Icon = health.icon;
                return (
                  <>
                    <Icon className={`h-4 w-4 ${health.color}`} />
                    <span className={`text-sm font-medium ${health.color}`}>
                      {monitoringData.health.status}
                    </span>
                  </>
                );
              })()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Workers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {workerMetrics?.data?.active_workers || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {workerMetrics?.data?.total_workers || 0} total workers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Queue Depth</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {queueHealth?.data?.queue_depth || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {queueHealth?.data?.processing_rate || 0} calls/min
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Load</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {systemMetrics?.data?.cpu_usage?.toFixed(1) || 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              {systemMetrics?.data?.memory_usage?.toFixed(1) || 0}% memory
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Monitoring Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="workers">Workers</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Queue Health */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Queue Health</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {queueHealth?.data && (
                  <>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Queue Depth</span>
                        <span className="font-medium">{queueHealth.data.queue_depth}</span>
                      </div>
                      <Progress value={Math.min((queueHealth.data.queue_depth / 1000) * 100, 100)} />
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <div className="text-lg font-bold text-blue-600">
                          {queueHealth.data.processing_rate}
                        </div>
                        <div className="text-xs text-muted-foreground">Calls/min</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-red-600">
                          {queueHealth.data.error_rate?.toFixed(2) || 0}%
                        </div>
                        <div className="text-xs text-muted-foreground">Error Rate</div>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* System Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Server className="h-5 w-5" />
                  <span>System Metrics</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {systemMetrics?.data && (
                  <>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>CPU Usage</span>
                        <span className="font-medium">{systemMetrics.data.cpu_usage?.toFixed(1)}%</span>
                      </div>
                      <Progress value={systemMetrics.data.cpu_usage || 0} />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Memory Usage</span>
                        <span className="font-medium">{systemMetrics.data.memory_usage?.toFixed(1)}%</span>
                      </div>
                      <Progress value={systemMetrics.data.memory_usage || 0} />
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <div className="text-lg font-bold text-green-600">
                          {systemMetrics.data.disk_usage?.toFixed(1) || 0}%
                        </div>
                        <div className="text-xs text-muted-foreground">Disk Usage</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-blue-600">
                          {systemMetrics.data.active_connections || 0}
                        </div>
                        <div className="text-xs text-muted-foreground">Connections</div>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="workers" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Worker Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>Worker Status</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {workerMetrics?.data && (
                  <>
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <div className="text-lg font-bold text-green-600">
                          {workerMetrics.data.active_workers}
                        </div>
                        <div className="text-xs text-muted-foreground">Active</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-yellow-600">
                          {workerMetrics.data.idle_workers}
                        </div>
                        <div className="text-xs text-muted-foreground">Idle</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-red-600">
                          {workerMetrics.data.failed_workers}
                        </div>
                        <div className="text-xs text-muted-foreground">Failed</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-blue-600">
                          {workerMetrics.data.total_processed}
                        </div>
                        <div className="text-xs text-muted-foreground">Processed</div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Avg Processing Time</span>
                        <span className="font-medium">
                          {workerMetrics.data.avg_processing_time?.toFixed(2) || 0}s
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Worker Controls */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="h-5 w-5" />
                  <span>Worker Controls</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={() => handleWorkerControl('pause')}
                    variant="outline"
                    size="sm"
                    className="border-yellow-300 text-yellow-700 hover:bg-yellow-50"
                  >
                    <Pause className="h-4 w-4 mr-2" />
                    Pause All
                  </Button>
                  <Button
                    onClick={() => handleWorkerControl('resume')}
                    variant="outline"
                    size="sm"
                    className="border-green-300 text-green-700 hover:bg-green-50"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Resume All
                  </Button>
                  <Button
                    onClick={() => handleWorkerControl('restart')}
                    variant="outline"
                    size="sm"
                    className="border-blue-300 text-blue-700 hover:bg-blue-50"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Restart All
                  </Button>
                  <Button
                    onClick={handleEmergencyStop}
                    variant="outline"
                    size="sm"
                    className="border-red-300 text-red-700 hover:bg-red-50"
                  >
                    <Square className="h-4 w-4 mr-2" />
                    Emergency Stop
                  </Button>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Scale Workers</label>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={workerCount}
                      onChange={(e) => setWorkerCount(parseInt(e.target.value) || 1)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                    <Button
                      onClick={() => handleWorkerControl('scale')}
                      variant="outline"
                      size="sm"
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      Scale
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* RabbitMQ Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Network className="h-5 w-5" />
                  <span>RabbitMQ Status</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {monitoringData?.rabbitmqStatus && (
                  <>
                    <div className="flex items-center space-x-2">
                      {(() => {
                        const health = getHealthStatus(monitoringData.rabbitmqStatus.status);
                        const Icon = health.icon;
                        return (
                          <>
                            <Icon className={`h-4 w-4 ${health.color}`} />
                            <span className={`text-sm font-medium ${health.color}`}>
                              {monitoringData.rabbitmqStatus.status}
                            </span>
                          </>
                        );
                      })()}
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Call Batch Queue:</span>
                        <span className="font-medium">
                          {monitoringData.rabbitmqStatus.queues?.call_batch_queue || 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Result Queue:</span>
                        <span className="font-medium">
                          {monitoringData.rabbitmqStatus.queues?.call_result_queue || 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Error Queue:</span>
                        <span className="font-medium">
                          {monitoringData.rabbitmqStatus.queues?.call_error_queue || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Database Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <HardDrive className="h-5 w-5" />
                  <span>Database Status</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {monitoringData?.dbStatus && (
                  <>
                    <div className="flex items-center space-x-2">
                      {(() => {
                        const health = getHealthStatus(
                          monitoringData.dbStatus.data?.database_connected ? 'healthy' : 'error'
                        );
                        const Icon = health.icon;
                        return (
                          <>
                            <Icon className={`h-4 w-4 ${health.color}`} />
                            <span className={`text-sm font-medium ${health.color}`}>
                              {monitoringData.dbStatus.data?.database_connected ? 'Connected' : 'Disconnected'}
                            </span>
                          </>
                        );
                      })()}
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Total Records:</span>
                        <span className="font-medium">
                          {monitoringData.dbStatus.data?.total_records || 0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Recent Records:</span>
                        <span className="font-medium">
                          {monitoringData.dbStatus.data?.recent_records?.length || 0}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5" />
                <span>System Alerts</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {systemAlerts?.data?.alerts?.length > 0 ? (
                <div className="space-y-3">
                  {systemAlerts.data.alerts.map((alert: any, index: number) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border ${
                        alert.severity === 'error' 
                          ? 'bg-red-50 border-red-200' 
                          : alert.severity === 'warning'
                          ? 'bg-yellow-50 border-yellow-200'
                          : 'bg-blue-50 border-blue-200'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className={`h-4 w-4 ${
                          alert.severity === 'error' 
                            ? 'text-red-600' 
                            : alert.severity === 'warning'
                            ? 'text-yellow-600'
                            : 'text-blue-600'
                        }`} />
                        <span className={`font-medium ${
                          alert.severity === 'error' 
                            ? 'text-red-800' 
                            : alert.severity === 'warning'
                            ? 'text-yellow-800'
                            : 'text-blue-800'
                        }`}>
                          {alert.title}
                        </span>
                        <Badge variant="outline" className="ml-auto">
                          {alert.severity}
                        </Badge>
                      </div>
                      <p className={`text-sm mt-1 ${
                        alert.severity === 'error' 
                          ? 'text-red-700' 
                          : alert.severity === 'warning'
                          ? 'text-yellow-700'
                          : 'text-blue-700'
                      }`}>
                        {alert.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(alert.timestamp).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <p className="text-muted-foreground">No active alerts</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

