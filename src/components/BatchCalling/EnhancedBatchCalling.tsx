import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { authorizedFetch } from '../../lib/api';
import { 
  createUnifiedBatchOperation,
  getUnifiedOperationStatus,
  pauseUnifiedOperation,
  resumeUnifiedOperation,
  cancelUnifiedOperation
} from '@/lib/unifiedBatchCallingApi';
import { BatchMonitorDashboard } from './BatchMonitorDashboard';
import { Upload, Loader2, FileSpreadsheet } from 'lucide-react';

const EnhancedBatchCalling: React.FC = () => {
  const { toast } = useToast();
  
  // Form state
  const [orgs, setOrgs] = useState<Array<{ id: string; name: string }>>([]);
  const [campaigns, setCampaigns] = useState<Array<{ id: string; name: string; org_id: string }>>([]);
  const [orgId, setOrgId] = useState('');
  const [campaignId, setCampaignId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [starting, setStarting] = useState(false);
  
  // Configuration
  const [batchName, setBatchName] = useState('');
  const [sleepSeconds, setSleepSeconds] = useState('5');
  const [workerChannels, setWorkerChannels] = useState('16');
  
  // Operation tracking
  const [currentOperation, setCurrentOperation] = useState<any>(null);
  const [recentOperations, setRecentOperations] = useState<any[]>([]);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [orgRes, campRes] = await Promise.all([
          authorizedFetch('/organizations'),
          authorizedFetch('/campaigns/')
        ]);
        
        if (orgRes.ok) setOrgs(await orgRes.json());
        if (campRes.ok) setCampaigns(await campRes.json());
      } catch (error) {
        console.error('Failed to load data:', error);
      }
    };
    
    loadData();
  }, []);

  // Poll for operation status
  const pollOperationStatus = async (operationId: string) => {
    try {
      const response = await getUnifiedOperationStatus(operationId);
      if (response.data) {
        setCurrentOperation(response.data);
        
        // Stop polling if operation is complete
        if (['completed', 'failed', 'cancelled'].includes(response.data.status)) {
          if (pollingInterval) {
            clearInterval(pollingInterval);
            setPollingInterval(null);
          }
          // Move to recent operations
          setRecentOperations(prev => [response.data, ...prev.slice(0, 9)]);
          setCurrentOperation(null);
        }
      }
    } catch (error) {
      console.error('Failed to poll status:', error);
    }
  };

  // Start polling when operation starts
  useEffect(() => {
    if (currentOperation && ['starting', 'processing'].includes(currentOperation.status)) {
      const interval = setInterval(() => {
        pollOperationStatus(currentOperation.bulk_operation_id);
      }, 3000);
      setPollingInterval(interval);
      return () => clearInterval(interval);
    }
  }, [currentOperation?.bulk_operation_id, currentOperation?.status]);

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const authToken = localStorage.getItem('authToken');
    const userDataRaw = localStorage.getItem('userData');
    
    if (!authToken) {
      toast({
        title: 'Not Logged In',
        description: 'Please log in to use batch calling feature.',
        variant: 'destructive'
      });
      return;
    }
    
    if (!orgId || !campaignId || !file) {
      toast({
        title: 'Missing Information',
        description: 'Please select organization, campaign, and upload Excel file',
        variant: 'destructive'
      });
      return;
    }

    setStarting(true);
    try {
      const userData = userDataRaw ? JSON.parse(userDataRaw) : null;
      const userId = userData?.id || userData?.user_id || 'unknown';
      
      if (userId === 'unknown') {
        toast({
          title: 'Authentication Error',
          description: 'Unable to identify user. Please log in again.',
          variant: 'destructive'
        });
        return;
      }

      const result = await createUnifiedBatchOperation(
        file,
        {
          org_id: orgId,
          campaign_id: campaignId,
          user_id: userId,
          operation_name: batchName || `Batch ${new Date().toLocaleString()}`,
          sleep_seconds: parseInt(sleepSeconds),
          channels: parseInt(workerChannels),
          worker_prefetch: 5,
          batch_size: 50
        },
        'rabbitmq'
      );

      toast({
        title: 'Batch Operation Started',
        description: `Processing ${result.total_calls} calls`,
      });

      setCurrentOperation(result);
      
      // Reset form
      setFile(null);
      setBatchName('');
      
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to start batch operation',
        variant: 'destructive'
      });
    } finally {
      setStarting(false);
    }
  };

  const handlePause = async (operationId: string) => {
    try {
      await pauseUnifiedOperation(operationId);
      toast({ title: 'Operation Paused' });
      pollOperationStatus(operationId);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleResume = async (operationId: string) => {
    try {
      await resumeUnifiedOperation(operationId);
      toast({ title: 'Operation Resumed' });
      pollOperationStatus(operationId);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleStop = async (operationId: string) => {
    try {
      await cancelUnifiedOperation(operationId);
      toast({ title: 'Operation Stopped', variant: 'destructive' });
      pollOperationStatus(operationId);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleRefresh = () => {
    if (currentOperation) {
      pollOperationStatus(currentOperation.bulk_operation_id);
    }
  };

  const filteredCampaigns = orgId 
    ? campaigns.filter(c => c.org_id === orgId)
    : campaigns;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Batch Calling</h1>
          <p className="text-muted-foreground">Start and monitor bulk call operations with real-time tracking</p>
        </div>
      </div>

      {/* Monitor Dashboard - Shows when operation is active */}
      {(currentOperation || recentOperations.length > 0) && (
        <BatchMonitorDashboard
          currentOperation={currentOperation}
          recentOperations={recentOperations}
          onRefresh={handleRefresh}
          onPause={handlePause}
          onResume={handleResume}
          onStop={handleStop}
        />
      )}

      {/* Start New Batch Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Start New Batch Operation
          </CardTitle>
          <CardDescription>
            Upload an Excel file and configure your batch calling operation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleStart} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Organization Select */}
              <div className="space-y-2">
                <Label htmlFor="org">Organization *</Label>
                <Select value={orgId} onValueChange={setOrgId}>
                  <SelectTrigger id="org">
                    <SelectValue placeholder="Select organization" />
                  </SelectTrigger>
                  <SelectContent>
                    {orgs.map(org => (
                      <SelectItem key={org.id} value={org.id}>
                        {org.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Campaign Select */}
              <div className="space-y-2">
                <Label htmlFor="campaign">Campaign *</Label>
                <Select value={campaignId} onValueChange={setCampaignId}>
                  <SelectTrigger id="campaign" disabled={!orgId}>
                    <SelectValue placeholder={orgId ? "Select campaign" : "Select organization first"} />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredCampaigns.map(camp => (
                      <SelectItem key={camp.id} value={camp.id}>
                        {camp.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Batch Name */}
              <div className="space-y-2">
                <Label htmlFor="batchName">Batch Name (Optional)</Label>
                <Input
                  id="batchName"
                  value={batchName}
                  onChange={(e) => setBatchName(e.target.value)}
                  placeholder="e.g., Morning Campaign Batch"
                />
              </div>

              {/* Sleep Seconds */}
              <div className="space-y-2">
                <Label htmlFor="sleep">Delay Between Calls (seconds)</Label>
                <Input
                  id="sleep"
                  type="number"
                  min="1"
                  max="60"
                  value={sleepSeconds}
                  onChange={(e) => setSleepSeconds(e.target.value)}
                />
              </div>

              {/* Worker Channels */}
              <div className="space-y-2">
                <Label htmlFor="channels">Worker Channels</Label>
                <Input
                  id="channels"
                  type="number"
                  min="1"
                  max="32"
                  value={workerChannels}
                  onChange={(e) => setWorkerChannels(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Higher values = faster processing (recommended: 16)
                </p>
              </div>

              {/* File Upload */}
              <div className="space-y-2">
                <Label htmlFor="file">Excel File *</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="file"
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="cursor-pointer"
                  />
                  {file && (
                    <FileSpreadsheet className="h-5 w-5 text-green-600" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Excel file with "Mobile Number" column
                </p>
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={starting || !orgId || !campaignId || !file}
              className="w-full md:w-auto"
              size="lg"
            >
              {starting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Starting Batch...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Start Batch Operation
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedBatchCalling;
