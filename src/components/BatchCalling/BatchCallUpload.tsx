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
  RefreshCw
} from 'lucide-react';
import { startBatchCall, pollOperationStatus, calculateCallStatusCounts, getStatusColorClass } from '@/lib/batchCallingApi';
import { BatchCallStartRequest, BatchCallOperation } from '@/types/batchCalling';
import { Campaign } from '@/types/campaign';
import { authorizedFetch } from '@/lib/api';

interface BatchCallUploadProps {
  onUploadSuccess: () => void;
}

export const BatchCallUpload: React.FC<BatchCallUploadProps> = ({ onUploadSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [filteredCampaigns, setFilteredCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [currentOperation, setCurrentOperation] = useState<BatchCallOperation | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const { toast } = useToast();
  
  // Use refs to track polling state and prevent multiple calls
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const isSubmittingRef = useRef(false);

  const [formData, setFormData] = useState({
    campaign_id: '',
    org_id: '',
    channels: '1', // Default to 1 channel
    sleep_seconds: '100' // Default to 100 seconds
  });

  // Fetch campaigns and organizations only once on mount
  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Use the existing API utilities for consistency
        const [campaignsRes, orgsRes] = await Promise.all([
          authorizedFetch('/campaigns/'),
          authorizedFetch('/organizations/')
        ]);

        if (!isMounted) return;

        if (campaignsRes.ok) {
          const campaignsData = await campaignsRes.json() as Campaign[];
          setCampaigns(campaignsData);
        } else {
          console.error('Failed to fetch campaigns:', campaignsRes.status);
          toast({
            title: "Warning",
            description: "Could not load campaigns. Please refresh the page.",
            variant: "destructive",
          });
        }

        if (orgsRes.ok) {
          const orgsData = await orgsRes.json() as any[];
          setOrganizations(orgsData);
        } else {
          console.error('Failed to fetch organizations:', orgsRes.status);
          toast({
            title: "Warning",
            description: "Could not load organizations. Please refresh the page.",
            variant: "destructive",
          });
        }
      } catch (error) {
        if (!isMounted) return;
        console.error('Error fetching data:', error);
        toast({
          title: "Error",
          description: "Failed to load campaigns and organizations",
          variant: "destructive",
        });
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, []); // Empty dependency array - only run once

  // Filter campaigns based on selected organization
  useEffect(() => {
    if (formData.org_id && campaigns.length > 0) {
      const filtered = campaigns.filter(campaign => campaign.org_id === formData.org_id);
      setFilteredCampaigns(filtered);
      
      // Reset campaign selection if current campaign is not in filtered list
      if (formData.campaign_id && !filtered.find(c => c.id === formData.campaign_id)) {
        setFormData(prev => ({ ...prev, campaign_id: '' }));
      }
    } else {
      setFilteredCampaigns([]);
    }
  }, [formData.org_id, campaigns]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      if (!selectedFile.name.match(/\.(xlsx|xls)$/i)) {
        toast({
          title: "Invalid File Type",
          description: "Please select an Excel file (.xlsx or .xls)",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (max 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please select a file smaller than 10MB",
          variant: "destructive",
        });
        return;
      }

      // Additional validation - ensure file is not empty
      if (selectedFile.size === 0) {
        toast({
          title: "Invalid File",
          description: "Please select a non-empty file",
          variant: "destructive",
        });
        return;
      }

      setFile(selectedFile);
      console.log('BatchCallUpload: File selected:', {
        name: selectedFile.name,
        size: selectedFile.size,
        type: selectedFile.type
      });
      
      toast({
        title: "File Selected",
        description: `${selectedFile.name} has been selected`,
      });
    }
  };

  const handleInputChange = (field: string, value: string) => {
    // Trim the value to remove leading/trailing whitespace
    const trimmedValue = value.trim();
    setFormData(prev => ({ ...prev, [field]: trimmedValue }));
  };

  const validateForm = (): boolean => {
    if (!file) {
      toast({
        title: "No File Selected",
        description: "Please select an Excel file to upload",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.campaign_id || formData.campaign_id.trim() === '') {
      toast({
        title: "Campaign Required",
        description: "Please select a campaign for this batch operation",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.org_id || formData.org_id.trim() === '') {
      toast({
        title: "Organization Required",
        description: "Please select an organization for this batch operation",
        variant: "destructive",
      });
      return false;
    }

    // Validate sleep seconds - ensure it's a valid number
    const sleepSeconds = parseInt(formData.sleep_seconds);
    if (isNaN(sleepSeconds) || sleepSeconds < 1 || sleepSeconds > 3600) {
      toast({
        title: "Invalid Delay",
        description: "Delay between calls must be a valid number between 1 and 3600 seconds",
        variant: "destructive",
      });
      return false;
    }

    // Validate channels - ensure it's a valid number
    const channels = parseInt(formData.channels);
    if (isNaN(channels) || channels < 1 || channels > 10) {
      toast({
        title: "Invalid Channels",
        description: "Number of channels must be between 1 and 10",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    // Prevent multiple submissions
    if (isSubmittingRef.current || uploading) {
      return;
    }
    
    if (!validateForm()) return;

    try {
      isSubmittingRef.current = true;
      setUploading(true);
      
      // Final validation and data preparation
      const request: BatchCallStartRequest = {
        file: file!,
        campaign_id: formData.campaign_id.trim(),
        org_id: formData.org_id.trim(),
        user_id: 'auto', // Will be automatically set by backend
        channels: parseInt(formData.channels),
        sleep_seconds: Math.max(1, Math.min(3600, parseInt(formData.sleep_seconds) || 100)) // Ensure value is between 1-3600
      };

      // Double-check that all required fields are present
      if (!request.campaign_id || !request.org_id) {
        toast({
          title: "Missing Required Fields",
          description: "Please fill in all required fields",
          variant: "destructive",
        });
        return;
      }

      console.log('BatchCallUpload: Sending request:', {
        campaign_id: request.campaign_id,
        org_id: request.org_id,
        channels: request.channels,
        sleep_seconds: request.sleep_seconds,
        file_name: request.file.name,
        file_size: request.file.size,
        has_external_url: !!request.external_call_url,
        has_external_username: !!request.external_username,
        has_external_password: !!request.external_password
      });

      const response = await startBatchCall(request);
      
      console.log('BatchCallUpload: Response received:', response);
      
      toast({
        title: "Upload Successful",
        description: response.message,
      });

      // Start polling for status updates (only if not already polling)
      if (!isPolling) {
        startPolling(response.bulk_operation_id);
      } else {
        console.log('handleSubmit: Already polling, skipping new polling start');
      }
      
      // Reset form
      setFile(null);
      if (event.target instanceof HTMLFormElement) {
        event.target.reset();
      }
      
      onUploadSuccess();
    } catch (error) {
      console.error('BatchCallUpload: Error during upload:', error);
      
      let errorMessage = "Failed to start batch operation. Please try again.";
      
      // Try to extract more specific error information
      if (error instanceof Error) {
        if (error.message.includes('422') || error.message.includes('Unprocessable Entity')) {
          errorMessage = "Invalid data provided. Please check all required fields and try again.";
        } else if (error.message.includes('400') || error.message.includes('Bad Request')) {
          errorMessage = "Bad request. Please check your input data and try again.";
        } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
          errorMessage = "Authentication failed. Please log in again.";
        } else if (error.message.includes('500') || error.message.includes('Internal Server Error')) {
          errorMessage = "Server error. Please try again later.";
        }
      }
      
      toast({
        title: "Upload Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      isSubmittingRef.current = false;
    }
  };

  const startPolling = (operationId: string) => {
    // Stop any existing polling
    stopPolling();
    
    // Prevent multiple polling instances
    if (pollingRef.current) {
      console.log('startPolling: Already polling, stopping existing instance');
      stopPolling();
    }
    
    setIsPolling(true);
    
    console.log(`startPolling: Starting polling for operation ${operationId}`);
    
    const cleanup = pollOperationStatus(
      operationId,
      (status) => {
        setCurrentOperation(status);
        
        // Stop polling if operation is complete
        if (status.status === 'completed' || status.status === 'failed' || status.status === 'cancelled') {
          console.log(`startPolling: Operation ${operationId} completed with status ${status.status}, stopping polling`);
          stopPolling();
        }
      },
      (status) => {
        setCurrentOperation(status);
        stopPolling();
        
        if (status.status === 'completed') {
          toast({
            title: "Operation Completed",
            description: `Successfully processed ${status.total_calls} calls`,
          });
        } else if (status.status === 'failed') {
          toast({
            title: "Operation Failed",
            description: status.error || "Batch operation failed",
            variant: "destructive",
          });
        }
      },
      (error) => {
        console.error('Polling error:', error);
        stopPolling();
      },
      5000 // Poll every 5 seconds
    );

    pollingRef.current = cleanup as any;
  };

  const stopPolling = () => {
    if (pollingRef.current) {
      console.log('stopPolling: Stopping polling and cleaning up');
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    setIsPolling(false);
  };

  // Cleanup polling on unmount or when operation changes
  useEffect(() => {
    return () => {
      console.log('BatchCallUpload: Component unmounting, cleaning up polling');
      stopPolling();
    };
  }, []);

  // Additional cleanup when currentOperation changes
  useEffect(() => {
    if (currentOperation && (currentOperation.status === 'completed' || currentOperation.status === 'failed' || currentOperation.status === 'cancelled')) {
      console.log(`BatchCallUpload: Operation ${currentOperation.bulk_operation_id} finished, ensuring polling is stopped`);
      stopPolling();
    }
  }, [currentOperation]);

  return (
    <div className="space-y-6">
      {/* File Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Upload className="h-5 w-5" />
            <span>Upload Excel File</span>
          </CardTitle>
          <CardDescription>
            Select an Excel file containing customer data for batch calling. The file should have columns for phone numbers and customer information.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="file">Excel File *</Label>
            <div className="relative">
              <Input
                id="file"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Supported formats: .xlsx, .xls (Maximum size: 10MB)
            </p>
          </div>

          {file && (
            <div className="flex items-center space-x-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-800">{file.name}</p>
                <p className="text-xs text-green-600">
                  Size: {(file.size / 1024 / 1024).toFixed(2)} MB • 
                  Type: {file.type || 'Excel file'}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFile(null)}
                className="text-green-600 hover:text-green-700 hover:bg-green-100"
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Configuration Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Operation Configuration</span>
          </CardTitle>
          <CardDescription>
            Configure the batch calling operation parameters and select the campaign and organization.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="org_id">Organization *</Label>
                <Select value={formData.org_id} onValueChange={(value) => handleInputChange('org_id', value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select an organization" />
                  </SelectTrigger>
                  <SelectContent>
                    {organizations.map((org) => (
                      <SelectItem key={org.id} value={org.id}>
                        <span className="font-medium">{org.name}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {organizations.length === 0 && (
                  <p className="text-xs text-amber-600">No organizations available. Please create an organization first.</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="campaign_id">Campaign *</Label>
                <Select value={formData.campaign_id} onValueChange={(value) => handleInputChange('campaign_id', value)} disabled={!formData.org_id}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={formData.org_id ? "Select a campaign" : "Select organization first"} />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredCampaigns.map((campaign) => (
                      <SelectItem key={campaign.id} value={campaign.id}>
                        <span className="font-medium">{campaign.name}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!formData.org_id && (
                  <p className="text-xs text-blue-600">Please select an organization first to view available campaigns</p>
                )}
                {formData.org_id && filteredCampaigns.length === 0 && (
                  <p className="text-xs text-amber-600">No campaigns available for this organization. Please create a campaign first.</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="channels">Number of Channels *</Label>
                <Select value={formData.channels} onValueChange={(value) => handleInputChange('channels', value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select number of channels" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        <div className="flex items-center space-x-2">
                          <Phone className="h-4 w-4" />
                          <span>{num} Channel{num > 1 ? 's' : ''}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Number of parallel channels for processing calls</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sleep_seconds">Delay Between Calls (seconds) *</Label>
                <Input
                  id="sleep_seconds"
                  type="number"
                  min="1"
                  max="3600"
                  value={formData.sleep_seconds}
                  onChange={(e) => handleInputChange('sleep_seconds', e.target.value)}
                  placeholder="100"
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">Recommended: 100 seconds to avoid rate limiting</p>
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={uploading || !file || !formData.campaign_id || !formData.org_id || !formData.channels || !formData.sleep_seconds} 
              className="w-full h-12 text-lg font-semibold"
            >
              {uploading ? (
                <>
                  <RefreshCw className="h-5 w-5 mr-3 animate-spin" />
                  Starting Batch Operation...
                </>
              ) : (
                <>
                  <Upload className="h-5 w-5 mr-3" />
                  Start Batch Operation
                </>
              )}
            </Button>
            
            {(!file || !formData.campaign_id || !formData.org_id || !formData.channels || !formData.sleep_seconds) && (
              <p className="text-xs text-muted-foreground text-center">
                Please fill in all required fields to start the batch operation
              </p>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Current Operation Status */}
      {currentOperation && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-blue-800">
              <Clock className="h-5 w-5" />
              <span>Current Operation Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-blue-800">
                  Operation ID: {currentOperation.bulk_operation_id.slice(-8)}
                </p>
                <p className="text-xs text-blue-600">
                  Started: {new Date(currentOperation.started_at).toLocaleString()}
                </p>
              </div>
              <Badge className={`${getStatusColor(currentOperation.status)} text-sm font-medium`}>
                {currentOperation.status.charAt(0).toUpperCase() + currentOperation.status.slice(1)}
              </Badge>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-blue-700 font-medium">Progress</span>
                <span className="text-blue-800 font-semibold">
                  {currentOperation.completed_calls} / {currentOperation.total_calls} calls
                </span>
              </div>
              <Progress 
                value={currentOperation.progress_percentage} 
                className="h-3 bg-blue-100" 
              />
              <p className="text-xs text-blue-600 text-center font-medium">
                {currentOperation.progress_percentage.toFixed(1)}% complete
              </p>
            </div>

            <div className="grid grid-cols-4 gap-4 text-center">
              <div className="bg-white rounded-lg p-3 border border-blue-200">
                <div className="text-lg font-bold text-blue-600">{currentOperation.total_calls}</div>
                <div className="text-xs text-blue-600 font-medium">Total Calls</div>
              </div>
              <div className="bg-white rounded-lg p-3 border border-yellow-200">
                <div className="text-lg font-bold text-yellow-600">{currentOperation.pending_calls || 0}</div>
                <div className="text-xs text-yellow-600 font-medium">Pending</div>
              </div>
              <div className="bg-white rounded-lg p-3 border border-green-200">
                <div className="text-lg font-bold text-green-600">{currentOperation.successful_calls}</div>
                <div className="text-xs text-green-600 font-medium">Successful</div>
              </div>
              <div className="bg-white rounded-lg p-3 border border-red-200">
                <div className="text-lg font-bold text-red-600">{currentOperation.failed_calls}</div>
                <div className="text-xs text-red-600 font-medium">Failed</div>
              </div>
            </div>

            {/* Call Status Breakdown - New Feature */}
            {currentOperation.call_statuses && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-blue-800 text-center">Call Status Breakdown</h4>
                <div className="grid grid-cols-4 gap-3">
                  {Object.entries(calculateCallStatusCounts(currentOperation.call_statuses)).map(([status, count]) => (
                    <div key={status} className="bg-white rounded-lg p-2 border text-center">
                      <div className={`text-sm font-bold ${getStatusColorClass(status).split(' ')[0]}`}>
                        {count}
                      </div>
                      <div className="text-xs text-gray-600 capitalize">
                        {status}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {currentOperation.error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <XCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                  <span className="text-sm text-red-800 font-medium">Error: {currentOperation.error}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Helper function for status colors
const getStatusColor = (status: string) => {
  switch (status) {
    case 'processing':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'completed':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'failed':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'paused':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'cancelled':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    case 'starting':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};
