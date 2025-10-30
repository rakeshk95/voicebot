import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { 
  BarChart, 
  Users, 
  Activity, 
  Settings, 
  Phone, 
  Upload, 
  Filter,
  Plus,
  Play,
  Pause,
  Edit,
  Trash2,
  Download,
  Eye,
  Search,
  Calendar as CalendarIcon,
  X,
  History,
  FileText,
  FileSpreadsheet,
  MessageSquare,
  Variable,
  Database,
  Tag,
  Globe,
  MessageCircle,
  FileDown,
  Info,
  Mic,
  Volume2,
  Clock,
  Hourglass,
  Copy
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, addDays, subDays, startOfDay, endOfDay, startOfToday, endOfToday } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { DialogFooter } from '@/components/ui/dialog';
import { usePermissions } from '@/contexts/PermissionProvider';
import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast, useToast } from "@/components/ui/use-toast";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Separator } from "@/components/ui/separator";
import StepLanguage from '../components/CampaignForm/StepLanguage';
import StepVoice from '../components/CampaignForm/StepVoice';
import StepFlow from '../components/CampaignForm/StepFlow';
import StepTelephony from '../components/CampaignForm/StepTelephony';
import StepPostCall from '../components/CampaignForm/StepPostCall';
import CampaignDetails from '@/components/CampaignDetails/CampaignDetails';
import CampaignTable from '@/components/CampaignTable/CampaignTable';
import CampaignCall from '@/components/CampaignCall/CampaignCall';
import CampaignUpload from '@/components/CampaignUpload/CampaignUpload';
import { Switch } from '@/components/ui/switch';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import * as XLSX from 'xlsx-js-style';
import { cachedFetch } from '@/lib/api';

// Interfaces
interface Organization {
  id: string;
  name: string;
}

interface KeyValuePair {
  key: string;
  value: string;
}

interface Campaign {
  id: string;
  name: string;
  direction: 'INBOUND' | 'OUTBOUND';
  state: 'TRIAL' | 'ACTIVE' | 'INACTIVE';
  org_id: string;
  tts?: {
    gender: string;
    language: string;
    voice_id: string;
    vendor?: string;
  };
  llm?: {
    model: string;
    prompt: string;
    provider: string;
    promptJson: {
      nodes: Record<string, any>;
      context: string;
      language: string;
      skeleton: string;
      mermaidGraph: string;
      knowledgeBase?: {
        url: string;
        file: File | null;
      };
      promptVariables: Record<string, string>;
      botStateDefinitions: Record<string, any>;
    };
    temperature: string;
    useProxyLlm: boolean;
    useEmbeddings: boolean;
    initialMessage: string;
    maxCallDuration: any;
    UseStructuredPrompt: boolean;
  };
  telephonic_provider: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  version: number;
  knowledge_base?: {
    url: string;
    file: null | File;
  };
  post_call_actions?: {
    categories: Record<string, string>;
    data_extracted: Record<string, string>;
  };
  speech_setting?: {
    interruption?: {
      status: boolean;
    };
    ambient_sound?: {
      status: boolean;
      sound: string;
      volume: string;
    };
  };
}

interface CampaignFormData {
  campaign_id: string;
  name: string;
  direction: 'INBOUND' | 'OUTBOUND';
  state: 'TRIAL' | 'ACTIVE' | 'INACTIVE';
  org_id: string;
  tts: {
    gender: string;
    language: string;
    voice_id: string;
    vendor?: string;
  };
  stt: {
    vendor: string;
  };
  telephonic_provider: string;
  knowledge_base: {
    url: string;
    file: null | File;
  };
  post_call_actions: {
    categories: Record<string, string>;
    data_extracted: Record<string, string>;
  };
  callback_endpoint?: string;
}

interface ResponseItem {
  key: string;
  value: string;
}

interface VariableItem {
  key: string;
  value: string;
}

// Add new interfaces
interface CallFormValues {
  callerName: string;
  mobileNumber: string;
}

// Add new interface for API call
interface CallApiRequest {
  to_number: string;
  dynamic_variables: {
    customer_name: string;
    dealer_name: string;
    vehicle_no: string;
    callback_date?: string;
    callback_time?: string;
    alt_contact_name?: string;
    alt_contact_no?: string;
  };
  metadata: {
    org_id: string;
    user_id: string;
  };
  campaign_id: string;
}

interface ExtractedData {
  category?: string;
  summary?: string;
  'extracted-data'?: string;
}

// Form schema
const campaignFormSchema = z.object({
  campaign_id: z.string().min(1, "Campaign ID is required"),
  name: z.string().min(1, "Campaign name is required"),
  direction: z.enum(['INBOUND', 'OUTBOUND']),
  state: z.enum(['TRIAL', 'ACTIVE', 'INACTIVE']),
  org_id: z.string().min(1, "Organization is required"),
  tts: z.object({
    gender: z.string(),
    language: z.string(),
    voice_id: z.string()
  }),
  stt: z.object({
    vendor: z.string(),
    provider: z.string()
  }),
  telephonic_provider: z.string(),
  telephony_config: z.object({
    channels: z.number().min(0, "Channels cannot be negative"),
    max_concurrent_calls: z.number().min(1, "At least 1 concurrent call is required"),
    call_timeout: z.number().min(30, "Call timeout must be at least 30 seconds")
  }),
  llm: z.object({
    provider: z.string(),
    model: z.string()
  }),
  knowledge_base: z.object({
    url: z.string(),
    file: z.any().nullable()
  }),
  post_call_actions: z.object({
    categories: z.record(z.string()).optional(),
    data_extracted: z.record(z.string()).optional()
  }).optional(),
  callback_endpoint: z.string().optional()
});

type CampaignFormValues = z.infer<typeof campaignFormSchema>;

const defaultValues: Partial<CampaignFormValues> = {
  campaign_id: generateUUID(),
  name: "",
  direction: "OUTBOUND",
  state: "TRIAL",
  org_id: "",
  tts: {
    gender: "female",
    language: "hindi",
    voice_id: "hi-IN-AnanyaNeural"
  },
  stt: {
    vendor: "deepgram",
    provider: "nova-2"
  },
  llm: {
    provider: "openai",
    model: "gpt-4.1"
  },
  telephonic_provider: "czentrix",
  telephony_config: {
    channels: 0,
    max_concurrent_calls: 1,
    call_timeout: 30
  },
  knowledge_base: {
    url: "",
    file: null
  },
  post_call_actions: {
    categories: {},
    data_extracted: {}
  },
  callback_endpoint: ""
};

type FormPath = 
  | 'llm.promptJson.responses'
  | 'llm.promptJson.promptVariables'
  | 'llm.promptJson.knowledgeBase.url'
  | 'llm.promptJson.knowledgeBase.file';

const handleAddKeyValuePair = (
  list: KeyValuePair[],
  setList: React.Dispatch<React.SetStateAction<KeyValuePair[]>>,
  form: any,
  formPath: FormPath
) => {
  const newPair = { key: '', value: '' };
  setList([...list, newPair]);
  const currentValue = form.getValues(formPath) || {};
  form.setValue(formPath, { ...currentValue, [newPair.key]: newPair.value });
};

const handleRemoveKeyValuePair = (
  index: number,
  list: KeyValuePair[],
  setList: React.Dispatch<React.SetStateAction<KeyValuePair[]>>,
  form: any,
  formPath: FormPath
) => {
  const newList = list.filter((_, i) => i !== index);
  setList(newList);
  const newValue = {};
  newList.forEach(pair => {
    newValue[pair.key] = pair.value;
  });
  form.setValue(formPath, newValue);
};

const handleKeyValueChange = (
  index: number,
  field: 'key' | 'value',
  value: string,
  list: KeyValuePair[],
  setList: React.Dispatch<React.SetStateAction<KeyValuePair[]>>,
  form: any,
  formPath: FormPath
) => {
  const newList = [...list];
  const oldKey = newList[index].key;
  newList[index][field] = value;
  setList(newList);

  const formValue = {};
  newList.forEach(pair => {
    formValue[pair.key] = pair.value;
  });
  form.setValue(formPath, formValue);
};

const callFormSchema = z.object({
  callerName: z.string().min(1, "Caller name is required"),
  mobileNumber: z.string()
    .min(10, "Mobile number must be at least 10 digits")
    .max(15, "Mobile number must not exceed 15 digits")
    .regex(/^[0-9+\-\s()]*$/, "Invalid mobile number format")
});

type CallFormData = z.infer<typeof callFormSchema>;

