/**
 * Campaign Versioning API Service
 * Handles all campaign versioning operations using the new versioning endpoints
 */

import { authorizedFetch } from './api';

// Types for Campaign Versioning
export interface CampaignVersion {
  id: string;
  name: string;
  version: string;
  state: string;
  created_at: string;
  created_by: string;
  direction?: 'INBOUND' | 'OUTBOUND';
  org_id?: string;
  max_idle_reminder?: number;
  max_idle_duration?: number;
  campaign_id?: string;
  account_id?: string;
  allow_interruption?: boolean;
  callback_endpoint?: string;
  caller_id_number?: string;
  inbound_number?: string;
  is_active?: boolean;
  live_actions?: any[];
  retry?: any;
  timezone?: string;
  updated_at?: string;
  llm?: {
    initialMessage?: string;
    useProxyLlm?: boolean;
    UseStructuredPrompt?: boolean;
    provider?: string;
    model: string;
    temperature?: string;
    maxCallDuration?: any;
    useEmbeddings?: boolean;
    prompt: string;
    promptJson?: {
      skeleton?: string;
      promptVariables?: Record<string, string>;
      knowledgeBase?: any;
      nodes?: any;
      context?: string;
      responses?: any;
      variables?: any;
    };
  };
  tts?: {
    voice_id: string;
    gender: string;
    language: string;
    vendor?: string;
    transfer_call?: boolean;
  };
  stt?: {
    vendor: string;
    provider: string;
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
  telephonic_provider?: string;
  telephony_config?: {
    channels: number;
    max_concurrent_calls: number;
    call_timeout: number;
  };
  knowledge_base?: {
    url: string;
    file: any;
  };
  post_call_actions?: {
    categories: {
      system_prompt: string;
      fields: Record<string, string>;
    };
    data_extracted: {
      system_prompt: string;
      fields: Record<string, string>;
    };
  };
}

export interface CampaignUpdateRequest {
  name?: string;
  state?: string;
  llm?: {
    model: string;
    prompt: string;
    promptJson?: any;
  };
  tts?: {
    voice_id: string;
    gender: string;
    language: string;
  };
  speech_setting?: any;
  telephonic_provider?: string;
  knowledge_base?: any;
  post_call_actions?: any;
}

export interface CampaignUpdateResponse {
  campaign: CampaignVersion;
  version_created: boolean;
  new_version: string;
  change_reason?: string;
}

export interface RestoreResponse {
  message: string;
  campaign: CampaignVersion;
  restored_to_version: string;
  new_version: string;
  restore_success: boolean;
}

/**
 * Update campaign with versioning
 */
export async function updateCampaignWithVersioning(
  campaignId: string, 
  campaignData: CampaignUpdateRequest, 
  changeReason?: string
): Promise<CampaignUpdateResponse> {
  try {
    let endpoint = `/campaigns/${campaignId}`;
    if (changeReason) {
      endpoint += `?change_reason=${encodeURIComponent(changeReason)}`;
    }

    const response = await authorizedFetch<CampaignUpdateResponse>(endpoint, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(campaignData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to update campaign: ${response.status} - ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating campaign with versioning:', error);
    throw error;
  }
}

/**
 * Get all versions of a campaign
 */
export async function getCampaignVersions(campaignId: string): Promise<CampaignVersion[]> {
  try {
    const response = await authorizedFetch<CampaignVersion[]>(
      `/campaigns/${campaignId}/versions`
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get campaign versions: ${response.status} - ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching campaign versions:', error);
    throw error;
  }
}

/**
 * Get specific version of a campaign
 */
export async function getCampaignVersion(campaignId: string, versionNumber: string): Promise<CampaignVersion> {
  try {
    const response = await authorizedFetch<CampaignVersion>(
      `/campaigns/${campaignId}/versions/${versionNumber}`
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get campaign version: ${response.status} - ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching campaign version:', error);
    throw error;
  }
}

/**
 * Restore campaign to a specific version
 */
export async function restoreToVersion(campaignId: string, versionNumber: string): Promise<RestoreResponse> {
  try {
    const response = await authorizedFetch<RestoreResponse>(
      `/campaigns/${campaignId}/versions/${versionNumber}/restore`,
      {
        method: 'POST',
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to restore campaign version: ${response.status} - ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error restoring campaign version:', error);
    throw error;
  }
}

/**
 * Get current (latest) version of a campaign
 */
export async function getCurrentVersion(campaignId: string): Promise<CampaignVersion> {
  try {
    const response = await authorizedFetch<CampaignVersion>(
      `/campaigns/${campaignId}/current-version`
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get current version: ${response.status} - ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching current version:', error);
    throw error;
  }
}

/**
 * Compare two versions of a campaign
 */
export function compareVersions(version1: CampaignVersion, version2: CampaignVersion): {
  changes: Array<{
    field: string;
    oldValue: any;
    newValue: any;
    type: 'added' | 'removed' | 'modified';
  }>;
  hasChanges: boolean;
} {
  const changes: Array<{
    field: string;
    oldValue: any;
    newValue: any;
    type: 'added' | 'removed' | 'modified';
  }> = [];

  const compareObjects = (obj1: any, obj2: any, prefix = '') => {
    const allKeys = new Set([...Object.keys(obj1 || {}), ...Object.keys(obj2 || {})]);
    
    for (const key of allKeys) {
      const fieldPath = prefix ? `${prefix}.${key}` : key;
      const val1 = obj1?.[key];
      const val2 = obj2?.[key];

      if (val1 === undefined && val2 !== undefined) {
        changes.push({
          field: fieldPath,
          oldValue: undefined,
          newValue: val2,
          type: 'added'
        });
      } else if (val1 !== undefined && val2 === undefined) {
        changes.push({
          field: fieldPath,
          oldValue: val1,
          newValue: undefined,
          type: 'removed'
        });
      } else if (JSON.stringify(val1) !== JSON.stringify(val2)) {
        changes.push({
          field: fieldPath,
          oldValue: val1,
          newValue: val2,
          type: 'modified'
        });
      }
    }
  };

  // Compare basic fields
  compareObjects(version1, version2);

  return {
    changes,
    hasChanges: changes.length > 0
  };
}

/**
 * Get version change summary
 */
export function getVersionChangeSummary(version: CampaignVersion, previousVersion?: CampaignVersion): string {
  if (!previousVersion) {
    return `Initial version ${version.version}`;
  }

  const comparison = compareVersions(previousVersion, version);
  
  if (!comparison.hasChanges) {
    return `No changes from version ${previousVersion.version}`;
  }

  const changeTypes = {
    added: comparison.changes.filter(c => c.type === 'added').length,
    modified: comparison.changes.filter(c => c.type === 'modified').length,
    removed: comparison.changes.filter(c => c.type === 'removed').length
  };

  const parts = [];
  if (changeTypes.added > 0) parts.push(`${changeTypes.added} added`);
  if (changeTypes.modified > 0) parts.push(`${changeTypes.modified} modified`);
  if (changeTypes.removed > 0) parts.push(`${changeTypes.removed} removed`);

  return `${parts.join(', ')} from version ${previousVersion.version}`;
}
