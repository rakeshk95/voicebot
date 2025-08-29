import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Phone, 
  Clock, 
  BarChart3, 
  Users, 
  TrendingUp, 
  Activity, 
  Brain, 
  Target, 
  Zap, 
  AlertCircle,
  RefreshCw,
  Building2,
  Target as Campaign,
  Play,
  Info
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { usePermissions } from '@/contexts/PermissionContext';
import { getUserData } from '@/utils/localStorage';
import { authorizedFetch, cachedFetch } from '@/lib/api';
import { toast } from '@/components/ui/use-toast';

// Utility function to safely render values
const safeRender = (value: any, defaultValue: any = 'N/A') => {
  if (value === null || value === undefined || value === '') {
    return defaultValue;
  }
  // Check for special NULL objects from API (e.g., { "NULL": true })
  if (typeof value === 'object' && value !== null && value.NULL === true) {
    return defaultValue;
  }
  // Additional check to ensure we don't render objects directly
  if (typeof value === 'object' && value !== null) {
    console.warn('Attempting to render object directly:', value);
    return defaultValue;
  }
  return value;
};

// Utility function to safely get numeric values, handling NULL objects from API
const safeValue = (value: any, defaultValue: any = 0) => {
  if (value === null || value === undefined || value === '') {
    return defaultValue;
  }
  if (typeof value === 'object' && value !== null && value.NULL === true) {
    return defaultValue;
  }
  return value;
};

// Utility function to calculate missing metrics from available data
const calculateMetrics = (metrics: DashboardMetrics | null) => {
  if (!metrics?.core_performance_metrics) return {};
  
  const core = metrics.core_performance_metrics;
  
  const totalCalls = safeValue(core.total_calls, 0) as number;
  const successfulCalls = safeValue(core.successful_calls, 0) as number;
  const successPercentage = safeValue(core.success_percentage, 0) as number;
  
  return {
    // Calculate drop off rate from success percentage
    dropOffRate: totalCalls > 0 ? (100 - successPercentage).toFixed(1) : '0.0',
    
    // Use available fields or calculate from others
    transferredToHuman: safeValue(core.transferred_to_human, successfulCalls),
    callBackRequests: safeValue(core.call_back_requests, 0),
    totalCallsMade: safeValue(core.total_calls_made, totalCalls),
    callPickupRate: safeValue(core.call_pickup_rate, safeValue(core.pickup_percentage, 0)),
    successRate: safeValue(core.success_rate, successPercentage),
    
    // Calculate failure count
    failedCalls: totalCalls - successfulCalls,
    
    // Estimated breakdown if not provided
    estimatedNoAnswer: Math.round(totalCalls * 0.1),
    estimatedBusy: Math.round(totalCalls * 0.05),
    estimatedUnknown: Math.round(totalCalls * 0.02)
  };
};

// Updated Dashboard API response types based on the new comprehensive documentation
interface DashboardMetrics {
  dashboard_period: string;
  organization_id: string | null;
  campaign_id: string | null;
  generated_at: string;
  core_performance_metrics: {
    total_calls: number | { NULL: true };
    successful_calls: number | { NULL: true };
    avg_handle_time_minutes: number | { NULL: true };
    total_minutes_consumed: number | { NULL: true };
    success_percentage: number | { NULL: true };
    pickup_percentage: number | { NULL: true };
    total_calls_made: number | { NULL: true };
    call_pickup_rate: number | { NULL: true };
    aht_average_handle_time: number | { NULL: true };
    drop_off_rate: number | { NULL: true };
    call_completion_rate: number | { NULL: true };
    call_status_breakdown: {
      completed: number | { NULL: true };
      'no-answer': number | { NULL: true };
      failed: number | { NULL: true };
      busy: number | { NULL: true };
      unknown: number | { NULL: true };
    };
    transferred_to_human: number | { NULL: true };
    call_back_requests: number | { NULL: true };
    success_rate: number | { NULL: true };
    pickup_rate: number | { NULL: true };
    avg_handle_time_formatted: string | { NULL: true };
    total_minutes_formatted: string | { NULL: true };
  };
  user_interaction_metrics: {
    intent_recognition_accuracy: number | { NULL: true };
    fallback_or_error_triggers: number | { NULL: true };
    first_response_time_seconds: number | { NULL: true };
    average_bot_response_time_seconds: number | { NULL: true };
    average_user_talk_time_seconds: number | { NULL: true };
    first_attempt_responses: number | { NULL: true };
    multi_attempt_responses: number | { NULL: true };
    total_interactions: number | { NULL: true };
    average_bot_talk_time_seconds: number | { NULL: true };
  };
  outcome_based_metrics: {
    conversion_rate: number;
    lead_qualification_rate: number;
    feedback_rating_score: number;
    sentiment_score: number;
    call_activity: {
      hourly: Record<string, number>;
      daily: Record<string, number>;
      monthly: Record<string, number>;
    };
  };
  failure_analysis: {
    failure_reasons: {
      STT: number;
      TTS: number;
      LLM: number;
      APIs: number;
      Caller: number;
      Network: number;
      Other: number;
    };
    total_failures: number;
    failure_rate: number;
  };
  call_details?: {
    success: boolean;
    data: {
      calls: Array<{
        call_id: string;
        campaign_id: string;
        org_id: string;
        status: string;
        status_color: string;
        duration_formatted: string;
        // All Original DynamoDB Columns
        Status: string;
        EndTime: string;
        DateUpdated: string;
        ParentCallSid: string;
        StartTime: string;
        DateCreated: string;
        RecordingUrl: string;
        Duration: string;
        From: string;
        is_dnd: string;
        Direction: string;
        Uri: string;
        AccountSid: string;
        PhoneNumberSid: string;
        Price: string;
        To: string;
        ForwardedFrom: string;
        CallerName: string;
        AnsweredBy: string;
        // Calculated Fields
        duration_minutes: number;
        duration_seconds: number;
      }>;
      summary: {
        total_calls: number;
        completed_calls: number;
        failed_calls: number;
        in_progress_calls: number;
        success_rate: number;
        total_duration_minutes: number;
        avg_duration_minutes: number;
      };
      filters?: {
        org_id: string;
        campaign_id: string;
        days: number;
        limit: number;
      };
    };
  };
}

