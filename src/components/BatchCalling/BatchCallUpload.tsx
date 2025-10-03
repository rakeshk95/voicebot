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
  X
} from 'lucide-react';
import { 
  startBatchCall, 
  startBatchCallWithRabbitMQ,
  pollOperationStatus, 
  calculateCallStatusCounts, 
  getStatusColorClass,
  pauseRabbitMQOperation,
  resumeRabbitMQOperation,
  deleteRabbitMQOperation
} from '@/lib/batchCallingApi';
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
  const [apiError, setApiError] = useState<string | null>(null);
  const [lastStatusCheck, setLastStatusCheck] = useState<Date | null>(null);
  const [statusSource, setStatusSource] = useState<'memory' | 'database' | 'capabilities' | null>(null);
  const [useRabbitMQ, setUseRabbitMQ] = useState(true); // Toggle between RabbitMQ and legacy API
  const { toast } = useToast();
  
  // Use refs to track polling state and prevent multiple calls
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const isSubmittingRef = useRef(false);

  const [formData, setFormData] = useState({
    campaign_id: '',
    org_id: '',
    channels: '1', // Default to 1 channel
    sleep_seconds: '100', // Default to 100 seconds
    operation_name: '' // New field for operation name
  });

  // Get user data and check role
  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  const isSuperUser = userData?.role_name === 'superuser';

  // Fetch campaigns and organizations only once on mount
  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Build API URLs with role-based filtering
        let campaignsUrl = '/campaigns/';
        let orgsUrl = '/organizations/';
        
                  if (!isSuperUser && userData?.org_id) {
            campaignsUrl += `?org_id=${userData.org_id}`;
          }
        
        // Always fetch organizations from API for both superusers and non-superusers
        const [campaignsRes, orgsRes] = await Promise.all([
          authorizedFetch(campaignsUrl),
          authorizedFetch(orgsUrl)
        ]);

        if (!isMounted) return;

                  if (campaignsRes.ok) {
            const campaignsData = await campaignsRes.json() as Campaign[];
            setCampaigns(campaignsData);
            setApiError(null); // Clear any previous errors
          } else {
          console.error('Failed to fetch campaigns:', campaignsRes.status);
          const errorMsg = `Failed to load campaigns (${campaignsRes.status})`;
          setApiError(errorMsg);
          toast({
            title: "Warning",
            description: "Could not load campaigns. Please refresh the page.",
            variant: "destructive",
          });
        }

        if (orgsRes.ok) {
          const orgsData = await orgsRes.json() as any[];
          setOrganizations(orgsData);
          
          // For non-superusers, set their organization as default if it exists in the fetched list
          if (!isSuperUser && userData?.org_id) {
            const userOrg = orgsData.find(org => org.id === userData.org_id);
            if (userOrg) {
              setFormData(prev => ({ ...prev, org_id: userOrg.id }));
            }
          }
          setApiError(null); // Clear any previous errors
        } else {
          console.error('Failed to fetch organizations:', orgsRes.status);
          const errorMsg = `Failed to load organizations (${orgsRes.status})`;
          setApiError(errorMsg);
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
      // Convert both to strings for comparison to handle potential type mismatches
      const orgIdStr = String(formData.org_id);
      const filtered = campaigns.filter(campaign => {
        const campaignOrgIdStr = String(campaign.org_id);
        const matches = campaignOrgIdStr === orgIdStr;
        return matches;
      });
      
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
      
      toast({
        title: "File Selected",
        description: `${selectedFile.name} has been selected`,
      });
    }
  };

  const handleInputChange = (field: string, value: string) => {
    // Trim the value to remove leading/trailing whitespace
    const trimmedValue = value.trim();
    
    setFormData(prev => {
      const newData = { ...prev, [field]: trimmedValue };
      return newData;
    });
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
     if (isNaN(channels) || channels < 1) {
       toast({
         title: "Invalid Channels",
         description: "Number of channels must be at least 1",
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
        sleep_seconds: Math.max(1, Math.min(3600, parseInt(formData.sleep_seconds) || 100)), // Ensure value is between 1-3600
        operation_name: formData.operation_name.trim() || undefined // Include operation name if provided
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

      // Use RabbitMQ API if enabled, otherwise use legacy API
      const response = useRabbitMQ 
        ? await startBatchCallWithRabbitMQ(request)
        : await startBatchCall(request);
      
      toast({
        title: "Upload Successful",
        description: response.message,
      });

      // Start polling for status updates (only if not already polling)
      if (!isPolling) {
        startPolling(response.bulk_operation_id);
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
      stopPolling();
    }
    
    setIsPolling(true);
    
    const cleanup = pollOperationStatus(
      operationId,
      (status) => {
        setCurrentOperation(status);
        
        // Stop polling if operation is complete
        if (status.status === 'completed' || status.status === 'failed' || status.status === 'cancelled') {
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
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    setIsPolling(false);
  };

  // Cleanup polling on unmount or when operation changes
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, []);

  // Additional cleanup when currentOperation changes
  useEffect(() => {
    if (currentOperation && (currentOperation.status === 'completed' || currentOperation.status === 'failed' || currentOperation.status === 'cancelled')) {
      stopPolling();
    }
  }, [currentOperation]);

  // Handler functions for operation control
  const handlePauseOperation = async (operationId: string) => {
    try {
      let response;
      if (useRabbitMQ) {
        // Use RabbitMQ API for pause
        const result = await pauseRabbitMQOperation(operationId);
        toast({
          title: "Operation Paused",
          description: result.message || "RabbitMQ operation paused successfully.",
        });
      } else {
        // Use legacy API for pause
        response = await authorizedFetch(`/bulk-calls/operations/${operationId}/pause`, { method: 'POST' });
        if (response.ok) {
          toast({
            title: "Operation Paused",
            description: "Batch operation paused successfully.",
          });
        } else {
          const errorData = await response.json() as any;
          toast({
            title: "Pause Failed",
            description: errorData.detail || "Failed to pause operation.",
            variant: "destructive",
          });
        }
      }
      // Refresh status after pausing
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
      let response;
      if (useRabbitMQ) {
        // Use RabbitMQ API for resume
        const result = await resumeRabbitMQOperation(operationId);
        toast({
          title: "Operation Resumed",
          description: result.message || "RabbitMQ operation resumed successfully.",
        });
      } else {
        // Use legacy API for resume
        response = await authorizedFetch(`/bulk-calls/operations/${operationId}/resume`, { method: 'POST' });
        if (response.ok) {
          toast({
            title: "Operation Resumed",
            description: "Batch operation resumed successfully.",
          });
        } else {
          const errorData = await response.json() as any;
          toast({
            title: "Resume Failed",
            description: errorData.detail || "Failed to resume operation.",
            variant: "destructive",
          });
        }
      }
      // Refresh status after resuming
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
    if (window.confirm('Are you sure you want to cancel this batch operation? This action cannot be undone.')) {
      try {
        let response;
        if (useRabbitMQ) {
          // Use RabbitMQ API for delete/cancel
          const result = await deleteRabbitMQOperation(operationId);
          toast({
            title: "Operation Deleted",
            description: result.message || "RabbitMQ operation deleted successfully.",
          });
        } else {
          // Use legacy API for cancel
          response = await authorizedFetch(`/bulk-calls/operations/${operationId}/cancel`, { method: 'POST' });
          if (response.ok) {
            toast({
              title: "Operation Cancelled",
              description: "Batch operation cancelled successfully.",
            });
          } else {
            const errorData = await response.json() as any;
            toast({
              title: "Cancel Failed",
              description: errorData.detail || "Failed to cancel operation.",
              variant: "destructive",
            });
          }
        }
        // Refresh status after cancelling
        handleCheckStatus(operationId);
      } catch (error) {
        console.error('Error cancelling operation:', error);
        toast({
          title: "Cancel Failed",
          description: "Failed to cancel operation. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleCheckStatus = async (operationId: string) => {
    try {
      const response = await authorizedFetch(`/bulk-calls/operations/${operationId}/check-status`);
      if (response.ok) {
        const data = await response.json() as any;
        
        // Ensure the response has all required properties
        const status: BatchCallOperation = {
          ...data,
          can_pause: data.can_pause || false,
          can_resume: data.can_resume || false,
          can_cancel: data.can_cancel || false,
          exists: data.exists || false,
          location: data.location || 'unknown',
          message: data.message || '',
          actions_available: data.actions_available || {
            pause: false,
            resume: false,
            cancel: false,
            view_status: true,
            view_calls: true
          }
        };
        
        setCurrentOperation(status);
        // If operation is completed, stop polling
        if (status.status === 'completed' || status.status === 'failed' || status.status === 'cancelled') {
          stopPolling();
        }
      } else {
        const errorData = await response.json() as any;
        console.error('Error fetching status:', errorData);
        toast({
          title: "Status Check Failed",
          description: errorData.detail || "Failed to check operation status.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching status:', error);
      toast({
        title: "Status Check Failed",
        description: "Failed to check operation status. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Comprehensive status checking with fallback strategy
  const checkOperationStatus = async (operationId: string, source: 'check-status' | 'status' | 'db-status' = 'status') => {
    try {
      let endpoint = '';
      switch (source) {
        case 'check-status':
          endpoint = `/bulk-calls/operations/${operationId}/check-status`;
          break;
        case 'status':
          endpoint = `/bulk-calls/operations/${operationId}/check-status`;
          break;
        case 'db-status':
          endpoint = `/bulk-calls/operations/${operationId}/db-status`;
          break;
      }
      
      const response = await authorizedFetch(endpoint);
      if (response.ok) {
        const data = await response.json();
        
        if (source === 'check-status') {
          // Handle capabilities response
          const capabilitiesData = data as any; // Type cast to access properties
          const capabilities = [];
          if (capabilitiesData.can_pause) capabilities.push('Pause');
          if (capabilitiesData.can_resume) capabilities.push('Resume');
          if (capabilitiesData.can_cancel) capabilities.push('Cancel');
          
          toast({
            title: "Capabilities Check",
            description: `Available actions: ${capabilities.join(', ') || 'None'}`,
          });
          
          return { success: true, data: capabilitiesData, type: 'capabilities' };
        } else {
          // Handle status response
          const status = data as BatchCallOperation;
          setCurrentOperation(status);
          setLastStatusCheck(new Date());
          
          // If operation is completed, stop polling
          if (status.status === 'completed' || status.status === 'failed' || status.status === 'cancelled') {
            stopPolling();
          }
          
          return { success: true, data: status, type: 'status' };
        }
      } else {
        const errorData = await response.json() as any;
        console.error(`Error fetching ${source}:`, errorData);
        return { success: false, error: errorData.detail || `Failed to fetch ${source}` };
      }
    } catch (error) {
      console.error(`Error in ${source} check:`, error);
      return { success: false, error: `Failed to check ${source}` };
    }
  };

  // Enhanced status check with smart fallback
  const smartStatusCheck = async (operationId: string) => {
    // First try real-time status from memory
    let result = await checkOperationStatus(operationId, 'status');
    if (result.success) {
      toast({
        title: "Status Updated",
        description: `Operation status: ${(result.data as BatchCallOperation).status}`,
      });
      return;
    }
    
    // If memory status fails, try database status
    result = await checkOperationStatus(operationId, 'db-status');
    if (result.success) {
      toast({
        title: "Status Updated (Database)",
        description: `Operation status: ${(result.data as BatchCallOperation).status}`,
      });
      return;
    }
    
    // If both fail, try capabilities check
    result = await checkOperationStatus(operationId, 'check-status');
    if (result.success) {
      const capabilitiesData = result.data as any;
      toast({
        title: "Capabilities Check",
        description: `Operation exists but status unavailable. Available actions: ${capabilitiesData.can_pause ? 'Pause' : ''} ${capabilitiesData.can_resume ? 'Resume' : ''} ${capabilitiesData.can_cancel ? 'Cancel' : ''}`.trim(),
      });
      return;
    }
    
    // All checks failed
    toast({
      title: "Status Check Failed",
      description: "Unable to retrieve operation status from any source.",
      variant: "destructive",
    });
  };

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
                className="cursor-pointer w-full min-w-0 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 file:flex-shrink-0"
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
            {loading && (
              <div className="flex items-center justify-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <RefreshCw className="h-5 w-5 mr-2 animate-spin text-blue-600" />
                <span className="text-blue-600">Loading campaigns and organizations...</span>
              </div>
            )}
            {apiError && (
              <div className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 mr-2 text-red-600 flex-shrink-0" />
                  <span className="text-red-600 text-sm">{apiError}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setApiError(null);
                    setLoading(true);
                    // Trigger a re-fetch
                    const fetchData = async () => {
                      try {
                        let campaignsUrl = '/campaigns/';
                        let orgsUrl = '/organizations/';
                        
                        if (!isSuperUser && userData?.org_id) {
                          campaignsUrl += `?org_id=${userData.org_id}`;
                        }
                        
                        const [campaignsRes, orgsRes] = await Promise.all([
                          authorizedFetch(campaignsUrl),
                          authorizedFetch(orgsUrl)
                        ]);

                        if (campaignsRes.ok) {
                          const campaignsData = await campaignsRes.json() as Campaign[];
                          setCampaigns(campaignsData);
                          setApiError(null);
                        } else {
                          setApiError(`Failed to load campaigns (${campaignsRes.status})`);
                        }

                        if (orgsRes.ok) {
                          const orgsData = await orgsRes.json() as any[];
                          setOrganizations(orgsData);
                          
                          if (!isSuperUser && userData?.org_id) {
                            const userOrg = orgsData.find(org => org.id === userData.org_id);
                            if (userOrg) {
                              setFormData(prev => ({ ...prev, org_id: userOrg.id }));
                            }
                          }
                          setApiError(null);
                        } else {
                          setApiError(`Failed to load organizations (${orgsRes.status})`);
                        }
                      } catch (error) {
                        console.error('Error refreshing data:', error);
                        setApiError('Failed to refresh data');
                      } finally {
                        setLoading(false);
                      }
                    };
                    
                    fetchData();
                  }}
                  disabled={loading}
                  className="text-red-600 border-red-200 hover:bg-red-100"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Retry
                </Button>
              </div>
            )}
            {/* API Selection */}
            <div className="space-y-2">
              <Label>API Backend</Label>
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="api-backend"
                    checked={useRabbitMQ}
                    onChange={() => setUseRabbitMQ(true)}
                    className="text-blue-600"
                  />
                  <span className="text-sm font-medium">RabbitMQ (Recommended)</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="api-backend"
                    checked={!useRabbitMQ}
                    onChange={() => setUseRabbitMQ(false)}
                    className="text-blue-600"
                  />
                  <span className="text-sm font-medium">Legacy API</span>
                </label>
              </div>
              <p className="text-xs text-muted-foreground">
                {useRabbitMQ 
                  ? "Using enhanced RabbitMQ backend with real-time monitoring and advanced controls"
                  : "Using legacy API backend for compatibility"
                }
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="operation_name">Operation Name</Label>
              <Input
                id="operation_name"
                type="text"
                value={formData.operation_name}
                onChange={(e) => handleInputChange('operation_name', e.target.value)}
                placeholder="Enter a name for this operation (optional)"
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">Give your operation a descriptive name for easier tracking</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="org_id">Organization *</Label>
                <Select value={formData.org_id} onValueChange={(value) => {
                  handleInputChange('org_id', value);
                }}>
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
                <Select value={formData.campaign_id} onValueChange={(value) => {
                  handleInputChange('campaign_id', value);
                }} disabled={!formData.org_id}>
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
                <Input
                  id="channels"
                  type="number"
                  min="1"
                  max="100"
                  value={formData.channels}
                  onChange={(e) => handleInputChange('channels', e.target.value)}
                  placeholder="1"
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">Number of parallel channels for processing calls (1-100)</p>
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
                  Starting {useRabbitMQ ? 'RabbitMQ' : 'Legacy'} Batch Operation...
                </>
              ) : (
                <>
                  <Upload className="h-5 w-5 mr-3" />
                  Start {useRabbitMQ ? 'RabbitMQ' : 'Legacy'} Batch Operation
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
                {currentOperation.operation_name && (
                  <p className="text-sm font-medium text-blue-700">
                    Name: {currentOperation.operation_name}
                  </p>
                )}
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
                <div className="text-lg font-bold text-blue-600">{currentOperation.expected_total_calls || currentOperation.total_calls || 0}</div>
                <div className="text-xs text-blue-600 font-medium">Expected Calls</div>
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
                  {useRabbitMQ ? 'Delete' : 'Cancel'}
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
                {currentOperation.message && (
                  <p className="mt-1 text-blue-700 font-medium">{currentOperation.message}</p>
                )}
              </div>

              {/* Last Status Check */}
              {lastStatusCheck && (
                <div className="text-xs text-blue-500 text-center">
                  Last updated: {lastStatusCheck.toLocaleTimeString()}
                </div>
              )}
            </div>
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
