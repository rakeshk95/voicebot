import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { 
  Upload, 
  FileSpreadsheet, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Info,
  Clock,
  Users,
  Phone,
  Settings,
  RefreshCw,
  Pause,
  Play,
  X,
  Database,
  Zap
} from 'lucide-react';
import { 
  createUnifiedBatchOperation,
  getUnifiedOperationStatus,
  pauseUnifiedOperation,
  resumeUnifiedOperation,
  cancelUnifiedOperation,
  pollUnifiedOperationStatus,
  UnifiedBatchCallResponse,
  UnifiedOperationStatus
} from '@/lib/unifiedBatchCallingApi';
import { BatchCallStartRequest } from '@/types/batchCalling';
import { Campaign } from '@/types/campaign';
import { authorizedFetch } from '@/lib/api';
import { useOperationUpdates } from '@/hooks/useBatchCallWebSocket';

interface UnifiedBatchCallUploadProps {
  onUploadSuccess: () => void;
}

export const UnifiedBatchCallUpload: React.FC<UnifiedBatchCallUploadProps> = ({ onUploadSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [filteredCampaigns, setFilteredCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [currentOperation, setCurrentOperation] = useState<UnifiedOperationStatus | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [lastStatusCheck, setLastStatusCheck] = useState<Date | null>(null);
  const [statusSource, setStatusSource] = useState<'memory' | 'database' | null>(null);
  const [implementation, setImplementation] = useState<'legacy' | 'rabbitmq'>('rabbitmq');
  const { toast } = useToast();
  
  // Use refs to track polling state and prevent multiple calls
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const isSubmittingRef = useRef(false);

  // WebSocket for real-time updates
  const { isConnected: wsConnected, update: wsUpdate, error: wsError } = useOperationUpdates(
    currentOperation?.bulk_operation_id || ''
  );

  const [formData, setFormData] = useState({
    campaign_id: '',
    org_id: '',
    channels: '16', // Default to 16 channels for RabbitMQ
    sleep_seconds: '5', // Default to 5 seconds
    operation_name: '',
    worker_prefetch: '5',
    batch_size: '50'
  });

  // Get user data and check role
  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  const isSuperUser = userData?.role_name === 'superuser';

  // Fetch campaigns and organizations only once on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [orgsResponse, campaignsResponse] = await Promise.all([
          authorizedFetch('/organizations'),
          authorizedFetch('/campaigns/')
        ]);

        if (orgsResponse.ok) {
          const orgData = await orgsResponse.json();
          setOrganizations(orgData);
        }

        if (campaignsResponse.ok) {
          const campaignData = await campaignsResponse.json();
          setCampaigns(campaignData);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  // Filter campaigns based on selected organization
  useEffect(() => {
    if (formData.org_id) {
      const filtered = campaigns.filter(campaign => campaign.org_id === formData.org_id);
      setFilteredCampaigns(filtered);
      
      // Reset campaign selection if current campaign is not in filtered list
      if (formData.campaign_id && !filtered.find(c => c.id === formData.campaign_id)) {
        setFormData(prev => ({ ...prev, campaign_id: '' }));
      }
    } else {
      setFilteredCampaigns(campaigns);
    }
  }, [formData.org_id, campaigns, formData.campaign_id]);

  // Handle WebSocket updates
  useEffect(() => {
    if (wsUpdate && currentOperation) {
      console.log('🔄 WebSocket update received for operation:', wsUpdate);
      setCurrentOperation(prev => prev ? {
        ...prev,
        status: wsUpdate.status,
        progress_percentage: wsUpdate.progress_percentage,
        total_calls: wsUpdate.total_calls,
        completed_calls: wsUpdate.completed_calls,
        successful_calls: wsUpdate.successful_calls,
        failed_calls: wsUpdate.failed_calls,
        pending_calls: wsUpdate.pending_calls,
        current_row: wsUpdate.current_row,
        error_message: wsUpdate.error_message
      } : null);
      
      setLastStatusCheck(new Date());
      setStatusSource('memory');
    }
  }, [wsUpdate, currentOperation]);

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

  // Stop polling when operation completes
  useEffect(() => {
    if (currentOperation && ['completed', 'failed', 'cancelled'].includes(currentOperation.status)) {
      stopPolling();
    }
  }, [currentOperation]);

  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
      setIsPolling(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 10 * 1024 * 1024) { // 10MB limit
        toast({
          title: "File Too Large",
          description: "Please select a file smaller than 10MB",
          variant: "destructive",
        });
        return;
      }
      setFile(selectedFile);
      setApiError(null);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (isSubmittingRef.current) {
      toast({
        title: "Please Wait",
        description: "An operation is already in progress",
        variant: "destructive",
      });
      return;
    }

    if (!file) {
      toast({
        title: "No File Selected",
        description: "Please select an Excel file to upload",
        variant: "destructive",
      });
      return;
    }

    if (!formData.campaign_id || !formData.org_id) {
      toast({
        title: "Missing Information",
        description: "Please select both organization and campaign",
        variant: "destructive",
      });
      return;
    }

    isSubmittingRef.current = true;
    setUploading(true);
    setApiError(null);

    try {
      const request: BatchCallStartRequest = {
        campaign_id: formData.campaign_id,
        org_id: formData.org_id,
        user_id: userData.id,
        operation_name: formData.operation_name || `Batch Operation ${new Date().toLocaleString()}`,
        sleep_seconds: parseInt(formData.sleep_seconds),
        channels: parseInt(formData.channels),
        worker_prefetch: parseInt(formData.worker_prefetch),
        batch_size: parseInt(formData.batch_size)
      };

      console.log('🚀 Starting unified batch operation:', request);
      
      const result: UnifiedBatchCallResponse = await createUnifiedBatchOperation(
        file,
        request,
        implementation
      );

      console.log('✅ Unified batch operation created:', result);

      toast({
        title: "Operation Started",
        description: `Batch operation started successfully using ${implementation} implementation`,
      });

      // Set current operation and start monitoring
      setCurrentOperation({
        bulk_operation_id: result.bulk_operation_id,
        status: result.status,
        started_at: new Date().toISOString(),
        total_calls: result.total_calls,
        completed_calls: result.completed_calls,
        successful_calls: result.successful_calls,
        failed_calls: result.failed_calls,
        pending_calls: result.total_calls - result.completed_calls,
        progress_percentage: result.progress_percentage,
        current_row: 0,
        can_pause: result.capabilities.can_pause,
        can_resume: result.capabilities.can_resume,
        can_cancel: result.capabilities.can_cancel,
        implementation: result.implementation,
        database_synced: result.persistent,
        database_id: result.database_id
      });

      // Start polling for updates (fallback if WebSocket fails)
      if (!wsConnected) {
        startPolling(result.bulk_operation_id);
      }

      // Call success callback
      onUploadSuccess();

    } catch (error) {
      console.error('❌ Error starting unified batch operation:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setApiError(errorMessage);
      
      toast({
        title: "Operation Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      isSubmittingRef.current = false;
    }
  };

  const startPolling = (operationId: string) => {
    if (pollingRef.current) return;
    
    setIsPolling(true);
    pollingRef.current = setInterval(async () => {
      try {
        const result = await getUnifiedOperationStatus(operationId);
        setCurrentOperation(result.data);
        setLastStatusCheck(new Date());
        setStatusSource(result.source);
        
        if (['completed', 'failed', 'cancelled'].includes(result.data.status)) {
          stopPolling();
        }
      } catch (error) {
        console.error('Error polling operation status:', error);
      }
    }, 2000);
  };

  const handleCheckStatus = async (operationId: string) => {
    try {
      const result = await getUnifiedOperationStatus(operationId);
      setCurrentOperation(result.data);
      setLastStatusCheck(new Date());
      setStatusSource(result.source);
    } catch (error) {
      console.error('Error checking status:', error);
      toast({
        title: "Status Check Failed",
        description: "Failed to check operation status",
        variant: "destructive",
      });
    }
  };

  const handlePauseOperation = async (operationId: string) => {
    try {
      const result = await pauseUnifiedOperation(operationId);
      toast({
        title: "Operation Paused",
        description: result.message,
      });
      handleCheckStatus(operationId);
    } catch (error) {
      console.error('Error pausing operation:', error);
      toast({
        title: "Pause Failed",
        description: "Failed to pause operation. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleResumeOperation = async (operationId: string) => {
    try {
      const result = await resumeUnifiedOperation(operationId);
      toast({
        title: "Operation Resumed",
        description: result.message,
      });
      handleCheckStatus(operationId);
    } catch (error) {
      console.error('Error resuming operation:', error);
      toast({
        title: "Resume Failed",
        description: "Failed to resume operation. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCancelOperation = async (operationId: string) => {
    try {
      const result = await cancelUnifiedOperation(operationId);
      toast({
        title: "Operation Cancelled",
        description: result.message,
      });
      handleCheckStatus(operationId);
    } catch (error) {
      console.error('Error cancelling operation:', error);
      toast({
        title: "Cancel Failed",
        description: "Failed to cancel operation. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Implementation Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Implementation Settings</span>
          </CardTitle>
          <CardDescription>
            Choose the batch calling implementation to use
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div 
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                implementation === 'rabbitmq' 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setImplementation('rabbitmq')}
            >
              <div className="flex items-center space-x-2 mb-2">
                <Zap className="h-5 w-5 text-blue-600" />
                <h3 className="font-medium">RabbitMQ (Recommended)</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                High-performance, scalable implementation with real-time updates
              </p>
              <div className="mt-2 flex flex-wrap gap-1">
                <Badge variant="secondary" className="text-xs">Real-time</Badge>
                <Badge variant="secondary" className="text-xs">Scalable</Badge>
                <Badge variant="secondary" className="text-xs">Persistent</Badge>
              </div>
            </div>
            
            <div 
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                implementation === 'legacy' 
                  ? 'border-green-500 bg-green-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setImplementation('legacy')}
            >
              <div className="flex items-center space-x-2 mb-2">
                <Database className="h-5 w-5 text-green-600" />
                <h3 className="font-medium">Legacy</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Traditional implementation for compatibility
              </p>
              <div className="mt-2 flex flex-wrap gap-1">
                <Badge variant="secondary" className="text-xs">Compatible</Badge>
                <Badge variant="secondary" className="text-xs">Simple</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upload Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Upload className="h-5 w-5" />
            <span>Create New Batch Operation</span>
          </CardTitle>
          <CardDescription>
            Upload an Excel file to start a new batch calling operation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* File Upload */}
            <div className="space-y-2">
              <Label htmlFor="file">Excel File</Label>
              <Input
                id="file"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                disabled={uploading}
              />
              {file && (
                <div className="flex items-center space-x-2 text-sm text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span>{file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                </div>
              )}
            </div>

            {/* Organization Selection */}
            <div className="space-y-2">
              <Label htmlFor="org_id">Organization</Label>
              <Select
                value={formData.org_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, org_id: value, campaign_id: '' }))}
                disabled={uploading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select organization" />
                </SelectTrigger>
                <SelectContent>
                  {organizations.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Campaign Selection */}
            <div className="space-y-2">
              <Label htmlFor="campaign_id">Campaign</Label>
              <Select
                value={formData.campaign_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, campaign_id: value }))}
                disabled={uploading || !formData.org_id}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select campaign" />
                </SelectTrigger>
                <SelectContent>
                  {filteredCampaigns.map((campaign) => (
                    <SelectItem key={campaign.id} value={campaign.id}>
                      {campaign.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Operation Name */}
            <div className="space-y-2">
              <Label htmlFor="operation_name">Operation Name (Optional)</Label>
              <Input
                id="operation_name"
                value={formData.operation_name}
                onChange={(e) => setFormData(prev => ({ ...prev, operation_name: e.target.value }))}
                placeholder="Enter a name for this operation"
                disabled={uploading}
              />
            </div>

            {/* Configuration Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sleep_seconds">Sleep Between Calls (seconds)</Label>
                <Input
                  id="sleep_seconds"
                  type="number"
                  min="1"
                  max="300"
                  value={formData.sleep_seconds}
                  onChange={(e) => setFormData(prev => ({ ...prev, sleep_seconds: e.target.value }))}
                  disabled={uploading}
                />
              </div>

              {implementation === 'rabbitmq' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="channels">Worker Channels</Label>
                    <Input
                      id="channels"
                      type="number"
                      min="1"
                      max="32"
                      value={formData.channels}
                      onChange={(e) => setFormData(prev => ({ ...prev, channels: e.target.value }))}
                      disabled={uploading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="worker_prefetch">Worker Prefetch</Label>
                    <Input
                      id="worker_prefetch"
                      type="number"
                      min="1"
                      max="20"
                      value={formData.worker_prefetch}
                      onChange={(e) => setFormData(prev => ({ ...prev, worker_prefetch: e.target.value }))}
                      disabled={uploading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="batch_size">Batch Size</Label>
                    <Input
                      id="batch_size"
                      type="number"
                      min="1"
                      max="100"
                      value={formData.batch_size}
                      onChange={(e) => setFormData(prev => ({ ...prev, batch_size: e.target.value }))}
                      disabled={uploading}
                    />
                  </div>
                </>
              )}
            </div>

            {/* Submit Button */}
            <Button 
              type="submit" 
              disabled={uploading || !file || !formData.campaign_id || !formData.org_id}
              className="w-full"
            >
              {uploading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Starting Operation...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Start Batch Operation
                </>
              )}
            </Button>

            {apiError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                <div className="flex items-center space-x-2 text-red-800">
                  <XCircle className="h-4 w-4" />
                  <span className="font-medium">Error</span>
                </div>
                <p className="text-sm text-red-700 mt-1">{apiError}</p>
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Current Operation Status */}
      {currentOperation && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Activity className="h-5 w-5" />
                <span>Current Operation</span>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="outline">{currentOperation.implementation}</Badge>
                {wsConnected && <Badge variant="default" className="flex items-center space-x-1">
                  <Zap className="h-3 w-3" />
                  <span>Live</span>
                </Badge>}
                {isPolling && <Badge variant="secondary">Polling</Badge>}
              </div>
            </CardTitle>
            <CardDescription>
              Operation ID: {currentOperation.bulk_operation_id}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Status and Progress */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Badge variant={
                    currentOperation.status === 'processing' ? 'default' :
                    currentOperation.status === 'completed' ? 'default' :
                    currentOperation.status === 'failed' ? 'destructive' :
                    currentOperation.status === 'paused' ? 'secondary' :
                    'outline'
                  }>
                    {currentOperation.status}
                  </Badge>
                  {statusSource && (
                    <Badge variant="outline" className="text-xs">
                      {statusSource}
                    </Badge>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  {currentOperation.progress_percentage.toFixed(1)}% complete
                </div>
              </div>

              <Progress value={currentOperation.progress_percentage} className="w-full" />

              {/* Statistics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{currentOperation.total_calls}</div>
                  <div className="text-sm text-muted-foreground">Total Calls</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{currentOperation.successful_calls}</div>
                  <div className="text-sm text-muted-foreground">Successful</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{currentOperation.failed_calls}</div>
                  <div className="text-sm text-muted-foreground">Failed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{currentOperation.pending_calls}</div>
                  <div className="text-sm text-muted-foreground">Pending</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-blue-800 text-center">Operation Controls</h4>
                <div className="flex flex-wrap gap-2 justify-center">
                  {/* Pause Button */}
                  <Button
                    onClick={() => handlePauseOperation(currentOperation.bulk_operation_id)}
                    disabled={!currentOperation.can_pause}
                    variant="outline"
                    size="sm"
                    className="border-yellow-300 text-yellow-700 hover:bg-yellow-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Pause className="h-4 w-4 mr-2" />
                    Pause
                  </Button>

                  {/* Resume Button */}
                  <Button
                    onClick={() => handleResumeOperation(currentOperation.bulk_operation_id)}
                    disabled={!currentOperation.can_resume}
                    variant="outline"
                    size="sm"
                    className="border-green-300 text-green-700 hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Resume
                  </Button>

                  {/* Cancel Button */}
                  <Button
                    onClick={() => handleCancelOperation(currentOperation.bulk_operation_id)}
                    disabled={!currentOperation.can_cancel}
                    variant="outline"
                    size="sm"
                    className="border-red-300 text-red-700 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>

                  {/* Check Status Button */}
                  <Button
                    onClick={() => handleCheckStatus(currentOperation.bulk_operation_id)}
                    variant="outline"
                    size="sm"
                    className="border-blue-300 text-blue-700 hover:bg-blue-50"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Check Status
                  </Button>
                </div>

                {/* Capabilities Info */}
                <div className="text-xs text-blue-600 text-center">
                  <div className="flex justify-center space-x-4">
                    <span className={`${currentOperation.can_pause ? 'text-green-600' : 'text-gray-400'}`}>
                      Pause: {currentOperation.can_pause ? '✓' : '✗'}
                    </span>
                    <span className={`${currentOperation.can_resume ? 'text-green-600' : 'text-gray-400'}`}>
                      Resume: {currentOperation.can_resume ? '✓' : '✗'}
                    </span>
                    <span className={`${currentOperation.can_cancel ? 'text-green-600' : 'text-gray-400'}`}>
                      Cancel: {currentOperation.can_cancel ? '✓' : '✗'}
                    </span>
                  </div>
                  {currentOperation.database_synced && (
                    <p className="mt-1 text-blue-700 font-medium">Database synced</p>
                  )}
                </div>

                {/* Last Status Check */}
                {lastStatusCheck && (
                  <div className="text-xs text-blue-500 text-center">
                    Last updated: {lastStatusCheck.toLocaleTimeString()}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
