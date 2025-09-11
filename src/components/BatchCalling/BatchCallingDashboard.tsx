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
  Activity
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { 
  getBatchOperationsSummary, 
  getBatchOperationsList,
  getBatchOperationStatus,
  pauseBatchOperation,
  resumeBatchOperation,
  cancelBatchOperation
} from '@/lib/batchCallingApi';
import { authorizedFetch } from '@/lib/api';
import { BatchCallSummary, BatchOperationsList, BatchCallOperation } from '@/types/batchCalling';
import { BatchCallUpload } from './BatchCallUpload';
import { BatchCallOperations } from './BatchCallOperations';
import { BatchOperationsTable } from './BatchOperationsTable';
import { BatchCallDetails } from './BatchCallDetails';
import { SystemMonitoring } from './SystemMonitoring';
import { RabbitMQIntegrationTest } from './RabbitMQIntegrationTest';

export const BatchCallingDashboard: React.FC = () => {
  const [summary, setSummary] = useState<BatchCallSummary | null>(null);
  const [operations, setOperations] = useState<BatchOperationsList | null>(null);
  const [selectedOperation, setSelectedOperation] = useState<string | null>(null);
  const [operationDetails, setOperationDetails] = useState<BatchCallOperation | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoRefreshActive, setAutoRefreshActive] = useState(false);
  const [organizations, setOrganizations] = useState<Array<{ id: string; name: string }>>([]);
  const [campaigns, setCampaigns] = useState<Array<{ id: string; name: string; org_id: string }>>([]);
  const { toast } = useToast();
  
  // Use ref to prevent multiple simultaneous API calls
  const isFetchingRef = useRef(false);
  const lastFetchTimeRef = useRef(0);
  const FETCH_COOLDOWN_MS = 5000; // 5 second cooldown between API calls

  // Cleanup effect
  useEffect(() => {
    return () => {
      // Reset refs on unmount
      isFetchingRef.current = false;
      lastFetchTimeRef.current = 0;
    };
  }, []);

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

  // Fetch all data on initial load
  const fetchData = async () => {
    // Prevent multiple simultaneous API calls and enforce cooldown
    const now = Date.now();
    if (isFetchingRef.current) {
      return;
    }
    
    if (now - lastFetchTimeRef.current < FETCH_COOLDOWN_MS) {
      return;
    }

    try {
      isFetchingRef.current = true;
      setLoading(true);
      setError(null);
      
      // Fetch all data: organizations, campaigns, and operations
      const [summaryData, operationsData] = await Promise.all([
        getBatchOperationsSummary(),
        getBatchOperationsList(),
        fetchOrganizations(),
        fetchCampaigns()
      ]);
      
      setSummary(summaryData);
      setOperations(operationsData);
      
      // Reset selected operation if it's no longer in the list
      if (selectedOperation && operationsData && !operationsData.operations[selectedOperation]) {
        setSelectedOperation(null);
        setOperationDetails(null);
      }
      
    } catch (error) {
      let errorMessage = 'Failed to fetch batch calling data. Please check your connection and try again.';
      
      // Try to provide more specific error information
      if (error instanceof Error) {
        if (error.message.includes('401') || error.message.includes('Unauthorized')) {
          errorMessage = 'Authentication failed. Please log in again.';
        } else if (error.message.includes('403') || error.message.includes('Forbidden')) {
          errorMessage = 'Access denied. You may not have permission to view batch operations.';
        } else if (error.message.includes('404') || error.message.includes('Not Found')) {
          errorMessage = 'Batch calling API endpoint not found. Please check if the service is running.';
        } else if (error.message.includes('500') || error.message.includes('Internal Server Error')) {
          errorMessage = 'Server error. Please try again later.';
        } else if (error.message.includes('Network') || error.message.includes('fetch')) {
          errorMessage = 'Network error. Please check your internet connection and try again.';
        }
      }
      
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
      lastFetchTimeRef.current = Date.now();
    }
  };

  const refreshData = async () => {
    if (isFetchingRef.current) {
      return;
    }
    
    const now = Date.now();
    if (now - lastFetchTimeRef.current < FETCH_COOLDOWN_MS) {
      return;
    }
    
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchData();
  }, []); // Only run once on mount

  // Separate effect for auto-refresh logic
  useEffect(() => {
    // Only set up auto-refresh if there are active operations
    const checkAndRefresh = () => {
      if (summary && operations) {
        const hasActiveOperations = Object.values(operations.operations).some(op => 
          op.status === 'processing' || op.status === 'starting' || op.status === 'paused'
        );
        
        setAutoRefreshActive(hasActiveOperations);
        
                 // Only refresh if there are active operations AND we haven't fetched recently
         if (hasActiveOperations && !isFetchingRef.current) {
           fetchData(); // Fetch operations data for auto-refresh
         }
      }
    };
    
    // Check every 2 minutes, but only refresh if there are active operations
    const interval = setInterval(checkAndRefresh, 120000);
    
    // Initial check - but don't auto-refresh immediately
    if (summary && operations) {
      const hasActiveOperations = Object.values(operations.operations).some(op => 
        op.status === 'processing' || op.status === 'starting' || op.status === 'paused'
      );
      setAutoRefreshActive(hasActiveOperations);
    }
    
    return () => {
      clearInterval(interval);
    };
  }, [summary, operations]); // Depend on summary and operations to re-evaluate when they change

  // Add a manual refresh button handler that respects cooldown
  const handleManualRefresh = async () => {
    const now = Date.now();
    if (now - lastFetchTimeRef.current < FETCH_COOLDOWN_MS) {
      toast({
        title: "Please wait",
        description: `Please wait ${Math.ceil((FETCH_COOLDOWN_MS - (now - lastFetchTimeRef.current)) / 1000)} seconds before refreshing again`,
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
          result = await pauseBatchOperation(operationId);
          break;
        case 'resume':
          result = await resumeBatchOperation(operationId);
          break;
        case 'cancel':
          result = await cancelBatchOperation(operationId);
          break;
      }

      toast({
        title: "Success",
        description: result.message,
      });

             // Refresh data after action
       await fetchData(); // Fetch operations data after action
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
      const details = await getBatchOperationStatus(operationId);
      setOperationDetails(details);
      setSelectedOperation(operationId);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch operation details",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span>Loading batch calling dashboard...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Batch Calling Dashboard</h1>
            <p className="text-muted-foreground">
              Monitor and manage bulk call operations
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

  // Fallback display if no data
  if (!summary && !operations) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Batch Calling Dashboard</h1>
            <p className="text-muted-foreground">
              Monitor and manage bulk call operations
            </p>
          </div>
        </div>
        
        <div className="text-center py-12">
          <div className="text-lg font-medium text-muted-foreground mb-4">
            No batch operations found
          </div>
          <p className="text-sm text-muted-foreground">
            Start your first batch calling operation by uploading an Excel file
          </p>
          <Button onClick={fetchData} className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Data
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
          <h1 className="text-3xl font-bold tracking-tight">Batch Calling Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor and manage bulk call operations with real-time status updates
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {/* Auto-refresh indicator */}
          
          <Button onClick={refreshData} disabled={refreshing} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Info Section */}


      {/* Status Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Operations</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.operation_summary.processing || 0}</div>
            <p className="text-xs text-muted-foreground">
              {summary?.operation_summary.total || 0} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Operations</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.operation_summary.pending || 0}</div>
            <p className="text-xs text-muted-foreground">
              Waiting to start
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

      {/* Main Content Tabs */}
      <Tabs defaultValue="operations" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="operations" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Operations</span>
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex items-center space-x-2">
            <Upload className="h-4 w-4" />
            <span>New Operation</span>
          </TabsTrigger>
          <TabsTrigger value="monitoring" className="flex items-center space-x-2">
            <Activity className="h-4 w-4" />
            <span>Monitoring</span>
          </TabsTrigger>
          <TabsTrigger value="test" className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4" />
            <span>Integration Test</span>
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

         <TabsContent value="monitoring" className="space-y-4">
           <SystemMonitoring refreshInterval={10000} autoRefresh={true} />
         </TabsContent>

         <TabsContent value="test" className="space-y-4">
           <RabbitMQIntegrationTest />
         </TabsContent>

        <TabsContent value="call-details" className="space-y-4">
          <BatchCallDetails 
            operations={
              operations?.operations 
                ? Object.entries(operations.operations).map(([id, op]) => ({
                    bulk_operation_id: id,
                    status: op.status as any,
                    started_at: op.started_at,
                    completed_at: null,
                    expected_total_calls: op.expected_total_calls || op.total_calls || 0,
                    total_calls: op.total_calls,
                    completed_calls: op.completed_calls,
                    successful_calls: op.successful_calls || 0,
                    failed_calls: op.failed_calls || 0,
                    pending_calls: op.pending_calls || (op.total_calls - op.completed_calls),
                    progress_percentage: (() => {
                      const completed = op.completed_calls || 0;
                      const actualTotal = Math.max(completed, op.total_calls || op.expected_total_calls || 0);
                      return actualTotal > 0 ? (completed / actualTotal) * 100 : 0;
                    })(),
                    error: null,
                    is_active: op.is_active,
                    call_statuses: undefined
                  }))
                : []
            } 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
