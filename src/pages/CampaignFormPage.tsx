import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import StepLanguage from '@/components/CampaignForm/StepLanguage';
import StepVoice from '@/components/CampaignForm/StepVoice';
import StepFlow from '@/components/CampaignForm/StepFlow';
import StepTelephony from '@/components/CampaignForm/StepTelephony';
import StepPostCall from '@/components/CampaignForm/StepPostCall';
import { Form, FormField, FormItem, FormLabel, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Mic, Volume2, Info, Clock, Hourglass } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { toast } from '@/components/ui/use-toast';
import { CampaignVersion, getCurrentVersion, getCampaignVersions, getCampaignVersion } from '@/lib/campaignVersioningApi';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

// --- Schema and default values (copied from Campaigns.tsx) ---
const campaignFormSchema = z.object({
  campaign_id: z.string().min(1, "Campaign ID is required"),
  name: z.string().min(1, "Campaign name is required"),
  direction: z.enum(['INBOUND', 'OUTBOUND']),
  state: z.enum(['TRIAL', 'ACTIVE', 'INACTIVE']),
  org_id: z.string().min(1, "Organization is required"),
  tts: z.object({
    gender: z.string(),
    language: z.string(),
    voice_id: z.string(),
    vendor: z.string().optional(),
    transfer_call: z.boolean().optional()
  }),
  stt: z.object({
    vendor: z.string(),
    provider: z.string().optional()
  }),
  telephonic_provider: z.string(),
  telephony_config: z.object({
    channels: z.number().min(0, "Channels cannot be negative"),
    max_concurrent_calls: z.number().min(1, "At least 1 concurrent call is required"),
    call_timeout: z.number().min(30, "Call timeout must be at least 30 seconds")
  }).optional(),
  knowledge_base: z.object({
    url: z.string(),
    file: z.any().nullable()
  }),
  post_call_actions: z.object({
    categories: z.object({
      system_prompt: z.string(),
      fields: z.record(z.string())
    }),
    data_extracted: z.object({
      system_prompt: z.string(),
      fields: z.record(z.string())
    })
  }),
  callback_endpoint: z.string().optional(),
  callback_method: z.string().optional(),
  callback_auth_token: z.string().optional(),
  llm: z.object({
    initialMessage: z.string().optional(),
    useProxyLlm: z.boolean().optional(),
    UseStructuredPrompt: z.boolean().optional(),
    provider: z.string().optional(),
    model: z.string().optional(),
    temperature: z.string().optional(),
    maxCallDuration: z.any().optional(),
    useEmbeddings: z.boolean().optional(),
    prompt: z.string().optional(),
    promptJson: z.object({
      skeleton: z.string().optional(),
      promptVariables: z.record(z.string()).optional(),
      knowledgeBase: z.object({
        url: z.string().optional(),
        file: z.any().nullable().optional()
      }).optional(),
      nodes: z.record(z.any()).optional(),
      context: z.string().optional(),
      responses: z.record(z.any()).optional(),
      variables: z.record(z.any()).optional(),
      botStateDefinitions: z.record(z.any()).optional(),
      language: z.string().optional(),
      mermaidGraph: z.string().optional()
    }).optional()
  }).optional(),
}).strict();

// --- Update CampaignFormValues type to match new schema ---
type CampaignFormValues = {
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
    transfer_call?: boolean;
  };
  stt: {
    vendor: string;
    provider?: string;
  };
  telephonic_provider: string;
  telephony_config?: {
    channels: number;
    max_concurrent_calls: number;
    call_timeout: number;
  };
  knowledge_base: {
    url: string;
    file: any;
  };
  post_call_actions: {
    categories: {
      system_prompt: string;
      fields: Record<string, string>;
    };
    data_extracted: {
      system_prompt: string;
      fields: Record<string, string>;
    };
  };
  callback_endpoint: string;
  llm?: {
    initialMessage?: string;
    useProxyLlm?: boolean;
    UseStructuredPrompt?: boolean;
    provider?: string;
    model?: string;
    temperature?: string;
    maxCallDuration?: any;
    useEmbeddings?: boolean;
    prompt?: string;
    promptJson?: {
      skeleton?: string;
      promptVariables?: Record<string, string>;
      knowledgeBase?: {
        url?: string;
        file?: any;
      };
      nodes?: Record<string, any>;
      context?: string;
      responses?: Record<string, any>;
      variables?: Record<string, any>;
      botStateDefinitions?: Record<string, any>;
      language?: string;
      mermaidGraph?: string;
    };
  };
};

type KeyValuePair = { key: string; value: string };

type Organization = { id: string; name: string };

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// --- Make defaultValues fully required ---
const defaultValues: CampaignFormValues = {
  campaign_id: generateUUID(),
  name: "",
  direction: "OUTBOUND",
  state: "TRIAL",
  org_id: "",
  tts: {
    gender: "female",
    language: "hindi",
    voice_id: "hi-IN-AnanyaNeural",
    vendor: "11labs"
  },
  stt: {
    vendor: "deepgram",
    provider: "nova-2"
  },
  llm: {
    provider: "openai",
    model: "gpt-4.1",
    temperature: "0.7"
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
    categories: {
      system_prompt: "",
      fields: {}
    },
    data_extracted: {
      system_prompt: "",
      fields: {}
    }
  },
  callback_endpoint: "https://platform.voxiflow.com/backend/api/v1/webhook"
};

const steps = [
  'Name',
  'Speech & Call',
  'Voice',
  'Flow',
  'Telephony',
  'Post Call Actions',
];

type FormPath = 
  | 'llm.promptJson.responses'
  | 'llm.promptJson.promptVariables'
  | 'llm.promptJson.knowledgeBase.url'
  | 'llm.promptJson.knowledgeBase.file';

