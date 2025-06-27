import React, { useState, useEffect } from 'react';
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
  MessageSquare,
  Variable,
  Database,
  Tag,
  Globe,
  MessageCircle,
  FileDown
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, addDays, subDays, startOfDay, endOfDay, startOfToday, endOfToday } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { DialogFooter } from '@/components/ui/dialog';
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
    maxCallDuration: number;
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
}

interface CampaignFormData {
  name: string;
  direction: 'INBOUND' | 'OUTBOUND';
  state: 'TRIAL' | 'ACTIVE' | 'INACTIVE';
  org_id: string;
  tts: {
    gender: string;
    language: string;
    voice_id: string;
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
  name: z.string().min(1, "Campaign name is required"),
  direction: z.enum(['INBOUND', 'OUTBOUND']),
  state: z.enum(['TRIAL', 'ACTIVE', 'INACTIVE']),
  org_id: z.string().min(1, "Organization is required"),
  tts: z.object({
    gender: z.string(),
    language: z.string(),
    voice_id: z.string()
  }),
  telephonic_provider: z.string(),
  knowledge_base: z.object({
    url: z.string(),
    file: z.any().nullable()
  }),
  post_call_actions: z.object({
    categories: z.record(z.string()),
    data_extracted: z.record(z.string())
  }),
  callback_endpoint: z.string().optional()
});

type CampaignFormValues = z.infer<typeof campaignFormSchema>;

