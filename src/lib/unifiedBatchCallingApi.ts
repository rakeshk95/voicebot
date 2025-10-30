/**
 * Unified Batch Calling API Client
 * Provides a single interface for all batch calling operations
 * Handles both legacy and RabbitMQ implementations seamlessly
 */

import { authorizedFetch } from './api';
import { BatchCallStartRequest, BatchCallOperation, BatchOperationsList, BatchCallSummary } from '@/types/batchCalling';

// Base URL for unified batch calling API - use local backend
const UNIFIED_BATCH_CALLS_BASE_URL = 'https://platform.voxiflow.com/backend/api/v1/batch-calls';

// Use the standard authorizedFetch function which handles authentication properly
async function localAuthorizedFetch<T>(url: string, options?: RequestInit): Promise<Response> {
  console.log('🔍 localAuthorizedFetch - URL:', url);
  console.log('🔍 localAuthorizedFetch - Method:', options?.method || 'GET');
  
  // Use the standard authorizedFetch which handles authentication correctly
  return await authorizedFetch<T>(url, options);
}

export interface UnifiedBatchCallResponse {
  message: string;
  bulk_operation_id: string;
  status: string;
  progress_percentage: number;
  total_calls: number;
  completed_calls: number;
  successful_calls: number;
  failed_calls: number;
  implementation: 'legacy' | 'rabbitmq';
  capabilities: {
    can_pause: boolean;
    can_resume: boolean;
    can_cancel: boolean;
    real_time_updates: boolean;
  };
  database_id?: string;
  persistent: boolean;
  note?: string;
}

export interface UnifiedOperationStatus {
  bulk_operation_id: string;
  status: string;
  started_at?: string;
  paused_at?: string;
  resumed_at?: string;
  completed_at?: string;
  cancelled_at?: string;
  total_calls: number;
  completed_calls: number;
  successful_calls: number;
  failed_calls: number;
  pending_calls: number;
  progress_percentage: number;
  current_row: number;
  can_pause: boolean;
  can_resume: boolean;
  can_cancel: boolean;
  implementation: 'legacy' | 'rabbitmq';
  database_synced?: boolean;
  database_id?: string;
  error_message?: string;
  last_error_at?: string;
}

export interface UnifiedOperationsList {
  total_operations: number;
  active_operations: number;
  operations: Record<string, UnifiedOperationStatus>;
  implementation_breakdown?: {
    legacy: number;
    rabbitmq: number;
  };
  source: string;
}

export interface UnifiedOperationsSummary {
  operation_summary: {
    total: number;
    active: number;
    paused: number;
    completed: number;
    failed: number;
    cancelled: number;
  };
  call_summary: {
    total_calls: number;
    completed_calls: number;
    successful_calls: number;
    failed_calls: number;
    pending_calls: number;
  };
  total_operations: number;
  active_operations: number;
  paused_operations: number;
  memory_operations: number;
  memory_active: number;
  source: string;
  timestamp: string;
}

export interface UnifiedSystemHealth {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  memory_operations: {
    total: number;
    active: number;
  };
  implementations: {
    legacy: string;
    rabbitmq: string;
  };
  capabilities: {
    pause: boolean;
    resume: boolean;
    cancel: boolean;
    real_time_updates: boolean;
    database_persistence: boolean;
  };
  error?: string;
}

/**
 * Create a new batch operation using the unified API
 */
