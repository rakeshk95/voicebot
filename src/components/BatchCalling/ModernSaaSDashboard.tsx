import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { authorizedFetch } from '../../lib/api';
import { 
  createUnifiedBatchOperation,
  getUnifiedOperationsSummary,
  getUnifiedOperationsList,
  pauseUnifiedOperation,
  resumeUnifiedOperation,
  cancelUnifiedOperation
} from '@/lib/unifiedBatchCallingApi';
import { 
  Play, 
  Pause, 
  Square, 
  Eye, 
  RotateCcw, 
  Download, 
  Filter,
  Search,
  TrendingUp,
  Clock,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Zap
} from 'lucide-react';

interface BatchOperation {
  id: string;
  operation_name: string;
  created_by: string;
  created_at: string;
  status: 'running' | 'completed' | 'failed' | 'paused' | 'cancelled';
  total_calls: number;
  successful_calls: number;
  failed_calls: number;
  pending_calls: number;
  avg_duration: number;
  retry_count: number;
  progress_percentage: number;
  campaign_id: string;
  org_id: string;
  can_pause: boolean;
  can_resume: boolean;
  can_cancel: boolean;
}


const ModernSaaSDashboard: React.FC = () => {
  console.log('🚀 ModernSaaSDashboard component rendering...');
  
  const navigate = useNavigate();
  const [batches, setBatches] = useState<BatchOperation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [summary, setSummary] = useState({
    total_operations: 0,
    total_calls: 0,
    success_rate: 0,
    active_operations: 0
  });
  const { toast } = useToast();

  // Fetch real data from APIs
  const fetchData = async () => {
    setLoading(true);
    try {
      console.log('🔍 Fetching batch operations data...');
      
      // Check authentication status first
      const authToken = localStorage.getItem('authToken');
      const userData = localStorage.getItem('userData');
      console.log('🔐 Auth Token:', authToken ? 'Present' : 'Missing');
      console.log('👤 User Data:', userData ? 'Present' : 'Missing');
      
      if (!authToken) {
        console.error('❌ No auth token found in localStorage');
        toast({
          title: 'Authentication Required',
          description: 'Please log in to view batch operations',
          variant: 'destructive'
        });
        setLoading(false);
        return;
      }
      
      // Fetch batch operations list with error handling
      let operationsResponse;
      try {
        operationsResponse = await getUnifiedOperationsList();
        console.log('📊 Operations Response:', operationsResponse);
      } catch (apiError) {
        console.error('❌ Error fetching operations:', apiError);
        toast({
          title: 'API Error',
          description: 'Failed to fetch batch operations. Please try again.',
          variant: 'destructive'
        });
        setLoading(false);
        return;
      }
      
      if (operationsResponse) {
        // Handle different response formats
        let operations = [];
        if (operationsResponse.operations) {
          // Check if operations is an object (convert to array) or already an array
          if (typeof operationsResponse.operations === 'object' && !Array.isArray(operationsResponse.operations)) {
            // Convert object to array of values
            operations = Object.values(operationsResponse.operations);
          } else {
            operations = operationsResponse.operations;
          }
        } else if (Array.isArray(operationsResponse)) {
          operations = operationsResponse;
        } else if (operationsResponse.data) {
          operations = operationsResponse.data;
        }
        
        console.log('📋 Operations Array:', operations);
        console.log('📋 Operations Type:', typeof operations, 'Is Array:', Array.isArray(operations));
        
        if (operations && Array.isArray(operations) && operations.length > 0) {
          const formattedBatches: BatchOperation[] = operations.map((op: any) => ({
            id: op.bulk_operation_id || op.id || `batch_${Date.now()}`,
            operation_name: op.operation_name || op.name || `Batch ${op.id || 'Unknown'}`,
            created_by: op.created_by || op.user_id || 'Unknown',
            created_at: op.started_at || op.created_at || new Date().toISOString(),
            status: op.status || 'unknown',
            total_calls: op.total_calls || 0,
            successful_calls: op.successful_calls || 0,
            failed_calls: op.failed_calls || 0,
            pending_calls: op.pending_calls || (op.total_calls - (op.successful_calls + op.failed_calls)) || 0,
            avg_duration: op.avg_duration || 0,
            retry_count: op.retry_count || 0,
            progress_percentage: op.progress_percentage || 0,
            campaign_id: op.campaign_id || '',
            org_id: op.org_id || '',
            can_pause: op.can_pause || op.actions_available?.pause || false,
            can_resume: op.can_resume || op.actions_available?.resume || false,
            can_cancel: op.can_cancel || op.actions_available?.cancel || false
          }));
          console.log('✅ Formatted Batches:', formattedBatches);
          setBatches(formattedBatches);
        } else {
          console.log('⚠️ No operations found in response');
          setBatches([]);
        }
      } else {
        console.log('❌ No operations response received');
        setBatches([]);
      }

      // Fetch summary data with error handling
      console.log('🔍 Fetching summary data...');
      try {
        const summaryResponse = await getUnifiedOperationsSummary();
        console.log('📈 Summary Response:', summaryResponse);
        
        if (summaryResponse) {
          setSummary({
            total_operations: summaryResponse.total_operations || summaryResponse.total_ops || 0,
            total_calls: summaryResponse.total_calls || 0,
            success_rate: summaryResponse.success_rate || summaryResponse.overall_success_rate || 0,
            active_operations: summaryResponse.active_operations || summaryResponse.active_ops || 0
          });
        } else {
          console.log('❌ No summary response received');
        }
      } catch (summaryError) {
        console.error('❌ Error fetching summary:', summaryError);
        // Set default summary values on error
        setSummary({
          total_operations: 0,
          total_calls: 0,
          success_rate: 0,
          active_operations: 0
        });
      }

      // System health functionality removed for now

    } catch (error: any) {
      console.error('❌ Error fetching data:', error);
      console.error('❌ Error details:', error.message, error.stack);
      
      // Try fallback method - direct API call
      console.log('🔄 Trying fallback method...');
      try {
        await fetchDataFallback();
      } catch (fallbackError) {
        console.error('❌ Fallback also failed:', fallbackError);
        toast({
          title: 'Error',
          description: `Failed to fetch batch operations data: ${error.message}`,
          variant: 'destructive'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Fallback method to fetch data directly from backend
  const fetchDataFallback = async () => {
    console.log('🔄 Using fallback method to fetch data...');
    
    try {
      // Try to fetch from the unified batch calls endpoint directly
      const response = await authorizedFetch('/api/v1/unified-batch-calls/operations');
      console.log('📊 Fallback Response:', response);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📋 Fallback Data:', data);
        
        if (data && data.operations) {
          // Handle both object and array formats
          let operationsArray = data.operations;
          if (typeof data.operations === 'object' && !Array.isArray(data.operations)) {
            operationsArray = Object.values(data.operations);
          }
          
          const formattedBatches: BatchOperation[] = operationsArray.map((op: any) => ({
            id: op.bulk_operation_id || op.id || `batch_${Date.now()}`,
            operation_name: op.operation_name || op.name || `Batch ${op.id || 'Unknown'}`,
            created_by: op.created_by || op.user_id || 'Unknown',
            created_at: op.started_at || op.created_at || new Date().toISOString(),
            status: op.status || 'unknown',
            total_calls: op.total_calls || 0,
            successful_calls: op.successful_calls || 0,
            failed_calls: op.failed_calls || 0,
            pending_calls: op.pending_calls || (op.total_calls - (op.successful_calls + op.failed_calls)) || 0,
            avg_duration: op.avg_duration || 0,
            retry_count: op.retry_count || 0,
            progress_percentage: op.progress_percentage || 0,
            campaign_id: op.campaign_id || '',
            org_id: op.org_id || '',
            can_pause: op.can_pause || op.actions_available?.pause || false,
            can_resume: op.can_resume || op.actions_available?.resume || false,
            can_cancel: op.can_cancel || op.actions_available?.cancel || false
          }));
          setBatches(formattedBatches);
          console.log('✅ Fallback successful, set batches:', formattedBatches);
        }
      } else {
        console.error('❌ Fallback API call failed:', response.status, response.statusText);
      }
    } catch (fallbackError) {
      console.error('❌ Fallback method failed:', fallbackError);
      throw fallbackError;
    }
  };


  // Load data on component mount
  useEffect(() => {
    fetchData();
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusBadge = (status: string) => {
    const variants = {
      running: { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: Activity },
      completed: { bg: 'bg-blue-100', text: 'text-blue-700', icon: CheckCircle },
      failed: { bg: 'bg-red-100', text: 'text-red-700', icon: XCircle },
      paused: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: Pause },
      cancelled: { bg: 'bg-gray-100', text: 'text-gray-700', icon: Square },
      starting: { bg: 'bg-blue-100', text: 'text-blue-700', icon: Activity },
      processing: { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: Activity },
      unknown: { bg: 'bg-gray-100', text: 'text-gray-700', icon: Square }
    };

    const variant = variants[status as keyof typeof variants] || variants.unknown;
    const Icon = variant.icon;

    return (
      <Badge className={`${variant.bg} ${variant.text} flex items-center space-x-1 px-2 py-1`}>
        <Icon className="h-3 w-3" />
        <span className="text-xs font-medium">{status.toUpperCase()}</span>
      </Badge>
    );
  };


  // Handle batch operations
  const handleBatchAction = async (batchId: string, action: 'pause' | 'resume' | 'cancel') => {
    try {
      let result;
      switch (action) {
        case 'pause':
          result = await pauseUnifiedOperation(batchId);
          break;
        case 'resume':
          result = await resumeUnifiedOperation(batchId);
          break;
        case 'cancel':
          result = await cancelUnifiedOperation(batchId);
          break;
      }
      
      toast({
        title: 'Success',
        description: `Operation ${action}d successfully`,
      });
      
      // Refresh data
      fetchData();
      
    } catch (error: any) {
      toast({
        title: 'Action Failed',
        description: error.message || `Failed to ${action} operation`,
        variant: 'destructive'
      });
    }
  };

  const handleRefresh = () => {
    fetchData();
  };

  const handleNewBatch = () => {
    // Navigate to the batch creation page using React Router
    navigate('/batch-calling/create');
  };

  const handleViewDetails = (batchId: string) => {
    // Navigate to batch details or open modal
    toast({
      title: 'View Details',
      description: `Opening details for batch ${batchId}`,
    });
  };

  const filteredBatches = batches.filter(batch => {
    const matchesSearch = batch.operation_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         batch.created_by.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || batch.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalCalls = batches.reduce((sum, batch) => sum + batch.total_calls, 0);
  const totalSuccessful = batches.reduce((sum, batch) => sum + batch.successful_calls, 0);
  const totalFailed = batches.reduce((sum, batch) => sum + batch.failed_calls, 0);
  const successRate = totalCalls > 0 ? ((totalSuccessful / totalCalls) * 100).toFixed(1) : '0';

  if (loading && batches.length === 0) {
    console.log('🔄 Showing loading state...');
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading batch operations...</p>
        </div>
      </div>
    );
  }

  console.log('🎨 Rendering main dashboard...', { loading, batchesCount: batches.length });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Modern Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Batch Operations</h1>
                  <p className="text-sm text-gray-500">Manage and monitor your calling campaigns</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-9"
                onClick={handleRefresh}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-9"
                onClick={() => {
                  console.log('🔍 Current batches state:', batches);
                  console.log('🔍 Current summary state:', summary);
                  console.log('🔍 Current loading state:', loading);
                  
                  // Check localStorage
                  const authToken = localStorage.getItem('authToken');
                  const userData = localStorage.getItem('userData');
                  console.log('🔐 Auth Token:', authToken);
                  console.log('👤 User Data:', userData);
                  
                  // Calculate current values
                  const calculatedTotalCalls = batches.reduce((sum, batch) => sum + batch.total_calls, 0);
                  const calculatedActiveOps = batches.filter(b => b.status === 'running').length;
                  console.log('🧮 Calculated totalCalls:', calculatedTotalCalls);
                  console.log('🧮 Calculated activeOps:', calculatedActiveOps);
                  console.log('🧮 Batches length:', batches.length);
                  
                  // Test API call directly
                  fetch('http://localhost:8000/api/v1/unified-batch-calls/health')
                    .then(response => response.json())
                    .then(data => console.log('🏥 Health API Response:', data))
                    .catch(error => console.error('❌ Health API Error:', error));
                }}
              >
                Debug
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-9"
                onClick={() => {
                  // Force clear all state
                  setBatches([]);
                  setSummary({
                    total_operations: 0,
                    total_calls: 0,
                    success_rate: 0,
                    active_operations: 0
                  });
                  console.log('🧹 Cleared all frontend state');
                  toast({
                    title: 'State Cleared',
                    description: 'All frontend state has been cleared. Refreshing data...',
                  });
                  // Refetch data
                  setTimeout(() => {
                    fetchData();
                  }, 1000);
                }}
              >
                Clear State
              </Button>
              <Button 
                className="h-9 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                onClick={handleNewBatch}
              >
                <Plus className="h-4 w-4 mr-2" />
                New Batch
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Operations</p>
                  <p className="text-3xl font-bold text-gray-900">{summary.total_operations || batches.length}</p>
                  <div className="flex items-center mt-1">
                    <ArrowUpRight className="h-4 w-4 text-emerald-600 mr-1" />
                    <span className="text-sm text-emerald-600 font-medium">+12%</span>
                    <span className="text-sm text-gray-500 ml-1">vs last week</span>
                  </div>
                </div>
                <div className="p-3 bg-blue-50 rounded-full">
                  <Target className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Calls</p>
                  <p className="text-3xl font-bold text-gray-900">{(summary.total_calls || totalCalls).toLocaleString()}</p>
                  <div className="flex items-center mt-1">
                    <ArrowUpRight className="h-4 w-4 text-emerald-600 mr-1" />
                    <span className="text-sm text-emerald-600 font-medium">+8%</span>
                    <span className="text-sm text-gray-500 ml-1">vs last week</span>
                  </div>
                </div>
                <div className="p-3 bg-emerald-50 rounded-full">
                  <Users className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Success Rate</p>
                  <p className="text-3xl font-bold text-gray-900">{summary.success_rate || successRate}%</p>
                  <div className="flex items-center mt-1">
                    <ArrowUpRight className="h-4 w-4 text-emerald-600 mr-1" />
                    <span className="text-sm text-emerald-600 font-medium">+3.2%</span>
                    <span className="text-sm text-gray-500 ml-1">vs last week</span>
                  </div>
                </div>
                <div className="p-3 bg-green-50 rounded-full">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Operations</p>
                  <p className="text-3xl font-bold text-gray-900">{summary.active_operations || batches.filter(b => b.status === 'running').length}</p>
                  <div className="flex items-center mt-1">
                    <Clock className="h-4 w-4 text-blue-600 mr-1" />
                    <span className="text-sm text-gray-500">Currently running</span>
                  </div>
                </div>
                <div className="p-3 bg-orange-50 rounded-full">
                  <Activity className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content - Operations Only */}
        <div className="space-y-6">
            {/* Filters */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search operations..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 h-10"
                      />
                    </div>
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-48 h-10">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="running">Running</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="paused">Paused</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Operations Table */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Target className="h-5 w-5 text-blue-600" />
                    <span>Batch Operations ({filteredBatches.length})</span>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-gray-100">
                      <TableHead className="font-semibold">Operation</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold">Progress</TableHead>
                      <TableHead className="font-semibold">Calls</TableHead>
                      <TableHead className="font-semibold">Success Rate</TableHead>
                      <TableHead className="font-semibold">Created</TableHead>
                      <TableHead className="font-semibold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBatches.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-12">
                          <div className="flex flex-col items-center space-y-4">
                            <Target className="h-12 w-12 text-gray-400" />
                            <div>
                              <p className="text-lg font-medium text-gray-900">No batch operations found</p>
                              <p className="text-gray-500">Get started by creating your first batch operation</p>
                            </div>
                            <Button 
                              onClick={handleNewBatch}
                              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Create New Batch
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredBatches.map((batch) => (
                      <TableRow key={batch.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <TableCell>
                          <div>
                            <p className="font-medium text-gray-900">{batch.operation_name}</p>
                            <p className="text-sm text-gray-500">by {batch.created_by}</p>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(batch.status)}</TableCell>
                        <TableCell>
                          <div className="w-24">
                            <Progress value={batch.progress_percentage} className="h-2" />
                            <p className="text-xs text-gray-500 mt-1">{batch.progress_percentage.toFixed(1)}%</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p className="font-medium text-gray-900">{batch.total_calls}</p>
                            <p className="text-gray-500">{batch.successful_calls} successful</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p className="font-medium text-gray-900">
                              {batch.total_calls > 0 ? ((batch.successful_calls / batch.total_calls) * 100).toFixed(1) : 0}%
                            </p>
                            <p className="text-gray-500">{batch.failed_calls} failed</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p className="text-gray-900">{new Date(batch.created_at).toLocaleDateString()}</p>
                            <p className="text-gray-500">{new Date(batch.created_at).toLocaleTimeString()}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-8 w-8 p-0"
                              onClick={() => handleViewDetails(batch.id)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {batch.can_pause && (
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="h-8 w-8 p-0"
                                onClick={() => handleBatchAction(batch.id, 'pause')}
                              >
                                <Pause className="h-4 w-4" />
                              </Button>
                            )}
                            {batch.can_resume && (
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="h-8 w-8 p-0"
                                onClick={() => handleBatchAction(batch.id, 'resume')}
                              >
                                <Play className="h-4 w-4" />
                              </Button>
                            )}
                            {batch.failed_calls > 0 && (
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="h-8 w-8 p-0"
                                onClick={() => handleBatchAction(batch.id, 'cancel')}
                              >
                                <RotateCcw className="h-4 w-4" />
                              </Button>
                            )}
                            {batch.can_cancel && (
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="h-8 w-8 p-0"
                                onClick={() => handleBatchAction(batch.id, 'cancel')}
                              >
                                <Square className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
};

export default ModernSaaSDashboard;