// Interface for the new call details with org endpoint
interface CallDetailsResponse {
  success: boolean;
  data: {
    calls: Array<{
      call_id: string;
      campaign_id: string;
      org_id: string;
      status: string;
      status_color: string;
      duration_formatted: string;
      // All Original DynamoDB Columns
      Status: string;
      EndTime: string;
      DateUpdated: string;
      ParentCallSid: string;
      StartTime: string;
      DateCreated: string;
      RecordingUrl: string;
      Duration: string;
      From: string;
      is_dnd: string;
      Direction: string;
      Uri: string;
      AccountSid: string;
      PhoneNumberSid: string;
      Price: string;
      To: string;
      ForwardedFrom: string;
      CallerName: string;
      AnsweredBy: string;
      // Calculated Fields
      duration_minutes: number;
      duration_seconds: number;
    }>;
    summary: {
      total_calls: number;
      completed_calls: number;
      failed_calls: number;
      in_progress_calls: number;
      success_rate: number;
      total_duration_minutes: number;
      avg_duration_minutes: number;
    };
    filters: {
      org_id: string;
      campaign_id: string;
      days: number;
      limit: number;
    };
    note: string;
  };
}

interface Organization {
  id: string;
  name: string;
}

interface Campaign {
  id: string;
  name: string;
  org_id: string;
}

