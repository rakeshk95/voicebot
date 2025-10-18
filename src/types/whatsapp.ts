export interface WhatsAppBusinessAccount {
  id: string;
  business_account_id: string;
  name: string;
  phone_number_id: string;
  access_token: string;
  webhook_verify_token?: string;
  org_id?: string;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface WhatsAppCampaign {
  id: string;
  name: string;
  business_account_id: string;
  campaign_id?: string;
  template_name: string;
  template_params?: Record<string, any>;
  message_content?: string;
  media_url?: string;
  media_type?: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  org_id?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface WhatsAppMessage {
  id: string;
  message_id: string;
  business_account_id: string;
  whatsapp_campaign_id?: string;
  to_number: string;
  from_number: string;
  message_type: 'text' | 'template' | 'image' | 'video' | 'document' | 'audio';
  content?: string;
  template_name?: string;
  template_params?: Record<string, any>;
  media_url?: string;
  media_type?: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  direction: 'inbound' | 'outbound';
  error_message?: string;
  sent_at?: string;
  delivered_at?: string;
  read_at?: string;
  org_id?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface WhatsAppTemplate {
  id: string;
  template_name: string;
  template_id: string;
  category: 'AUTHENTICATION' | 'MARKETING' | 'UTILITY';
  language: string;
  status: 'pending' | 'approved' | 'rejected' | 'disabled';
  components?: Record<string, any>;
  business_account_id: string;
  org_id?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface WhatsAppSendMessageRequest {
  to: string;
  type: 'text' | 'template' | 'image' | 'video' | 'document' | 'audio';
  text?: {
    body: string;
  };
  template?: {
    name: string;
    parameters?: any[];
  };
  image?: {
    link: string;
    caption?: string;
  };
  video?: {
    link: string;
    caption?: string;
  };
  document?: {
    link: string;
    filename?: string;
  };
  audio?: {
    link: string;
  };
}

export interface WhatsAppSendMessageResponse {
  messaging_product: string;
  contacts: Array<{
    input: string;
    wa_id: string;
  }>;
  messages: Array<{
    id: string;
  }>;
}

export interface WhatsAppBulkSendRequest {
  campaign_id: string;
  phone_numbers: string[];
  template_params?: Record<string, any>;
  media_url?: string;
  media_type?: string;
}

export interface WhatsAppBulkSendResponse {
  campaign_id: string;
  total_messages: number;
  successful_messages: number;
  failed_messages: number;
  message_ids: string[];
  errors: Array<{
    phone_number: string;
    error: string;
  }>;
}

export interface WhatsAppBusinessAccountCreate {
  business_account_id: string;
  name: string;
  phone_number_id: string;
  access_token: string;
  webhook_verify_token?: string;
  org_id?: string;
  is_active?: boolean;
  created_by: string;
}

export interface WhatsAppCampaignCreate {
  name: string;
  business_account_id: string;
  campaign_id?: string;
  template_name: string;
  template_params?: Record<string, any>;
  message_content?: string;
  media_url?: string;
  media_type?: string;
  status?: string;
  org_id?: string;
  created_by: string;
}