export async function createUnifiedBatchOperation(
  file: File,
  request: BatchCallStartRequest,
  implementation: 'legacy' | 'rabbitmq' = 'rabbitmq'
): Promise<UnifiedBatchCallResponse> {
  try {
    console.log('🚀 Creating unified batch operation:', {
      filename: file.name,
      implementation,
      campaign_id: request.campaign_id
    });

    const formData = new FormData();
    formData.append('file', file);
    formData.append('campaign_id', request.campaign_id);
    formData.append('org_id', request.org_id);
    formData.append('user_id', request.user_id);
    formData.append('implementation', implementation);
    
    if (request.operation_name) {
      formData.append('operation_name', request.operation_name);
    }
    
    if (request.sleep_seconds) {
      formData.append('sleep_seconds', request.sleep_seconds.toString());
    }
    
    if (request.channels) {
      formData.append('channels', request.channels.toString());
    }
    
    if (request.worker_prefetch) {
      formData.append('worker_prefetch', request.worker_prefetch.toString());
    }
    
    if (request.batch_size) {
      formData.append('batch_size', request.batch_size.toString());
    }

  // Debug: Log FormData contents
  console.log('🔍 FormData contents:');
  for (let [key, value] of formData.entries()) {
    if (value instanceof File) {
      console.log(`  ${key}: [File] ${value.name} (${value.size} bytes)`);
    } else {
      console.log(`  ${key}: ${value}`);
    }
  }
  
  // Additional debug: Check if file is actually in FormData
  const fileEntry = formData.get('file');
  console.log('🔍 File entry in FormData:', fileEntry);
  console.log('🔍 File entry type:', typeof fileEntry);
  console.log('🔍 File entry instanceof File:', fileEntry instanceof File);

    console.log('🔍 Request URL:', `/batch-calls/create`);
    console.log('🔍 Request method: POST');
    console.log('🔍 FormData type:', formData.constructor.name);
    console.log('🔍 FormData size:', formData.toString().length);

  // First test the FormData with authentication
  console.log('🧪 Testing FormData with test endpoint first...');
  
  try {
    const testResponse = await localAuthorizedFetch(`/batch-calls/test`, {
      method: 'POST',
      body: formData,
    });
    
    console.log('🧪 Test endpoint response status:', testResponse.status);
    const testResult = await testResponse.text();
    console.log('🧪 Test endpoint response:', testResult);
    
    if (testResponse.ok) {
      console.log('✅ FormData is working correctly');
    } else {
      console.log('❌ FormData has issues:', testResult);
    }
  } catch (testError) {
    console.error('❌ Test endpoint error:', testError);
  }

  const response = await localAuthorizedFetch<UnifiedBatchCallResponse>(
    `/batch-calls/create`,
    {
      method: 'POST',
      body: formData,
    }
  );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Failed to create unified batch operation:', response.status, errorText);
      throw new Error(`Failed to create batch operation: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Unified batch operation created successfully:', result);
    
    return result;
  } catch (error) {
    console.error('❌ Error creating unified batch operation:', error);
    throw error;
  }
}

/**
 * Get all batch operations from the unified API
 */
export async function getUnifiedOperationsList(
  filters?: {
    implementation?: 'legacy' | 'rabbitmq';
    org_id?: string;
    user_id?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }
): Promise<UnifiedOperationsList> {
  try {
    console.log('🚀 Fetching unified operations list with filters:', filters);
    
    const params = new URLSearchParams();
    if (filters?.implementation) params.append('implementation', filters.implementation);
    if (filters?.org_id) params.append('org_id', filters.org_id);
    if (filters?.user_id) params.append('user_id', filters.user_id);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());

    const url = `/batch-calls/operations${params.toString() ? `?${params.toString()}` : ''}`;
    
    const response = await localAuthorizedFetch<UnifiedOperationsList>(url);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Failed to get unified operations list:', response.status, errorText);
      throw new Error(`Failed to get operations list: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Unified operations list received:', {
      total: result.total_operations,
      active: result.active_operations,
      source: result.source
    });
    
    return result;
  } catch (error) {
    console.error('❌ Error getting unified operations list:', error);
    throw error;
  }
}

/**
 * Get status of a specific operation
 */
