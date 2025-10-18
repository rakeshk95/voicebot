import { authorizedFetch } from './api';
import {
  WhatsAppBusinessAccount,
  WhatsAppCampaign,
  WhatsAppMessage,
  WhatsAppTemplate,
  WhatsAppSendMessageRequest,
  WhatsAppSendMessageResponse,
  WhatsAppBulkSendRequest,
  WhatsAppBulkSendResponse,
  WhatsAppBusinessAccountCreate,
  WhatsAppCampaignCreate
} from '@/types/whatsapp';

// Business Account API
export async function createWhatsAppBusinessAccount(
  data: WhatsAppBusinessAccountCreate
): Promise<WhatsAppBusinessAccount> {
  const response = await authorizedFetch<WhatsAppBusinessAccount>(
    '/whatsapp/business-accounts',
    {
      method: 'POST',
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create business account: ${response.status} - ${errorText}`);
  }

  return response.json();
}

export async function getWhatsAppBusinessAccounts(
  orgId?: string
): Promise<WhatsAppBusinessAccount[]> {
  const params = new URLSearchParams();
  if (orgId) params.append('org_id', orgId);

  const response = await authorizedFetch<WhatsAppBusinessAccount[]>(
    `/whatsapp/business-accounts?${params.toString()}`
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get business accounts: ${response.status} - ${errorText}`);
  }

  return response.json();
}

export async function getWhatsAppBusinessAccount(
  accountId: string
): Promise<WhatsAppBusinessAccount> {
  const response = await authorizedFetch<WhatsAppBusinessAccount>(
    `/whatsapp/business-accounts/${accountId}`
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get business account: ${response.status} - ${errorText}`);
  }

  return response.json();
}

export async function updateWhatsAppBusinessAccount(
  accountId: string,
  data: Partial<WhatsAppBusinessAccount>
): Promise<WhatsAppBusinessAccount> {
  const response = await authorizedFetch<WhatsAppBusinessAccount>(
    `/whatsapp/business-accounts/${accountId}`,
    {
      method: 'PUT',
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to update business account: ${response.status} - ${errorText}`);
  }

  return response.json();
}

// Campaign API
export async function createWhatsAppCampaign(
  data: WhatsAppCampaignCreate
): Promise<WhatsAppCampaign> {
  const response = await authorizedFetch<WhatsAppCampaign>(
    '/whatsapp/campaigns',
    {
      method: 'POST',
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create campaign: ${response.status} - ${errorText}`);
  }

  return response.json();
}

export async function getWhatsAppCampaigns(
  orgId?: string,
  businessAccountId?: string
): Promise<WhatsAppCampaign[]> {
  const params = new URLSearchParams();
  if (orgId) params.append('org_id', orgId);
  if (businessAccountId) params.append('business_account_id', businessAccountId);

  const response = await authorizedFetch<WhatsAppCampaign[]>(
    `/whatsapp/campaigns?${params.toString()}`
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get campaigns: ${response.status} - ${errorText}`);
  }

  return response.json();
}

// Message API
export async function sendWhatsAppMessage(
  request: WhatsAppSendMessageRequest,
  businessAccountId: string
): Promise<WhatsAppSendMessageResponse> {
  const params = new URLSearchParams();
  params.append('business_account_id', businessAccountId);

  const response = await authorizedFetch<WhatsAppSendMessageResponse>(
    `/whatsapp/send-message?${params.toString()}`,
    {
      method: 'POST',
      body: JSON.stringify(request),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to send message: ${response.status} - ${errorText}`);
  }

  return response.json();
}

export async function sendBulkWhatsAppMessages(
  request: WhatsAppBulkSendRequest,
  businessAccountId: string
): Promise<WhatsAppBulkSendResponse> {
  const params = new URLSearchParams();
  params.append('business_account_id', businessAccountId);

  const response = await authorizedFetch<WhatsAppBulkSendResponse>(
    `/whatsapp/send-bulk?${params.toString()}`,
    {
      method: 'POST',
      body: JSON.stringify(request),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to send bulk messages: ${response.status} - ${errorText}`);
  }

  return response.json();
}

export async function getWhatsAppMessages(
  orgId?: string,
  businessAccountId?: string,
  campaignId?: string,
  limit: number = 50,
  offset: number = 0
): Promise<WhatsAppMessage[]> {
  const params = new URLSearchParams();
  if (orgId) params.append('org_id', orgId);
  if (businessAccountId) params.append('business_account_id', businessAccountId);
  if (campaignId) params.append('campaign_id', campaignId);
  params.append('limit', limit.toString());
  params.append('offset', offset.toString());

  const response = await authorizedFetch<WhatsAppMessage[]>(
    `/whatsapp/messages?${params.toString()}`
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get messages: ${response.status} - ${errorText}`);
  }

  return response.json();
}

// Template API
export async function getWhatsAppTemplates(
  businessAccountId: string
): Promise<{ templates: WhatsAppTemplate[] }> {
  const params = new URLSearchParams();
  params.append('business_account_id', businessAccountId);

  const response = await authorizedFetch<{ templates: WhatsAppTemplate[] }>(
    `/whatsapp/templates?${params.toString()}`
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get templates: ${response.status} - ${errorText}`);
  }

  return response.json();
}
