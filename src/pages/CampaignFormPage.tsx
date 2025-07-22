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
    vendor: z.string().optional()
  }),
  stt: z.object({
    vendor: z.string()
  }),
  telephonic_provider: z.string(),
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
  callback_auth_token: z.string().optional()
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
  };
  stt: {
    vendor: string;
  };
  telephonic_provider: string;
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
    vendor: "deepgram"
  },
  telephonic_provider: "exotel",
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
  callback_endpoint: ""
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
  const [responses, setResponses] = useState<KeyValuePair[]>([]);
  const [variables, setVariables] = useState<KeyValuePair[]>([]);
  const [categorization, setCategorization] = useState<KeyValuePair[]>([]);
  const [dataExtractionFields, setDataExtractionFields] = useState<KeyValuePair[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  // --- Persist system prompt for data extraction ---
  const [dataExtractionSystemPrompt, setDataExtractionSystemPrompt] = useState('');
  // --- Persist system prompt for categories ---
  const [categoriesSystemPrompt, setCategoriesSystemPrompt] = useState('');

  // --- Form ---
  const form = useForm<CampaignFormValues>({
    resolver: zodResolver(campaignFormSchema) as any, // force type to match CampaignFormValues
    defaultValues
  });

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

  // --- Fetch organizations ---
  useEffect(() => {
    async function fetchOrganizations() {
      try {
        const response = await fetch('http://192.168.2.135:8000/api/v1/organizations', {
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

  // --- Fetch campaign data for edit mode ---
  useEffect(() => {
    if (mode === 'edit' && params.id) {
      (async () => {
        try {
          const response = await fetch(`http://192.168.2.135:8000/api/v1/campaigns/${params.id}`, {
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
          vendor: campaignData.tts?.vendor || '11labs'
        },
        stt: {
          vendor: campaignData.stt?.vendor || 'deepgram'
        },
        telephonic_provider: campaignData.telephonic_provider || 'exotel',
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
        }
      });
      setContextValue(campaignData.llm?.promptJson?.context || '');
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
      // Now get the latest values
      data = form.getValues();
      let createdBy = undefined;
      try {
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        createdBy = userData.id ? Number(userData.id) : undefined;
      } catch {}
      // Always send post_call_actions in the required format
      const postCallActions = {
        data_extracted: {
          system_prompt: data.post_call_actions?.data_extracted?.system_prompt || '',
          fields: data.post_call_actions?.data_extracted?.fields || {}
        },
        categories: {
          system_prompt: data.post_call_actions?.categories?.system_prompt || '',
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
          initialMessage: "",
          useProxyLlm: false,
          UseStructuredPrompt: false,
          provider: "OPENAI",
          promptJson: {
            skeleton: "Simple output format.",
            promptVariables: Object.fromEntries(variables.map(v => [v.key, v.value])),
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
          gender: data.tts.gender || "",
          voice_id: data.tts.voice_id || "",
          language: data.tts.language || "",
          vendor: data.tts.vendor || "11labs"
        },
        stt: {
          vendor: data.stt?.vendor || 'deepgram'
        },
        timezone: "Asia/Kolkata",
        post_call_actions: postCallActions,
        live_actions: [],
        callback_endpoint: data.callback_endpoint ?? "",
        retry: {},
        account_id: "a43b689f-b95f-4178-a7c7-7cfd547a1f68",
        telephonic_provider: data.telephonic_provider || "",
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
      console.log('Campaign create/edit payload:', requestData); // Debug: verify campaign_id in payload
      const url = mode === 'edit' && params.id
        ? `http://192.168.2.135:8000/api/v1/campaigns/${params.id}`
        : 'http://192.168.2.135:8000/api/v1/campaigns/';
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
    <main className="flex-1 bg-gray-50">
      <div className="flex flex-col flex-1 items-stretch w-full mt-2">
        {/* Stepper */}
        <div className="bg-gradient-to-r from-white to-blue-50/30 w-full p-0 m-0 text-xs">
          <div className="flex justify-between relative">
            {/* Progress Line */}
            <div className="absolute top-4 left-0 w-full h-0.5 bg-gray-200">
              <div 
                className="h-full bg-blue-500 transition-all duration-300 ease-in-out"
                style={{ width: `${((activeStep) / 5) * 100}%` }}
              />
            </div>
            {['Name', 'Speech and Call', 'Voice', 'Flow', 'Telephony', 'Post Call Actions'].map((step, index) => (
              <div
                key={step}
                className={`flex flex-col items-center relative ${
                  activeStep === index 
                    ? 'text-blue-600' 
                    : index < activeStep 
                      ? 'text-blue-500' 
                      : 'text-gray-400'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 transition-all duration-200 ${
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
                    <span className="text-sm font-semibold">{index + 1}</span>
                  )}
                </div>
                <span className={`text-sm font-medium ${
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
        {/* Card Container */}
        <div className="bg-white rounded-lg border shadow-sm">
          <div className="p-6">
            <Form {...form}>
              <form onSubmit={e => e.preventDefault()} className="space-y-4 w-full">
                {/* Step 1: Name */}
                {activeStep === 0 && (
                  <div className="space-y-2 w-full">
                    <h2 className="text-base font-bold text-blue-700 mb-2">Name</h2>
                    <div className="mb-1 w-full">
                      <FormField
                        control={form.control}
                        name="campaign_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Campaign ID</FormLabel>
                            <Input {...field} placeholder="Campaign ID" className="h-7 text-xs" />
                            <FormDescription className="text-[10px] text-gray-500 mt-0.5">
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
                <div className="flex justify-between items-center pt-1 px-0 sticky bottom-0 bg-white border-t z-10 w-full">
                  <Button variant="outline" onClick={() => navigate(-1)} className="h-7 px-3 text-xs font-semibold">
                    Cancel
                  </Button>
                  <div>
                    {activeStep > 0 && (
                      <Button variant="ghost" onClick={prevStep} className="mr-2 h-7 px-3 text-xs">
                        Previous
                      </Button>
                    )}
                    {activeStep < steps.length - 1 ? (
                      <Button variant="default" type="button" onClick={nextStep} className="h-7 px-3 text-xs bg-blue-600 hover:bg-blue-700">
                        Next
                      </Button>
                    ) : (
                      <Button
                        variant="default"
                        type="button"
                        disabled={isSubmitting}
                        className="h-7 px-3 text-xs bg-blue-600 hover:bg-blue-700"
                        onClick={async () => {
                          const isValid = await form.trigger();
                          if (isValid) {
                            // Only pass the fields defined in the Zod schema to validation and handleSubmit
                            const {
                              campaign_id, name, direction, state, org_id, tts, stt, telephonic_provider, knowledge_base, post_call_actions, callback_endpoint
                            } = form.getValues();
                            handleSubmit({
                              campaign_id, name, direction, state, org_id, tts, stt, telephonic_provider, knowledge_base, post_call_actions, callback_endpoint
                            });
                          } else {
                            const errors = form.formState.errors;
                            console.log('Validation errors:', errors);
                            alert(JSON.stringify(errors, null, 2));
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
              </form>
            </Form>
          </div>
        </div>
      </div>
    </main>
  );
} 