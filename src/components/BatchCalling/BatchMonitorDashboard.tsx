import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Play, 
  Pause, 
  Square, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Phone,
  Users,
  TrendingUp,
  AlertCircle,
  BarChart3
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface BatchOperation {
  bulk_operation_id: string;
  operation_name: string;
  status: 'starting' | 'processing' | 'paused' | 'completed' | 'failed' | 'cancelled';
  progress_percentage: number;
  total_calls: number;
  queued_calls: number;
  completed_calls?: number;
  successful_calls?: number;
  failed_calls?: number;
  campaign_id: string;
  org_id: string;
  user_id: string;
  started_at: string;
  completed_at?: string;
  actions_available?: {
    pause: boolean;
    resume: boolean;
    delete: boolean;
    view_status: boolean;
  };
}

interface BatchMonitorDashboardProps {
  currentOperation?: BatchOperation | null;
  recentOperations?: BatchOperation[];
  onRefresh?: () => void;
  onPause?: (operationId: string) => void;
  onResume?: (operationId: string) => void;
  onStop?: (operationId: string) => void;
}

export const BatchMonitorDashboard: React.FC<BatchMonitorDashboardProps> = ({
  currentOperation,
  recentOperations = [],
  onRefresh,
  onPause,
  onResume,
  onStop,
}) => {
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Auto-refresh every 3 seconds if there's an active operation
  useEffect(() => {
    if (autoRefresh && currentOperation && ['starting', 'processing'].includes(currentOperation.status)) {
      const interval = setInterval(() => {
        onRefresh?.();
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, currentOperation, onRefresh]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'processing': return 'bg-blue-500';
      case 'starting': return 'bg-yellow-500';
      case 'paused': return 'bg-orange-500';
      case 'failed': return 'bg-red-500';
      case 'cancelled': return 'bg-gray-500';
      default: return 'bg-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="h-4 w-4" />;
      case 'processing': return <RefreshCw className="h-4 w-4 animate-spin" />;
      case 'starting': return <Clock className="h-4 w-4" />;
      case 'paused': return <Pause className="h-4 w-4" />;
      case 'failed': return <XCircle className="h-4 w-4" />;
      case 'cancelled': return <Square className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDuration = (startTime: string, endTime?: string) => {
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const diff = Math.floor((end.getTime() - start.getTime()) / 1000);
    
    const hours = Math.floor(diff / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    const seconds = diff % 60;
    
    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  };

  const calculateCallsPerMinute = (operation: BatchOperation) => {
    if (!operation.started_at) return 0;
    const duration = (new Date().getTime() - new Date(operation.started_at).getTime()) / 1000 / 60;
    const completed = operation.completed_calls || operation.queued_calls || 0;
    return duration > 0 ? Math.round(completed / duration) : 0;
  };

  const calculateETA = (operation: BatchOperation) => {
    const remaining = operation.total_calls - (operation.completed_calls || operation.queued_calls || 0);
    const rate = calculateCallsPerMinute(operation);
    if (rate === 0) return 'Calculating...';
    const minutes = Math.ceil(remaining / rate);
    if (minutes < 1) return 'Less than 1 min';
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="space-y-6">
      {/* Current Operation */}
      {currentOperation && (
        <Card className="border-2 border-primary/20 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Phone className="h-6 w-6 text-primary" />
                  Active Batch Operation
                </CardTitle>
                <CardDescription className="text-base">
                  {currentOperation.operation_name}
                </CardDescription>
              </div>
              <Badge 
                variant="outline" 
                className={cn(
                  "px-4 py-2 text-white font-semibold",
                  getStatusColor(currentOperation.status)
                )}
              >
                <span className="flex items-center gap-2">
                  {getStatusIcon(currentOperation.status)}
                  {currentOperation.status.toUpperCase()}
                </span>
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-muted-foreground">Progress</span>
                <span className="font-bold text-lg">{currentOperation.progress_percentage.toFixed(1)}%</span>
              </div>
              <Progress value={currentOperation.progress_percentage} className="h-3" />
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500 rounded-lg">
                      <Users className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Total Calls</p>
                      <p className="text-2xl font-bold">{currentOperation.total_calls}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-green-50 border-green-200">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-500 rounded-lg">
                      <CheckCircle2 className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Completed</p>
                      <p className="text-2xl font-bold">
                        {currentOperation.completed_calls || currentOperation.queued_calls || 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-orange-50 border-orange-200">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-500 rounded-lg">
                      <Clock className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Pending</p>
                      <p className="text-2xl font-bold">
                        {currentOperation.total_calls - (currentOperation.completed_calls || currentOperation.queued_calls || 0)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-red-50 border-red-200">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-500 rounded-lg">
                      <XCircle className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Failed</p>
                      <p className="text-2xl font-bold">{currentOperation.failed_calls || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Additional Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Speed</p>
                  <p className="text-sm font-semibold">{calculateCallsPerMinute(currentOperation)} calls/min</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Duration</p>
                  <p className="text-sm font-semibold">
                    {formatDuration(currentOperation.started_at, currentOperation.completed_at)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">ETA</p>
                  <p className="text-sm font-semibold">
                    {currentOperation.status === 'completed' ? 'Completed' : calculateETA(currentOperation)}
                  </p>
                </div>
              </div>
            </div>

            {/* Control Buttons */}
            <div className="flex items-center gap-3 pt-4 border-t">
              {currentOperation.actions_available?.pause && currentOperation.status === 'processing' && (
                <Button
                  variant="outline"
                  onClick={() => onPause?.(currentOperation.bulk_operation_id)}
                  className="flex items-center gap-2"
                >
                  <Pause className="h-4 w-4" />
                  Pause
                </Button>
              )}
              
              {currentOperation.actions_available?.resume && currentOperation.status === 'paused' && (
                <Button
                  variant="default"
                  onClick={() => onResume?.(currentOperation.bulk_operation_id)}
                  className="flex items-center gap-2"
                >
                  <Play className="h-4 w-4" />
                  Resume
                </Button>
              )}
              
              {['starting', 'processing', 'paused'].includes(currentOperation.status) && (
                <Button
                  variant="destructive"
                  onClick={() => onStop?.(currentOperation.bulk_operation_id)}
                  className="flex items-center gap-2"
                >
                  <Square className="h-4 w-4" />
                  Stop
                </Button>
              )}

              <Button
                variant="outline"
                onClick={onRefresh}
                className="flex items-center gap-2 ml-auto"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>

              <Button
                variant={autoRefresh ? "default" : "outline"}
                onClick={() => setAutoRefresh(!autoRefresh)}
                className="flex items-center gap-2"
              >
                <RefreshCw className={cn("h-4 w-4", autoRefresh && "animate-spin")} />
                Auto {autoRefresh ? 'ON' : 'OFF'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Operations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Operations
          </CardTitle>
          <CardDescription>
            {recentOperations.length} recent batch operation{recentOperations.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentOperations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p>No recent operations</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentOperations.map((operation) => (
                <Card key={operation.bulk_operation_id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge 
                            variant="outline"
                            className={cn(
                              "text-white font-medium",
                              getStatusColor(operation.status)
                            )}
                          >
                            {getStatusIcon(operation.status)}
                            <span className="ml-1">{operation.status}</span>
                          </Badge>
                          <span className="text-sm font-semibold truncate">
                            {operation.operation_name}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-muted-foreground mt-2">
                          <div>
                            <span className="font-medium">Total:</span> {operation.total_calls}
                          </div>
                          <div>
                            <span className="font-medium">Completed:</span>{' '}
                            {operation.completed_calls || operation.queued_calls || 0}
                          </div>
                          <div>
                            <span className="font-medium">Failed:</span> {operation.failed_calls || 0}
                          </div>
                          <div>
                            <span className="font-medium">Started:</span> {formatTime(operation.started_at)}
                          </div>
                        </div>
                        {operation.progress_percentage !== undefined && (
                          <Progress value={operation.progress_percentage} className="h-1.5 mt-2" />
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">
                          {operation.progress_percentage?.toFixed(0)}%
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {operation.status === 'completed' ? 'Done' : 'Progress'}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

