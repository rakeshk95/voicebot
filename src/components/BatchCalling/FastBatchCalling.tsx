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
  getUnifiedOperationsSummary,
  getUnifiedOperationsList
} from '@/lib/unifiedBatchCallingApi';
import { Play, Upload, RefreshCw, Activity, Download, FileSpreadsheet } from 'lucide-react';

interface FastBatchCallingProps {}

export const FastBatchCalling: React.FC<FastBatchCallingProps> = () => {
  const { toast } = useToast();
  
  // Core state
  const [orgs, setOrgs] = useState<Array<{ id: string; name: string }>>([]);
  const [campaigns, setCampaigns] = useState<Array<{ id: string; name: string; description?: string; org_id?: string }>>([]);
  const [orgId, setOrgId] = useState('');
  const [campaignId, setCampaignId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [starting, setStarting] = useState(false);
  
  // Batch configuration
  const [batchName, setBatchName] = useState('');
  const [batchSize, setBatchSize] = useState('50');
  const [workerChannels, setWorkerChannels] = useState('2');
  const [workerPrefetch, setWorkerPrefetch] = useState('1');
  const [sleepSeconds, setSleepSeconds] = useState('5');
  const [detectedRows, setDetectedRows] = useState<number | null>(null);
  
  // Summary state (lightweight)
  const [summary, setSummary] = useState({
    active: 0,
    total: 0,
    completed: 0,
    failed: 0,
    pending: 0
  });
  
  
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [recentOps, setRecentOps] = useState<any[]>([]);
  const lastFetchRef = useRef(0);
  const FETCH_COOLDOWN = 15000; // 15 seconds
  const [banner, setBanner] = useState<{ type: 'info' | 'success' | 'warning' | 'error'; message: string } | null>(null);
  const [webhookTesting, setWebhookTesting] = useState(false);
  const [isLiveRefreshing, setIsLiveRefreshing] = useState(false);

  // Optional webhook for notifications (provided by user)
  const WEBHOOK_URL = import.meta.env.VITE_WEBHOOK_URL || 'https://platform.voxiflow.com/backend/api/v1/webhook';
  const WEBHOOK_TOKEN = import.meta.env.VITE_WEBHOOK_TOKEN ? `Bearer ${import.meta.env.VITE_WEBHOOK_TOKEN}` : '';

  // Org/campaigns: loading/error state
  const [orgsLoading, setOrgsLoading] = useState(false);
  const [orgsError, setOrgsError] = useState<string | null>(null);
  const [campaignsLoading, setCampaignsLoading] = useState(false);
  const [campaignsError, setCampaignsError] = useState<string | null>(null);

  // Download Excel template for selected campaign
  const downloadTemplate = async () => {
    if (!campaignId) {
      toast({
        title: "No Campaign Selected",
        description: "Please select a campaign first to download its template.",
        variant: "destructive"
      });
      return;
    }

    setDownloadingTemplate(true);
    try {
      const response = await authorizedFetch(`/excel-template/campaigns/${campaignId}/excel-template`);
      
      if (!response.ok) {
        throw new Error('Failed to download template');
      }

      // Get filename from response headers or use default
      const contentDisposition = response.headers.get('content-disposition');
      let filename = 'batch_template.xlsx';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Template Downloaded",
        description: `Excel template for ${campaigns.find(c => c.id === campaignId)?.name || 'campaign'} has been downloaded successfully.`
      });

    } catch (error) {
      console.error('Error downloading template:', error);
      toast({
        title: "Download Failed",
        description: "Failed to download template. Please try again.",
        variant: "destructive"
      });
    } finally {
      setDownloadingTemplate(false);
    }
  };

  // Analyze Excel on file selection and auto-tune configuration
  useEffect(() => {
    if (!file) { setDetectedRows(null); return; }
    const analyze = async () => {
      try {
        const buf = await file.arrayBuffer();
        // dynamic import to keep bundle light
        const XLSX = await import('xlsx');
        const wb = XLSX.read(buf, { type: 'array' });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        const json = XLSX.utils.sheet_to_json(ws, { defval: '' });
        const rows = json.length;
        setDetectedRows(rows);

        // Auto-tune: conservative defaults that scale with size
        // baseline batch size 50
        const bs = Math.min(50, Math.max(10, Math.ceil(rows / 4)));
        // channels scale up but capped to 8
        const ch = Math.min(8, Math.max(2, Math.ceil(rows / 200)));
        // prefetch small for stability
        const pf = Math.min(5, Math.max(1, Math.ceil(rows / (ch * 200))));
        const sleep = rows > 2000 ? 8 : rows > 1000 ? 6 : 5;

        setBatchSize(String(bs));
        setWorkerChannels(String(ch));
        setWorkerPrefetch(String(pf));
        setSleepSeconds(String(sleep));

        toast({
          title: 'Excel analyzed',
          description: `Detected ${rows} rows. Auto-tuned config: batch=${bs}, channels=${ch}, prefetch=${pf}, sleep=${sleep}s. You can adjust before starting.`,
        });
      } catch (e) {
        console.warn('Failed to analyze Excel, keeping defaults', e);
      }
    };
    analyze();
  }, [file]);

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
          .map(([id, op]: [string, any]) => ({ id, ...op }));
        setRecentOps(recent);

        // Update banner with most recent op status
        if (recent.length > 0) {
          const r = recent[0];
          const status = (r.status || '').toUpperCase();
          const total = r.total_calls ?? r.expected_total_calls ?? 0;
          const done = r.completed_calls ?? 0;
          const progress = r.progress_percentage ?? (total > 0 ? Math.round((done / total) * 100) : 0);
          const text = `Latest operation ${r.operation_name || r.id.slice(-8)}: ${status} — ${done} / ${total} (${progress}% complete)`;
          if (status === 'STARTING' || status === 'PROCESSING') setBanner({ type: 'info', message: text });
          else if (status === 'COMPLETED') setBanner({ type: 'success', message: text });
          else if (status === 'FAILED' || status === 'CANCELLED') setBanner({ type: 'error', message: text });
          else setBanner({ type: 'warning', message: text });
        }
      }
      
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Start batch operation
  const startBatchOperation = async () => {
    if (!orgId || !campaignId || !file || !batchName.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please select organization, campaign, enter batch name, and upload Excel file',
        variant: 'destructive'
      });
      return;
    }

    // Check if file is selected
    if (!file) {
      toast({
        title: 'No File Selected',
        description: 'Please select an Excel file to upload',
        variant: 'destructive'
      });
      return;
    }

    setStarting(true);
    
    try {
      const userId = localStorage.getItem('userId') || 'user_1';
      
      const result = await createUnifiedBatchOperation(
        file,
        {
          org_id: orgId,
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
      
      // result is the JSON payload from backend
      const opName = (result as any).operation_name || 'Batch Operation';
      toast({
        title: 'Batch Operation Started',
        description: `Operation "${opName}" has been queued successfully.`,
      });

      // Show live banner and short-interval polling for 30s
      setBanner({ type: 'info', message: `Starting ${opName}… polling for status` });
      setIsLiveRefreshing(true);
      const startedAt = Date.now();
      const liveTimer = setInterval(async () => {
        await fetchData();
        if (Date.now() - startedAt > 30000) {
          clearInterval(liveTimer);
          setIsLiveRefreshing(false);
        }
      }, 3000);

      // Optional: notify external webhook "batch_started"
      try {
        await fetch(WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': WEBHOOK_TOKEN },
          body: JSON.stringify({ event: 'batch_started', data: { operation_name: opName, campaign_id: campaignId, org_id: orgId, timestamp: new Date().toISOString() } })
        });
      } catch {}
      
      // Reset form
      setFile(null);
      setOrgId('');
      setCampaignId('');
      setBatchName('');
      
      // Refresh data
      lastFetchRef.current = 0; // Reset cooldown
      fetchData();
      
    } catch (error) {
      console.error('Error starting batch operation:', error);
      toast({
        title: 'Operation Failed',
        description: error instanceof Error ? error.message : 'Failed to start batch operation',
        variant: 'destructive'
      });
    } finally {
      setStarting(false);
    }
  };

  const testWebhook = async () => {
    setWebhookTesting(true);
    try {
      const resp = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': WEBHOOK_TOKEN },
        body: JSON.stringify({
          event: 'test',
          data: {
            call_id: '123e4567-e89b-12d3-a456-426614174000',
            status: 'initiated',
            timestamp: new Date().toISOString()
          }
        })
      });
      toast({ title: 'Webhook', description: `Test webhook sent: ${resp.status} ${resp.ok ? 'OK' : ''}` });
    } catch (e: any) {
      toast({ title: 'Webhook failed', description: e?.message || 'Unknown error', variant: 'destructive' });
    } finally {
      setWebhookTesting(false);
    }
  };

  // Filter campaigns by organization (ensure single declaration)
  const filteredCampaigns = campaigns.filter(campaign => 
    !orgId || orgId === 'default_org' || campaign.org_id === orgId
  );

  // Load initial data once, with retry logic
  useEffect(() => {
    const loadInitialData = async () => {
      setOrgsLoading(true); setOrgsError(null);
      setCampaignsLoading(true); setCampaignsError(null);
      try {
        // Orgs
        try {
          const orgRes = await authorizedFetch('/organizations/');
          if (orgRes.ok) {
            const orgData = await orgRes.json() as any[];
            setOrgs(orgData.map((org: any) => ({ id: org.id, name: org.name })));
            setOrgsError(null);
          } else throw new Error(`API returned: ${orgRes.status}`);
        } catch (orgError: any) {
          setOrgs([{ id: 'default_org', name: 'Default Organization' }]);
          setOrgsError('Failed to load organizations.');
        } finally { setOrgsLoading(false); }
        // Campaigns (defer until orgs loaded to use orgId as filter if needed)
        try {
          const campRes = await authorizedFetch('/campaigns/');
          if (campRes.ok) {
            const campData = await campRes.json() as any[];
            setCampaigns(campData.map((camp: any) => ({ id: camp.id, name: camp.name, description: camp.description, org_id: camp.org_id })));
            setCampaignsError(null);
          } else throw new Error(`API returned: ${campRes.status}`);
        } catch (campError: any) {
          setCampaigns([{ id: 'cf821e28-bae9-4500-93bf-2d755c7d0b7c', name: 'Default Campaign', description: 'Default for testing', org_id: 'org_3966895b'}]);
          setCampaignsError('Failed to load campaigns.');
        } finally { setCampaignsLoading(false); }
      } catch (e) {
        setOrgs([{ id: 'default_org', name: 'Default Organization' }]);
        setCampaigns([{ id: 'cf821e28-bae9-4500-93bf-2d755c7d0b7c', name: 'Default Campaign', description: 'Default for testing', org_id: 'org_3966895b'}]);
        setOrgsError('Unexpected error.');
        setCampaignsError('Unexpected error.');
        setOrgsLoading(false);
        setCampaignsLoading(false);
      }
    };
    loadInitialData();
  }, []);

  // remove duplicate fetchData block (was defined earlier)

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

    // Check if file is selected
    if (!file) {
      toast({
        title: 'No File Selected',
        description: 'Please select an Excel file to upload.',
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
      console.log('🔍 Debug - File:', file ? `${file.name} (${file.size} bytes)` : 'No file');
      
      if (!authToken) {
        toast({
          title: 'Not Logged In',
          description: 'Please log in to use batch calling feature.',
          variant: 'destructive'
        });
        return;
      }
      
      // Robust user identification: localStorage → JWT → API fallback
      const userData = userDataRaw 
        ? JSON.parse(userDataRaw)
        : null;
      
      console.log('🔍 Debug - User Data Parsed:', userData);
      
      // 1) Try localStorage fields
      let userId = userData?.id || userData?.user_id || userData?.userId || userData?.uid || null;
      
      // 2) Try to decode JWT if still unknown
      if (!userId && authToken && authToken.split('.').length === 3) {
        try {
          const payload = JSON.parse(atob(authToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
          userId = payload?.sub || payload?.user_id || payload?.id || null;
          console.log('🔍 Debug - User ID from JWT:', userId);
        } catch (e) {
          console.warn('JWT decode failed:', e);
        }
      }
      
      // 3) Final fallback: fetch current user from API (synchronous path kept simple)
      if (!userId) {
        try {
          const resp = await fetch('/api/v1/users/me', {
            headers: { 'Authorization': `Bearer ${authToken}` }
          });
          if (resp.ok) {
            const me = await resp.json();
            userId = me?.id || me?.user_id || null;
            console.log('🔍 Debug - User ID from /users/me:', userId);
          }
        } catch (e) {
          console.warn('Fetch /users/me failed:', e);
        }
      }
      
      // Normalize userId to string
      userId = userId ? String(userId) : 'unknown';
      
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

  // [duplicate filteredCampaigns removed]

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
              {banner && (
                <div className={`mt-3 text-sm rounded-md px-3 py-2 shadow ${
                  banner.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' :
                  banner.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' :
                  banner.type === 'warning' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
                  'bg-blue-50 text-blue-700 border border-blue-200'
                }`}>
                  {banner.message} {isLiveRefreshing ? '⏱️' : ''}
                </div>
              )}
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
              <Button onClick={testWebhook} disabled={webhookTesting} variant="outline" size="sm">
                {webhookTesting ? 'Testing…' : 'Test Webhook'}
              </Button>
            </div>
          </div>
        </div>

        {/* Summary Cards Removed - Showing only on main dashboard to avoid redundancy */}

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
                      {orgsError && <div className="text-xs text-red-500 mt-1">{orgsError} <button className="ml-2 underline text-blue-700" onClick={()=>{setOrgsLoading(true);setOrgsError(null);authorizedFetch('/organizations/').then(res=>res.ok?res.json():Promise.reject()).then((orgData: any[]) => { setOrgs(orgData.map((o: any) => ({ id: o.id, name: o.name }))); setOrgsError(null); }, ()=>setOrgsError('Retry failed.')).finally(()=>setOrgsLoading(false));}}>Retry</button></div>}
                    </Select>
                  </div>
                  
                  <div className="space-y-3">
                      <div className="flex items-center justify-between">
                      <Label className="text-sm font-semibold text-gray-700">Campaign</Label>
                      {campaignId && (
                        <Button 
                          type="button"
                          variant="outline"
                          size="sm" 
                          onClick={downloadTemplate}
                          disabled={downloadingTemplate}
                          className="flex items-center gap-2 text-blue-600 border-blue-200 hover:bg-blue-50"
                        >
                          {downloadingTemplate ? (
                            <>
                              <RefreshCw className="h-4 w-4 animate-spin" />
                              Downloading...
                            </>
                          ) : (
                            <>
                              <Download className="h-4 w-4" />
                              Download Template
                            </>
                          )}
                        </Button>
                    )}
                  </div>
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
                      {campaignsError && <div className="text-xs text-red-500 mt-1">{campaignsError}<button className="ml-2 underline text-blue-700" onClick={()=>{setCampaignsLoading(true);setCampaignsError(null);authorizedFetch('/campaigns/').then(res=>res.ok?res.json():Promise.reject()).then((campData: any[]) => { setCampaigns(campData.map((c: any) => ({ id: c.id, name: c.name, description: c.description, org_id: c.org_id }))); setCampaignsError(null); }, ()=>setCampaignsError('Retry failed.')).finally(()=>setCampaignsLoading(false));}}>Retry</button></div>}
                    </Select>
                    {campaignId && (
                      <div className="text-xs text-gray-500 bg-blue-50 p-2 rounded-md">
                        <FileSpreadsheet className="h-3 w-3 inline mr-1" />
                        Template will include campaign variables as columns
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold text-gray-700">Batch Name <span className="text-red-600">*</span></Label>
                    <Input
                      value={batchName}
                      onChange={(e) => setBatchName(e.target.value)}
                      placeholder="Enter batch name"
                      required
                      className={`h-12 border-2 ${batchName.trim() === '' ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'} transition-colors`}
                    />
                    {batchName.trim() === '' && (
                      <p className="text-xs text-red-600">Batch name is required</p>
                    )}
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
                  disabled={starting || !orgId || !campaignId || !file || batchName.trim() === '' || orgsLoading || campaignsLoading}
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
