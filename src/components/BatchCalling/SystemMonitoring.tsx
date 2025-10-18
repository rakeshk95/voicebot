import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  Server, 
  Database, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  RefreshCw,
  TrendingUp,
  Users,
  MessageSquare
} from 'lucide-react';

interface RabbitMQHealth {
  queue_depth: number;
  message_rate_in: number;
  message_rate_out: number;
  consumers_count: number;
  connection_status: 'connected' | 'disconnected' | 'error';
  last_heartbeat: string;
}

interface ServiceHealth {
  api_latency: number;
  concurrent_calls: number;
  avg_response_delay: number;
  error_rate: number;
  uptime: string;
}

interface SystemStatus {
  rabbitmq: RabbitMQHealth;
  voice_service: ServiceHealth;
  database: {
    connection_status: 'connected' | 'disconnected' | 'error';
    response_time: number;
    active_connections: number;
  };
  overall_status: 'healthy' | 'warning' | 'critical';
  last_updated: string;
}

const SystemMonitoring: React.FC = () => {
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    const fetchSystemStatus = async () => {
      try {
        // Mock data - will be replaced with real API calls
        const mockStatus: SystemStatus = {
          rabbitmq: {
            queue_depth: 45,
            message_rate_in: 12.5,
            message_rate_out: 10.2,
            consumers_count: 8,
            connection_status: 'connected',
            last_heartbeat: new Date().toISOString()
          },
          voice_service: {
            api_latency: 150,
            concurrent_calls: 24,
            avg_response_delay: 1.2,
            error_rate: 2.1,
            uptime: '7d 14h 32m'
          },
          database: {
            connection_status: 'connected',
            response_time: 25,
            active_connections: 12
          },
          overall_status: 'healthy',
          last_updated: new Date().toISOString()
        };

        setSystemStatus(mockStatus);
      } catch (error) {
        console.error('Failed to fetch system status:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSystemStatus();

    if (autoRefresh) {
      const interval = setInterval(fetchSystemStatus, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const getStatusBadge = (status: string) => {
    const variants = {
      healthy: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
      warning: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: AlertTriangle },
      critical: { bg: 'bg-red-100', text: 'text-red-800', icon: AlertTriangle },
      connected: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
      disconnected: { bg: 'bg-red-100', text: 'text-red-800', icon: AlertTriangle },
      error: { bg: 'bg-red-100', text: 'text-red-800', icon: AlertTriangle }
    };

    const variant = variants[status as keyof typeof variants];
    const Icon = variant.icon;

    return (
      <Badge className={`${variant.bg} ${variant.text} flex items-center space-x-1`}>
        <Icon className="h-3 w-3" />
        <span>{status.toUpperCase()}</span>
      </Badge>
    );
  };

  const getQueueHealthColor = (depth: number) => {
    if (depth < 50) return 'text-green-600';
    if (depth < 100) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getLatencyColor = (latency: number) => {
    if (latency < 200) return 'text-green-600';
    if (latency < 500) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!systemStatus) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
            <p>Unable to fetch system status</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Server className="h-5 w-5" />
            <span>System Status</span>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
              Auto Refresh
            </Button>
            <Badge className={
              systemStatus.overall_status === 'healthy' ? 'bg-green-100 text-green-800' :
              systemStatus.overall_status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }>
              {systemStatus.overall_status.toUpperCase()}
            </Badge>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Last updated: {new Date(systemStatus.last_updated).toLocaleString()}
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* RabbitMQ Health */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold">RabbitMQ Queue</h3>
              {getStatusBadge(systemStatus.rabbitmq.connection_status)}
            </div>
            
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm">
                  <span>Queue Depth</span>
                  <span className={getQueueHealthColor(systemStatus.rabbitmq.queue_depth)}>
                    {systemStatus.rabbitmq.queue_depth}
                  </span>
                </div>
                <Progress 
                  value={Math.min(systemStatus.rabbitmq.queue_depth, 100)} 
                  className="h-2 mt-1"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Message Rate In</p>
                  <p className="font-medium">{systemStatus.rabbitmq.message_rate_in}/s</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Message Rate Out</p>
                  <p className="font-medium">{systemStatus.rabbitmq.message_rate_out}/s</p>
                </div>
              </div>
              
              <div>
                <p className="text-muted-foreground text-sm">Active Consumers</p>
                <p className="font-medium">{systemStatus.rabbitmq.consumers_count}</p>
              </div>
            </div>
          </div>

          {/* Voice Service Health */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-green-600" />
              <h3 className="font-semibold">Voice Bot Service</h3>
              <Badge className="bg-green-100 text-green-800">ONLINE</Badge>
            </div>
            
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm">
                  <span>API Latency</span>
                  <span className={getLatencyColor(systemStatus.voice_service.api_latency)}>
                    {systemStatus.voice_service.api_latency}ms
                  </span>
                </div>
                <Progress 
                  value={Math.min((systemStatus.voice_service.api_latency / 1000) * 100, 100)} 
                  className="h-2 mt-1"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Concurrent Calls</p>
                  <p className="font-medium">{systemStatus.voice_service.concurrent_calls}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Avg Response</p>
                  <p className="font-medium">{systemStatus.voice_service.avg_response_delay}s</p>
                </div>
              </div>
              
              <div>
                <p className="text-muted-foreground text-sm">Error Rate</p>
                <p className="font-medium">{systemStatus.voice_service.error_rate}%</p>
              </div>
              
              <div>
                <p className="text-muted-foreground text-sm">Uptime</p>
                <p className="font-medium">{systemStatus.voice_service.uptime}</p>
              </div>
            </div>
          </div>

          {/* Database Health */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Database className="h-5 w-5 text-purple-600" />
              <h3 className="font-semibold">Database</h3>
              {getStatusBadge(systemStatus.database.connection_status)}
            </div>
            
            <div className="space-y-3">
              <div>
                <p className="text-muted-foreground text-sm">Response Time</p>
                <p className="font-medium">{systemStatus.database.response_time}ms</p>
              </div>
              
              <div>
                <p className="text-muted-foreground text-sm">Active Connections</p>
                <p className="font-medium">{systemStatus.database.active_connections}</p>
              </div>
              
              <div className="pt-2">
                <div className="flex items-center space-x-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Last Heartbeat:</span>
                  <span className="font-medium">
                    {new Date(systemStatus.rabbitmq.last_heartbeat).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* System Alerts */}
        {(systemStatus.rabbitmq.queue_depth > 100 || 
          systemStatus.voice_service.api_latency > 500 || 
          systemStatus.voice_service.error_rate > 5) && (
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <h4 className="font-medium text-yellow-800">System Alerts</h4>
            </div>
            <ul className="mt-2 text-sm text-yellow-700 space-y-1">
              {systemStatus.rabbitmq.queue_depth > 100 && (
                <li>• RabbitMQ queue depth is high ({systemStatus.rabbitmq.queue_depth})</li>
              )}
              {systemStatus.voice_service.api_latency > 500 && (
                <li>• Voice service latency is elevated ({systemStatus.voice_service.api_latency}ms)</li>
              )}
              {systemStatus.voice_service.error_rate > 5 && (
                <li>• Voice service error rate is high ({systemStatus.voice_service.error_rate}%)</li>
              )}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SystemMonitoring;
