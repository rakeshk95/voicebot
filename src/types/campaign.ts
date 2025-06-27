export interface Organization {
  id: string;
  name: string;
}

export interface KeyValuePair {
  key: string;
  value: string;
}

export interface Campaign {
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
    provider: string;
    promptJson?: {
      context?: string;
      promptVariables?: Record<string, string>;
    };
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

export interface CampaignFormData {
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

export interface CallFormData {
  callerName: string;
  mobileNumber: string;
} 