const Dashboard = () => {
  const { userPermissions, userRole, hasPermission } = usePermissions();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [filters, setFilters] = useState({
    org_id: 'all',
    campaign_id: 'all',
    days: 30
  });
  const [refreshing, setRefreshing] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [isFilterDataLoaded, setIsFilterDataLoaded] = useState(false);
  const [userOrgId, setUserOrgId] = useState<string | null>(null);
  const [callDetails, setCallDetails] = useState<CallDetailsResponse | null>(null);
  const [callDetailsLoading, setCallDetailsLoading] = useState(false);
  const [filterDataLoading, setFilterDataLoading] = useState(false);
  
  // Store all data for reference (keeping for potential future use)
  const [allCallDetails, setAllCallDetails] = useState<CallDetailsResponse | null>(null);
  const [allMetrics, setAllMetrics] = useState<DashboardMetrics | null>(null);
  
  // Flag to prevent multiple API calls
  const [isApiCallInProgress, setIsApiCallInProgress] = useState(false);
  
  // Debounce timer for filter changes
  const [filterDebounceTimer, setFilterDebounceTimer] = useState<NodeJS.Timeout | null>(null);
  
  // Ref to track if initialization has already run
  const hasInitializedRef = useRef(false);
  
  // Ref to prevent multiple organization fetches
  const organizationsFetchedRef = useRef(false);
  
  const userData = getUserData();
  const isSuperAdmin = userPermissions?.admin;
  
  // Auto-detect user's organization on component mount
  useEffect(() => {
    if (userData?.org_id && !isSuperAdmin) {
      setUserOrgId(userData.org_id);
      setFilters(prev => ({ ...prev, org_id: userData.org_id }));
      console.log('Dashboard: Auto-detected user organization:', userData.org_id);
    }
  }, [userData, isSuperAdmin]);

  // Check if user is superuser based on role
  const isSuperUser = userData?.role_name === 'superuser';
  console.log('Dashboard: User role check:', { 
    roleName: userData?.role_name, 
    isSuperUser, 
    isSuperAdmin: userPermissions?.admin 
  });

  // Fetch campaigns function
  const fetchCampaigns = async (orgId?: string) => {
    try {
      console.log('Dashboard: Fetching campaigns...');
      let campaignUrl = '/campaigns/';
      
      // Add organization filter if provided or if user is not superuser
      const orgToUse = orgId || (!isSuperUser && userData?.org_id);
      if (orgToUse) {
        campaignUrl += `?org_id=${orgToUse}`;
        console.log('Dashboard: Fetching campaigns with org filter:', campaignUrl);
      }
      
      const campaignResponse = await authorizedFetch(campaignUrl);
      if (campaignResponse.ok) {
        const campaignData = await campaignResponse.json() as Campaign[];
        console.log('Dashboard: Campaigns fetched:', campaignData);
        setCampaigns(campaignData);
      } else {
        console.error('Dashboard: Failed to fetch campaigns:', campaignResponse.status);
        setCampaigns([]);
      }
    } catch (error) {
      console.error('Dashboard: Error fetching campaigns:', error);
      setCampaigns([]);
    }
  };

  // Fetch organizations and campaigns for filters
  const fetchFilterData = async () => {
    // Prevent multiple calls
    if (filterDataLoading || isFilterDataLoaded) {
      console.log('Dashboard: Filter data already loading or loaded, skipping...');
      return Promise.resolve();
    }
    
    try {
      setFilterDataLoading(true);
      console.log('Dashboard: Starting fetchFilterData...', { isSuperUser, userData: userData?.org_id });
      
      // Fetch organizations for all users
      console.log('Dashboard: About to fetch organizations...');
      try {
        console.log('Dashboard: Calling organizations API...');
        const orgResponse = await authorizedFetch('/organizations');
        console.log('Dashboard: Organizations API response status:', orgResponse.status);
        
        if (orgResponse.ok) {
          const orgData = await orgResponse.json() as Organization[];
          console.log('Dashboard: Organizations fetched:', orgData);
          if (orgData && orgData.length > 0) {
            setOrganizations(orgData);
            
            // For non-superusers, set their organization as the default filter if available
            if (!isSuperUser && userData?.org_id) {
              const userOrg = orgData.find(org => org.id === userData.org_id);
              if (userOrg) {
                console.log('Dashboard: Setting user organization as default filter:', userData.org_id);
                setFilters(prev => ({ ...prev, org_id: userData.org_id }));
              }
            }
          } else {
            console.log('Dashboard: No organizations returned from API');
            setOrganizations([]);
          }
        } else {
          const errorText = await orgResponse.text();
          console.error('Dashboard: Failed to fetch organizations:', orgResponse.status, errorText);
          setOrganizations([]);
        }
      } catch (error) {
        console.error('Dashboard: Error fetching organizations:', error);
        setOrganizations([]);
      }

      // Fetch campaigns with organization filtering
      console.log('Dashboard: Fetching campaigns...');
      let campaignUrl = '/campaigns/';
      
      // Add organization filter for non-superuser users
      if (!isSuperUser && userData?.org_id) {
        campaignUrl += `?org_id=${userData.org_id}`;
        console.log('Dashboard: Fetching campaigns with org filter for non-superuser:', campaignUrl);
      }
      
      console.log('Dashboard: Campaigns API call starting at:', new Date().toISOString());
      const campaignResponse = await authorizedFetch(campaignUrl);
      console.log('Dashboard: Campaigns API call completed at:', new Date().toISOString());
      if (campaignResponse.ok) {
        const campaignData = await campaignResponse.json() as Campaign[];
        console.log('Dashboard: Campaigns fetched:', campaignData);
        
        // For non-superuser users, campaigns are already filtered by API
        // For superuser users, show all campaigns
        setCampaigns(campaignData);
      } else {
        console.error('Dashboard: Failed to fetch campaigns:', campaignResponse.status);
        setCampaigns([]);
      }
      
      // Mark filter data as loaded AFTER all data is fetched
      console.log('Dashboard: Filter data loaded successfully');
      setIsFilterDataLoaded(true);
    } catch (error) {
      console.error('Dashboard: Error fetching filter data:', error);
      // Set empty arrays on error to prevent infinite loading
      setOrganizations([]);
      setCampaigns([]);
      // Even on error, mark as loaded to prevent infinite loops
      setIsFilterDataLoaded(true);
    } finally {
      setFilterDataLoading(false);
    }
    
    return Promise.resolve();
  };

  // Single, consolidated organizations loader - prevents multiple API calls
  useEffect(() => {
    // Only load organizations if we have userData and haven't loaded them yet
    if (userData && organizations.length === 0 && !filterDataLoading && !isFilterDataLoaded && !organizationsFetchedRef.current) {
      console.log('Dashboard: Loading organizations (single useEffect)...');
      
      const loadOrganizations = async () => {
        // Set flag to prevent multiple fetches
        organizationsFetchedRef.current = true;
        
        try {
          console.log('Dashboard: Calling organizations API...');
          const orgResponse = await authorizedFetch('/organizations');
          console.log('Dashboard: Organizations API response status:', orgResponse.status);
          
          if (orgResponse.ok) {
            const orgData = await orgResponse.json() as Organization[];
            console.log('Dashboard: Organizations loaded successfully:', orgData);
            setOrganizations(orgData);
            
            // For non-superusers, set their organization as the default filter if available
            if (!isSuperUser && userData?.org_id) {
              const userOrg = orgData.find(org => org.id === userData.org_id);
              if (userOrg) {
                console.log('Dashboard: Setting user organization as default filter:', userData.org_id);
                setFilters(prev => ({ ...prev, org_id: userData.org_id }));
              }
            }
          } else {
            const errorText = await orgResponse.text();
            console.error('Dashboard: Organizations API error:', orgResponse.status, errorText);
            setOrganizations([]);
          }
        } catch (error) {
          console.error('Dashboard: Organizations fetch error:', error);
          setOrganizations([]);
        }
      };
      
      loadOrganizations();
    }
  }, [userData, organizations.length, filterDataLoading, isFilterDataLoaded, isSuperUser]);

  // Cleanup refs on unmount
  useEffect(() => {
    return () => {
      organizationsFetchedRef.current = false;
      hasInitializedRef.current = false;
    };
  }, []);

  // Debug user data and permissions (only in development)
  if (process.env.NODE_ENV === 'development') {
    console.log('Dashboard: User data:', userData);
    console.log('Dashboard: User permissions:', userPermissions);
    console.log('Dashboard: Is super admin:', isSuperAdmin);
    console.log('Dashboard: Organizations state:', organizations);
    console.log('Dashboard: Campaigns state:', campaigns);
    console.log('Dashboard: isFilterDataLoaded:', isFilterDataLoaded);
    console.log('Dashboard: filterDataLoading:', filterDataLoading);
    console.log('Dashboard: hasInitialized:', hasInitialized);
    console.log('Dashboard: hasInitializedRef.current:', hasInitializedRef.current);
  }

  // Simplified dashboard initialization
  useEffect(() => {
    let isMounted = true;
    
    console.log('Dashboard: Dashboard useEffect triggered with:', {
      userData: !!userData,
      hasInitializedRef: hasInitializedRef.current,
      isMounted,
      isSuperUser
    });
    
    // Initialize if user data exists and not initialized yet
    if (userData && !hasInitialized && isMounted) {
      console.log('Dashboard: Initializing dashboard...');
      hasInitializedRef.current = true;
      
      // Fetch filter data first, then dashboard
      fetchFilterData().then(() => {
        console.log('Dashboard: Filter data loaded, now fetching dashboard...');
        fetchDashboard();
        setHasInitialized(true);
      });
    } else {
      console.log('Dashboard: Skipping initialization - conditions not met');
    }
    
    return () => {
      isMounted = false;
    };
  }, [userData, hasInitialized]); // Include hasInitialized in dependencies

  // Refresh dashboard when user organization changes (only for non-superuser users)
  useEffect(() => {
    let isMounted = true;
    
    if (userOrgId && hasInitialized && !loading && !refreshing && !isSuperUser && isMounted) {
      console.log('Dashboard: User organization changed, refreshing dashboard...');
      fetchDashboard();
    }
    
    return () => {
      isMounted = false;
    };
  }, [userOrgId, hasInitialized, loading, refreshing, isSuperUser]);

  // Debounced function to fetch dashboard data
  const debouncedFetchDashboard = (newOrgId?: string, delay: number = 300) => {
    // Clear existing timer
    if (filterDebounceTimer) {
      clearTimeout(filterDebounceTimer);
    }
    
    // Set new timer
    const timer = setTimeout(() => {
      // Create a temporary filter state for the API call
      const tempFilters = {
        ...filters,
        org_id: newOrgId || filters.org_id
      };
      
      // Call fetchDashboard with the updated filter state
      fetchDashboard(tempFilters);
    }, delay);
    
    setFilterDebounceTimer(timer);
  };
  
  // Single, consolidated dashboard fetch function
  const fetchDashboard = async (customFilters?: typeof filters) => {
    // Prevent multiple simultaneous API calls
    if (loading || isApiCallInProgress) {
      console.log('Dashboard: API call already in progress, skipping...');
      return;
    }
    
    try {
      setLoading(true);
      setIsApiCallInProgress(true);
      setError(null);
      
      const params = new URLSearchParams();
      
      // Use custom filters if provided, otherwise use current filters
      const filterState = customFilters || filters;
      
      // Role-based organization filter logic
      let orgIdToUse = null;
      
      if (filterState.org_id && filterState.org_id !== 'all') {
        // User has selected a specific organization from dropdown
        orgIdToUse = filterState.org_id;
        console.log('Dashboard: Using selected organization:', orgIdToUse);
      } else if (userOrgId && !isSuperUser) {
        // Regular user (non-superuser) - use their organization
        orgIdToUse = userOrgId;
        console.log('Dashboard: Using user organization ID for non-superuser:', userOrgId);
      } else if (isSuperUser && filterState.org_id === 'all') {
        // Superuser viewing all organizations - don't include org_id
        console.log('Dashboard: Superuser viewing all organizations - no org_id filter');
      } else if (!isSuperUser && userOrgId) {
        // Non-superuser without specific selection - use their organization
        orgIdToUse = userOrgId;
        console.log('Dashboard: Non-superuser using default organization:', userOrgId);
      }
      
      if (orgIdToUse) {
        params.append('org_id', orgIdToUse);
        console.log('Dashboard: Added org_id parameter:', orgIdToUse);
      } else {
        console.log('Dashboard: No org_id parameter added - will fetch all organizations data');
      }
      
      if (filterState.campaign_id && filterState.campaign_id !== 'all') {
        params.append('campaign_id', filterState.campaign_id);
      }
      params.append('days', filterState.days.toString());

      // Use the new comprehensive dashboard endpoint
      const apiUrl = `/dashboard/comprehensive?${params}`;
      console.log('Dashboard: API call:', `${process.env.NODE_ENV === 'development' ? 'https://platform.voxiflow.com/backend/api/v1' : ''}${apiUrl}`);
      
      const response = await authorizedFetch(apiUrl);
      
      if (!response.ok) {
        const errorData = await response.json() as { detail?: string };
        console.error('Dashboard: API error response:', errorData);
        throw new Error(errorData.detail || 'Failed to fetch dashboard data');
      }

      const data = await response.json() as DashboardMetrics;
      console.log('Dashboard: Data received successfully');
      
      // Store all data for reference
      setAllMetrics(data);
      setMetrics(data);
      
      // Removed call details fetch - not essential for dashboard functionality
      // if (userOrgId || (filterState.org_id && filterState.org_id !== 'all')) {
      //   fetchCallDetails();
      // }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch dashboard data';
      console.error('Dashboard: Fetch error:', error);
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setIsApiCallInProgress(false);
      console.log('Dashboard: fetchDashboard finished (loading set to false)');
    }
  };
  
  // Cleanup function for debounce timer
  useEffect(() => {
    return () => {
      if (filterDebounceTimer) {
        clearTimeout(filterDebounceTimer);
      }
    };
  }, [filterDebounceTimer]);
  
  // Main component cleanup
  useEffect(() => {
    return () => {
      // Clear any pending timers or API calls
      if (filterDebounceTimer) {
        clearTimeout(filterDebounceTimer);
      }
      setIsApiCallInProgress(false);
      setLoading(false);
      setCallDetailsLoading(false);
      setFilterDataLoading(false);
    };
  }, [filterDebounceTimer]);

  // Fetch call details using the new recommended endpoint - DISABLED due to 500 error
  // const fetchCallDetails = async () => {
  //   // ... entire function commented out ...
  // };

  // Refresh dashboard data
  const handleRefresh = async () => {
    if (refreshing || loading) {
      console.log('Dashboard: Refresh already in progress, skipping...');
      return;
    }
    
    setRefreshing(true);
    try {
      // Refresh filter data first
      await fetchFilterData();
      // Then refresh dashboard data
      await fetchDashboard();
    } catch (error) {
      console.error('Dashboard: Refresh error:', error);
      toast({
        title: "Error",
        description: "Failed to refresh dashboard data",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  // Comprehensive refresh function for all data
  const refreshAllData = async () => {
    if (loading || refreshing) {
      console.log('Dashboard: Refresh already in progress, skipping...');
      return;
    }
    
    setLoading(true);
    try {
      console.log('Dashboard: Starting comprehensive refresh...');
      
      // Refresh organizations and campaigns
      await fetchFilterData();
      
      // Refresh dashboard data
      await fetchDashboard();
      
      toast({
        title: "Success",
        description: "All data refreshed successfully",
        variant: "default",
      });
    } catch (error) {
      console.error('Dashboard: Comprehensive refresh error:', error);
      toast({
        title: "Error",
        description: "Failed to refresh all data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };



  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to Load Dashboard</h2>
        <p className="text-gray-600 mb-4">{error}</p>
        <Button onClick={handleRefresh} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  // Show loading state when loading is true OR when metrics is not available but we're still loading
  if (loading || (!metrics && !error)) {
    console.log('Dashboard: Showing loading state', { loading, hasMetrics: !!metrics, hasError: !!error });
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-4 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[300px] w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Final safety check - ensure metrics is a valid object
  if (typeof metrics !== 'object' || metrics === null) {
    console.error('Dashboard: metrics is not a valid object:', metrics);
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Invalid Data Format</h2>
        <p className="text-gray-600">Dashboard data format is invalid. Please try refreshing.</p>
        <Button onClick={handleRefresh} variant="outline" className="mt-4">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>
    );
  }

  // Debug calculated metrics
  const calculatedMetrics = calculateMetrics(metrics);
  


  // Additional safety check for required nested properties
  if (!metrics?.core_performance_metrics || !metrics?.user_interaction_metrics || !metrics?.outcome_based_metrics || !metrics?.failure_analysis) {
    console.log('Dashboard: metrics has incomplete structure:', {
      hasCoreMetrics: !!metrics?.core_performance_metrics,
      hasUserMetrics: !!metrics?.user_interaction_metrics,
      hasOutcomeMetrics: !!metrics?.outcome_based_metrics,
      hasFailureAnalysis: !!metrics?.failure_analysis
    });
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-16 w-16 text-yellow-500 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Incomplete Data</h2>
        <p className="text-gray-600">Dashboard data is incomplete. Please try refreshing.</p>
        <Button onClick={handleRefresh} variant="outline" className="mt-4">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>
    );
  }

  // Transform data for charts
  const transformChartData = () => {
    if (!metrics) return { hourlyData: [], dailyData: [], failureReasons: [] };

    try {
      // Additional safety check for nested properties
      if (!metrics?.core_performance_metrics || !metrics?.outcome_based_metrics || !metrics?.failure_analysis) {
        return { hourlyData: [], dailyData: [], failureReasons: [] };
      }

      // Transform hourly data
      const hourlyData = Object.entries(metrics?.outcome_based_metrics?.call_activity?.hourly || {})
        .map(([hour, calls]) => ({
          hour: `${hour}:00`,
          calls,
          success: Math.round(calls * ((safeValue(metrics?.core_performance_metrics?.success_percentage, 0)) / 100))
        }))
        .sort((a, b) => parseInt(a.hour) - parseInt(b.hour));

      // Transform daily data
      const dailyData = Object.entries(metrics?.outcome_based_metrics?.call_activity?.daily || {})
        .map(([date, calls]) => ({
          date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          calls,
          success: Math.round(calls * ((safeValue(metrics?.core_performance_metrics?.success_percentage, 0)) / 100))
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // Transform failure reasons for pie chart
      const failureReasons = Object.entries(metrics?.failure_analysis?.failure_reasons || {})
        .filter(([_, count]) => count > 0)
        .map(([reason, count]) => ({
          name: reason,
          value: count
        }));

      return { hourlyData, dailyData, failureReasons };
    } catch (error) {
      console.error('Error transforming chart data:', error);
      return { hourlyData: [], dailyData: [], failureReasons: [] };
    }
  };

  // Transform data for charts only when metrics is available
  const { hourlyData, dailyData, failureReasons } = transformChartData();

  // Reset filters and fetch all data from API
  const resetFilters = () => {
    console.log('Dashboard: Resetting filters to show all data');
    
    setFilters({
      org_id: 'all',
      campaign_id: 'all',
      days: filters.days // Keep the same time period
    });
    
    // Fetch all data from API
    console.log('Dashboard: Fetching all data from API after reset...');
    setTimeout(() => {
      fetchDashboard();
    }, 100);
  };


  


  return (
    <div className="space-y-6">


      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Organization Filter */}
          <div className="flex-1">
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              {isSuperUser ? 'Organization' : 'My Organization'}
              {filters.org_id !== 'all' && (
                <span className="ml-2 text-xs text-blue-600 font-medium">
                  🔒 Filtering: {organizations.find(org => org.id === filters.org_id)?.name}
                </span>
              )}
            </label>
            {filterDataLoading ? (
              <div className="h-10 px-3 py-2 text-sm border border-gray-300 rounded-md bg-gray-50 text-gray-500 flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                Loading organizations...
              </div>
            ) : organizations.length > 0 ? (
              <Select
                value={filters.org_id}
                onValueChange={async (value) => {
                  console.log('Dashboard: Organization filter changed to:', value);
                  
                  setFilters(prev => {
                    const newFilters = { ...prev, org_id: value, campaign_id: 'all' };
                    return newFilters;
                  });
                  
                  try {
                    // Fetch campaigns for the selected organization
                    if (value === 'all') {
                      await fetchCampaigns(); // Fetch all campaigns
                    } else {
                      await fetchCampaigns(value); // Fetch campaigns for specific organization
                    }
                    
                    // Use debounced API call to prevent rapid successive calls
                    debouncedFetchDashboard(value); // Pass the new org_id value
                  } catch (error) {
                    console.error('Dashboard: Error updating campaigns after org change:', error);
                    toast({
                      title: "Error",
                      description: "Failed to update campaigns for selected organization",
                      variant: "destructive",
                    });
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={isSuperUser ? "All Organizations" : "My Organization"}>
                    {isSuperUser 
                      ? (filters.org_id === 'all' ? 'All Organizations' : organizations.find(org => org.id === filters.org_id)?.name || 'Select Organization')
                      : organizations.find(org => org.id === filters.org_id)?.name || 'My Organization'
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {isSuperUser && (
                    <SelectItem value="all">All Organizations</SelectItem>
                  )}
                  {organizations.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        {org.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="h-10 px-3 py-2 text-sm border border-red-300 rounded-md bg-red-50 text-red-600">
                No organizations available
              </div>
            )}
          </div>

          {/* Campaign Filter */}
          <div className="flex-1">
            <label className="text-sm font-medium text-gray-700 mb-2 block">Campaign</label>
            {filterDataLoading ? (
              <div className="h-10 px-3 py-2 text-sm border border-gray-300 rounded-md bg-gray-50 text-gray-500 flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                Loading campaigns...
              </div>
            ) : campaigns.length > 0 ? (
              <Select
                value={filters.campaign_id}
                onValueChange={async (value) => {
                  console.log('Dashboard: Campaign filter changed to:', value);
                  
                  setFilters(prev => {
                    const newFilters = { ...prev, campaign_id: value };
                    return newFilters;
                  });
                  
                  try {
                    // Use debounced API call to prevent rapid successive calls
                    debouncedFetchDashboard(undefined, 300); // Pass undefined for org_id, use current filters
                  } catch (error) {
                    console.error('Dashboard: Error updating dashboard after campaign change:', error);
                    toast({
                      title: "Error",
                      description: "Failed to update dashboard for selected campaign",
                      variant: "destructive",
                    });
                  }
                }}
                disabled={false}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Campaigns">
                    {filters.campaign_id === 'all' ? 'All Campaigns' : campaigns.find(camp => camp.id === filters.campaign_id)?.name || 'Select Campaign'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Campaigns</SelectItem>
                  {campaigns
                    .filter(campaign => {
                      // Filter campaigns based on selected organization
                      if (filters.org_id === 'all') {
                        // Show all campaigns if "All Organizations" is selected
                        return true;
                      } else {
                        // Show only campaigns that belong to the selected organization
                        return campaign.org_id === filters.org_id;
                      }
                    })
                    .map((campaign) => (
                      <SelectItem key={campaign.id} value={campaign.id}>
                        <div className="flex items-center gap-2">
                          <Campaign className="h-4 w-4" />
                          {campaign.name}
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="h-10 px-3 py-2 text-sm border border-red-300 rounded-md bg-red-50 text-red-600">
                No campaigns available
              </div>
            )}
          </div>

          {/* Time Period Filter */}
          <div className="flex-1">
            <label className="text-sm font-medium text-gray-700 mb-2 block">Time Period</label>
            <Select
              value={filters.days.toString()}
              onValueChange={async (value) => {
                console.log('Dashboard: Time period changed to:', value, 'days');
                
                setFilters(prev => ({ ...prev, days: parseInt(value) }));
                
                try {
                  // Use debounced API call to prevent rapid successive calls
                  if (isFilterDataLoaded && hasInitialized) {
                    debouncedFetchDashboard(undefined, 300); // Pass undefined for org_id, use current filters
                  }
                } catch (error) {
                  console.error('Dashboard: Error updating dashboard after time period change:', error);
                  toast({
                    title: "Error",
                    description: "Failed to update dashboard for selected time period",
                    variant: "destructive",
                  });
                }
              }}
            >
              <SelectTrigger>
                <SelectValue>
                  {filters.days === 7 ? 'Last 7 days' : 
                   filters.days === 30 ? 'Last 30 days' : 
                   filters.days === 90 ? 'Last 90 days' : 
                   filters.days === 365 ? 'Last year' : 'Select Period'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="365">Last year</SelectItem>
              </SelectContent>
            </Select>
          </div>

                     {/* Filter Refresh Button */}
           <div className="flex items-end gap-2">
             <Button
               onClick={async () => {
                 console.log('Dashboard: Resetting filters and refreshing all data...');
                 setLoading(true);
                 
                 try {
                   // Reset filters
                   setFilters({
                     org_id: 'all',
                     campaign_id: 'all',
                     days: filters.days // Keep the same time period
                   });
                   
                   // Refresh filter data
                   console.log('Dashboard: Refreshing filter data after reset...');
                   await fetchFilterData();
                   
                   // Fetch all data from API
                   console.log('Dashboard: Fetching all data from API after reset...');
                   await fetchDashboard();
                   
                   toast({
                     title: "Success",
                     description: "Filters reset and data refreshed successfully",
                     variant: "default",
                   });
                 } catch (error) {
                   console.error('Dashboard: Reset filters error:', error);
                   toast({
                     title: "Error",
                     description: "Failed to reset filters and refresh data",
                     variant: "destructive",
                   });
                 } finally {
                   setLoading(false);
                 }
               }}
               variant="outline"
               size="sm"
               className="h-10"
               title="Reset filters to show all data and refresh"
               disabled={loading}
             >
               <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
               Reset Filters
             </Button>
           </div>
        </div>
      </Card>

     
      {/* Core Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-lg bg-gradient-to-br from-blue-600 to-blue-400">
                <Phone className="h-5 w-5 text-white" />
              </div>
              <Badge variant="secondary" className="text-xs">
                {safeValue(metrics?.core_performance_metrics?.success_percentage, 0)}% Success
              </Badge>
            </div>
            <div className="mt-4">
              <h3 className="text-sm font-medium text-muted-foreground">Total Calls</h3>
              <p className="text-3xl font-bold mt-2">{safeValue(metrics?.core_performance_metrics?.total_calls, 0).toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">{safeRender(metrics?.dashboard_period, 'Loading...')}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-lg bg-gradient-to-br from-green-600 to-green-400">
                <Target className="h-5 w-5 text-white" />
              </div>
              <Badge variant="secondary" className="text-xs">
                {safeValue(metrics?.core_performance_metrics?.pickup_percentage, 0)}% Pickup
              </Badge>
            </div>
            <div className="mt-4">
              <h3 className="text-sm font-medium text-muted-foreground">Successful Calls</h3>
              <p className="text-3xl font-bold mt-2">{safeValue(metrics?.core_performance_metrics?.successful_calls, 0).toLocaleString()}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                  {safeValue(metrics?.core_performance_metrics?.success_percentage, 0)}% of total
                </p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-lg bg-gradient-to-br from-purple-600 to-purple-400">
                <Clock className="h-5 w-5 text-white" />
              </div>
              <Badge variant="secondary" className="text-xs">
                {(() => {
                  const formatted = metrics?.core_performance_metrics?.avg_handle_time_formatted;
                  const minutes = metrics?.core_performance_metrics?.avg_handle_time_minutes;
                  
                  // Check for NULL objects from API
                  if (formatted && typeof formatted === 'object' && formatted.NULL === true) {
                    return '0 min';
                  }
                  if (minutes && typeof minutes === 'object' && minutes.NULL === true) {
                    return '0 min';
                  }
                  
                  if (formatted && typeof formatted === 'string' && formatted !== '0 min') {
                    return formatted;
                  }
                  if (minutes && typeof minutes === 'number' && minutes > 0) {
                    return `${minutes.toFixed(1)} min`;
                  }
                  
                  return '0 min';
                })()}
              </Badge>
            </div>
            <div className="mt-4">
              <h3 className="text-sm font-medium text-muted-foreground">Avg Handle Time</h3>
              <p className="text-3xl font-bold mt-2">
                {(() => {
                  const formatted = metrics?.core_performance_metrics?.avg_handle_time_formatted;
                  const minutes = metrics?.core_performance_metrics?.avg_handle_time_minutes;
                  console.log('Dashboard: Rendering Avg Handle Time - formatted:', formatted, 'minutes:', minutes);
                  
                  // Check for NULL objects from API
                  if (formatted && typeof formatted === 'object' && formatted.NULL === true) {
                    console.log('Dashboard: avg_handle_time_formatted is NULL object');
                    return '0 min';
                  }
                  if (minutes && typeof minutes === 'object' && minutes.NULL === true) {
                    console.log('Dashboard: avg_handle_time_minutes is NULL object');
                    return '0 min';
                  }
                  
                  // Use formatted value if available, otherwise calculate from minutes
                  if (formatted && typeof formatted === 'string' && formatted !== '0 min') {
                    return formatted;
                  }
                  if (minutes && typeof minutes === 'number' && minutes > 0) {
                    return `${minutes.toFixed(1)} min`;
                  }
                  
                  return '0 min';
                })()}
              </p>
              <p className="text-xs text-muted-foreground mt-1">minutes per call</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-lg bg-gradient-to-br from-orange-600 to-orange-400">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <Badge variant="secondary" className="text-xs">
                {(() => {
                  const rate = metrics?.core_performance_metrics?.call_completion_rate;
                  
                  // Check for NULL objects from API
                  if (rate && typeof rate === 'object' && rate.NULL === true) {
                    return '0% Complete';
                  }
                  
                  if (rate && typeof rate === 'number' && rate > 0) {
                    return `${rate}% Complete`;
                  }
                  
                  return '0% Complete';
                })()}
              </Badge>
            </div>
            <div className="mt-4">
              <h3 className="text-sm font-medium text-muted-foreground">Total Minutes</h3>
              <p className="text-3xl font-bold mt-2">
                {(() => {
                  const formatted = metrics?.core_performance_metrics?.total_minutes_formatted;
                  const consumed = metrics?.core_performance_metrics?.total_minutes_consumed;
                  console.log('Dashboard: Rendering Total Minutes - formatted:', formatted, 'consumed:', consumed);
                  
                  // Check for NULL objects from API
                  if (formatted && typeof formatted === 'object' && formatted.NULL === true) {
                    console.log('Dashboard: total_minutes_formatted is NULL object');
                    return '0 min';
                  }
                  if (consumed && typeof consumed === 'object' && consumed.NULL === true) {
                    console.log('Dashboard: total_minutes_consumed is NULL object');
                    return '0 min';
                  }
                  
                  // Use formatted value if available, otherwise calculate from consumed
                  if (formatted && typeof formatted === 'string' && formatted !== '0 min') {
                    return formatted;
                  }
                  if (consumed && typeof consumed === 'number' && consumed > 0) {
                    return `${consumed.toFixed(1)} min`;
                  }
                  
                  return '0 min';
                })()}
              </p>
              <p className="text-xs text-muted-foreground mt-1">consumed</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Call Status Breakdown */}
      {metrics?.core_performance_metrics?.call_status_breakdown && (
        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-500" />
              Call Status Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {(() => {
                    const completed = safeValue(metrics.core_performance_metrics.call_status_breakdown?.completed, 0);
                    const successful = safeValue(metrics.core_performance_metrics.successful_calls, 0);
                    return completed || successful || 0;
                  })()}
                </div>
                <div className="text-sm text-gray-600">Completed</div>
                <Badge variant="outline" className="mt-1">Success</Badge>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {(() => {
                    const noAnswer = safeValue(metrics.core_performance_metrics.call_status_breakdown?.['no-answer'], 0);
                    return noAnswer || calculatedMetrics.estimatedNoAnswer;
                  })()}
                </div>
                <div className="text-sm text-gray-600">No Answer</div>
                <Badge variant="outline" className="mt-1">Warning</Badge>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {(() => {
                    const failed = safeValue(metrics.core_performance_metrics.call_status_breakdown?.failed, 0);
                    return failed || calculatedMetrics.failedCalls;
                  })()}
                </div>
                <div className="text-sm text-gray-600">Failed</div>
                <Badge variant="destructive" className="mt-1">Failed</Badge>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {(() => {
                    const busy = safeValue(metrics.core_performance_metrics.call_status_breakdown?.busy, 0);
                    return busy || calculatedMetrics.estimatedBusy;
                  })()}
                </div>
                <div className="text-sm text-gray-600">Busy</div>
                <Badge variant="destructive" className="mt-1">Failed</Badge>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">
                  {(() => {
                    const unknown = safeValue(metrics.core_performance_metrics.call_status_breakdown?.unknown, 0);
                    return unknown || calculatedMetrics.estimatedUnknown;
                  })()}
                </div>
                <div className="text-sm text-gray-600">Unknown</div>
                <Badge variant="secondary" className="mt-1">Unknown</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Call Activity Chart */}
        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-500" />
              Call Activity ({filters.days === 7 ? 'Hourly' : 'Daily'})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={filters.days === 7 ? hourlyData : dailyData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  {(filters.days === 7 ? hourlyData : dailyData).length === 0 ? (
                    <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" fill="#666">
                      No data available for selected period
                    </text>
                  ) : (
                    <>
                      <defs>
                        <linearGradient id="colorCalls" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey={filters.days === 7 ? "hour" : "date"} />
                      <YAxis />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'white',
                          border: '1px solid #e2e8f0',
                          borderRadius: '6px',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="calls" 
                        stroke="#3b82f6" 
                        fillOpacity={1} 
                        fill="url(#colorCalls)" 
                        name="Total Calls"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="success" 
                        stroke="#10b981" 
                        fillOpacity={1} 
                        fill="url(#colorSuccess)" 
                        name="Successful Calls"
                      />
                    </>
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* AI Performance Metrics */}
        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-500" />
              AI Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Intent Accuracy', value: safeValue(metrics.user_interaction_metrics?.intent_recognition_accuracy, 0) },
                      { name: 'First Response', value: Math.round(100 - safeValue(metrics.user_interaction_metrics?.first_response_time_seconds, 0)) },
                      { name: 'Fallback Rate', value: Math.round(((safeValue(metrics.user_interaction_metrics?.fallback_or_error_triggers, 0)) / (safeValue(metrics.user_interaction_metrics?.total_interactions, 1))) * 100) }
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}%`}
                  >
                    {['#3b82f6', '#10b981', '#ef4444'].map((color, index) => (
                      <Cell key={`cell-${index}`} fill={color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Metrics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Interaction Metrics */}
        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5 text-green-500" />
              User Interaction
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Intent Recognition</span>
              <Badge variant="outline">{safeValue(metrics?.user_interaction_metrics?.intent_recognition_accuracy, 0)}%</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">First Response Time</span>
              <Badge variant="outline">{safeValue(metrics?.user_interaction_metrics?.first_response_time_seconds, 0)}s</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Fallback Triggers</span>
              <Badge variant="outline">{safeValue(metrics?.user_interaction_metrics?.fallback_or_error_triggers, 0)}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Interactions</span>
              <Badge variant="outline">{safeValue(metrics?.user_interaction_metrics?.total_interactions, 0)}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Avg Bot Response</span>
              <Badge variant="outline">{safeValue(metrics?.user_interaction_metrics?.average_bot_response_time_seconds, 0)}s</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">User Talk Time</span>
              <Badge variant="outline">{safeValue(metrics?.user_interaction_metrics?.average_user_talk_time_seconds, 0)}s</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Bot Talk Time</span>
              <Badge variant="outline">{safeValue(metrics?.user_interaction_metrics?.average_bot_talk_time_seconds, 0)}s</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Business Outcomes */}
        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              Business Outcomes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Conversion Rate</span>
              <Badge variant="outline">{metrics?.outcome_based_metrics?.conversion_rate || 0}%</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Lead Qualification</span>
              <Badge variant="outline">{metrics?.outcome_based_metrics?.lead_qualification_rate || 0}%</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Feedback Score</span>
              <Badge variant="outline">{metrics?.outcome_based_metrics?.feedback_rating_score || 0}/5</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Sentiment Score</span>
              <Badge variant="outline">{metrics?.outcome_based_metrics?.sentiment_score || 0}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Failure Analysis */}
        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Failure Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Failures</span>
              <Badge variant="destructive">{metrics?.failure_analysis?.total_failures || 0}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Failure Rate</span>
              <Badge variant="destructive">{metrics?.failure_analysis?.failure_rate || 0}%</Badge>
            </div>
            <div className="space-y-2">
              <span className="text-sm text-gray-600">Top Failure Reasons:</span>
              {Object.entries(metrics?.failure_analysis?.failure_reasons || {})
                .filter(([_, count]) => count > 0)
                .sort(([_, a], [__, b]) => b - a)
                .slice(0, 3)
                .map(([reason, count]) => (
                  <div key={reason} className="flex justify-between items-center text-xs">
                    <span className="text-gray-500">{reason}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Performance Metrics */}
      {metrics?.core_performance_metrics && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Call Transfer & Human Handoff */}
          <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5 text-green-500" />
                Call Transfers
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Transferred to Human</span>
                <Badge variant="outline">
                  {calculatedMetrics.transferredToHuman}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Call Back Requests</span>
                <Badge variant="outline">
                  {calculatedMetrics.callBackRequests}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Drop Off Rate</span>
                <Badge variant="destructive">
                  {calculatedMetrics.dropOffRate}%
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Call Volume & Performance */}
          <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <BarChart3 className="h-5 w-5 text-blue-500" />
                Call Volume
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Calls Made</span>
                <Badge variant="outline">
                  {calculatedMetrics.totalCallsMade}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Call Pickup Rate</span>
                <Badge variant="outline">
                  {calculatedMetrics.callPickupRate}%
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Success Rate</span>
                <Badge variant="outline">
                  {calculatedMetrics.successRate}%
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* User Interaction Details */}
          <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Brain className="h-5 w-5 text-purple-500" />
                AI Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">First Attempt Responses</span>
                <Badge variant="outline">{safeValue(metrics.user_interaction_metrics?.first_attempt_responses, 0)}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Multi Attempt Responses</span>
                <Badge variant="outline">{safeValue(metrics.user_interaction_metrics?.multi_attempt_responses, 0)}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Interactions</span>
                <Badge variant="outline">{safeValue(metrics.user_interaction_metrics?.total_interactions, 0)}</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

           </div>
     
  );
};

export default Dashboard;