export async function getUnifiedOperationStatus(operationId: string): Promise<{
  source: 'memory' | 'database';
  data: UnifiedOperationStatus;
  note: string;
}> {
  try {
    console.log('🚀 Getting unified operation status:', operationId);
    
    const response = await localAuthorizedFetch<{
      source: 'memory' | 'database';
      data: UnifiedOperationStatus;
      note: string;
    }>(`/batch-calls/operations/${operationId}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Failed to get unified operation status:', response.status, errorText);
      throw new Error(`Failed to get operation status: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Unified operation status received:', {
      operationId,
      source: result.source,
      status: result.data.status
    });
    
    return result;
  } catch (error) {
    console.error('❌ Error getting unified operation status:', error);
    throw error;
  }
}

/**
 * Pause a batch operation
 */
export async function pauseUnifiedOperation(operationId: string): Promise<{ message: string; status: string }> {
  try {
    console.log('⏸️ Pausing unified operation:', operationId);
    
    const response = await localAuthorizedFetch<{ message: string; status: string }>(
      `/batch-calls/operations/${operationId}/pause`,
      {
        method: 'POST',
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Failed to pause unified operation:', response.status, errorText);
      throw new Error(`Failed to pause operation: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Unified operation paused successfully:', result);
    
    return result;
  } catch (error) {
    console.error('❌ Error pausing unified operation:', error);
    throw error;
  }
}

/**
 * Resume a paused batch operation
 */
export async function resumeUnifiedOperation(operationId: string): Promise<{ message: string; status: string }> {
  try {
    console.log('▶️ Resuming unified operation:', operationId);
    
    const response = await localAuthorizedFetch<{ message: string; status: string }>(
      `/batch-calls/operations/${operationId}/resume`,
      {
        method: 'POST',
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Failed to resume unified operation:', response.status, errorText);
      throw new Error(`Failed to resume operation: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Unified operation resumed successfully:', result);
    
    return result;
  } catch (error) {
    console.error('❌ Error resuming unified operation:', error);
    throw error;
  }
}

/**
 * Cancel a batch operation
 */
export async function cancelUnifiedOperation(operationId: string): Promise<{ message: string; status: string }> {
  try {
    console.log('🛑 Cancelling unified operation:', operationId);
    
    const response = await localAuthorizedFetch<{ message: string; status: string }>(
      `/batch-calls/operations/${operationId}/cancel`,
      {
        method: 'POST',
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Failed to cancel unified operation:', response.status, errorText);
      throw new Error(`Failed to cancel operation: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Unified operation cancelled successfully:', result);
    
    return result;
  } catch (error) {
    console.error('❌ Error cancelling unified operation:', error);
    throw error;
  }
}

/**
 * Get comprehensive operations summary
 */
export async function getUnifiedOperationsSummary(
  filters?: {
    org_id?: string;
    user_id?: string;
  }
): Promise<UnifiedOperationsSummary> {
  try {
    console.log('🚀 Getting unified operations summary with filters:', filters);
    
    const params = new URLSearchParams();
    if (filters?.org_id) params.append('org_id', filters.org_id);
    if (filters?.user_id) params.append('user_id', filters.user_id);

    const url = `/batch-calls/summary${params.toString() ? `?${params.toString()}` : ''}`;
    
    const response = await localAuthorizedFetch<UnifiedOperationsSummary>(url);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Failed to get unified operations summary:', response.status, errorText);
      throw new Error(`Failed to get operations summary: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Unified operations summary received:', {
      total: result.total_operations,
      active: result.active_operations,
      source: result.source
    });
    
    return result;
  } catch (error) {
    console.error('❌ Error getting unified operations summary:', error);
    throw error;
  }
}

/**
 * Clean up completed operations
 */
export async function cleanupUnifiedOperations(maxAgeHours: number = 24): Promise<{
  message: string;
  memory_cleaned: number;
  database_cleaned: number;
  total_cleaned: number;
  max_age_hours: number;
  timestamp: string;
}> {
  try {
    console.log('🧹 Cleaning up unified operations older than', maxAgeHours, 'hours');
    
    const response = await localAuthorizedFetch<{
      message: string;
      memory_cleaned: number;
      database_cleaned: number;
      total_cleaned: number;
      max_age_hours: number;
      timestamp: string;
    }>(
      `/batch-calls/cleanup?max_age_hours=${maxAgeHours}`,
      {
        method: 'POST',
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Failed to cleanup unified operations:', response.status, errorText);
      throw new Error(`Failed to cleanup operations: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Unified operations cleanup completed:', result);
    
    return result;
  } catch (error) {
    console.error('❌ Error cleaning up unified operations:', error);
    throw error;
  }
}

/**
 * Get system health status
 */
export async function getUnifiedSystemHealth(): Promise<UnifiedSystemHealth> {
  try {
    console.log('🏥 Getting unified system health status');
    
    const response = await localAuthorizedFetch<UnifiedSystemHealth>(
      `/batch-calls/health`
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Failed to get unified system health:', response.status, errorText);
      throw new Error(`Failed to get system health: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Unified system health received:', result);
    
    return result;
  } catch (error) {
    console.error('❌ Error getting unified system health:', error);
    throw error;
  }
}

/**
 * Poll operation status with automatic retry
 */
export async function pollUnifiedOperationStatus(
  operationId: string,
  maxAttempts: number = 60,
  intervalMs: number = 2000
): Promise<UnifiedOperationStatus> {
  console.log(`🔄 Starting to poll operation ${operationId} (max ${maxAttempts} attempts, ${intervalMs}ms interval)`);
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await getUnifiedOperationStatus(operationId);
      const status = result.data.status;
      
      console.log(`📊 Poll attempt ${attempt}/${maxAttempts}: Status = ${status}`);
      
      // Check if operation is complete
      if (['completed', 'failed', 'cancelled'].includes(status)) {
        console.log(`✅ Operation ${operationId} completed with status: ${status}`);
        return result.data;
      }
      
      // Wait before next attempt
      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, intervalMs));
      }
      
    } catch (error) {
      console.error(`❌ Poll attempt ${attempt} failed:`, error);
      
      if (attempt === maxAttempts) {
        throw error;
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
  }
  
  throw new Error(`Operation ${operationId} did not complete within ${maxAttempts} attempts`);
}

/**
 * Convert unified operation to legacy format for compatibility
 */
export function convertUnifiedToLegacyOperation(unifiedOp: UnifiedOperationStatus): BatchCallOperation {
  return {
    bulk_operation_id: unifiedOp.bulk_operation_id,
    status: unifiedOp.status,
    started_at: unifiedOp.started_at,
    total_calls: unifiedOp.total_calls,
    completed_calls: unifiedOp.completed_calls,
    successful_calls: unifiedOp.successful_calls,
    failed_calls: unifiedOp.failed_calls,
    pending_calls: unifiedOp.pending_calls,
    progress_percentage: unifiedOp.progress_percentage,
    current_row: unifiedOp.current_row,
    is_active: ['starting', 'processing', 'paused'].includes(unifiedOp.status),
    can_pause: unifiedOp.can_pause,
    can_resume: unifiedOp.can_resume,
    can_cancel: unifiedOp.can_cancel,
    implementation: unifiedOp.implementation,
    database_synced: unifiedOp.database_synced,
    database_id: unifiedOp.database_id,
    error_message: unifiedOp.error_message,
    last_error_at: unifiedOp.last_error_at
  };
}

/**
 * Convert unified operations list to legacy format for compatibility
 */
export function convertUnifiedToLegacyOperationsList(unifiedList: UnifiedOperationsList): BatchOperationsList {
  const operations: Record<string, BatchCallOperation> = {};
  
  for (const [operationId, unifiedOp] of Object.entries(unifiedList.operations)) {
    operations[operationId] = convertUnifiedToLegacyOperation(unifiedOp);
  }
  
  return {
    total_operations: unifiedList.total_operations,
    active_operations: unifiedList.active_operations,
    operations
  };
}