// Add UUID generation function at the top of the file after imports
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const Campaigns = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { hasPermission, userRole } = usePermissions();
  const COPY_STORAGE_KEY = 'VOXIFLOW_COPIED_CAMPAIGN';
  
  console.log('Campaigns component mounted');
  
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [viewingCampaign, setViewingCampaign] = useState<any>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [editingCampaign, setEditingCampaign] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Get user data and check role
  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  const isSuperUser = userData?.role_name === 'superuser';
  console.log('Campaigns: User role check:', { 
    roleName: userData?.role_name, 
    isSuperUser,
    orgId: userData?.org_id 
  });
  const [selectedOrgFilter, setSelectedOrgFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');

  // Reset to page 1 when filters or items per page change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, startDate, endDate, selectedOrgFilter, selectedStatusFilter, itemsPerPage]);
  const [currentStep, setCurrentStep] = useState(1);
  const [activeFlowTab, setActiveFlowTab] = useState<'context' | 'graph' | 'responses' | 'variables' | 'knowledgeBase'>('context');
  const [responses, setResponses] = useState<ResponseItem[]>([]);
  const [variables, setVariables] = useState<VariableItem[]>([]);
  const [dataExtractionFields, setDataExtractionFields] = useState<VariableItem[]>([]);
  const [contextValue, setContextValue] = useState('');
  const [knowledgeBaseFiles, setKnowledgeBaseFiles] = useState<File[]>([]);
  const [knowledgeBaseUrls, setKnowledgeBaseUrls] = useState<string[]>([]);
  const [categorization, setCategorization] = useState<KeyValuePair[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [knowledgeBaseUrl, setKnowledgeBaseUrl] = useState('');
  const [isCallDialogOpen, setIsCallDialogOpen] = useState(false);
  const [selectedCampaignForCall, setSelectedCampaignForCall] = useState<Campaign | null>(null);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedCampaignForUpload, setSelectedCampaignForUpload] = useState<Campaign | null>(null);
  const [isBulkCallDialogOpen, setIsBulkCallDialogOpen] = useState(false);
  const [selectedCampaignForBulkCall, setSelectedCampaignForBulkCall] = useState<Campaign | null>(null);
  const [bulkCallFile, setBulkCallFile] = useState<File | null>(null);
  const [isBulkCalling, setIsBulkCalling] = useState(false);
  const [allowInterruptions, setAllowInterruptions] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [testCallVariables, setTestCallVariables] = useState<Record<string, string>>({});
  const [isCalling, setIsCalling] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [ambientStatus, setAmbientStatus] = useState(false);
  const [sound, setSound] = useState('office');
  const [volume, setVolume] = useState(0.1);
  const [maxIdleReminder, setMaxIdleReminder] = useState(3);
  const [maxIdleDuration, setMaxIdleDuration] = useState(5);
  
  // Add missing state variables for StepPostCall
  const [dataExtractionSystemPrompt, setDataExtractionSystemPrompt] = useState('');
  const [categoriesSystemPrompt, setCategoriesSystemPrompt] = useState('');

  // Add refs to prevent unnecessary API calls
  const hasFetchedOrganizations = useRef(false);
  const hasFetchedCampaigns = useRef(false);
  const isFetchingCampaigns = useRef(false);


  const form = useForm<CampaignFormValues>({
    resolver: zodResolver(campaignFormSchema),
    defaultValues: {
      ...defaultValues,
      post_call_actions: {
        categories: {},
        data_extracted: {}
      }
    }
  });

  const callForm = useForm<CallFormData>({
    resolver: zodResolver(callFormSchema),
    defaultValues: {
      callerName: "",
      mobileNumber: ""
    }
  });

  const nextStep = () => {
    const currentValues = form.getValues();
    let canProceed = true;

    switch (currentStep) {
      case 1:
        canProceed = !!currentValues.name && !!currentValues.tts?.language;
        break;
      case 2:
        canProceed = !!currentValues.tts?.gender && !!currentValues.tts?.voice_id;
        break;
      case 3:
        // Flow step can proceed without validation
        break;
      case 4:
        canProceed = !!currentValues.direction && !!currentValues.telephonic_provider;
        break;
    }

    if (canProceed) {
      setCurrentStep(prev => Math.min(prev + 1, 6));
    } else {
      toast({
        title: "Required Fields",
        description: "Please fill in all required fields before proceeding.",
        variant: "destructive",
      });
    }
  };

  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const datePresets = [
    { label: 'Today', getValue: () => ({ start: startOfToday(), end: endOfToday() }) },
    { label: 'Last 7 days', getValue: () => ({ start: subDays(startOfToday(), 6), end: endOfToday() }) },
    { label: 'Last 30 days', getValue: () => ({ start: subDays(startOfToday(), 29), end: endOfToday() }) },
    { label: 'Last 90 days', getValue: () => ({ start: subDays(startOfToday(), 89), end: endOfToday() }) }
  ];

  const handleDatePreset = (preset: { start: Date; end: Date }) => {
    setStartDate(preset.start);
    setEndDate(preset.end);
  };

  const clearDateFilter = () => {
    setStartDate(null);
    setEndDate(null);
  };

  // PERFORMANCE FIX: Fetch campaigns only after organizations are loaded
  useEffect(() => {
    console.log('🚀 PERFORMANCE FIX: Campaigns useEffect running - checking if organizations are loaded');
    
    // PERFORMANCE FIX: Only fetch campaigns if organizations are loaded
    if (organizations.length === 0) {
      console.log('🚀 PERFORMANCE FIX: Organizations not loaded yet, skipping campaigns fetch');
      return;
    }
    
    // Prevent multiple simultaneous API calls
    if (hasFetchedCampaigns.current) {
      console.log('🚀 PERFORMANCE FIX: Already fetched campaigns, skipping');
      return;
    }
    
    if (isFetchingCampaigns.current) {
      console.log('🚀 PERFORMANCE FIX: Already fetching campaigns, skipping');
      return;
    }
    
    // PERFORMANCE FIX: Wait for organizations to be loaded for proper name matching
    
    const fetchCampaigns = async () => {
      try {
        isFetchingCampaigns.current = true;
        setIsLoading(true);
        
        const authToken = localStorage.getItem('authToken');
        if (!authToken) {
          console.error('No auth token found');
          toast({
            title: "Error",
            description: "Authentication token not found. Please login again.",
            variant: "destructive",
          });
          return;
        }

        // Build API URL with organization filter for non-superusers
        let campaignUrl = 'http://localhost:8000/api/v1/campaigns/';
        if (!isSuperUser && userData?.org_id) {
          campaignUrl += `?org_id=${userData.org_id}`;
          console.log('Campaigns: Non-superuser - filtering by organization:', userData.org_id);
        }
        
        console.log('Campaigns API URL:', campaignUrl);
        console.log('Auth token:', authToken.substring(0, 20) + '...');

        const response = await fetch(campaignUrl, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          },
        });

        console.log('Campaigns API response:', response.status, response.statusText);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('API Error:', response.status, errorText);
          throw new Error(`API Error: ${response.status} - ${errorText}`);
        }

        const responseData = await response.json();
        console.log('🚀 PERFORMANCE FIX: Campaigns API response:', responseData);
        
        // Handle different response formats
        let data;
        if (Array.isArray(responseData)) {
          data = responseData;
        } else if (responseData.value && Array.isArray(responseData.value)) {
          data = responseData.value;
        } else {
          console.error('🚀 PERFORMANCE FIX: Invalid campaigns data format:', responseData);
          data = [];
        }
        
        // PERFORMANCE FIX: Format campaigns with organization names
        console.log('🚀 PERFORMANCE FIX: Available organizations:', organizations.length);
        console.log('🚀 PERFORMANCE FIX: Campaigns data:', data.length);
        
        const formattedCampaigns = data.map((campaign: any) => {
          // Find organization name by org_id
          const organization = organizations.find(org => org.id === campaign.org_id);
          let orgName = 'Unknown Organization';
          
          console.log(`🚀 PERFORMANCE FIX: Campaign ${campaign.name}: org_id=${campaign.org_id}, found org:`, organization?.name);
          
          if (organization) {
            orgName = organization.name;
          } else if (campaign.org_id) {
            // If organization not found but org_id exists, try to get from userData for non-superusers
            if (!isSuperUser && userData?.org_id === campaign.org_id) {
              orgName = userData.org_name || userData.user_name || `Org ${campaign.org_id}`;
            } else {
              // For superusers or when organization is not found, show org_id
              orgName = `Org ${campaign.org_id}`;
            }
          }
          
          console.log(`🚀 PERFORMANCE FIX: Final org name for ${campaign.name}: ${orgName}`);
          
          return {
            id: campaign.id,
            name: campaign.name,
            direction: campaign.direction,
            state: campaign.state,
            status: campaign.is_active ? 'Active' : 'Inactive',
            type: campaign.direction === 'INBOUND' ? 'Inbound' : 'Outbound',
            language: campaign.tts?.language || 'N/A',
            voice_id: campaign.tts?.voice_id || 'N/A',
            created_at: campaign.created_at,
            updated_at: campaign.updated_at,
            org_id: campaign.org_id,
            org_name: orgName,
            telephonic_provider: campaign.telephonic_provider,
            knowledge_base: campaign.knowledge_base,
            post_call_actions: campaign.post_call_actions,
            tts: campaign.tts,
            llm: campaign.llm,
          };
        });

        setCampaigns(formattedCampaigns);
        hasFetchedCampaigns.current = true;
      } catch (error) {
        console.error('Error fetching campaigns:', error);
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to load campaigns. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
        isFetchingCampaigns.current = false;
      }
    };

    fetchCampaigns();
  }, [organizations, isSuperUser, userData?.org_id]); // Re-fetch campaigns when organizations change



  // PERFORMANCE FIX: Optimized organizations fetching
  useEffect(() => {
    console.log('🚀 PERFORMANCE FIX: Organizations useEffect running - fetching organizations');
    
    // Prevent multiple simultaneous API calls
    if (hasFetchedOrganizations.current) {
      console.log('🚀 PERFORMANCE FIX: Organizations already fetched, skipping');
      return;
    }
    
    const fetchOrganizations = async () => {
      try {
        console.log('🚀 PERFORMANCE FIX: Fetching organizations...');
        
        // Try direct fetch first to debug the issue
        const authToken = localStorage.getItem('authToken');
        if (!authToken) {
          console.error('No auth token found for organizations fetch');
          setOrganizations([]);
          hasFetchedOrganizations.current = true;
          return;
        }
        
        // Build organizations API URL with role-based filtering
        let orgUrl = 'http://localhost:8000/api/v1/organizations/';
        if (!isSuperUser && userData?.org_id) {
          // For non-superusers, still fetch organizations to get the proper name
          console.log('Campaigns: Non-superuser - fetching organizations for proper names');
        }
        
        console.log('Organizations API URL:', orgUrl);
        console.log('Auth token:', authToken.substring(0, 20) + '...');
        
        const response = await fetch(orgUrl, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          },
        });
        
        console.log('Organizations API response:', response.status, response.statusText);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Organizations API Error:', response.status, errorText);
          throw new Error(`Organizations API Error: ${response.status} - ${errorText}`);
        }
        
        const responseData = await response.json();
        console.log('Organizations API response:', responseData);
        
        // Handle different response formats
        let data;
        if (Array.isArray(responseData)) {
          data = responseData;
        } else if (responseData.value && Array.isArray(responseData.value)) {
          data = responseData.value;
        } else {
          console.error('Invalid organizations data format:', responseData);
          data = [];
        }
        
        console.log('Organizations API data:', data);
        
        if (Array.isArray(data)) {
          console.log('Setting organizations:', data.length, 'organizations');
          console.log('Organizations data:', data);
          setOrganizations(data);
          
          // Reset campaigns fetched flag so campaigns are re-fetched with proper org names
          hasFetchedCampaigns.current = false;
          
          // For non-superusers, set their organization as the default filter
          if (!isSuperUser && userData?.org_id) {
            setSelectedOrgFilter(userData.org_id);
          }
        } else {
          console.error('Invalid organizations data format:', data);
          setOrganizations([]);
        }
      } catch (error) {
        console.error('Error fetching organizations:', error);
        toast({
          title: "Error",
          description: "Failed to load organizations",
          variant: "destructive",
        });
        setOrganizations([]);
      } finally {
        // Always mark as fetched to prevent infinite loops
        hasFetchedOrganizations.current = true;
      }
    };

    fetchOrganizations();
  }, [isSuperUser, userData?.org_id]); // Add proper dependencies

  // Reset status filter when campaigns change - but only if it's not already 'all'
  useEffect(() => {
    if (selectedStatusFilter !== 'all') {
      setSelectedStatusFilter('all');
    }
  }, [campaigns, selectedStatusFilter]);

  // Cleanup refs on component unmount
  useEffect(() => {
    return () => {
      hasFetchedOrganizations.current = false;
      hasFetchedCampaigns.current = false;
      isFetchingCampaigns.current = false;
    };
  }, []);

  const filteredCampaigns = campaigns.filter(campaign => {
    if (!campaign) return false; // Add null check
    
    const matchesSearch = 
      campaign.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      campaign.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      campaign.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      campaign.org_name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDateRange = (!startDate || new Date(campaign.created_at) >= startDate) &&
                           (!endDate || new Date(campaign.created_at) <= endDate);

          const matchesOrgFilter = selectedOrgFilter === 'all' || campaign.org_id === selectedOrgFilter;
          const matchesStatusFilter = selectedStatusFilter === 'all' || campaign.state === selectedStatusFilter;

    return matchesSearch && matchesDateRange && matchesOrgFilter && matchesStatusFilter;
  }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()); // Sort by created_at in descending order

  // Pagination calculations
  const totalPages = Math.ceil(filteredCampaigns.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCampaigns = filteredCampaigns.slice(startIndex, endIndex);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Draft': return 'bg-yellow-100 text-yellow-800';
      case 'Completed': return 'bg-blue-100 text-blue-800';
      case 'Paused': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleCopyCampaign = async (campaign: any) => {
    try {
      const payload = {
        copiedAt: new Date().toISOString(),
        version: 1,
        campaign,
      };
      const text = JSON.stringify(payload, null, 2);
      localStorage.setItem(COPY_STORAGE_KEY, text);
      try { await navigator.clipboard.writeText(text); } catch {}
      toast({ title: 'Campaign copied', description: `"${campaign.name}" details saved for new campaign prefill.` });
    } catch (e) {
      console.error('Failed to copy campaign', e);
      toast({ title: 'Copy failed', description: 'Could not copy campaign data', variant: 'destructive' });
    }
  };

  const handleEdit = (campaign: Campaign) => {
    // Navigate to dedicated edit page which handles its own data loading
    navigate(`/campaigns/${campaign.id}/edit`);
  };

  const handleSubmit = async (data: CampaignFormData) => {
    console.log('handleSubmit called with data:', data);
    setIsSubmitting(true);
    try {
      // Convert variables array to object
      const promptVariables = {};
      variables.forEach((variable: KeyValuePair) => {
        promptVariables[variable.key] = variable.value;
      });

      // Prepare the request data according to API structure (curl example)
      let requestData;
      if (editingCampaign) {
        requestData = {
          campaign_id: data.campaign_id,
          id: editingCampaign.id,
        name: data.name,
        direction: data.direction,
        inbound_number: "",
        caller_id_number: "",
        state: data.state,
          version: "0",
        llm: {
            initialMessage: "",
            useProxyLlm: false,
            UseStructuredPrompt: false,
          provider: "OPENAI",
          promptJson: {
              skeleton: "Simple output format.",
              promptVariables,
              knowledgeBase: data.knowledge_base,
            nodes: {},
            context: contextValue || "",
              botStateDefinitions: {},
            language: data.tts?.language || "hindi",
              mermaidGraph: "initial_message -->|edge| node1\nnode1 -->|edge| node2"
          },
          temperature: "0.5",
            maxCallDuration: "300",
            model: "gpt-4o",
          useEmbeddings: false,
            prompt: ""
        },
        tts: {
          gender: data.tts.gender,
            voice_id: data.tts.voice_id,
          language: data.tts.language,
            vendor: data.tts.vendor || "11labs"
          },
          stt: {
            vendor: data.stt?.vendor || 'deepgram'
          },
          speech_setting: {
            interruption: {
              status: allowInterruptions
            },
            ambient_sound: {
              status: ambientStatus,
              sound: sound,
              volume: String(volume)
            }
          },
          retry: {},
        live_actions: [],
          post_call_actions: {
            data_extracted: {
              system_prompt: data.post_call_actions.data_extracted?.system_prompt || '',
              fields: data.post_call_actions.data_extracted?.fields || {}
            },
            categories: {
              system_prompt: data.post_call_actions.categories?.system_prompt || '',
              fields: data.post_call_actions.categories?.fields || {}
            }
          },
        callback_endpoint: data.callback_endpoint || "",
          timezone: "Asia/Kolkata",
          telephonic_provider: data.telephonic_provider,
          allow_interruption: allowInterruptions,
          created_at: editingCampaign.created_at,
        updated_at: new Date().toISOString(),
          org_id: data.org_id,
        };
      } else {
        // Get user ID from localStorage
        let createdBy = undefined;
        try {
          const userData = JSON.parse(localStorage.getItem('userData') || '{}');
          createdBy = userData.id;
        } catch {}
        requestData = {
          campaign_id: data.campaign_id,
          created_by: createdBy,
          live_actions: [],
          allow_interruption: allowInterruptions,
        telephonic_provider: data.telephonic_provider,
          version: "0",
          account_id: "a43b689f-b95f-4178-a7c7-7cfd547a1f68",
          post_call_actions: {
            data_extracted: {
              system_prompt: data.post_call_actions.data_extracted?.system_prompt || '',
              fields: data.post_call_actions.data_extracted?.fields || {}
            },
            categories: {
              system_prompt: data.post_call_actions.categories?.system_prompt || '',
              fields: data.post_call_actions.categories?.fields || {}
            }
          },
          name: data.name,
          retry: {},
          llm: {
            initialMessage: "",
            useProxyLlm: false,
            UseStructuredPrompt: false,
            provider: "OPENAI",
            promptJson: {
              skeleton: "Simple output format.",
              promptVariables,
              context: contextValue || "",
              botStateDefinitions: {},
              language: data.tts?.language || "hindi",
              mermaidGraph: "initial_message -->|edge| node1\nnode1 -->|edge| node2"
            },
            temperature: "0.5",
            maxCallDuration: "300",
            model: "gpt-4o",
            useEmbeddings: false,
            prompt: ""
          },
          state: data.state,
          tts: {
            gender: data.tts.gender,
            voice_id: data.tts.voice_id,
            language: data.tts.language,
            vendor: data.tts.vendor || "11labs"
          },
          stt: {
            vendor: data.stt?.vendor || 'deepgram'
          },
          speech_setting: {
            interruption: {
              status: allowInterruptions
            },
            ambient_sound: {
              status: ambientStatus,
              sound: sound,
              volume: String(volume)
            }
          },
          inbound_number: "",
          caller_id_number: "",
          direction: data.direction,
          timezone: "Asia/Kolkata",
          callback_endpoint: data.callback_endpoint || "",
          org_id: data.org_id,
        };
      }
      // Remove FormData and Excel template logic for campaign create/edit
      // Send JSON body instead
      const url = editingCampaign 
        ? `http://localhost:8000/api/v1/campaigns/${editingCampaign.id}`
        : 'http://localhost:8000/api/v1/campaigns/';

      const response = await fetch(url, {
        method: editingCampaign ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || (editingCampaign ? 'Failed to update campaign' : 'Failed to create campaign'));
      }

      const savedCampaign = await response.json();
      console.log('Saved campaign:', savedCampaign);
      
      if (editingCampaign) {
        setCampaigns(prev => prev.map(camp => 
          camp.id === editingCampaign.id ? {
            ...camp,
            ...savedCampaign,
            name: savedCampaign.name,
            direction: savedCampaign.direction,
            state: savedCampaign.state,
            language: savedCampaign.tts?.language || 'N/A',
            voice_id: savedCampaign.tts?.voice_id || 'N/A',
            telephonic_provider: savedCampaign.telephonic_provider,
            created_at: savedCampaign.created_at,
            updated_at: savedCampaign.updated_at,
            tts: savedCampaign.tts,
            org_id: savedCampaign.org_id,
            knowledge_base: savedCampaign.knowledge_base,
            post_call_actions: savedCampaign.post_call_actions,
            is_active: savedCampaign.is_active
          } : camp
        ));
        toast({
          title: "Success",
          description: "Campaign updated successfully",
        });
      } else {
        const newCampaign = {
          ...savedCampaign,
          language: savedCampaign.tts?.language || 'N/A',
          voice_id: savedCampaign.tts?.voice_id || 'N/A',
          status: savedCampaign.is_active ? 'Active' : 'Inactive',
          type: savedCampaign.direction === 'INBOUND' ? 'Inbound' : 'Outbound'
        };
        setCampaigns(prev => [newCampaign, ...prev]);
        toast({
          title: "Success",
          description: "Campaign created successfully",
        });
      }
      
      setIsCreateDialogOpen(false);
      setEditingCampaign(null);
      resetForm();
    } catch (error) {
      console.error('Error saving campaign:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save campaign",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    form.reset(defaultValues);
    setCurrentStep(1);
    setResponses([]);
    setVariables([]);
    setDataExtractionFields([]);
    setKnowledgeBaseFiles([]);
    setKnowledgeBaseUrls([]);
    setCategorization([]);
    setContextValue('');
    setSelectedFile(null);
    setKnowledgeBaseUrl('');
  };

  const handleDelete = async (campaign: any) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return;

    try {
      const response = await fetch(`http://localhost:8000/api/v1/campaigns/${campaign.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to delete campaign: ${response.statusText}`);
      }

      // Update local state
      setCampaigns(prevCampaigns => prevCampaigns.filter(c => c.id !== campaign.id));

      toast({
        title: "Success",
        description: "Campaign deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting campaign:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete campaign. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      setKnowledgeBaseFiles(Array.from(files));
    }
  };

  const handleFileUploadSubmit = async (campaignId: string) => {
    if (!uploadFile) {
      toast({
        title: "Error",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);

      const response = await fetch(`http://localhost:8000/api/v1/campaigns/${campaignId}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload file');
      }

      toast({
        title: "Success",
        description: "File uploaded successfully",
      });

      setIsUploadDialogOpen(false);
      setUploadFile(null);
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload file",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleBulkCallSubmit = async () => {
    if (!bulkCallFile || !selectedCampaignForBulkCall) {
      toast({
        title: "Error",
        description: "Please select a file and campaign for bulk calling",
        variant: "destructive",
      });
      return;
    }

    setIsBulkCalling(true);
    try {
      // Get user ID from localStorage
      const userData = localStorage.getItem('userData') 
        ? JSON.parse(localStorage.getItem('userData') || '{}')
        : null;
      
      const userId = userData?.id || userData?.user_id || 'unknown';
      
      if (userId === 'unknown') {
        toast({
          title: "Authentication Error",
          description: "Unable to identify user. Please log in again.",
          variant: "destructive",
        });
        return;
      }

      const formData = new FormData();
      formData.append('file', bulkCallFile);
      formData.append('campaign_id', selectedCampaignForBulkCall.id);
      formData.append('org_id', selectedCampaignForBulkCall.org_id);
      formData.append('user_id', userId);
      formData.append('sleep_seconds', '5'); // Reduced from 100 to 5 seconds
      formData.append('channels', '16'); // Dynamic channel allocation
      formData.append('worker_prefetch', '5'); // Worker prefetch count
      formData.append('batch_size', '50'); // Batch size for processing

      console.log('CallHistory: Initiating bulk calls with FormData:', {
        campaign_id: selectedCampaignForBulkCall.id,
        org_id: selectedCampaignForBulkCall.org_id,
        user_id: userId,
        sleep_seconds: 5,
        channels: 16,
        worker_prefetch: 5,
        batch_size: 50,
        file: bulkCallFile.name
      });

      const response = await fetch('http://localhost:8000/api/v1/rabbitmq-bulk-calls/rabbitmq-bulk-calls', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to initiate bulk calls');
      }

      const result = await response.json();
      console.log('Bulk calls initiated:', result);

      toast({
        title: "Success",
        description: `Bulk calls initiated successfully. ${result.message}. Estimated processing time: ${result.estimated_processing_time}`,
      });

      // Reset form and close dialog
      setIsBulkCallDialogOpen(false);
      setSelectedCampaignForBulkCall(null);
      setBulkCallFile(null);
    } catch (error) {
      console.error('Error initiating bulk calls:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to initiate bulk calls",
        variant: "destructive",
      });
    } finally {
      setIsBulkCalling(false);
    }
  };

  const onCallSubmit = async (data: any) => {
    // Get user ID from localStorage
    const userData = localStorage.getItem('userData') 
      ? JSON.parse(localStorage.getItem('userData') || '{}')
      : null;
    
    const userId = userData?.id || userData?.user_id || 'unknown';
    
    if (userId === 'unknown') {
      toast({
        title: "Authentication Error",
        description: "Unable to identify user. Please log in again.",
        variant: "destructive",
      });
      return;
    }

    // Get the variable keys from the selected campaign
    const variableKeys = Object.keys(selectedCampaignForCall?.llm?.promptJson?.promptVariables || {}).filter(
      key => key !== 'mobile_number' && key !== 'caller_name'
    );
    // Build dynamic_variables from user input
    let dynamic_variables: Record<string, string> = {};
    variableKeys.forEach(key => {
      dynamic_variables[key] = data[key];
    });
    dynamic_variables.mobile_number = data.mobileNumber;
    if (data.callerName) dynamic_variables.caller_name = data.callerName;

    const callRequest = {
      to_number: data.mobileNumber,
      dynamic_variables,
      call_metadata: {
        org_id: selectedCampaignForCall?.org_id || "",
        user_id: userId
      },
      campaign_id: selectedCampaignForCall?.id || ""
    };

    try {
      const response = await fetch('http://localhost:8000/api/v1/calls/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(callRequest)
      });

      if (!response.ok) {
        throw new Error('Failed to initiate call');
      }

      const result = await response.json();
      console.log("Call initiated:", result);

      toast({
        title: "Call Initiated",
        description: `Calling ${data.callerName || ''} at ${data.mobileNumber}`,
      });

      setIsCallDialogOpen(false);
      callForm.reset();
    } catch (error) {
      console.error("Error initiating call:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to initiate call. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAddVariable = (
    list: VariableItem[],
    setList: React.Dispatch<React.SetStateAction<VariableItem[]>>,
    form: any,
    formPath: string
  ) => {
    const newPair = { key: '', value: '' };
    setList([...list, newPair]);
    const currentValue = form.getValues(formPath) || {};
    form.setValue(formPath, { ...currentValue, [newPair.key]: newPair.value });
  };

  const handleRemoveVariable = (
    index: number,
    list: VariableItem[],
    setList: React.Dispatch<React.SetStateAction<VariableItem[]>>,
    form: any,
    formPath: string
  ) => {
    const newList = list.filter((_, i) => i !== index);
    setList(newList);
    const newValue = {};
    newList.forEach(pair => {
      newValue[pair.key] = pair.value;
    });
    form.setValue(formPath, newValue);
  };

  const handleVariableChange = (
    index: number,
    field: 'key' | 'value',
    value: string,
    list: VariableItem[],
    setList: React.Dispatch<React.SetStateAction<VariableItem[]>>,
    form: any,
    formPath: string
  ) => {
    const newList = [...list];
    const oldKey = newList[index].key;
    newList[index][field] = value;
    setList(newList);

    const formValue = {};
    newList.forEach(pair => {
      formValue[pair.key] = pair.value;
    });
    form.setValue(formPath, formValue);
  };

  // Download Excel template for bulk calling
  const downloadTemplate = () => {
    // Create sample data for the template
    const templateData = [
      { 'Mobile Number': '1234567890', 'Name': 'John Doe', 'Location': 'New York' },
      { 'Mobile Number': '0987654321', 'Name': 'Jane Smith', 'Location': 'Los Angeles' },
      { 'Mobile Number': '5555555555', 'Name': 'Bob Johnson', 'Location': 'Chicago' }
    ];

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(templateData);

    // Set column widths
    ws['!cols'] = [
      { wch: 15 }, // Mobile Number
      { wch: 20 }, // Name
      { wch: 20 }  // Location
    ];

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Bulk Call Template');

    // Generate and download the file
    XLSX.writeFile(wb, 'bulk_call_template.xlsx');
  };

  const handleCall = (campaign: Campaign) => {
    setSelectedCampaignForCall(campaign);
    setPhoneNumber('');
    setPhoneError('');
    setTestCallVariables({}); // Reset variables when opening dialog
    setIsCallDialogOpen(true);
  };

  const validatePhoneNumber = (phone: string): boolean => {
    // Remove all non-digit characters except +
    let cleaned = phone.replace(/[^\d+]/g, '');
    
    // Auto-add +91 for Indian numbers (10 digits starting with 6,7,8,9)
    if (!cleaned.startsWith('+') && cleaned.length === 10 && /^[6-9]/.test(cleaned)) {
      cleaned = '+91' + cleaned;
      setPhoneNumber(cleaned); // Update the input field
    }
    
    // Check if it starts with + and has 10-15 digits after
    const phoneRegex = /^\+[1-9]\d{9,14}$/;
    
    if (!cleaned.startsWith('+')) {
      setPhoneError('Phone number must start with country code (e.g., +1, +91)');
      return false;
    }
    
    if (!phoneRegex.test(cleaned)) {
      setPhoneError('Please enter a valid phone number with country code (e.g., +1234567890)');
      return false;
    }
    
    setPhoneError('');
    return true;
  };

  const handlePhoneNumberChange = (value: string) => {
    setPhoneNumber(value);
    if (phoneError) {
      setPhoneError('');
    }
  };

  const makeCall = async () => {
    if (!selectedCampaignForCall) return;
    
    if (!validatePhoneNumber(phoneNumber)) {
      return;
    }

    setIsCalling(true);
    
    // Debug: Log campaign data
    console.log('🔍 Debug - Selected campaign:', selectedCampaignForCall);
    console.log('🔍 Debug - Campaign LLM:', selectedCampaignForCall.llm);
    console.log('🔍 Debug - Prompt Variables:', selectedCampaignForCall.llm?.promptJson?.promptVariables);
    
    try {
      // Use testCallVariables from dialog inputs instead of campaign defaults
      const dynamicVariables = {
        mobile_number: phoneNumber,
        ...testCallVariables
      };
      
      console.log('🔍 Debug - Final dynamic variables:', dynamicVariables);
      
      const response = await fetch('http://localhost:8000/api/v1/calls', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          campaign_id: selectedCampaignForCall.id,
          to_number: phoneNumber,
          dynamic_variables: dynamicVariables,
          call_metadata: {
            org_id: selectedCampaignForCall.org_id || 'org_1',
            user_id: localStorage.getItem('userId') || 'user_1'
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to initiate call');
      }

      const result = await response.json();
      toast({
        title: "Call Initiated",
        description: `Call to ${phoneNumber} has been started successfully. Call ID: ${result.call_id}`,
      });

      // Close dialog and reset state
      setIsCallDialogOpen(false);
      setPhoneNumber('');
      setSelectedCampaignForCall(null);

    } catch (error) {
      console.error('Error making call:', error);
      toast({
        title: "Call Failed",
        description: error instanceof Error ? error.message : 'Failed to initiate call',
        variant: "destructive"
      });
    } finally {
      setIsCalling(false);
    }
  };

  const handleView = async (campaign: Campaign) => {
    try {
      // Fetch the complete campaign data first
      const response = await fetch(`http://localhost:8000/api/v1/campaigns/${campaign.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch campaign details');
      }

      const campaignData = await response.json();
      console.log('Fetched campaign data for view:', campaignData);
      setViewingCampaign(campaignData);
    } catch (error) {
      console.error('Error fetching campaign details:', error);
      toast({
        title: "Error",
        description: "Failed to load campaign details",
        variant: "destructive",
      });
    }
  };

  const handleExportToCSV = () => {
    // Convert campaigns data to CSV format
    const headers = ['Campaign Name', 'Organization', 'Direction', 'Status', 'Language', 'Voice ID', 'Provider', 'Created At', 'Updated At'];
    const csvData = filteredCampaigns.map(campaign => [
      campaign.name,
      campaign.org_name,
      campaign.direction,
      campaign.state,
      campaign.language,
      campaign.voice_id,
      campaign.telephonic_provider,
      new Date(campaign.created_at).toLocaleString(),
      new Date(campaign.updated_at).toLocaleString()
    ]);

    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');

    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `campaigns_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const CampaignCreation = () => {
    return (
      <div className="space-y-6">
        {/* Step Indicator */}
        <div className="bg-gradient-to-r from-white to-blue-50/30 rounded-lg p-6 border shadow-sm">
          <div className="flex justify-between relative">
            {/* Progress Line */}
            <div className="absolute top-4 left-0 w-full h-0.5 bg-gray-200">
              <div 
                className="h-full bg-blue-500 transition-all duration-300 ease-in-out"
                style={{ width: `${((currentStep - 1) / 4) * 100}%` }}
                />
              </div>
              
            {['Name', 'Speech and Call', 'Voice', 'Flow', 'Telephony', 'Post Call Actions'].map((step, index) => (
              <div
                key={step}
                className={`flex flex-col items-center relative ${
                  currentStep === index + 1 
                    ? 'text-blue-600' 
                    : index + 1 < currentStep 
                      ? 'text-blue-500' 
                      : 'text-gray-400'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 transition-all duration-200 ${
                  currentStep === index + 1 
                    ? 'bg-blue-600 text-white ring-4 ring-blue-100 shadow-lg scale-110' 
                    : index + 1 < currentStep 
                      ? 'bg-blue-500 text-white'
                      : 'bg-white border-2 border-gray-200'
                }`}>
                  {index + 1 < currentStep ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span className="text-sm font-semibold">{index + 1}</span>
                  )}
                  </div>
                <span className={`text-sm font-medium ${
                  currentStep === index + 1 
                    ? 'text-blue-600' 
                    : index + 1 < currentStep 
                      ? 'text-blue-500' 
                      : 'text-gray-400'
                }`}>{step}</span>
              </div>
            ))}
                </div>
              </div>

        <Form {...form}>
          <form onSubmit={(e) => e.preventDefault()}>
            <div className="space-y-4">
              <div className="bg-white rounded-lg border shadow-sm">
                <div className="p-6">
                  <div className="space-y-6">
                    {currentStep === 1 && (
                      <div>
                        <div className="mb-4">
                          <FormField
                            control={form.control}
                            name="campaign_id"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Campaign ID</FormLabel>
                                <Input {...field} placeholder="Campaign ID" className="h-9 text-sm" />
                                <FormDescription className="text-xs text-gray-500 mt-1">
                                  Unique identifier for this campaign. You can edit this value.
                                </FormDescription>
                              </FormItem>
                            )}
                          />
                        </div>
                        <StepLanguage form={form} organizations={organizations} />
                      </div>
                    )}

                    {currentStep === 2 && (
                      <div className="w-full max-w-screen-lg mx-auto px-0 md:px-0">
                        <div className="glass-card relative rounded-lg shadow border border-white/30 p-0 flex flex-col md:flex-row gap-0 items-stretch font-inter overflow-hidden">
                          {/* Speech Section */}
                          <div className="flex-1 bg-blue-50/40 rounded-none p-6 min-w-0 border-r border-blue-100 flex flex-col justify-center" style={{paddingRight: 0}}>
                            <div className="flex items-center gap-2 mb-4 pl-2">
                              <span className="icon-animate bg-blue-100 p-1 rounded-full"><Mic className="w-5 h-5 text-blue-600" /></span>
                              <h4 className="font-extrabold text-lg text-blue-900 tracking-tight">Speech</h4>
                            </div>
                            <div className="flex flex-col gap-4 pl-10">
                              {/* Allow Interruptions */}
                      <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <Mic className="w-4 h-4 text-blue-400" />
                                  <span className="text-blue-700 font-medium">Allow Interruptions</span>
                                  <TooltipProvider><Tooltip><TooltipTrigger asChild><span className="icon-animate align-middle"><Info className="w-4 h-4 text-blue-400 inline" /></span></TooltipTrigger><TooltipContent>Allow the caller to interrupt the agent's speech.</TooltipContent></Tooltip></TooltipProvider>
                                </div>
                                <div className="mt-1"><button className={`relative w-10 h-6 rounded-full transition-colors duration-200 focus:outline-none border-2 border-blue-100 shadow-sm flex items-center ${allowInterruptions ? 'bg-blue-500' : 'bg-gray-200'}`} aria-pressed={allowInterruptions} onClick={() => setAllowInterruptions(!allowInterruptions)}><span className={`absolute left-1 top-0.5 w-4 h-4 rounded-full shadow-md transition-transform duration-200 flex items-center justify-center ${allowInterruptions ? 'translate-x-4 bg-white' : 'bg-white'}`} style={{ boxShadow: allowInterruptions ? '0 0 8px 2px #3b82f6aa' : '0 1px 4px #cbd5e1' }}><Mic className={`w-3 h-3 transition-colors duration-200 ${allowInterruptions ? 'text-blue-500' : 'text-gray-400'} ${allowInterruptions ? 'scale-100' : 'scale-0'}`} /><Mic className={`w-3 h-3 absolute transition-colors duration-200 ${allowInterruptions ? 'scale-0' : 'scale-100'} text-gray-400`} /></span></button></div>
                              </div>
                              {/* Ambient Status */}
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <Volume2 className="w-4 h-4 text-blue-400" />
                                  <span className="text-blue-700 font-medium">Ambient Status</span>
                                  <TooltipProvider><Tooltip><TooltipTrigger asChild><span className="icon-animate align-middle"><Info className="w-4 h-4 text-blue-400 inline" /></span></TooltipTrigger><TooltipContent>Enable or disable ambient background sound.</TooltipContent></Tooltip></TooltipProvider>
                                </div>
                                <div className="mt-1"><button className={`relative w-10 h-6 rounded-full transition-colors duration-200 focus:outline-none border-2 border-blue-100 shadow-sm flex items-center ${ambientStatus ? 'bg-blue-500' : 'bg-gray-200'}`} aria-pressed={ambientStatus} onClick={() => setAmbientStatus(!ambientStatus)}><span className={`absolute left-1 top-0.5 w-4 h-4 rounded-full shadow-md transition-transform duration-200 flex items-center justify-center ${ambientStatus ? 'translate-x-4 bg-white' : 'bg-white'}`} style={{ boxShadow: ambientStatus ? '0 0 8px 2px #3b82f6aa' : '0 1px 4px #cbd5e1' }}><Volume2 className={`w-3 h-3 transition-colors duration-200 ${ambientStatus ? 'text-blue-500' : 'text-gray-400'} ${ambientStatus ? 'scale-100' : 'scale-0'}`} /><Volume2 className={`w-3 h-3 absolute transition-colors duration-200 ${ambientStatus ? 'scale-0' : 'scale-100'} text-gray-400`} /></span></button></div>
                              </div>
                              {/* Sound */}
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="inline-block"><svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l-2 2H5a2 2 0 00-2 2v4a2 2 0 002 2h2l2 2z" /></svg></span>
                                  <span className="text-blue-700 font-medium">Sound</span>
                                  <TooltipProvider><Tooltip><TooltipTrigger asChild><span className="icon-animate align-middle"><Info className="w-4 h-4 text-blue-400 inline" /></span></TooltipTrigger><TooltipContent>Select the type of background sound.</TooltipContent></Tooltip></TooltipProvider>
                                </div>
                                <div className="mt-1"><select className="rounded border border-blue-200 bg-white px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-300" value={sound} onChange={e => setSound(e.target.value)} style={{ minWidth: 110 }}><option value="call-center">Call Center</option><option value="coffee-shop">Coffee Shop</option><option value="office">Office</option></select></div>
                              </div>
                              {/* Volume */}
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="inline-block"><svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3" /></svg></span>
                                  <span className="text-blue-700 font-medium">Volume</span>
                                  <TooltipProvider><Tooltip><TooltipTrigger asChild><span className="icon-animate align-middle"><Info className="w-4 h-4 text-blue-400 inline" /></span></TooltipTrigger><TooltipContent>Set the background sound volume (0 to 1).</TooltipContent></Tooltip></TooltipProvider>
                                </div>
                                <div className="flex items-center gap-2 mt-1"><input type="range" min={0} max={1} step={0.01} value={volume} onChange={e => setVolume(Number(e.target.value))} className="accent-blue-500 w-24" /><span className="text-xs text-gray-700 w-8 text-right">{volume}</span></div>
                              </div>
                            </div>
                          </div>
                          {/* Call Section */}
                          <div className="flex-1 bg-blue-50/40 rounded-none p-6 min-w-0 flex flex-col justify-center" style={{paddingLeft: 0}}>
                            <div className="flex items-center gap-2 mb-4 pl-2">
                              <span className="icon-animate bg-blue-100 p-1 rounded-full"><Clock className="w-5 h-5 text-blue-600" /></span>
                              <h4 className="font-extrabold text-lg text-blue-900 tracking-tight">Call</h4>
                            </div>
                            <div className="flex flex-col gap-6 pl-10">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-sm font-semibold text-gray-800 flex items-center">Max idle reminder</span>
                                  <TooltipProvider><Tooltip><TooltipTrigger asChild><span className="icon-animate"><Info className="w-4 h-4 text-blue-400" /></span></TooltipTrigger><TooltipContent>When a caller is idle, the agent repeats the last question.</TooltipContent></Tooltip></TooltipProvider>
                                </div>
                                <span className="text-xs text-gray-500 block mb-1">When a caller is idle, the agent repeats the last question.</span>
                                <div className="flex gap-2 mt-1 flex-nowrap overflow-x-auto pb-1">
                                  {[3,5,7,9].map((sec) => (
                                    <label key={sec} className="group flex items-center cursor-pointer">
                                      <input type="radio" name="maxIdleReminder" className="sr-only" checked={maxIdleReminder === Number(sec)} onChange={() => setMaxIdleReminder(Number(sec))} />
                                      <span className={`rounded-full border border-blue-200 px-2 py-1 text-xs font-medium transition-colors duration-200 ${maxIdleReminder === Number(sec) ? 'bg-blue-500 text-white border-blue-500 shadow' : 'bg-white text-blue-700 hover:bg-blue-100'}`}>{sec} secs</span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-sm font-semibold text-gray-800 flex items-center">Max idle duration</span>
                                  <TooltipProvider><Tooltip><TooltipTrigger asChild><span className="icon-animate"><Hourglass className="w-4 h-4 text-blue-400" /></span></TooltipTrigger><TooltipContent>Set the total time the agent will issue idle reminders before hanging up.</TooltipContent></Tooltip></TooltipProvider>
                                </div>
                                <span className="text-xs text-gray-500 block mb-1">Set the total time the agent will issue idle reminders before hanging up</span>
                                <div className="flex gap-2 mt-1 flex-nowrap overflow-x-auto pb-1">
                                  {[5,10,20,30].map((sec) => (
                                    <label key={sec} className="group flex items-center cursor-pointer">
                                      <input type="radio" name="maxIdleDuration" className="sr-only" checked={maxIdleDuration === Number(sec)} onChange={() => setMaxIdleDuration(Number(sec))} />
                                      <span className={`rounded-full border border-blue-200 px-2 py-1 text-xs font-medium transition-colors duration-200 ${maxIdleDuration === Number(sec) ? 'bg-blue-500 text-white border-blue-500 shadow' : 'bg-white text-blue-700 hover:bg-blue-100'}`}>{sec} secs</span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {currentStep === 3 && (
                      <div>
                        <StepVoice form={form} selectedVoiceId={form.getValues('tts.voice_id')} />
                      </div>
                    )}

                    {currentStep === 4 && (
                      <div>
                        <StepFlow
                          form={form}
                          activeFlowTab={activeFlowTab}
                          setActiveFlowTab={setActiveFlowTab}
                          contextValue={contextValue}
                          setContextValue={setContextValue}
                          responses={responses}
                          setResponses={setResponses}
                          variables={variables}
                          setVariables={setVariables}
                          selectedFile={selectedFile}
                          setSelectedFile={setSelectedFile}
                          handleKeyValueChange={handleKeyValueChange}
                          handleAddKeyValuePair={handleAddKeyValuePair}
                          handleRemoveKeyValuePair={handleRemoveKeyValuePair}
                        />
                      </div>
                    )}

                    {currentStep === 5 && (
                      <div>
                        <StepTelephony form={form} />
                      </div>
                    )}

                    {currentStep === 6 && (
                      <div>
                        <StepPostCall
                          form={form}
                          categorization={categorization}
                          setCategorization={setCategorization}
                          dataExtractionFields={dataExtractionFields}
                          setDataExtractionFields={setDataExtractionFields}
                          handleKeyValueChange={handleKeyValueChange}
                          handleAddKeyValuePair={handleAddKeyValuePair}
                          handleRemoveKeyValuePair={handleRemoveKeyValuePair}
                          dataExtractionSystemPrompt={dataExtractionSystemPrompt}
                          setDataExtractionSystemPrompt={setDataExtractionSystemPrompt}
                          categoriesSystemPrompt={categoriesSystemPrompt}
                          setCategoriesSystemPrompt={setCategoriesSystemPrompt}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 px-2 sticky bottom-0 bg-white border-t">
                {currentStep > 1 ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={prevStep}
                    className="h-9 px-4 text-sm border-gray-200 hover:bg-gray-50"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Previous
                  </Button>
                ) : (
                  <div></div>
                )}
                
                {currentStep < 6 ? (
                  <Button
                    type="button"
                    onClick={nextStep}
                    className="h-9 px-4 text-sm bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Next
                    <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Button>
                ) : (
                  <Button
                    type="button"
                    disabled={isSubmitting}
                    className="h-9 px-4 text-sm bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                    onClick={async () => {
                      const isValid = await form.trigger();
                      if (isValid) {
                        const formData = form.getValues() as CampaignFormData;
                        handleSubmit(formData);
                      } else {
                        // Collect missing/invalid fields
                        const errors = form.formState.errors;
                        let missingFields = Object.keys(errors).map(key => {
                          switch (key) {
                            case 'campaign_id': return 'Campaign ID';
                            case 'name': return 'Campaign Name';
                            case 'direction': return 'Direction';
                            case 'state': return 'State';
                            case 'org_id': return 'Organization';
                            case 'tts': return 'Voice Settings';
                            case 'stt': return 'STT Settings';
                            case 'telephonic_provider': return 'Telephony Provider';
                            case 'knowledge_base': return 'Knowledge Base';
                            // Remove custom post_call_actions validation
                            default: return key;
                          }
                        });
                        toast({
                          title: "Validation Error",
                          description: `Please fill in all required fields correctly: ${missingFields.join(', ')}`,
                          variant: "destructive",
                        });
                      }
                    }}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Save Campaign
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </form>
        </Form>
              </div>
    );
  };

  // When opening the call dialog, set form default values from promptVariables
  const handleOpenCallDialog = (campaign) => {
    // Prepare default values for the form from promptVariables
    const promptVars = campaign.llm?.promptJson?.promptVariables || {};
    const callFormDefaults: Record<string, string> = {};
    Object.keys(promptVars).forEach((key) => {
      if (key !== 'mobile_number' && key !== 'caller_name') callFormDefaults[key] = promptVars[key];
    });
    callFormDefaults['mobileNumber'] = '';
    callForm.reset(callFormDefaults);
    setSelectedCampaignForCall(campaign);
    setIsCallDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 overflow-x-hidden">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-200/50 shadow-sm">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg">
                  <BarChart className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
                    Campaigns
                  </h1>
                        <p className="text-sm text-gray-600 mt-1">
                    {filteredCampaigns.length} Total Campaigns • Showing {startIndex + 1}-{Math.min(endIndex, filteredCampaigns.length)} • Voice automation & management
                  </p>
                </div>
              </div>
                </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 py-6">

        {/* Enhanced Toolbar */}
        <div className="bg-white/70 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200/50 mb-6 p-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search Bar */}
            <div className="relative flex-1 max-w-[400px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search campaigns..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 bg-white/80 backdrop-blur-sm"
              />
            </div>

            {/* Date Range Filters */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-[140px]">
                  <DatePicker
                    selected={startDate}
                    onChange={(date: Date) => setStartDate(date)}
                    className="w-full h-10 rounded-lg border border-gray-200 bg-white/80 backdrop-blur-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    placeholderText="From date"
                    isClearable
                    showMonthDropdown
                    showYearDropdown
                    dropdownMode="select"
                    dateFormat="MMM dd, yyyy"
                    maxDate={endDate || undefined}
                    customInput={
                      <Button variant="outline" className="w-full h-10 justify-start text-left font-normal border-gray-200 bg-white/80 hover:bg-gray-50/80">
                        <CalendarIcon className="mr-2 h-4 w-4 text-gray-500" />
                        {startDate ? format(startDate, "MMM dd, yyyy") : "From date"}
                      </Button>
                    }
                  />
                </div>
                <span className="text-gray-400 font-medium">to</span>
                <div className="w-[140px]">
                  <DatePicker
                    selected={endDate}
                    onChange={(date: Date) => setEndDate(date)}
                    className="w-full h-10 rounded-lg border border-gray-200 bg-white/80 backdrop-blur-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    placeholderText="To date"
                    isClearable
                    showMonthDropdown
                    showYearDropdown
                    dropdownMode="select"
                    dateFormat="MMM dd, yyyy"
                    minDate={startDate || undefined}
                    customInput={
                      <Button variant="outline" className="w-full h-10 justify-start text-left font-normal border-gray-200 bg-white/80 hover:bg-gray-50/80">
                        <CalendarIcon className="mr-2 h-4 w-4 text-gray-500" />
                        {endDate ? format(endDate, "MMM dd, yyyy") : "To date"}
                      </Button>
                    }
                  />
                </div>
              </div>

              {/* Organization Filter */}
              <div className="flex items-center gap-2">
                <Label htmlFor="org-filter" className="text-sm font-medium text-gray-700 whitespace-nowrap">
                  Organization:
                </Label>
                <Select value={selectedOrgFilter} onValueChange={setSelectedOrgFilter}>
                  <SelectTrigger className="w-[200px] h-10 border-gray-200 bg-white/80">
                    <SelectValue placeholder="All Organizations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Organizations</SelectItem>
                    {organizations.map((org) => (
                      <SelectItem key={org.id} value={org.id}>
                        {org.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <Label htmlFor="status-filter" className="text-sm font-medium text-gray-700 whitespace-nowrap">
                  Status:
                </Label>
                <Select value={selectedStatusFilter} onValueChange={setSelectedStatusFilter}>
                  <SelectTrigger className="w-[150px] h-10 border-gray-200 bg-white/80">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="TRIAL">TRIAL</SelectItem>
                    <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                    <SelectItem value="INACTIVE">INACTIVE</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  onClick={handleExportToCSV}
                  className="bg-white/80 hover:bg-gray-50/80 h-10 border-gray-200 text-gray-700 hover:text-gray-900 shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <Download className="w-4 h-4 mr-2 text-gray-500" />
                  Export CSV
                </Button>
                {hasPermission('write', 'campaigns') && (
                  <Button 
                    onClick={() => navigate('/campaigns/new')} 
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white h-10 shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Campaign
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Table */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50 overflow-hidden">
          <div className="w-full">
            <Table className="w-full table-fixed">
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-gray-50/80 to-blue-50/30 hover:from-gray-50/80 hover:to-blue-50/30 border-b border-gray-200/50">
                  <TableHead className="font-bold text-gray-800 py-4 px-4 text-sm uppercase tracking-wide w-[18%]">Campaign Name</TableHead>
                  <TableHead className="font-bold text-gray-800 py-4 px-4 text-sm uppercase tracking-wide w-[12%]">Organization</TableHead>
                  <TableHead className="font-bold text-gray-800 py-4 px-4 text-sm uppercase tracking-wide w-[8%]">Direction</TableHead>
                  <TableHead className="font-bold text-gray-800 py-4 px-4 text-sm uppercase tracking-wide w-[8%]">Status</TableHead>
                  <TableHead className="font-bold text-gray-800 py-4 px-4 text-sm uppercase tracking-wide w-[10%]">Language</TableHead>
                  <TableHead className="font-bold text-gray-800 py-4 px-4 text-sm uppercase tracking-wide w-[12%]">Voice ID</TableHead>
                  <TableHead className="font-bold text-gray-800 py-4 px-4 text-sm uppercase tracking-wide w-[10%]">Provider</TableHead>
                  <TableHead className="font-bold text-gray-800 py-4 px-4 text-sm uppercase tracking-wide w-[12%]">Created At</TableHead>
                  <TableHead className="font-bold text-gray-800 py-4 px-4 text-sm uppercase tracking-wide w-[12%]">Updated At</TableHead>
                  <TableHead className="text-right font-bold text-gray-800 py-4 px-4 text-sm uppercase tracking-wide w-[12%]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-12">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
                        <p className="text-gray-600 font-medium">Loading campaigns...</p>
                        <p className="text-sm text-gray-400 mt-1">Please wait while we fetch your data</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredCampaigns.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-12">
                      <div className="flex flex-col items-center justify-center text-gray-500">
                        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                          <BarChart className="h-8 w-8 text-gray-400" />
                        </div>
                        <p className="text-xl font-semibold text-gray-700 mb-2">No campaigns found</p>
                        <p className="text-sm text-gray-400 mb-4">Try adjusting your search criteria or create a new campaign</p>
                        <Button 
                          onClick={() => navigate('/campaigns/new')}
                          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Create First Campaign
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedCampaigns.map((campaign, index) => (
                    <TableRow 
                      key={campaign.id} 
                      className={`group hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/30 transition-all duration-200 border-t border-gray-100/50 ${
                        index % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                      }`}
                    >
                      <TableCell className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                            <BarChart className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 group-hover:text-blue-900 transition-colors max-w-32 truncate" title={campaign.name}>
                              {campaign.name}
                            </p>
                            <p className="text-xs text-gray-500">Campaign</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-4 px-4">
                        <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200 transition-colors">
                          {campaign.org_name}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-4 px-4">
                        <Badge 
                          variant="outline" 
                          className={`font-medium px-3 py-1 rounded-full border-0 shadow-sm ${
                            campaign.direction === 'INBOUND' 
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' 
                              : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                          }`}
                        >
                          <div className={`w-2 h-2 rounded-full mr-2 ${
                            campaign.direction === 'INBOUND' ? 'bg-emerald-500' : 'bg-blue-500'
                          }`} />
                          {campaign.direction}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-4 px-4">
                        <Badge 
                          variant="outline" 
                          className={`font-medium px-3 py-1 rounded-full border-0 shadow-sm ${
                            campaign.state === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' :
                            campaign.state === 'TRIAL' ? 'bg-amber-100 text-amber-800 hover:bg-amber-200' :
                            'bg-gray-100 text-gray-800 hover:bg-gray-200'
                          }`}
                        >
                          <div className={`w-2 h-2 rounded-full mr-2 ${
                            campaign.state === 'ACTIVE' ? 'bg-emerald-500' :
                            campaign.state === 'TRIAL' ? 'bg-amber-500' :
                            'bg-gray-500'
                          }`} />
                          {campaign.state}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-4 px-4">
                        <span className="capitalize text-sm font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded-md">
                          {campaign.language}
                        </span>
                      </TableCell>
                      <TableCell className="py-4 px-4">
                        <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded-md text-gray-700 max-w-24 truncate block" title={campaign.voice_id}>
                          {campaign.voice_id}
                        </span>
                      </TableCell>
                      <TableCell className="py-4 px-4">
                        <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200 transition-colors">
                          {campaign.telephonic_provider}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-4 px-4">
                        <div className="text-sm text-gray-600">
                          <p className="font-medium">{new Date(campaign.created_at).toLocaleDateString()}</p>
                          <p className="text-xs text-gray-400">Created</p>
                        </div>
                      </TableCell>
                      <TableCell className="py-4 px-4">
                        <div className="text-sm text-gray-600">
                          <p className="font-medium">{new Date(campaign.updated_at).toLocaleDateString()}</p>
                          <p className="text-xs text-gray-400">Updated</p>
                        </div>
                      </TableCell>
                      <TableCell className="py-4 px-4">
                        <div className="flex justify-end space-x-2">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleCall(campaign)}
                            className="h-9 w-9 bg-green-50 hover:bg-green-100 text-green-600 hover:text-green-700 shadow-sm hover:shadow-md transition-all duration-200 group/btn"
                            title="Make Test Call"
                          >
                            <Phone className="h-4 w-4 group-hover/btn:scale-110 transition-transform" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleView(campaign.id)}
                            className="h-9 w-9 bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 shadow-sm hover:shadow-md transition-all duration-200 group/btn"
                            title="View Campaign"
                          >
                            <Eye className="h-4 w-4 group-hover/btn:scale-110 transition-transform" />
                          </Button>
                          {hasPermission('write', 'campaigns') && (
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleEdit(campaign)}
                              className="h-9 w-9 bg-amber-50 hover:bg-amber-100 text-amber-600 hover:text-amber-700 shadow-sm hover:shadow-md transition-all duration-200 group/btn"
                              title="Edit Campaign"
                            >
                              <Edit className="h-4 w-4 group-hover/btn:scale-110 transition-transform" />
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleCopyCampaign(campaign)}
                            className="h-9 w-9 bg-purple-50 hover:bg-purple-100 text-purple-600 hover:text-purple-700 shadow-sm hover:shadow-md transition-all duration-200 group/btn"
                            title="Copy Campaign"
                          >
                            <Copy className="h-4 w-4 group-hover/btn:scale-110 transition-transform" />
                          </Button>
                          {hasPermission('delete', 'campaigns') && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(campaign.id)}
                              className="h-9 w-9 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 shadow-sm hover:shadow-md transition-all duration-200 group/btn"
                              title="Delete Campaign"
                            >
                              <Trash2 className="h-4 w-4 group-hover/btn:scale-110 transition-transform" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Pagination Controls */}
        {!isLoading && filteredCampaigns.length > 0 && (
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 px-2">
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredCampaigns.length)} of {filteredCampaigns.length} campaigns
              </span>
              
              {/* Items per page dropdown */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 whitespace-nowrap">Show:</span>
                <Select
                  value={itemsPerPage.toString()}
                  onValueChange={(value) => setItemsPerPage(Number(value))}
                >
                  <SelectTrigger className="w-[80px] h-9 text-sm border-gray-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-4 h-9 text-sm border-gray-200 hover:bg-gray-50"
              >
                Previous
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 h-9 text-sm ${
                        currentPage === pageNum 
                          ? "bg-blue-600 hover:bg-blue-700 text-white" 
                          : "border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-4 h-9 text-sm border-gray-200 hover:bg-gray-50"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* View Campaign Dialog */}
      <Dialog open={!!viewingCampaign} onOpenChange={() => setViewingCampaign(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-primary flex items-center gap-2">
              {viewingCampaign?.name}
              <Badge variant={viewingCampaign?.is_active ? "default" : "secondary"}>
                {viewingCampaign?.is_active ? "Active" : "Inactive"}
              </Badge>
            </DialogTitle>
            <DialogDescription>
              View and manage campaign details and configuration
            </DialogDescription>
          </DialogHeader>
          <CampaignDetails campaign={viewingCampaign} />
        </DialogContent>
      </Dialog>

      {/* Call Dialog */}
      <Dialog open={isCallDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsCallDialogOpen(false);
          setSelectedCampaignForCall(null);
          callForm.reset();
        }
      }}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-primary">
              {selectedCampaignForCall?.name}
            </DialogTitle>
            <DialogDescription>
              Initiate a call for this campaign
            </DialogDescription>
          </DialogHeader>
          <CampaignCall
            campaign={selectedCampaignForCall}
            form={callForm}
            onSubmit={onCallSubmit}
            onCancel={() => setIsCallDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Add File Upload Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsUploadDialogOpen(false);
          setSelectedCampaignForUpload(null);
          setUploadFile(null);
        }
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-primary">
              Upload File - {selectedCampaignForUpload?.name}
            </DialogTitle>
            <DialogDescription>
              Upload a CSV file containing contact information for bulk calls
            </DialogDescription>
          </DialogHeader>
          <CampaignUpload
            campaign={selectedCampaignForUpload}
            uploadFile={uploadFile}
            isUploading={isUploading}
            onFileChange={(file) => setUploadFile(file)}
            onUpload={() => handleFileUploadSubmit(selectedCampaignForUpload?.id || '')}
            onCancel={() => setIsUploadDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Bulk Call Dialog */}
      <Dialog open={isBulkCallDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsBulkCallDialogOpen(false);
          setSelectedCampaignForBulkCall(null);
          setBulkCallFile(null);
        }
      }}>
        <DialogContent className="max-w-2xl w-full mx-4">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-primary flex items-center gap-2">
              <FileSpreadsheet className="w-6 h-6 text-orange-600" />
              Bulk Call - {selectedCampaignForBulkCall?.name}
            </DialogTitle>
            <DialogDescription className="text-base">
              Upload an Excel file (.xlsx) containing voter information for bulk calling
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="space-y-3">
              <Label htmlFor="bulk-call-file" className="text-base font-semibold flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-orange-500" />
                Excel File (.xlsx)
              </Label>
              
              {/* Download Template Section */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-blue-800 flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Download Template
                  </h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadTemplate()}
                    className="text-blue-700 border-blue-300 hover:bg-blue-100"
                  >
                    <FileDown className="w-4 h-4 mr-2" />
                    Download Template
                  </Button>
                </div>
                <p className="text-xs text-blue-700">
                  Download our Excel template with the correct column structure. The first column should be "Mobile Number" followed by other relevant voter information.
                </p>
              </div>
              
              <div className="relative">
                <Input
                  id="bulk-call-file"
                  type="file"
                  accept=".xlsx"
                  onChange={(e) => setBulkCallFile(e.target.files?.[0] || null)}
                  className="cursor-pointer h-12 text-base border-2 border-dashed border-orange-200 hover:border-orange-300 focus:border-orange-500 transition-colors"
                />
                {bulkCallFile && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
                    <FileSpreadsheet className="w-4 h-4" />
                    <span className="font-medium">{bulkCallFile.name}</span>
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                Upload an Excel file with voter information. The file should contain columns for phone numbers and other relevant data.
              </p>
            </div>


          </div>

          <DialogFooter className="mt-8 pt-4 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={() => {
                setIsBulkCallDialogOpen(false);
                setSelectedCampaignForBulkCall(null);
                setBulkCallFile(null);
              }}
              className="h-11 px-6 text-base"
            >
              Cancel
            </Button>
            <Button
              onClick={handleBulkCallSubmit}
              disabled={!bulkCallFile || isBulkCalling}
              className="bg-orange-600 hover:bg-orange-700 h-11 px-6 text-base"
            >
              {isBulkCalling ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Initiating Bulk Calls...
                </>
              ) : (
                <>
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Start Bulk Calls
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Call Dialog */}
      <Dialog open={isCallDialogOpen} onOpenChange={setIsCallDialogOpen}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-xl font-bold text-primary flex items-center gap-2">
              <Phone className="h-5 w-5 text-green-600" />
              Make Test Call
            </DialogTitle>
            <DialogDescription>
              Enter a phone number to make a test call using the <strong>{selectedCampaignForCall?.name}</strong> campaign.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="phone-number" className="text-sm font-medium">
                Phone Number
              </Label>
              <Input
                id="phone-number"
                type="tel"
                placeholder="9876543210 or +1234567890"
                value={phoneNumber}
                onChange={(e) => handlePhoneNumberChange(e.target.value)}
                className={`${phoneError ? 'border-red-500 focus:border-red-500' : ''}`}
                disabled={isCalling}
              />
              {phoneError && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <X className="h-4 w-4" />
                  {phoneError}
                </p>
              )}
              <p className="text-xs text-gray-500">
                Indian numbers (10 digits) will automatically get +91 prefix. For other countries, include country code (e.g., +1 for US)
              </p>
            </div>

            {/* Dynamic Variables Input Fields - Directly below phone number */}
            {selectedCampaignForCall?.llm?.promptJson?.promptVariables && 
             Object.keys(selectedCampaignForCall.llm.promptJson.promptVariables).length > 0 && (
              <div className="space-y-3">
                {Object.keys(selectedCampaignForCall.llm.promptJson.promptVariables).map((key) => (
                  <div key={key} className="space-y-1">
                    <Label htmlFor={`variable-${key}`} className="text-sm font-medium text-gray-600">
                      {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Label>
                    <Input
                      id={`variable-${key}`}
                      type="text"
                      placeholder={`Enter ${key.replace(/_/g, ' ')}`}
                      value={testCallVariables[key] || ''}
                      onChange={(e) => setTestCallVariables(prev => ({
                        ...prev,
                        [key]: e.target.value
                      }))}
                      disabled={isCalling}
                      className="text-sm"
                    />
                  </div>
                ))}
                <p className="text-xs text-gray-500">
                  Fill in the values for campaign variables. These will be used to personalize the call.
                </p>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium">Campaign Details:</p>
                  <p className="text-blue-700 mt-1">
                    <strong>Name:</strong> {selectedCampaignForCall?.name}<br/>
                    <strong>Direction:</strong> {selectedCampaignForCall?.direction}<br/>
                    <strong>Status:</strong> {selectedCampaignForCall?.state}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-shrink-0 flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setIsCallDialogOpen(false);
                setPhoneNumber('');
                setPhoneError('');
                setSelectedCampaignForCall(null);
              }}
              disabled={isCalling}
            >
              Cancel
            </Button>
            <Button
              onClick={makeCall}
              disabled={isCalling || !phoneNumber.trim()}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isCalling ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Calling...
                </>
              ) : (
                <>
                  <Phone className="h-4 w-4 mr-2" />
                  Make Call
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Campaigns;