export default function CampaignFormPage({ mode = 'create', initialData = {} }) {
  const navigate = useNavigate();
  const params = useParams();
  const [activeStep, setActiveStep] = useState(0);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [organizationsLoaded, setOrganizationsLoaded] = useState(false);
  const [campaignData, setCampaignData] = useState<any>(null);
  const [campaignLoaded, setCampaignLoaded] = useState(mode !== 'edit');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Speech & Call step state ---
  const [allowInterruptions, setAllowInterruptions] = useState(false);
  const [ambientStatus, setAmbientStatus] = useState(false);
  const [sound, setSound] = useState('office');
  const [volume, setVolume] = useState(0.1);
  const [maxIdleReminder, setMaxIdleReminder] = useState(3);
  const [maxIdleDuration, setMaxIdleDuration] = useState(5);

  // --- StepFlow and PostCall state ---
  const [activeFlowTab, setActiveFlowTab] = useState<'context' | 'graph' | 'responses' | 'variables' | 'knowledgeBase'>('context');
  const [contextValue, setContextValue] = useState('');
  const [initialMessage, setInitialMessage] = useState('');
  const [responses, setResponses] = useState<KeyValuePair[]>([]);
  const [variables, setVariables] = useState<KeyValuePair[]>([]);
  const [categorization, setCategorization] = useState<KeyValuePair[]>([]);
  const [dataExtractionFields, setDataExtractionFields] = useState<KeyValuePair[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  // --- Persist system prompt for data extraction ---
  const [dataExtractionSystemPrompt, setDataExtractionSystemPrompt] = useState('');
  // --- Persist system prompt for categories ---
  const [categoriesSystemPrompt, setCategoriesSystemPrompt] = useState('');
  
  // --- Version management state ---
  const [currentVersion, setCurrentVersion] = useState<CampaignVersion | null>(null);
  const [availableVersions, setAvailableVersions] = useState<CampaignVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<string>('');
  const [loadingVersion, setLoadingVersion] = useState(false);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const COPY_STORAGE_KEY = 'VOXIFLOW_COPIED_CAMPAIGN';

  // --- Form ---
  const form = useForm<CampaignFormValues>({
    resolver: zodResolver(campaignFormSchema) as any, // force type to match CampaignFormValues
    defaultValues
  });

  // Prefill from copied campaign when creating a new one
  useEffect(() => {
    if (mode !== 'create') return;
    try {
      const raw = localStorage.getItem(COPY_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      const copied = parsed?.campaign || {};
      // Map copied structure to form values
      const categories = copied.post_call_actions?.categories || {};
      const data_extracted = copied.post_call_actions?.data_extracted || {};
      const newId = generateUUID();
      form.reset({
        campaign_id: newId,
        name: copied.name || '',
        direction: (copied.direction === 'INBOUND' || copied.direction === 'OUTBOUND') ? copied.direction : 'OUTBOUND',
        state: (copied.state === 'TRIAL' || copied.state === 'ACTIVE' || copied.state === 'INACTIVE') ? copied.state : 'TRIAL',
        org_id: String(copied.org_id || ''),
        tts: {
          gender: copied.tts?.gender || 'female',
          language: copied.tts?.language || 'hindi',
          voice_id: copied.tts?.voice_id || 'hi-IN-AnanyaNeural',
          vendor: copied.tts?.vendor || '11labs',
          transfer_call: copied.tts?.transfer_call || false
        },
        stt: {
          vendor: copied.stt?.vendor || 'deepgram',
          provider: copied.stt?.provider || 'nova-2'
        },
        telephonic_provider: copied.telephonic_provider || 'czentrix',
        telephony_config: copied.telephony_config || {
          channels: 1,
          max_concurrent_calls: 1,
          call_timeout: 30
        },
        knowledge_base: {
          url: copied.knowledge_base?.url || '',
          file: null
        },
        post_call_actions: {
          categories: {
            system_prompt: categories.system_prompt || '',
            fields: categories.fields || {}
          },
          data_extracted: {
            system_prompt: data_extracted.system_prompt || '',
            fields: data_extracted.fields || {}
          }
        },
        callback_endpoint: copied.callback_endpoint || defaultValues.callback_endpoint,
        llm: {
          initialMessage: copied.llm?.initialMessage || '',
          useProxyLlm: copied.llm?.useProxyLlm || false,
          UseStructuredPrompt: copied.llm?.UseStructuredPrompt || false,
          provider: (copied.llm?.provider || 'openai').toString().toLowerCase(),
          model: copied.llm?.model || 'gpt-4.1',
          temperature: copied.llm?.temperature || '0.5',
          maxCallDuration: copied.llm?.maxCallDuration || '300',
          useEmbeddings: copied.llm?.useEmbeddings || false,
          prompt: copied.llm?.prompt || '',
          promptJson: {
            skeleton: copied.llm?.promptJson?.skeleton || 'Simple output format.',
            promptVariables: copied.llm?.promptJson?.promptVariables || {},
            knowledgeBase: copied.llm?.promptJson?.knowledgeBase || { url: '', file: null },
            nodes: copied.llm?.promptJson?.nodes || {},
            context: copied.llm?.promptJson?.context || '',
            botStateDefinitions: copied.llm?.promptJson?.botStateDefinitions || {},
            language: copied.llm?.promptJson?.language || copied.tts?.language || 'hindi',
            mermaidGraph: copied.llm?.promptJson?.mermaidGraph || 'initial_message -->|edge| node1\nnode1 -->|edge| node2'
          }
        }
      });
      // Sync local UI state pieces
      setContextValue(copied.llm?.promptJson?.context || '');
      setInitialMessage(copied.llm?.initialMessage || '');
      const pv = copied.llm?.promptJson?.promptVariables || {};
      setVariables(Object.entries(pv).map(([key, value]) => ({ key, value: String(value ?? '') })));
      setCategorization(Object.entries(categories.fields || {}).map(([key, value]) => ({ key, value: String(value ?? '') })));
      setDataExtractionFields(Object.entries(data_extracted.fields || {}).map(([key, value]) => ({ key, value: String(value ?? '') })));
      setDataExtractionSystemPrompt(data_extracted.system_prompt || '');
      setCategoriesSystemPrompt(categories.system_prompt || '');
      toast({ title: 'Prefilled from copied campaign', description: 'You can modify any fields before saving.' });
    } catch {}
  }, [mode]);

  // --- Sync dataExtractionFields and categorization to form state on change ---
  React.useEffect(() => {
    const dataExtractionFieldsObj = {};
    dataExtractionFields.forEach(pair => {
      if (pair.key) dataExtractionFieldsObj[pair.key] = pair.value;
    });
    form.setValue('post_call_actions.data_extracted.fields', dataExtractionFieldsObj);
  }, [dataExtractionFields]);
  React.useEffect(() => {
    const categorizationObj = {};
    categorization.forEach(pair => {
      if (pair.key) categorizationObj[pair.key] = pair.value;
    });
    form.setValue('post_call_actions.categories.fields', categorizationObj);
  }, [categorization]);

  // --- Sync dataExtractionSystemPrompt to form state ---
  React.useEffect(() => {
    form.setValue('post_call_actions.data_extracted.system_prompt', String(dataExtractionSystemPrompt || ''));
  }, [dataExtractionSystemPrompt]);

  // --- Sync categoriesSystemPrompt to form state ---
  React.useEffect(() => {
    form.setValue('post_call_actions.categories.system_prompt', String(categoriesSystemPrompt || ''));
  }, [categoriesSystemPrompt]);

  // --- Sync contextValue to llm.prompt in form state ---
  React.useEffect(() => {
    form.setValue('llm.prompt', String(contextValue || ''));
  }, [contextValue]);

  // --- Sync initialMessage to llm.initialMessage in form state ---
  React.useEffect(() => {
    form.setValue('llm.initialMessage', String(initialMessage || ''));
  }, [initialMessage]);

  // --- Sync variables to llm.promptJson.promptVariables in form state ---
  React.useEffect(() => {
    const promptVariablesObj = variables.reduce((acc, pair) => {
      if (pair.key) acc[pair.key] = pair.value;
      return acc;
    }, {} as Record<string, string>);
    const currentLlm = form.getValues('llm') || {};
    const currentPromptJson = currentLlm.promptJson || {};
    form.setValue('llm', {
      ...currentLlm,
      promptJson: {
        ...currentPromptJson,
        promptVariables: promptVariablesObj
      }
    });
  }, [variables]);

  // --- Version management functions ---
  const loadCurrentVersion = async (campaignId: string) => {
    setLoadingVersion(true);
    try {
      const version = await getCurrentVersion(campaignId);
      setCurrentVersion(version);
      setSelectedVersion(version.version);
    } catch (error) {
      toast({
        title: "Version Loading Error",
        description: `Failed to load current version: ${error.message}`,
        variant: "destructive",
      });
      
      // If versioning is not available, create a mock version from campaign data
      const mockVersion = {
        id: campaignId,
        name: campaignData?.name || '',
        version: '1',
        state: campaignData?.state || 'DRAFT',
        created_at: new Date().toISOString(),
        created_by: 'system',
        llm: {
          ...campaignData?.llm,
          prompt: campaignData?.llm?.promptJson?.context || ''
        },
        tts: campaignData?.tts,
        speech_setting: campaignData?.speech_setting,
        telephonic_provider: campaignData?.telephonic_provider,
        knowledge_base: campaignData?.knowledge_base,
        post_call_actions: campaignData?.post_call_actions,
      };
      setCurrentVersion(mockVersion);
      setSelectedVersion('1');
    } finally {
      setLoadingVersion(false);
    }
  };

  const loadAvailableVersions = async (campaignId: string) => {
    setLoadingVersions(true);
    try {
      const versions = await getCampaignVersions(campaignId);
      setAvailableVersions(versions);
    } catch (error) {
      toast({
        title: "Versions Loading Error",
        description: `Failed to load available versions: ${error.message}`,
        variant: "destructive",
      });
      
      setAvailableVersions([]);
    } finally {
      setLoadingVersions(false);
    }
  };

  // Helper function to clean and validate data
  const cleanData = (data: any, defaultValue: any = null) => {
    if (data === null || data === undefined || data === '') {
      return defaultValue;
    }
    if (typeof data === 'object' && Object.keys(data).length === 0) {
      return defaultValue;
    }
    return data;
  };

  const handleVersionChange = async (versionNumber: string) => {
    if (!params.id) return;
    
    setSelectedVersion(versionNumber);
    setLoadingVersion(true);
    
    try {
      const version = await getCampaignVersion(params.id, versionNumber);
      setCurrentVersion(version);
      
      // Update form with version data
      if (version) {
        
        // Basic fields
        form.setValue('campaign_id', version.id || '');
        form.setValue('name', version.name || '');
        form.setValue('state', version.state as 'TRIAL' | 'ACTIVE' | 'INACTIVE' || 'TRIAL');
        form.setValue('direction', version.direction as 'INBOUND' | 'OUTBOUND' || 'OUTBOUND');
        form.setValue('org_id', version.org_id || '');
        form.setValue('telephonic_provider', version.telephonic_provider || '');
        
        // TTS fields
        if (version.tts) {
          form.setValue('tts', {
            gender: version.tts.gender || 'female',
            language: version.tts.language || 'hindi',
            voice_id: version.tts.voice_id || '',
            vendor: version.tts.vendor || '11labs',
            transfer_call: version.tts.transfer_call || false
          });
        }
        
        // STT fields
        form.setValue('stt', {
          vendor: 'deepgram',
          provider: 'nova-2'
        });
        
        // LLM fields - comprehensive mapping with proper null handling
        if (version.llm) {
          const llmData = {
            initialMessage: version.llm.initialMessage || '',
            useProxyLlm: version.llm.useProxyLlm || false,
            UseStructuredPrompt: version.llm.UseStructuredPrompt || false,
            provider: version.llm.provider || 'AZURE',
            model: version.llm.model || 'gpt-4.1',
            temperature: version.llm.temperature || '0.5',
            maxCallDuration: version.llm.maxCallDuration || '300',
            useEmbeddings: version.llm.useEmbeddings || false,
            prompt: version.llm.prompt || '',
            promptJson: {
              skeleton: version.llm.promptJson?.skeleton || 'Simple output format.',
              promptVariables: version.llm.promptJson?.promptVariables || {},
              knowledgeBase: version.knowledge_base || { url: '', file: null },
              nodes: version.llm.promptJson?.nodes || {},
              context: version.llm.prompt || '',
              responses: version.llm.promptJson?.responses || {},
              variables: version.llm.promptJson?.variables || {}
            }
          };
          
          form.setValue('llm', llmData);
        } else {
          // Reset LLM data if not present
          form.setValue('llm', {
            initialMessage: '',
            useProxyLlm: false,
            UseStructuredPrompt: false,
            provider: 'AZURE',
            model: 'gpt-4.1',
            temperature: '0.5',
            maxCallDuration: '300',
            useEmbeddings: false,
            prompt: '',
            promptJson: {
              skeleton: 'Simple output format.',
              promptVariables: {},
              knowledgeBase: { url: '', file: null },
              nodes: {},
              context: '',
              responses: {},
              variables: {}
            }
          });
        }
        
        // Knowledge base
        if (version.knowledge_base) {
          form.setValue('knowledge_base', {
            url: version.knowledge_base.url || '',
            file: null
          });
        }
        
        // Post call actions - handle empty values properly
        if (version.post_call_actions) {
          const categories = version.post_call_actions.categories || { system_prompt: '', fields: {} };
          const dataExtracted = version.post_call_actions.data_extracted || { system_prompt: '', fields: {} };
          
          form.setValue('post_call_actions', {
            categories: {
              system_prompt: categories.system_prompt || '',
              fields: categories.fields || {}
            },
            data_extracted: {
              system_prompt: dataExtracted.system_prompt || '',
              fields: dataExtracted.fields || {}
            }
          });
          
          // Update state variables for post-call actions
          if (categories.fields && Object.keys(categories.fields).length > 0) {
            const categorization = Object.entries(categories.fields).map(([key, value]) => ({
              key,
              value: value as string
            }));
            setCategorization(categorization);
          } else {
            setCategorization([]);
          }
          
          if (dataExtracted.fields && Object.keys(dataExtracted.fields).length > 0) {
            const dataExtractionFields = Object.entries(dataExtracted.fields).map(([key, value]) => ({
              key,
              value: value as string
            }));
            setDataExtractionFields(dataExtractionFields);
          } else {
            setDataExtractionFields([]);
          }
          
          // Update system prompts
          setCategoriesSystemPrompt(categories.system_prompt || '');
          setDataExtractionSystemPrompt(dataExtracted.system_prompt || '');
        } else {
          // Reset post-call actions if not present
          form.setValue('post_call_actions', {
            categories: {
              system_prompt: '',
              fields: {}
            },
            data_extracted: {
              system_prompt: '',
              fields: {}
            }
          });
          setCategorization([]);
          setDataExtractionFields([]);
          setCategoriesSystemPrompt('');
          setDataExtractionSystemPrompt('');
        }
        
        // Telephony config
        form.setValue('telephony_config', {
          channels: 1,
          max_concurrent_calls: 1,
          call_timeout: 30
        });
        
        // Update speech settings state
        if (version.speech_setting) {
          setAllowInterruptions(version.speech_setting.interruption?.status || false);
          setAmbientStatus(version.speech_setting.ambient_sound?.status || false);
          setSound(version.speech_setting.ambient_sound?.sound || 'office');
          setVolume(Number(version.speech_setting.ambient_sound?.volume || 0.1));
        }
        
        // Update call settings
        setMaxIdleReminder(version.max_idle_reminder || 3);
        setMaxIdleDuration(version.max_idle_duration || 5);
        
        // Update context value for the form
        setContextValue(version.llm?.prompt || '');
        
        // Update initial message
        setInitialMessage(version.llm?.initialMessage || '');
        
        // Update variables from promptJson
        if (version.llm?.promptJson?.promptVariables && Object.keys(version.llm.promptJson.promptVariables).length > 0) {
          const variables = Object.entries(version.llm.promptJson.promptVariables).map(([key, value]) => ({
            key,
            value: value as string
          }));
          setVariables(variables);
        } else {
          setVariables([]);
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load version data",
        variant: "destructive",
      });
    } finally {
      setLoadingVersion(false);
    }
  };

  // --- Fetch organizations ---
  useEffect(() => {
    async function fetchOrganizations() {
      try {
        const response = await fetch('https://platform.voxiflow.com/api/v1/organizations', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json'
          },
        });
        if (!response.ok) throw new Error('Failed to fetch organizations');
        const data = await response.json();
        setOrganizations(data);
        setOrganizationsLoaded(true);
      } catch (error) {
        setOrganizations([]);
        setOrganizationsLoaded(true);
      }
    }
    fetchOrganizations();
  }, []);

  // --- Load versions when in edit mode ---
  useEffect(() => {
    if (mode === 'edit' && params.id) {
      loadCurrentVersion(params.id);
      loadAvailableVersions(params.id);
    }
  }, [mode, params.id]);

  // --- Auto-detect variables inside curly braces in Context and sync to Variables ---
  useEffect(() => {
    try {
      const text = contextValue || '';
      const matches = text.match(/\{([^{}]+)\}/g) || [];
      const extracted = matches
        .map(m => m.slice(1, -1).trim())
        .filter(Boolean);
      if (extracted.length === 0) {
        // still ensure form value reflects current variables
        const kv: Record<string, string> = {};
        variables.forEach(v => { if (v.key) kv[v.key] = v.value || ''; });
        form.setValue('llm.promptJson.promptVariables', kv);
        return;
      }

      const normalize = (k: string) => {
        const normalized = k.toLowerCase().replace(/[^a-z0-9_]+/g, '_').replace(/^_+|_+$/g, '');
        // Map common variations to standard keys
        const keyMap: Record<string, string> = {
          'client_name': 'customer_name',
          'clientname': 'customer_name',
          'appointment_date': 'date',
          'appointmentdate': 'date',
          'appointment_time': 'time',
          'appointmenttime': 'time'
        };
        return keyMap[normalized] || normalized;
      };
      const uniqueKeys = Array.from(new Set(extracted.map(normalize).filter(Boolean)));

      // preserve existing values when keys match, but don't auto-fill values
      const nextVars = uniqueKeys.map(key => ({
        key,
        value: (variables.find(v => v.key === key)?.value) || ''
      }));

      // optionally keep extra variables previously added by user
      variables.forEach(v => { if (!nextVars.find(n => n.key === v.key)) nextVars.push(v); });

      setVariables(nextVars);
      const kv: Record<string, string> = {};
      nextVars.forEach(v => { if (v.key) kv[v.key] = v.value || ''; });
      form.setValue('llm.promptJson.promptVariables', kv);
    } catch {
      // no-op
    }
  }, [contextValue]);

  // --- Fetch campaign data for edit mode ---
  useEffect(() => {
    if (mode === 'edit' && params.id) {
      (async () => {
        try {
          const response = await fetch(`https://platform.voxiflow.com/api/v1/campaigns/${params.id}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
              'Content-Type': 'application/json'
            },
          });
          if (!response.ok) throw new Error('Failed to fetch campaign details');
          const data = await response.json();
          setCampaignData(data);
          setCampaignLoaded(true);
        } catch (error) {
          setCampaignLoaded(true);
        }
      })();
    }
  }, [mode, params.id]);

  // --- Reset form after both orgs and campaign are loaded ---
  useEffect(() => {
    if (mode === 'edit' && organizationsLoaded && campaignLoaded && campaignData) {
      // Ensure the campaign's org is present in the organizations list
      if (
        campaignData.org_id &&
        !organizations.some(org => org.id === campaignData.org_id)
      ) {
        setOrganizations(prev => [
          ...prev,
          { id: String(campaignData.org_id), name: campaignData.org_id }
        ]);
      }
      // Map all fields and step states
      setAllowInterruptions(campaignData.speech_setting?.interruption?.status ?? false);
      setAmbientStatus(campaignData.speech_setting?.ambient_sound?.status ?? false);
      setSound(campaignData.speech_setting?.ambient_sound?.sound ?? 'office');
      setVolume(Number(campaignData.speech_setting?.ambient_sound?.volume ?? 0.1));
      // Ensure post_call_actions structure is always present and correct
      const categories = campaignData.post_call_actions?.categories || {};
      const data_extracted = campaignData.post_call_actions?.data_extracted || {};
      // Only generate a new campaign_id if creating, not editing
      form.reset({
        campaign_id: (mode === 'edit' ? (campaignData.campaign_id || '') : (campaignData.campaign_id || generateUUID())),
        name: campaignData.name || '',
        direction: (campaignData.direction === 'INBOUND' || campaignData.direction === 'OUTBOUND') ? campaignData.direction : 'OUTBOUND',
        state: (campaignData.state === 'TRIAL' || campaignData.state === 'ACTIVE' || campaignData.state === 'INACTIVE') ? campaignData.state : 'TRIAL',
        org_id: String(campaignData.org_id || ''),
        tts: {
          gender: campaignData.tts?.gender || 'female',
          language: campaignData.tts?.language || 'hindi',
          voice_id: campaignData.tts?.voice_id || 'hi-IN-AnanyaNeural',
          vendor: campaignData.tts?.vendor || '11labs',
          transfer_call: campaignData.tts?.transfer_call || false
        },
        stt: {
          vendor: campaignData.stt?.vendor || 'deepgram',
          provider: campaignData.stt?.provider || 'deepgram'
        },
        telephonic_provider: campaignData.telephonic_provider || 'exotel',
        telephony_config: campaignData.telephony_config || {
          channels: 1,
          max_concurrent_calls: 1,
          call_timeout: 30
        },
        knowledge_base: {
          url: campaignData.knowledge_base?.url || '',
          file: campaignData.knowledge_base?.file || null
        },
        post_call_actions: {
          categories: {
            system_prompt: categories.system_prompt || '',
            fields: categories.fields || {}
          },
          data_extracted: {
            system_prompt: data_extracted.system_prompt || '',
            fields: data_extracted.fields || {}
          }
        },
        callback_endpoint: campaignData.callback_endpoint || '',
        llm: {
          initialMessage: campaignData.llm?.initialMessage || '',
          useProxyLlm: campaignData.llm?.useProxyLlm || false,
          UseStructuredPrompt: campaignData.llm?.UseStructuredPrompt || false,
          provider: "AZURE",
          model: "gpt-4.1",
          temperature: campaignData.llm?.temperature || '0.7',
          maxCallDuration: campaignData.llm?.maxCallDuration || '300',
          useEmbeddings: campaignData.llm?.useEmbeddings || false,
          prompt: campaignData.llm?.prompt || '',
          promptJson: {
            skeleton: campaignData.llm?.promptJson?.skeleton || 'Simple output format.',
            promptVariables: campaignData.llm?.promptJson?.promptVariables || {},
            knowledgeBase: campaignData.llm?.promptJson?.knowledgeBase || {},
            nodes: campaignData.llm?.promptJson?.nodes || {},
            context: campaignData.llm?.promptJson?.context || '',
            botStateDefinitions: campaignData.llm?.promptJson?.botStateDefinitions || {},
            language: campaignData.llm?.promptJson?.language || 'hindi',
            mermaidGraph: campaignData.llm?.promptJson?.mermaidGraph || 'initial_message -->|edge| node1\nnode1 -->|edge| node2'
          }
        }
      });
      setContextValue(campaignData.llm?.promptJson?.context || '');
      setInitialMessage(campaignData.llm?.initialMessage || '');
      const promptVarsFromAPI = campaignData.llm?.promptJson?.promptVariables || {};
      setVariables(Object.entries(promptVarsFromAPI).map(([key, value]) => ({ key, value: value as string })));
      setCategorization(Object.entries(categories.fields || {}).map(([key, value]) => ({ key, value: value as string })));
      setDataExtractionFields(Object.entries(data_extracted.fields || {}).map(([key, value]) => ({ key, value: value as string })));
      setSelectedFile(campaignData.knowledge_base?.file || null);
      setDataExtractionSystemPrompt(data_extracted.system_prompt || '');
      setCategoriesSystemPrompt(categories.system_prompt || '');
    }
  }, [mode, organizationsLoaded, campaignLoaded, campaignData, organizations]);

  // --- KeyValuePair handlers ---
  const handleAddKeyValuePair = (list: KeyValuePair[], setList: React.Dispatch<React.SetStateAction<KeyValuePair[]>>, form: any, formPath: string) => {
    const newPair = { key: '', value: '' };
    setList([...list, newPair]);
    const currentValue = form.getValues(formPath) || {};
    form.setValue(formPath, { ...currentValue, [newPair.key]: newPair.value });
  };
  const handleRemoveKeyValuePair = (index: number, list: KeyValuePair[], setList: React.Dispatch<React.SetStateAction<KeyValuePair[]>>, form: any, formPath: string) => {
    const newList = list.filter((_, i) => i !== index);
    setList(newList);
    const newValue: Record<string, string> = {};
    newList.forEach(pair => {
      newValue[pair.key] = pair.value;
    });
    form.setValue(formPath, newValue);
  };
  const handleKeyValueChange = (index: number, field: 'key' | 'value', value: string, list: KeyValuePair[], setList: React.Dispatch<React.SetStateAction<KeyValuePair[]>>, form: any, formPath: string) => {
    const newList = [...list];
    newList[index][field] = value;
    setList(newList);
    const formValue: Record<string, string> = {};
    newList.forEach(pair => {
      formValue[pair.key] = pair.value;
    });
    form.setValue(formPath, formValue);
  };

  // --- Stepper navigation ---
  const nextStep = () => setActiveStep((prev) => Math.min(prev + 1, steps.length - 1));
  const prevStep = () => setActiveStep((prev) => Math.max(prev - 1, 0));

  // --- Form submission ---
  const handleSubmit = async (data: CampaignFormValues) => {
    setIsSubmitting(true);
    try {
      // Ensure all form state is up to date before reading values
      await form.trigger();
      // Sync dataExtractionFields and categorization to form state
      const dataExtractionFieldsObj = {};
      dataExtractionFields.forEach(pair => {
        if (pair.key) dataExtractionFieldsObj[pair.key] = pair.value;
      });
      form.setValue('post_call_actions.data_extracted.fields', dataExtractionFieldsObj);
      const categorizationObj = {};
      categorization.forEach(pair => {
        if (pair.key) categorizationObj[pair.key] = pair.value;
      });
      form.setValue('post_call_actions.categories.fields', categorizationObj);
      
      // Update form with current state values for system prompts
      form.setValue('post_call_actions.categories.system_prompt', categoriesSystemPrompt);
      form.setValue('post_call_actions.data_extracted.system_prompt', dataExtractionSystemPrompt);
      
      // Now get the latest values
      data = form.getValues();
      let createdBy = undefined;
      try {
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        createdBy = userData.id ? Number(userData.id) : undefined;
      } catch {}
      // Always send post_call_actions in the required format
      // Use state variables for system prompts as they contain the actual user input
      const postCallActions = {
        data_extracted: {
          system_prompt: dataExtractionSystemPrompt || data.post_call_actions?.data_extracted?.system_prompt || '',
          fields: data.post_call_actions?.data_extracted?.fields || {}
        },
        categories: {
          system_prompt: categoriesSystemPrompt || data.post_call_actions?.categories?.system_prompt || '',
          fields: data.post_call_actions?.categories?.fields || {}
        }
      };
      const requestData = {
        campaign_id: data.campaign_id || (mode === 'edit' && params.id) || '',
        name: data.name || "",
        direction: data.direction || "",
        inbound_number: "",
        caller_id_number: "",
        state: data.state || "",
        version: "0",
        llm: {
          initialMessage: initialMessage || data.llm?.initialMessage || "",
          useProxyLlm: data.llm?.useProxyLlm || false,
          UseStructuredPrompt: data.llm?.UseStructuredPrompt || false,
          provider: "AZURE",
          model: "gpt-4.1",
          temperature: data.llm?.temperature || "0.7",
          maxCallDuration: data.llm?.maxCallDuration || "300",
          useEmbeddings: data.llm?.useEmbeddings || false,
          prompt: contextValue || data.llm?.prompt || "",
          promptJson: {
            skeleton: "Simple output format.",
            promptVariables: variables.reduce((acc, v) => {
              if (v.key) acc[v.key] = v.value;
              return acc;
            }, {} as Record<string, string>),
            knowledgeBase: data.knowledge_base,
            nodes: {},
            context: contextValue || "",
            botStateDefinitions: {},
            language: data.tts?.language || "hindi",
            mermaidGraph: "initial_message -->|edge| node1\nnode1 -->|edge| node2"
          }
        },
        tts: {
          gender: data.tts.gender || "",
          voice_id: data.tts.voice_id || "",
          language: data.tts.language || "",
          vendor: data.tts.vendor || "11labs",
          transfer_call: data.tts.transfer_call || false
        },
        stt: {
          vendor: data.stt?.vendor || 'deepgram',
          provider: data.stt?.provider || 'deepgram'
        },
        timezone: "Asia/Kolkata",
        post_call_actions: postCallActions,
        live_actions: [],
        callback_endpoint: data.callback_endpoint ?? "",
        retry: {},
        account_id: "a43b689f-b95f-4178-a7c7-7cfd547a1f68",
        telephonic_provider: data.telephonic_provider || "",
        telephony_config: data.telephony_config || {
          channels: 1,
          max_concurrent_calls: 1,
          call_timeout: 30
        },
        allow_interruption: allowInterruptions,
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
        knowledge_base: data.knowledge_base || {},
        org_id: data.org_id || "",
        created_by: createdBy,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...(mode === 'edit' && params.id ? { id: params.id } : {})
      };
      const url = mode === 'edit' && params.id
        ? `https://platform.voxiflow.com/api/v1/campaigns/${params.id}`
        : 'https://platform.voxiflow.com/api/v1/campaigns/';
      const response = await fetch(url, {
        method: mode === 'edit' ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || (mode === 'edit' ? 'Failed to update campaign' : 'Failed to create campaign'));
      }
      // Success
      navigate('/campaigns');
    } catch (error: any) {
      // TODO: show toast
      alert(error.message || 'Failed to save campaign');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- UI ---
  if ((mode === 'edit' && (!organizationsLoaded || !campaignLoaded))) {
    return <div className="text-center py-20 text-gray-500">Loading...</div>;
  }
  return (
    <div className="bg-gray-50 relative">
      {/* Stepper - Fixed at top, accounting for 256px sidebar */}
      <div 
        className="bg-white py-2.5 px-3 fixed top-0 z-50" 
        style={{ 
          left: '256px', 
          right: '0', 
          width: 'calc(100% - 256px)',
          background: 'linear-gradient(to bottom, #ffffff 0%, #f8fafc 100%)', 
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)' 
        }}
      >
        <div className="flex relative w-full" style={{ paddingLeft: '12px', paddingRight: '12px', gap: '0' }}>
          {/* Progress Line */}
          <div className="absolute top-4 left-12 right-12 h-0.5 bg-gray-200">
            <div 
              className="h-full bg-blue-500 transition-all duration-300 ease-in-out"
              style={{ 
                width: `${Math.min((activeStep / (steps.length - 1)) * 100, 100)}%` 
              }}
            />
          </div>
          {steps.map((step, index) => (
            <div
              key={`step-${index}`}
              className={`flex flex-col items-center relative ${
                activeStep === index 
                  ? 'text-blue-600' 
                  : index < activeStep 
                    ? 'text-blue-500' 
                    : 'text-gray-400'
              }`}
              style={{ 
                width: `${100 / steps.length}%`,
                flexShrink: 0,
                paddingLeft: '4px',
                paddingRight: '4px'
              }}
            >
              <div className={`w-11 h-11 rounded-full flex items-center justify-center mb-1.5 transition-all duration-200 z-10 ${
                activeStep === index 
                  ? 'bg-blue-600 text-white ring-4 ring-blue-100 shadow-lg scale-110' 
                  : index < activeStep 
                    ? 'bg-blue-500 text-white'
                    : 'bg-white border-2 border-gray-200'
              }`}>
                {index < activeStep ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span className="text-xs font-semibold">{index + 1}</span>
                )}
              </div>
              <span className={`text-xs font-medium text-center leading-tight ${
                activeStep === index 
                  ? 'text-blue-600' 
                  : index < activeStep 
                    ? 'text-blue-500' 
                    : 'text-gray-400'
              }`}>{step}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Add padding-top to account for fixed stepper with extra gap */}
      <div style={{ paddingTop: mode === 'edit' ? '135px' : '95px', paddingBottom: '100px' }}>
        {/* Version Selector - Only show in edit mode */}
        {mode === 'edit' && (
          <div className="bg-white border-b border-gray-200 px-6 py-4 mb-8 mx-6 rounded-lg shadow-sm">
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {currentVersion ? (
                      <>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-blue-600 border-blue-600">
                            Version {currentVersion.version}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {new Date(currentVersion.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Created by: {currentVersion.created_by}
                        </div>
                      </>
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        {loadingVersion ? 'Loading version...' : 'No version data available'}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {/* Version Selector Dropdown */}
                    <div className="flex items-center gap-2">
                      <Label className="text-sm font-medium text-gray-700">Edit Version:</Label>
                      <Select
                        value={selectedVersion}
                        onValueChange={handleVersionChange}
                        disabled={loadingVersion || loadingVersions}
                      >
                        <SelectTrigger className="w-40 h-8 text-sm">
                          <SelectValue placeholder="Select version" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableVersions.length > 0 ? (
                            availableVersions.map((version) => (
                              <SelectItem key={version.version} value={version.version}>
                                <div className="flex items-center gap-2">
                                  <span>v{version.version}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(version.created_at).toLocaleDateString()}
                                  </span>
                                </div>
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="no-versions" disabled>
                              No versions available
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      {loadingVersion && (
                        <div className="text-xs text-muted-foreground">Loading...</div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Card Container */}
        <div className="bg-white rounded-lg border shadow-md mx-6 my-6">
          <div className="p-8">
            <Form {...form}>
              <form onSubmit={e => e.preventDefault()} className="space-y-6 w-full">
                {/* Step 1: Name */}
                {activeStep === 0 && (
                  <div className="space-y-6 w-full">
                    <div>
                      <FormField
                        control={form.control}
                        name="campaign_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium text-gray-700">Campaign ID</FormLabel>
                            <Input {...field} placeholder="Campaign ID" className="h-9" />
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
                {/* Step 2: Speech and Call */}
                {activeStep === 1 && (
                  <div className="w-full px-0 md:px-0">
                    <div className="flex flex-col md:flex-row gap-0 items-stretch w-full text-xs">
                      {/* Speech Section */}
                      <div className="flex-1 bg-blue-50/40 p-2 min-w-0 border-r border-blue-100 flex flex-col justify-center w-full" style={{paddingRight: 0}}>
                        <div className="flex items-center gap-1 mb-2 pl-1">
                          <span className="icon-animate bg-blue-100 p-1 rounded-full"><Mic className="w-5 h-5 text-blue-600" /></span>
                          <h4 className="font-extrabold text-sm text-blue-900 tracking-tight">Speech</h4>
                        </div>
                        <div className="flex flex-col gap-2 pl-4">
                          {/* Allow Interruptions */}
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Mic className="w-4 h-4 text-blue-400" />
                              <span className="text-blue-700 font-medium">Allow Interruptions</span>
                              <TooltipProvider><Tooltip><TooltipTrigger asChild><span className="icon-animate align-middle"><Info className="w-4 h-4 text-blue-400 inline" /></span></TooltipTrigger><TooltipContent>Allow the caller to interrupt the agent's speech.</TooltipContent></Tooltip></TooltipProvider>
                            </div>
                            <div className="mt-1"><button type="button" className={`relative w-10 h-6 rounded-full transition-colors duration-200 focus:outline-none border-2 border-blue-100 shadow-sm flex items-center ${allowInterruptions ? 'bg-blue-500' : 'bg-gray-200'}`} aria-pressed={allowInterruptions} onClick={() => setAllowInterruptions(!allowInterruptions)}><span className={`absolute left-1 top-0.5 w-4 h-4 rounded-full shadow-md transition-transform duration-200 flex items-center justify-center ${allowInterruptions ? 'translate-x-4 bg-white' : 'bg-white'}`} style={{ boxShadow: allowInterruptions ? '0 0 8px 2px #3b82f6aa' : '0 1px 4px #cbd5e1' }}><Mic className={`w-3 h-3 transition-colors duration-200 ${allowInterruptions ? 'text-blue-500' : 'text-gray-400'} ${allowInterruptions ? 'scale-100' : 'scale-0'}`} /><Mic className={`w-3 h-3 absolute transition-colors duration-200 ${allowInterruptions ? 'scale-0' : 'scale-100'} text-gray-400`} /></span></button></div>
                          </div>
                          {/* Ambient Status */}
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Volume2 className="w-4 h-4 text-blue-400" />
                              <span className="text-blue-700 font-medium">Ambient Status</span>
                              <TooltipProvider><Tooltip><TooltipTrigger asChild><span className="icon-animate align-middle"><Info className="w-4 h-4 text-blue-400 inline" /></span></TooltipTrigger><TooltipContent>Enable or disable ambient background sound.</TooltipContent></Tooltip></TooltipProvider>
                            </div>
                            <div className="mt-1"><button type="button" className={`relative w-10 h-6 rounded-full transition-colors duration-200 focus:outline-none border-2 border-blue-100 shadow-sm flex items-center ${ambientStatus ? 'bg-blue-500' : 'bg-gray-200'}`} aria-pressed={ambientStatus} onClick={() => setAmbientStatus(!ambientStatus)}><span className={`absolute left-1 top-0.5 w-4 h-4 rounded-full shadow-md transition-transform duration-200 flex items-center justify-center ${ambientStatus ? 'translate-x-4 bg-white' : 'bg-white'}`} style={{ boxShadow: ambientStatus ? '0 0 8px 2px #3b82f6aa' : '0 1px 4px #cbd5e1' }}><Volume2 className={`w-3 h-3 transition-colors duration-200 ${ambientStatus ? 'text-blue-500' : 'text-gray-400'} ${ambientStatus ? 'scale-100' : 'scale-0'}`} /><Volume2 className={`w-3 h-3 absolute transition-colors duration-200 ${ambientStatus ? 'scale-0' : 'scale-100'} text-gray-400`} /></span></button></div>
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
                      <div className="flex-1 bg-blue-50/40 p-2 min-w-0 flex flex-col justify-center w-full" style={{paddingLeft: 0}}>
                        <div className="flex items-center gap-1 mb-2 pl-1">
                          <span className="icon-animate bg-blue-100 p-1 rounded-full"><Clock className="w-5 h-5 text-blue-600" /></span>
                          <h4 className="font-extrabold text-sm text-blue-900 tracking-tight">Call</h4>
                        </div>
                        <div className="flex flex-col gap-2 pl-4">
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
                {activeStep === 2 && (
                  <div className="space-y-2 w-full">
                    <StepVoice form={form} selectedVoiceId={form.getValues('tts.voice_id')} />
                  </div>
                )}
                {activeStep === 3 && (
                  <div className="w-full">
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
                {activeStep === 4 && (
                  <div className="space-y-2 w-full">
                    <StepTelephony form={form} />
                  </div>
                )}
                {activeStep === 5 && (
                  <div className="space-y-2 w-full">
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
              </form>
            </Form>
          </div>
        </div>
      </div>

      {/* Fixed Button Bar - Static at bottom */}
      <div 
        className="fixed bg-white border-t border-gray-200 bottom-0 z-50 shadow-md"
        style={{ 
          left: '256px', 
          right: '0'
        }}
      >
        <div className="flex justify-between items-center px-8 py-4">
          <Button variant="outline" onClick={() => navigate(-1)} className="h-10 px-6 text-sm border-gray-300 hover:bg-gray-50">
            Cancel
          </Button>
          <div className="flex items-center gap-3">
            {activeStep > 0 && (
              <Button variant="outline" onClick={prevStep} className="h-10 px-6 text-sm border-gray-300 hover:bg-gray-50">
                Previous
              </Button>
            )}
            {activeStep < steps.length - 1 ? (
              <Button type="button" onClick={nextStep} className="h-10 px-6 text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
                Next
              </Button>
            ) : (
              <Button
                type="button"
                disabled={isSubmitting}
                className="h-10 px-6 text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-sm disabled:opacity-50"
                onClick={async () => {
                  const isValid = await form.trigger();
                  if (isValid) {
                    const { campaign_id, name, direction, state, org_id, tts, stt, telephonic_provider, telephony_config, knowledge_base, post_call_actions, callback_endpoint, llm } = form.getValues();
                    handleSubmit({ campaign_id, name, direction, state, org_id, tts, stt, telephonic_provider, telephony_config, knowledge_base, post_call_actions, callback_endpoint, llm });
                  } else {
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
                        case 'telephony_config': return 'Telephony Configuration';
                        case 'knowledge_base': return 'Knowledge Base';
                        case 'llm': return 'LLM Configuration';
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
                {isSubmitting ? 'Saving...' : (mode === 'edit' ? 'Save Changes' : 'Create Campaign')}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 