const defaultValues: Partial<CampaignFormValues> = {
  name: "",
  direction: "OUTBOUND",
  state: "TRIAL",
  org_id: "",
  tts: {
    gender: "female",
    language: "hindi",
    voice_id: "hi-IN-AnanyaNeural"
  },
  telephonic_provider: "exotel",
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
      setCurrentStep(prev => Math.min(prev + 1, 5));
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

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const response = await fetch('https://platform.voxiflow.com/backend/api/v1/campaigns/', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json'
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch campaigns');
        }

        const data = await response.json();
        const formattedCampaigns = data.map((campaign: any) => ({
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
          telephonic_provider: campaign.telephonic_provider,
          knowledge_base: campaign.knowledge_base,
          post_call_actions: campaign.post_call_actions,
          tts: campaign.tts
        }));

        setCampaigns(formattedCampaigns);
      } catch (error) {
        console.error('Error fetching campaigns:', error);
        toast({
          title: "Error",
          description: "Failed to load campaigns. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchCampaigns();
  }, []);

  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const response = await fetch('https://platform.voxiflow.com/backend/api/v1/organizations', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json'
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch organizations');
        }

        const data = await response.json();
        setOrganizations(data);
      } catch (error) {
        console.error('Error fetching organizations:', error);
        toast({
          title: "Error",
          description: "Failed to load organizations",
          variant: "destructive",
        });
      }
    };

    fetchOrganizations();
  }, []);

  const filteredCampaigns = campaigns.filter(campaign => {
    if (!campaign) return false; // Add null check
    
    const matchesSearch = 
      campaign.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      campaign.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      campaign.type?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDateRange = (!startDate || new Date(campaign.created_at) >= startDate) &&
                           (!endDate || new Date(campaign.created_at) <= endDate);

    return matchesSearch && matchesDateRange;
  }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()); // Sort by created_at in descending order

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Draft': return 'bg-yellow-100 text-yellow-800';
      case 'Completed': return 'bg-blue-100 text-blue-800';
      case 'Paused': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleEdit = async (campaign: Campaign) => {
    try {
      // Fetch the complete campaign data first
      const response = await fetch(`https://platform.voxiflow.com/backend/api/v1/campaigns/${campaign.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch campaign details');
      }

      const campaignData = await response.json();
      setEditingCampaign(campaignData);
      setCurrentStep(1);
      
      // Map campaign data to form fields with null checks
      form.reset({
        name: campaignData.name || '',
        direction: campaignData.direction || 'OUTBOUND',
        state: campaignData.state || 'TRIAL',
        org_id: campaignData.org_id || '',
        tts: {
          gender: campaignData.tts?.gender || 'female',
          language: campaignData.tts?.language || 'hindi',
          voice_id: campaignData.tts?.voice_id || 'hi-IN-AnanyaNeural'
        },
        telephonic_provider: campaignData.telephonic_provider || 'exotel',
        knowledge_base: {
          url: campaignData.knowledge_base?.url || '',
          file: campaignData.knowledge_base?.file || null
        },
        post_call_actions: {
          categories: campaignData.post_call_actions?.categories || {},
          data_extracted: campaignData.post_call_actions?.data_extracted || {}
        }
      });

      // Set context value from llm.promptJson.context
      const contextFromAPI = campaignData.llm?.promptJson?.context || '';
      console.log('Context from API:', contextFromAPI);
      setContextValue(contextFromAPI);

      // Set variables from llm.promptJson.promptVariables
      const promptVarsFromAPI = campaignData.llm?.promptJson?.promptVariables || {};
      console.log('Variables from API:', promptVarsFromAPI);
      const variablesArray = Object.entries(promptVarsFromAPI).map(([key, value]) => ({
        key,
        value: value as string
      }));
      setVariables(variablesArray);

      // Set up key-value pairs for categories and data extraction
      const categories = Object.entries(campaignData.post_call_actions?.categories || {}).map(([key, value]) => ({
        key,
        value: value as string
      }));
      setCategorization(categories);

      const extractedData = Object.entries(campaignData.post_call_actions?.data_extracted || {}).map(([key, value]) => ({
        key,
        value: value as string
      }));
      setDataExtractionFields(extractedData);

      // Set knowledge base data with null checks
      setKnowledgeBaseUrl(campaignData.knowledge_base?.url || '');
      setSelectedFile(campaignData.knowledge_base?.file || null);

      setIsCreateDialogOpen(true);
    } catch (error) {
      console.error('Error fetching campaign details:', error);
      toast({
        title: "Error",
        description: "Failed to load campaign details",
        variant: "destructive",
      });
    }
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

      // Prepare the request data according to API structure
      const requestData = {
        id: editingCampaign?.id || generateUUID(),
        name: data.name,
        direction: data.direction,
        inbound_number: "",
        caller_id_number: "",
        state: data.state,
        version: 0,
        org_id: data.org_id,
        llm: {
          model: "gpt-4o",
          prompt: "",
          provider: "OPENAI",
          promptJson: {
            nodes: {},
            context: contextValue || "",
            language: data.tts?.language || "hindi",
            skeleton: "Simple output format.",
            mermaidGraph: "initial_message -->|edge| node1\nnode1 -->|edge| node2",
            knowledgeBase: data.knowledge_base,
            promptVariables,
            botStateDefinitions: {}
          },
          temperature: "0.5",
          useProxyLlm: false,
          useEmbeddings: false,
          initialMessage: "",
          maxCallDuration: 300,
          UseStructuredPrompt: false
        },
        tts: {
          gender: data.tts.gender,
          language: data.tts.language,
          voice_id: data.tts.voice_id
        },
        stt: {},
        timezone: "Asia/Kolkata",
        post_call_actions: {
          categories: data.post_call_actions.categories || {},
          data_extracted: data.post_call_actions.data_extracted || {}
        },
        live_actions: [],
        callback_endpoint: data.callback_endpoint || "",
        retry: {},
        account_id: "a43b689f-b95f-4178-a7c7-7cfd547a1f68",
        created_by: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_active: true,
        telephonic_provider: data.telephonic_provider,
        knowledge_base: data.knowledge_base
      };

      console.log('Making API call with request data:', requestData);

      const url = editingCampaign 
        ? `https://platform.voxiflow.com/backend/api/v1/campaigns/${editingCampaign.id}`
        : 'https://platform.voxiflow.com/backend/api/v1/campaigns/';

      console.log('API URL:', url);

      const response = await fetch(url, {
        method: editingCampaign ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });

      console.log('API Response:', response);

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
      const response = await fetch(`https://platform.voxiflow.com/backend/api/v1/campaigns/${campaign.id}`, {
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

      const response = await fetch(`https://platform.voxiflow.com/backend/api/v1/campaigns/${campaignId}/upload`, {
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

  const onCallSubmit = callForm.handleSubmit(async (data: CallFormData) => {
    try {
      // Prepare the API request
      const callRequest: CallApiRequest = {
        to_number: data.mobileNumber,
        dynamic_variables: {
          customer_name: data.callerName,
          dealer_name: selectedCampaignForCall?.name || "",
          vehicle_no: "",
          callback_date: "",
          callback_time: "",
          alt_contact_name: "",
          alt_contact_no: ""
        },
        metadata: {
          org_id: selectedCampaignForCall?.org_id || "",
          user_id: "user_1"
        },
        campaign_id: selectedCampaignForCall?.id || ""
      };

      const response = await fetch('https://platform.voxiflow.com/backend/api/v1/calls/', {
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
        description: `Calling ${data.callerName} at ${data.mobileNumber}`,
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
  });

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

  const handleView = async (campaign: Campaign) => {
    try {
      // Fetch the complete campaign data first
      const response = await fetch(`https://platform.voxiflow.com/backend/api/v1/campaigns/${campaign.id}`, {
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
    const headers = ['Campaign Name', 'Direction', 'Language', 'Voice ID', 'Provider', 'Created At', 'Updated At', 'Status'];
    const csvData = filteredCampaigns.map(campaign => [
      campaign.name,
      campaign.direction,
      campaign.language,
      campaign.voice_id,
      campaign.telephonic_provider,
      new Date(campaign.created_at).toLocaleString(),
      new Date(campaign.updated_at).toLocaleString(),
      campaign.status
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
              
            {['Language', 'Voice', 'Flow', 'Telephony', 'Post Call Actions'].map((step, index) => (
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
                        <StepLanguage form={form} organizations={organizations} />
                      </div>
                    )}

                    {currentStep === 2 && (
                      <div>
                        <StepVoice form={form} />
                      </div>
                    )}

                    {currentStep === 3 && (
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

                    {currentStep === 4 && (
                      <div>
                        <StepTelephony form={form} />
                      </div>
                    )}

                    {currentStep === 5 && (
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
                
                {currentStep < 5 ? (
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
                        toast({
                          title: "Validation Error",
                          description: "Please fill in all required fields correctly.",
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

  return (
    <div className="p-1 pt-0 bg-gray-50 min-h-screen">
      <div className="mb-3">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
            Campaigns
          </h1>
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-medium">
            {filteredCampaigns.length} Total
          </Badge>
              </div>
        <p className="text-sm text-gray-500">Manage your voice campaigns and automation</p>
            </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-3 p-2">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search campaigns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500 h-9"
            />
              </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-[140px]">
                <DatePicker
                  selected={startDate}
                  onChange={(date: Date) => setStartDate(date)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  placeholderText="From date"
                  isClearable
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="select"
                  dateFormat="MMM dd, yyyy"
                  maxDate={endDate || undefined}
                  customInput={
                    <Button variant="outline" className="w-full h-9 justify-start text-left font-normal border-gray-200">
                      <CalendarIcon className="mr-2 h-4 w-4 text-gray-500" />
                      {startDate ? format(startDate, "MMM dd, yyyy") : "From date"}
                    </Button>
                  }
                />
              </div>
              <span className="text-gray-400">to</span>
              <div className="w-[140px]">
                <DatePicker
                  selected={endDate}
                  onChange={(date: Date) => setEndDate(date)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  placeholderText="To date"
                  isClearable
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="select"
                  dateFormat="MMM dd, yyyy"
                  minDate={startDate || undefined}
                  customInput={
                    <Button variant="outline" className="w-full h-9 justify-start text-left font-normal border-gray-200">
                      <CalendarIcon className="mr-2 h-4 w-4 text-gray-500" />
                      {endDate ? format(endDate, "MMM dd, yyyy") : "To date"}
                    </Button>
                  }
                />
            </div>
      </div>

            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                onClick={handleExportToCSV}
                className="bg-white hover:bg-gray-50 h-9 border-gray-200 text-gray-700 hover:text-gray-900"
              >
                <FileDown className="w-4 h-4 mr-2 text-gray-500" />
                Export to CSV
        </Button>
              <Button 
                onClick={() => setIsCreateDialogOpen(true)} 
                className="bg-blue-600 hover:bg-blue-700 text-white h-9"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Campaign
        </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/80 hover:bg-gray-50/80 border-b border-gray-200">
                <TableHead className="font-semibold text-gray-700 py-2 px-4 text-sm">Campaign Name</TableHead>
                <TableHead className="font-semibold text-gray-700 py-2 px-4 text-sm">Direction</TableHead>
                <TableHead className="font-semibold text-gray-700 py-2 px-4 text-sm">Language</TableHead>
                <TableHead className="font-semibold text-gray-700 py-2 px-4 text-sm">Voice ID</TableHead>
                <TableHead className="font-semibold text-gray-700 py-2 px-4 text-sm">Provider</TableHead>
                <TableHead className="font-semibold text-gray-700 py-2 px-4 text-sm">Created At</TableHead>
                <TableHead className="font-semibold text-gray-700 py-2 px-4 text-sm">Updated At</TableHead>
                <TableHead className="text-right font-semibold text-gray-700 py-2 px-4 text-sm">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-6">
                    <div className="flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2" />
                      Loading campaigns...
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredCampaigns.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-6 text-gray-500">
                    No campaigns found
                  </TableCell>
                </TableRow>
              ) : (
                filteredCampaigns.map((campaign) => (
                  <TableRow key={campaign.id} className="hover:bg-gray-50/50 border-t border-gray-100">
                    <TableCell className="font-medium text-gray-900 py-2 px-4">{campaign.name}</TableCell>
                    <TableCell className="py-2 px-4">
                      <Badge variant={campaign.direction === 'INBOUND' ? 'default' : 'secondary'} className="font-medium">
                        {campaign.direction}
                    </Badge>
                  </TableCell>
                    <TableCell className="capitalize py-2 px-4">{campaign.language}</TableCell>
                    <TableCell className="font-mono text-sm py-2 px-4 text-gray-600">{campaign.voice_id}</TableCell>
                    <TableCell className="py-2 px-4">
                      <Badge variant="outline" className="bg-gray-50/80 text-gray-700 border-gray-200">
                        {campaign.telephonic_provider}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-600 text-sm py-2 px-4">
                      {new Date(campaign.created_at).toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </TableCell>
                    <TableCell className="text-gray-600 text-sm py-2 px-4">
                      {new Date(campaign.updated_at).toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </TableCell>
                    <TableCell className="py-2 px-4">
                      <div className="flex justify-end space-x-1">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleView(campaign)}
                          className="h-8 w-8 bg-blue-50 hover:bg-blue-100 text-blue-600"
                        >
                          <Eye className="h-4 w-4" />
                      </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => {
                            setSelectedCampaignForCall(campaign);
                            setIsCallDialogOpen(true);
                          }}
                          className="h-8 w-8 bg-green-50 hover:bg-green-100 text-green-600"
                        >
                          <Phone className="h-4 w-4" />
                      </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => navigate(`/call-history?campaignId=${campaign.id}&campaignName=${encodeURIComponent(campaign.name)}`)}
                          className="h-8 w-8 bg-purple-50 hover:bg-purple-100 text-purple-600"
                        >
                          <History className="h-4 w-4" />
                      </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => {
                            setSelectedCampaignForUpload(campaign);
                            setIsUploadDialogOpen(true);
                          }}
                          className="h-8 w-8 bg-indigo-50 hover:bg-indigo-100 text-indigo-600"
                        >
                          <Upload className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleEdit(campaign)}
                          className="h-8 w-8 bg-amber-50 hover:bg-amber-100 text-amber-600"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(campaign)}
                          className="h-8 w-8 bg-red-50 hover:bg-red-100 text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Create Campaign Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsCreateDialogOpen(false);
          setEditingCampaign(null);
          resetForm();
        }
      }}>
        <DialogContent className="sm:max-w-[800px] p-0 max-h-[90vh] flex flex-col">
          <DialogHeader className="px-4 py-2 border-b bg-gray-50/80 flex-shrink-0">
            <DialogTitle className="text-xl font-semibold text-gray-900">
              {editingCampaign ? 'Edit Campaign' : 'Create New Campaign'}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto">
            <div className="px-4 py-3">
              <div className="space-y-4">
                {/* Step Indicator */}
                <div className="bg-gradient-to-r from-white to-blue-50/30 rounded-lg p-6 border shadow-sm flex-shrink-0">
                  <div className="flex justify-between relative">
                    {/* Progress Line */}
                    <div className="absolute top-4 left-0 w-full h-0.5 bg-gray-200">
                      <div 
                        className="h-full bg-blue-500 transition-all duration-300 ease-in-out"
                        style={{ width: `${((currentStep - 1) / 4) * 100}%` }}
                      />
                    </div>

                    {['Language', 'Voice', 'Flow', 'Telephony', 'Post Call Actions'].map((step, index) => (
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
                                <StepLanguage form={form} organizations={organizations} />
                              </div>
                            )}

                            {currentStep === 2 && (
                              <div>
                                <StepVoice form={form} />
                              </div>
                            )}

                            {currentStep === 3 && (
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

                            {currentStep === 4 && (
                              <div>
                                <StepTelephony form={form} />
                              </div>
                            )}

                            {currentStep === 5 && (
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
                        
                        {currentStep < 5 ? (
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
                                toast({
                                  title: "Validation Error",
                                  description: "Please fill in all required fields correctly.",
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
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
    </div>
  );
};

export default Campaigns;
