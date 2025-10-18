import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { authorizedFetch } from '../../lib/api';
import { 
  createUnifiedBatchOperation,
  getUnifiedOperationsSummary
} from '@/lib/unifiedBatchCallingApi';
import { Play, Upload, RefreshCw, Activity } from 'lucide-react';

interface FastBatchCallingProps {}

export const FastBatchCalling: React.FC<FastBatchCallingProps> = () => {
  const { toast } = useToast();
  
  // Core state
  const [orgs, setOrgs] = useState<Array<{ id: string; name: string }>>([]);
  const [campaigns, setCampaigns] = useState<Array<{ id: string; name: string; description?: string; org_id?: string }>>([]);
  const [orgId, setOrgId] = useState('default_org');
  const [campaignId, setCampaignId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [starting, setStarting] = useState(false);
  
  // Batch configuration
  const [batchName, setBatchName] = useState('');
  const [batchSize, setBatchSize] = useState('50');
  const [workerChannels, setWorkerChannels] = useState('16');
  const [workerPrefetch, setWorkerPrefetch] = useState('5');
  const [sleepSeconds, setSleepSeconds] = useState('5');
  
  // Summary state (lightweight)
  const [summary, setSummary] = useState({
    active: 0,
    total: 0,
    completed: 0,
    failed: 0,
    pending: 0
  });
  
  
  const [loading, setLoading] = useState(false);
  const lastFetchRef = useRef(0);
  const FETCH_COOLDOWN = 15000; // 15 seconds

  // Load initial data once
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        console.log('🔄 Loading organizations and campaigns from API...');
        
        // Try to load organizations from API
        try {
          const orgRes = await authorizedFetch('/organizations/');
          console.log('📊 Organizations response:', orgRes.status, orgRes.ok);
          
          if (orgRes.ok) {
            const orgData = await orgRes.json();
            console.log('✅ Organizations loaded from API:', orgData);
            setOrgs(orgData.map((org: any) => ({ id: org.id, name: org.name })));
          } else {
            console.warn('⚠️ Failed to load organizations from API:', orgRes.status);
            // Fallback to default organization
            setOrgs([{ id: 'default_org', name: 'Default Organization' }]);
          }
        } catch (orgError) {
          console.warn('⚠️ Organizations API call failed:', orgError);
          setOrgs([{ id: 'default_org', name: 'Default Organization' }]);
        }
        
        // Try to load campaigns from API
        try {
          const campRes = await authorizedFetch('/campaigns/');
          console.log('📊 Campaigns response:', campRes.status, campRes.ok);
          
          if (campRes.ok) {
            const campData = await campRes.json();
            console.log('✅ Campaigns loaded from API:', campData);
            setCampaigns(campData.map((camp: any) => ({ 
              id: camp.id, 
              name: camp.name, 
              description: camp.description,
              org_id: camp.org_id 
            })));
          } else {
            console.warn('⚠️ Failed to load campaigns from API:', campRes.status);
            // Fallback to database campaign
            setCampaigns([
              { id: 'cf821e28-bae9-4500-93bf-2d755c7d0b7c', name: 'Default Campaign', description: 'Default campaign for testing', org_id: 'org_3966895b' }
            ]);
          }
        } catch (campError) {
          console.warn('⚠️ Campaigns API call failed:', campError);
          // Fallback to database campaign
          setCampaigns([
            { id: 'cf821e28-bae9-4500-93bf-2d755c7d0b7c', name: 'Default Campaign', description: 'Default campaign for testing', org_id: 'org_3966895b' }
          ]);
        }
        
      } catch (e) {
        console.warn('❌ Failed to load initial data:', e);
        // Final fallback
        setOrgs([{ id: 'default_org', name: 'Default Organization' }]);
        setCampaigns([
          { id: 'cf821e28-bae9-4500-93bf-2d755c7d0b7c', name: 'Default Campaign', description: 'Default campaign for testing', org_id: 'org_3966895b' }
        ]);
      }
    };
    
    loadInitialData();
  }, []);

  // Fast data fetching with cooldown
  const fetchData = async () => {
    const now = Date.now();
    if (now - lastFetchRef.current < FETCH_COOLDOWN) return;
    
    lastFetchRef.current = now;
    setLoading(true);
    
    try {
      const [summaryRes, opsRes] = await Promise.all([
        getUnifiedOperationsSummary(),
        getUnifiedOperationsList({ limit: 5 })
      ]);
      
      if (summaryRes) {
        setSummary({
          active: summaryRes.operation_summary?.active || 0,
          total: summaryRes.operation_summary?.total || 0,
          completed: summaryRes.call_summary?.completed_calls || 0,
          failed: summaryRes.call_summary?.failed_calls || 0,
          pending: summaryRes.call_summary?.pending_calls || 0
        });
      }
      
      if (opsRes) {
        const recent = Object.entries(opsRes.operations || {})
          .slice(0, 5)
          .map(([id, op]: [string, any]) => ({
            id,
            status: op.status,
            progress: op.progress_percentage || 0,
            calls: `${op.completed_calls || 0}/${op.total_calls || 0}`,
            successful: op.successful_calls || 0,
            failed: op.failed_calls || 0,
            total: op.total_calls || 0,
            canPause: op.can_pause || false,
            canResume: op.can_resume || false,
            canCancel: op.can_cancel || false,
            startedAt: op.started_at,
            operationName: op.operation_name || `Operation ${id.slice(0, 8)}`
          }));
        setRecentOps(recent);
      }
    } catch (e) {
      console.warn('Failed to fetch data:', e);
    } finally {
      setLoading(false);
    }
  };

  // Initial load and periodic refresh
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // 30s refresh
    return () => clearInterval(interval);
  }, []);

  // Start batch operation
  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Debug authentication status
    const authToken = localStorage.getItem('authToken');
    const userData = localStorage.getItem('userData');
    console.log('🔍 Authentication Status Check:');
    console.log('  Auth Token:', authToken ? 'Present' : 'Missing');
    console.log('  User Data:', userData ? 'Present' : 'Missing');
    
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
      // Get user ID from localStorage
      const authToken = localStorage.getItem('authToken');
      const userDataRaw = localStorage.getItem('userData');
      
      console.log('🔍 Debug - Auth Token:', authToken ? 'Present' : 'Missing');
      console.log('🔍 Debug - User Data Raw:', userDataRaw);
      
      if (!authToken) {
        toast({
          title: 'Not Logged In',
          description: 'Please log in to use batch calling feature.',
          variant: 'destructive'
        });
        return;
      }
      
      const userData = userDataRaw 
        ? JSON.parse(userDataRaw)
        : null;
      
      console.log('🔍 Debug - User Data Parsed:', userData);
      
      const userId = userData?.id || userData?.user_id || 'unknown';
      
      console.log('🔍 Debug - Final User ID:', userId);
      
      if (userId === 'unknown') {
        console.error('❌ User ID is unknown. User data:', userData);
        toast({
          title: 'Authentication Error',
          description: 'Unable to identify user. Please log in again.',
          variant: 'destructive'
        });
        return;
      }
      
      await createUnifiedBatchOperation(
        file,
        {
          org_id: 'org_3966895b', // Use a consistent org_id for the database
          campaign_id: campaignId,
          user_id: userId,
          operation_name: batchName || `Batch ${new Date().toLocaleString()}`,
          sleep_seconds: parseInt(sleepSeconds),
          channels: parseInt(workerChannels),
          worker_prefetch: parseInt(workerPrefetch),
          batch_size: parseInt(batchSize)
        },
        'rabbitmq'
      );
      
      toast({
        title: 'Batch Started',
        description: 'Your batch operation has started successfully'
      });
      
      // Reset form
      setFile(null);
      setOrgId('');
      setCampaignId('');
      setBatchName('');
      
      // Refresh data
      lastFetchRef.current = 0;
      fetchData();
      
    } catch (error: any) {
      toast({
        title: 'Start Failed',
        description: error.message || 'Failed to start batch operation',
        variant: 'destructive'
      });
    } finally {
      setStarting(false);
    }
  };

  // Operation controls

  // Filter campaigns based on selected organization
  const filteredCampaigns = campaigns.filter(campaign => {
    // If no organization is selected, show all campaigns
    if (!orgId || orgId === 'default_org') {
      return true;
    }
    
    // Filter campaigns by organization ID
    // Campaigns now have org_id field that matches the selected organization
    const matches = campaign.org_id === orgId;
    console.log(`Campaign ${campaign.name} (org: ${campaign.org_id}) matches ${orgId}: ${matches}`);
    return matches;
  });
  
  console.log(`Filtered campaigns: ${filteredCampaigns.length} out of ${campaigns.length} campaigns for org ${orgId}`);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        {/* Enhanced Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Activity className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Batch Calling
                  </h1>
                  <p className="text-gray-600">Start and monitor bulk call operations with ease</p>
                </div>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button 
                onClick={() => { lastFetchRef.current = 0; fetchData(); }} 
                disabled={loading}
                variant="outline"
                size="sm"
                className="shadow-sm hover:shadow-md transition-shadow"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button 
                onClick={() => {
                  console.log('🔍 Current state:');
                  console.log('  Organizations:', orgs);
                  console.log('  Campaigns:', campaigns);
                  console.log('  Selected Org ID:', orgId);
                  console.log('  Selected Campaign ID:', campaignId);
                  console.log('  Filtered Campaigns:', filteredCampaigns);
                  console.log('  Campaign details:', campaigns.map(c => ({ id: c.id, name: c.name, description: c.description })));
                }}
                variant="outline"
                size="sm"
                className="shadow-sm hover:shadow-md transition-shadow"
              >
                Debug
              </Button>
            </div>
          </div>
        </div>

        {/* Enhanced Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-green-50 to-emerald-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-green-700 uppercase tracking-wide">Active</p>
                  <p className="text-3xl font-bold text-green-600">{summary.active}</p>
                  <p className="text-xs text-green-600 font-medium">{summary.total} total operations</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <Activity className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-blue-50 to-cyan-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-blue-700 uppercase tracking-wide">Completed</p>
                  <p className="text-3xl font-bold text-blue-600">{summary.completed}</p>
                  <p className="text-xs text-blue-600 font-medium">successful calls</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Activity className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-red-50 to-pink-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-red-700 uppercase tracking-wide">Failed</p>
                  <p className="text-3xl font-bold text-red-600">{summary.failed}</p>
                  <p className="text-xs text-red-600 font-medium">failed calls</p>
                </div>
                <div className="p-3 bg-red-100 rounded-full">
                  <Activity className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-orange-50 to-amber-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-orange-700 uppercase tracking-wide">Pending</p>
                  <p className="text-3xl font-bold text-orange-600">{summary.pending}</p>
                  <p className="text-xs text-orange-600 font-medium">queued calls</p>
                </div>
                <div className="p-3 bg-orange-100 rounded-full">
                  <Activity className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Start New Batch Form */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center text-xl">
              <div className="p-2 bg-white/20 rounded-lg mr-3">
                <Upload className="h-6 w-6" />
              </div>
              Start New Batch
            </CardTitle>
            <p className="text-blue-100 mt-2">Configure and launch your batch calling operation</p>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleStart} className="space-y-8">
              {/* Basic Configuration */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                  Basic Configuration
                </h3>
                <div className="grid gap-6 md:grid-cols-3">
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold text-gray-700">Organization</Label>
                    <Select value={orgId} onValueChange={(v) => { 
                      setOrgId(v); 
                      setCampaignId(''); // Reset campaign selection when organization changes
                      console.log('Organization changed to:', v);
                    }}>
                      <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-blue-500 transition-colors">
                        <SelectValue placeholder={orgs.length > 0 ? "Select organization" : "Loading organizations..."} />
                      </SelectTrigger>
                      <SelectContent>
                        {orgs.length > 0 ? (
                          orgs.map(org => (
                            <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                          ))
                        ) : (
                          <SelectItem value="loading" disabled>Loading organizations...</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    {orgs.length > 0 && (
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-green-600">✅ {orgs.length} organizations loaded</p>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => {
                            console.log('🔄 Retrying organizations API call...');
                            authorizedFetch('/organizations/')
                              .then(res => {
                                if (res.ok) {
                                  return res.json();
                                }
                                throw new Error(`API returned ${res.status}`);
                              })
                              .then(data => {
                                console.log('✅ Organizations retry successful:', data);
                                setOrgs(data.map((org: any) => ({ id: org.id, name: org.name })));
                              })
                              .catch(err => {
                                console.error('❌ Organizations retry failed:', err);
                              });
                          }}
                          className="text-xs h-6 px-2"
                        >
                          Retry
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold text-gray-700">Campaign</Label>
                    <Select value={campaignId} onValueChange={setCampaignId}>
                      <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-blue-500 transition-colors">
                        <SelectValue placeholder={
                          filteredCampaigns.length > 0 ? "Select campaign" : 
                          "Loading campaigns..."
                        } />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredCampaigns.length > 0 ? (
                          filteredCampaigns.map(campaign => (
                            <SelectItem key={campaign.id} value={campaign.id}>
                              <div>
                                <div className="font-medium">{campaign.name}</div>
                                {campaign.description && (
                                  <div className="text-xs text-gray-500">{campaign.description}</div>
                                )}
                              </div>
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="loading" disabled>Loading campaigns...</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    {filteredCampaigns.length > 0 && (
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-green-600">
                          ✅ {filteredCampaigns.length} campaigns loaded
                          {orgId && orgId !== 'default_org' && ` (filtered by organization)`}
                        </p>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => {
                            console.log('🔄 Retrying campaigns API call...');
                            authorizedFetch('/campaigns/')
                              .then(res => {
                                if (res.ok) {
                                  return res.json();
                                }
                                throw new Error(`API returned ${res.status}`);
                              })
                              .then(data => {
                                console.log('✅ Campaigns retry successful:', data);
                                setCampaigns(data.map((camp: any) => ({ 
                                  id: camp.id, 
                                  name: camp.name, 
                                  description: camp.description,
                                  org_id: camp.org_id 
                                })));
                              })
                              .catch(err => {
                                console.error('❌ Campaigns retry failed:', err);
                              });
                          }}
                          className="text-xs h-6 px-2"
                        >
                          Retry
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold text-gray-700">Batch Name (Optional)</Label>
                    <Input
                      value={batchName}
                      onChange={(e) => setBatchName(e.target.value)}
                      placeholder="Enter batch name"
                      className="h-12 border-2 border-gray-200 focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* File Upload */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <div className="w-2 h-2 bg-green-600 rounded-full mr-3"></div>
                  Upload Excel File
                </h3>
                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-gray-700">Excel File</Label>
                  <div className="relative">
                    <Input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                      className="h-12 border-2 border-dashed border-gray-300 focus:border-blue-500 transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>
                  <p className="text-xs text-gray-500">Supported formats: .xlsx, .xls</p>
                </div>
              </div>

              {/* Advanced Configuration */}
              <div className="space-y-6 border-t border-gray-200 pt-8">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <div className="w-2 h-2 bg-purple-600 rounded-full mr-3"></div>
                  Advanced Configuration
                </h3>
                <div className="grid gap-6 md:grid-cols-4">
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold text-gray-700">Batch Size</Label>
                    <Input
                      type="number"
                      min="1"
                      max="100"
                      value={batchSize}
                      onChange={(e) => setBatchSize(e.target.value)}
                      placeholder="50"
                      className="h-12 border-2 border-gray-200 focus:border-blue-500 transition-colors"
                    />
                    <p className="text-xs text-gray-500 font-medium">Calls per batch</p>
                  </div>
                  
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold text-gray-700">Worker Channels</Label>
                    <Input
                      type="number"
                      min="1"
                      max="32"
                      value={workerChannels}
                      onChange={(e) => setWorkerChannels(e.target.value)}
                      placeholder="16"
                      className="h-12 border-2 border-gray-200 focus:border-blue-500 transition-colors"
                    />
                    <p className="text-xs text-gray-500 font-medium">Parallel workers</p>
                  </div>
                  
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold text-gray-700">Worker Prefetch</Label>
                    <Input
                      type="number"
                      min="1"
                      max="50"
                      value={workerPrefetch}
                      onChange={(e) => setWorkerPrefetch(e.target.value)}
                      placeholder="5"
                      className="h-12 border-2 border-gray-200 focus:border-blue-500 transition-colors"
                    />
                    <p className="text-xs text-gray-500 font-medium">Tasks per worker</p>
                  </div>
                  
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold text-gray-700">Sleep Seconds</Label>
                    <Input
                      type="number"
                      min="1"
                      max="300"
                      value={sleepSeconds}
                      onChange={(e) => setSleepSeconds(e.target.value)}
                      placeholder="5"
                      className="h-12 border-2 border-gray-200 focus:border-blue-500 transition-colors"
                    />
                    <p className="text-xs text-gray-500 font-medium">Delay between calls</p>
                  </div>
                </div>
              </div>
              
              {/* Enhanced Submit Button */}
              <div className="flex justify-center pt-6">
                <Button 
                  type="submit" 
                  disabled={starting || !orgId || !campaignId || !file}
                  className="h-14 px-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {starting ? (
                    <>
                      <Activity className="h-5 w-5 mr-3 animate-pulse" />
                      Starting Batch...
                    </>
                  ) : (
                    <>
                      <Play className="h-5 w-5 mr-3" />
                      Start Batch Operation
                    </>
                  )}
                </Button>
              </div>
          </form>
        </CardContent>
      </Card>
      </div>
    </div>
  );
};

export default FastBatchCalling;
