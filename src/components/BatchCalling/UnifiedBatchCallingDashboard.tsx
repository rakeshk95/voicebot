import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Play, 
  Pause, 
  Square, 
  Upload, 
  BarChart3, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  RefreshCw,
  FileSpreadsheet,
  Users,
  Phone,
  Info,
  Activity,
  Database,
  Zap
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { 
  getUnifiedOperationsSummary,
  getUnifiedOperationsList,
  getUnifiedOperationStatus,
  pauseUnifiedOperation,
  resumeUnifiedOperation,
  cancelUnifiedOperation,
  getUnifiedSystemHealth,
  cleanupUnifiedOperations,
  UnifiedOperationsSummary,
  UnifiedOperationsList,
  UnifiedOperationStatus
} from '@/lib/unifiedBatchCallingApi';
import { authorizedFetch } from '@/lib/api';
import { BatchCallUpload } from './BatchCallUpload';
import { BatchOperationsTable } from './BatchOperationsTable';
import { useOperationUpdates, useAllOperationsUpdates } from '@/hooks/useBatchCallWebSocket';

export const UnifiedBatchCallingDashboard: React.FC = () => {
  const [summary, setSummary] = useState<UnifiedOperationsSummary | null>(null);
  const [operations, setOperations] = useState<UnifiedOperationsList | null>(null);
  const [selectedOperation, setSelectedOperation] = useState<string | null>(null);
  const [operationDetails, setOperationDetails] = useState<UnifiedOperationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoRefreshActive, setAutoRefreshActive] = useState(false);
  const [organizations, setOrganizations] = useState<Array<{ id: string; name: string }>>([]);
  const [campaigns, setCampaigns] = useState<Array<{ id: string; name: string; org_id: string }>>([]);
  const [systemHealth, setSystemHealth] = useState<any>(null);
  const { toast } = useToast();
  
  // Use ref to prevent multiple simultaneous API calls
  const isFetchingRef = useRef(false);
  const lastFetchTimeRef = useRef(0);
  const FETCH_COOLDOWN_MS = 5000; // 5 second cooldown between API calls

  // WebSocket for real-time updates
  const { isConnected: wsConnected, update: wsUpdate, error: wsError } = useAllOperationsUpdates();

  // Cleanup effect
  useEffect(() => {
    return () => {
      isFetchingRef.current = false;
      lastFetchTimeRef.current = 0;
    };
  }, []);

  // Handle WebSocket updates
  useEffect(() => {
    if (wsUpdate) {
      console.log('🔄 WebSocket update received:', wsUpdate);
      
      // Update operations list with real-time data
      if (operations) {
        const updatedOperations = { ...operations.operations };
        updatedOperations[wsUpdate.operation_id] = {
          ...updatedOperations[wsUpdate.operation_id],
          status: wsUpdate.status,
          progress_percentage: wsUpdate.progress_percentage,
          total_calls: wsUpdate.total_calls,
          completed_calls: wsUpdate.completed_calls,
          successful_calls: wsUpdate.successful_calls,
          failed_calls: wsUpdate.failed_calls,
          pending_calls: wsUpdate.pending_calls,
          current_row: wsUpdate.current_row,
          error_message: wsUpdate.error_message
        };
        
        setOperations({
          ...operations,
          operations: updatedOperations
        });
      }
      
      // Update summary if needed
      if (summary) {
        setSummary(prev => prev ? {
          ...prev,
          call_summary: {
            ...prev.call_summary,
            total_calls: prev.call_summary.total_calls + (wsUpdate.total_calls - (operations?.operations[wsUpdate.operation_id]?.total_calls || 0)),
            completed_calls: prev.call_summary.completed_calls + (wsUpdate.completed_calls - (operations?.operations[wsUpdate.operation_id]?.completed_calls || 0)),
            successful_calls: prev.call_summary.successful_calls + (wsUpdate.successful_calls - (operations?.operations[wsUpdate.operation_id]?.successful_calls || 0)),
            failed_calls: prev.call_summary.failed_calls + (wsUpdate.failed_calls - (operations?.operations[wsUpdate.operation_id]?.failed_calls || 0)),
            pending_calls: prev.call_summary.pending_calls + (wsUpdate.pending_calls - (operations?.operations[wsUpdate.operation_id]?.pending_calls || 0))
          }
        } : null);
      }
    }
  }, [wsUpdate, operations, summary]);

  // Handle WebSocket errors
  useEffect(() => {
    if (wsError) {
      console.warn('⚠️ WebSocket error:', wsError);
      toast({
        title: "Connection Warning",
        description: `Real-time updates unavailable: ${wsError}`,
        variant: "destructive",
      });
    }
  }, [wsError, toast]);

  const fetchOrganizations = async () => {
    try {
      const response = await authorizedFetch('/organizations');
      if (response.ok) {
        const orgData = await response.json() as Array<{ id: string; name: string }>;
        setOrganizations(orgData);
      } else {
        console.error('Failed to fetch organizations:', response.status);
        setOrganizations([]);
      }
    } catch (error) {
      console.error('Error fetching organizations:', error);
      setOrganizations([]);
    }
  };

  const fetchCampaigns = async () => {
    try {
      const response = await authorizedFetch('/campaigns/');
      if (response.ok) {
        const campaignData = await response.json() as Array<{ id: string; name: string; org_id: string }>;
        setCampaigns(campaignData);
      } else {
        console.error('Failed to fetch campaigns:', response.status);
        setCampaigns([]);
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      setCampaigns([]);
    }
  };

  const fetchSystemHealth = async () => {
    try {
      const health = await getUnifiedSystemHealth();
      setSystemHealth(health);
    } catch (error) {
      console.error('Error fetching system health:', error);
    }
  };

  // Optimized data fetching with reduced API calls
  const fetchData = async () => {
    if (isFetchingRef.current) {
      console.log('🚀 PERFORMANCE FIX: Skipping fetch - already in progress');
      return;
    }

    const now = Date.now();
    if (now - lastFetchTimeRef.current < FETCH_COOLDOWN_MS) {
      console.log('🚀 PERFORMANCE FIX: Skipping fetch - cooldown period not elapsed');
      return;
    }

    isFetchingRef.current = true;
    lastFetchTimeRef.current = now;

    try {
      console.log('🚀 PERFORMANCE FIX: Starting optimized data fetch');
      
      // Fetch all data in parallel
      const [summaryResult, operationsResult] = await Promise.all([
        getUnifiedOperationsSummary(),
        getUnifiedOperationsList({ limit: 100 })
      ]);

      setSummary(summaryResult);
      setOperations(operationsResult);
      setError(null);
      
      console.log('✅ PERFORMANCE FIX: Data fetch completed successfully');
      
    } catch (error) {
      console.error('❌ Error fetching data:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch data');
    } finally {
      isFetchingRef.current = false;
    }
  };

  const refreshData = async () => {
    if (refreshing) return;
    
    setRefreshing(true);
    try {
      await fetchData();
      await fetchSystemHealth();
    } finally {
      setRefreshing(false);
    }
  };

  // Single API call on mount with cooldown protection
  useEffect(() => {
    console.log('🚀 PERFORMANCE FIX: UnifiedBatchCallingDashboard useEffect triggered');
    const timeoutId = setTimeout(() => {
      fetchData();
      fetchOrganizations();
      fetchCampaigns();
      fetchSystemHealth();
    }, 100);
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, []);

  // Auto-refresh logic with reduced API calls
  useEffect(() => {
    const checkAndRefresh = () => {
      if (summary && operations) {
        const hasActiveOperations = Object.values(operations.operations).some(op => 
          op.status === 'processing' || op.status === 'starting' || op.status === 'paused'
        );
        
        setAutoRefreshActive(hasActiveOperations);
        
        const now = Date.now();
        if (hasActiveOperations && !isFetchingRef.current && (now - lastFetchTimeRef.current > FETCH_COOLDOWN_MS)) {
          console.log('🚀 PERFORMANCE FIX: Auto-refresh triggered for active operations');
          fetchData();
        }
      }
    };
    
    const interval = setInterval(checkAndRefresh, 180000); // 3 minutes
    
    if (summary && operations) {
      const hasActiveOperations = Object.values(operations.operations).some(op => 
        op.status === 'processing' || op.status === 'starting' || op.status === 'paused'
      );
      setAutoRefreshActive(hasActiveOperations);
    }
    
    return () => {
      clearInterval(interval);
    };
  }, [summary, operations]);

  const handleManualRefresh = async () => {
    if (refreshing) return;
    
    const now = Date.now();
    if (now - lastFetchTimeRef.current < FETCH_COOLDOWN_MS) {
      toast({
        title: "Please Wait",
        description: "Please wait before refreshing again",
        variant: "destructive",
      });
      return;
    }
    
    await refreshData();
  };

  const handleOperationAction = async (operationId: string, action: 'pause' | 'resume' | 'cancel') => {
    try {
      let result;
      switch (action) {
        case 'pause':
          result = await pauseUnifiedOperation(operationId);
          break;
        case 'resume':
          result = await resumeUnifiedOperation(operationId);
          break;
        case 'cancel':
          result = await cancelUnifiedOperation(operationId);
          break;
      }

      toast({
        title: "Success",
        description: result.message,
      });

      await fetchData();
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${action} operation`,
        variant: "destructive",
      });
    }
  };

  const handleOperationSelect = async (operationId: string) => {
    try {
      const result = await getUnifiedOperationStatus(operationId);
      setOperationDetails(result.data);
      setSelectedOperation(operationId);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch operation details",
        variant: "destructive",
      });
    }
  };

  const handleCleanup = async () => {
    try {
      const result = await cleanupUnifiedOperations(24);
      toast({
        title: "Cleanup Complete",
        description: `Cleaned up ${result.total_cleaned} operations`,
      });
      await fetchData();
    } catch (error) {
      toast({
        title: "Cleanup Failed",
        description: "Failed to cleanup operations",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span>Loading unified batch calling dashboard...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Unified Batch Calling Dashboard</h1>
            <p className="text-muted-foreground">
              Monitor and manage bulk call operations with unified API
            </p>
          </div>
        </div>
        
        <div className="text-center py-12">
          <div className="text-lg font-medium text-red-600 mb-4">
            Unable to load batch calling data
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            {error}
          </p>
          <Button onClick={fetchData} className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Unified Batch Calling Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor and manage bulk call operations with real-time updates
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {/* System Health Indicator */}
          {systemHealth && (
            <Badge variant={systemHealth.status === 'healthy' ? 'default' : 'destructive'} className="flex items-center space-x-1">
              {systemHealth.status === 'healthy' ? <CheckCircle className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
              <span>{systemHealth.status}</span>
            </Badge>
          )}
          
          {/* WebSocket Status */}
          <Badge variant={wsConnected ? 'default' : 'secondary'} className="flex items-center space-x-1">
            <Zap className="h-3 w-3" />
            <span>{wsConnected ? 'Live' : 'Offline'}</span>
          </Badge>
          
          {/* Auto-refresh Status */}
          {autoRefreshActive && (
            <Badge variant="outline" className="flex items-center space-x-1">
              <Activity className="h-3 w-3" />
              <span>Auto-refresh</span>
            </Badge>
          )}
          
          <Button onClick={handleManualRefresh} disabled={refreshing} variant="outline" size="sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button onClick={handleCleanup} variant="outline" size="sm">
            <Database className="h-4 w-4 mr-2" />
            Cleanup
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Operations</CardTitle>
            <BarChart3 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.operation_summary.active || 0}</div>
            <p className="text-xs text-muted-foreground">
              {summary?.operation_summary.total || 0} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Operations</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.operation_summary.paused || 0}</div>
            <p className="text-xs text-muted-foreground">
              Waiting to resume
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Calls</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.call_summary.completed_calls || 0}</div>
            <p className="text-xs text-muted-foreground">
              {summary?.call_summary.successful_calls || 0} successful
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Calls</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.call_summary.failed_calls || 0}</div>
            <p className="text-xs text-muted-foreground">
              {summary?.call_summary.total_calls ? 
                `${((summary.call_summary.failed_calls / summary.call_summary.total_calls) * 100).toFixed(1)}%` : 
                '0%'
              } failure rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* System Information */}
      {systemHealth && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Info className="h-5 w-5" />
              <span>System Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h4 className="font-medium">Memory Operations</h4>
                <p className="text-sm text-muted-foreground">
                  {systemHealth.memory_operations.total} total, {systemHealth.memory_operations.active} active
                </p>
              </div>
              <div>
                <h4 className="font-medium">Implementations</h4>
                <p className="text-sm text-muted-foreground">
                  Legacy: {systemHealth.implementations.legacy}, RabbitMQ: {systemHealth.implementations.rabbitmq}
                </p>
              </div>
              <div>
                <h4 className="font-medium">Capabilities</h4>
                <p className="text-sm text-muted-foreground">
                  Pause: {systemHealth.capabilities.pause ? '✓' : '✗'}, 
                  Resume: {systemHealth.capabilities.resume ? '✓' : '✗'}, 
                  Real-time: {systemHealth.capabilities.real_time_updates ? '✓' : '✗'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="operations" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="operations" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Operations</span>
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex items-center space-x-2">
            <Upload className="h-4 w-4" />
            <span>New Operation</span>
          </TabsTrigger>
          <TabsTrigger value="call-details" className="flex items-center space-x-2">
            <FileSpreadsheet className="h-4 w-4" />
            <span>Call Details</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="operations" className="space-y-4">
          <BatchOperationsTable
            operations={operations}
            onOperationSelect={handleOperationSelect}
            onOperationAction={handleOperationAction}
            selectedOperation={selectedOperation}
            organizations={organizations}
            campaigns={campaigns}
            loading={loading}
          />
        </TabsContent>

        <TabsContent value="upload" className="space-y-4">
          <BatchCallUpload onUploadSuccess={fetchData} />
        </TabsContent>

        <TabsContent value="call-details" className="space-y-4">
          {selectedOperation && operationDetails ? (
            <Card>
              <CardHeader>
                <CardTitle>Call Details for Operation: {selectedOperation}</CardTitle>
                <CardDescription>
                  Detailed information about individual calls in this batch operation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{operationDetails.total_calls}</div>
                      <div className="text-sm text-muted-foreground">Total Calls</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{operationDetails.successful_calls}</div>
                      <div className="text-sm text-muted-foreground">Successful</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{operationDetails.failed_calls}</div>
                      <div className="text-sm text-muted-foreground">Failed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">{operationDetails.pending_calls}</div>
                      <div className="text-sm text-muted-foreground">Pending</div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Progress</span>
                      <span>{operationDetails.progress_percentage.toFixed(1)}%</span>
                    </div>
                    <Progress value={operationDetails.progress_percentage} className="w-full" />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium">Operation Info</h4>
                      <p className="text-sm text-muted-foreground">
                        Status: <Badge variant="outline">{operationDetails.status}</Badge>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Implementation: <Badge variant="outline">{operationDetails.implementation}</Badge>
                      </p>
                      {operationDetails.started_at && (
                        <p className="text-sm text-muted-foreground">
                          Started: {new Date(operationDetails.started_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium">Capabilities</h4>
                      <p className="text-sm text-muted-foreground">
                        Pause: {operationDetails.can_pause ? '✓' : '✗'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Resume: {operationDetails.can_resume ? '✓' : '✗'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Cancel: {operationDetails.can_cancel ? '✓' : '✗'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No operation selected</p>
                  <p className="text-sm">Select an operation from the Operations tab to view call details</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
