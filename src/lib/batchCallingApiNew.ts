/**
 * Enhanced Batch Calling API with RabbitMQ Integration
 * Combines legacy API calls with new RabbitMQ-based operations
 */

import { authorizedFetch } from './api';
import {
  BatchCallOperation,
  BatchCallResponse,
  BatchCallDetail,
  BatchCallSummary,
  BatchCallSummaryResponse,
  BatchCallStartRequest,
  BatchCallStartResponse,
  BatchOperationsList,
  BatchCallStatus
} from '@/types/batchCalling';
import { RabbitMQBatchApiService, BatchCallRequest } from './rabbitmqBatchApi';
import { cacheService, CacheKeys, cacheHelpers } from './cacheService';

// API configuration - Production URLs
const API_BASE_URL = 'https://platform.voxiflow.com/api/v1';
const BACKGROUND_SERVER_URL = 'https://platform.voxiflow.com/api/v1';
const BATCH_CALLS_BASE_URL = '/bulk-calls';

/**
 * Start a new batch call operation using RabbitMQ
 */
export async function startBatchCall(request: BatchCallStartRequest): Promise<BatchCallStartResponse> {
  try {
    // Validate input parameters
    if (!request.file || !(request.file instanceof File)) {
      throw new Error('Invalid file: file must be a valid File object');
    }
    
    if (!request.campaign_id || typeof request.campaign_id !== 'string' || request.campaign_id.trim() === '') {
      throw new Error('Invalid campaign_id: must be a non-empty string');
    }
    
    if (!request.org_id || typeof request.org_id !== 'string' || request.org_id.trim() === '') {
      throw new Error('Invalid org_id: must be a non-empty string');
    }
    
    if (!request.user_id || typeof request.user_id !== 'string' || request.user_id.trim() === '') {
      throw new Error('Invalid user_id: must be a non-empty string');
    }

    console.log('Starting batch call with RabbitMQ:', {
      campaign_id: request.campaign_id,
      org_id: request.org_id,
      user_id: request.user_id,
      sleep_seconds: request.sleep_seconds,
      channels: request.channels,
      file_name: request.file.name,
      file_size: request.file.size
    });

    // Use RabbitMQ service for batch call upload
    const rabbitmqRequest: BatchCallRequest = {
      file: request.file,
      campaign_id: request.campaign_id.trim(),
      org_id: request.org_id.trim(),
      user_id: request.user_id.trim(),
      sleep_seconds: request.sleep_seconds || 10,
      channels: request.channels || 1
    };

    const result = await RabbitMQBatchApiService.uploadBulkCalls(rabbitmqRequest);
    
    console.log('Batch call queued successfully:', result);
    
    // Convert RabbitMQ response to expected format
    const response: BatchCallStartResponse = {
      bulk_operation_id: result.batch_id,
      message: result.message,
      total_calls: result.total_calls,
      campaign_id: result.campaign_id,
      org_id: result.org_id,
      user_id: result.user_id,
      channels: result.channels,
      sleep_seconds: result.sleep_seconds,
      status: result.status
    };
    
    return response;
  } catch (error) {
    console.error('Error starting batch call:', error);
    throw error;
  }
}

/**
 * Get batch operation status with cache
 */
export async function getBatchOperationStatus(operationId: string): Promise<BatchCallOperation> {
  try {
    // Try to get from cache first
    const cached = cacheService.get<BatchCallOperation>(CacheKeys.BATCH_OPERATION(operationId));
    if (cached) {
      return cached;
    }

    // Try RabbitMQ status first (for active operations)
    try {
      const systemStatus = await RabbitMQBatchApiService.getSystemStatus();
      
      // If we have queue stats, create a status object
      if (systemStatus.queueStats) {
        const status: BatchCallOperation = {
          bulk_operation_id: operationId,
          status: 'processing',
          total_calls: systemStatus.queueStats.data.pending_calls + systemStatus.queueStats.data.completed_calls,
          completed_calls: systemStatus.queueStats.data.completed_calls,
          successful_calls: systemStatus.queueStats.data.completed_calls,
          failed_calls: systemStatus.queueStats.data.error_calls,
          pending_calls: systemStatus.queueStats.data.pending_calls,
          progress_percentage: systemStatus.queueStats.data.completed_calls > 0 
            ? (systemStatus.queueStats.data.completed_calls / (systemStatus.queueStats.data.pending_calls + systemStatus.queueStats.data.completed_calls)) * 100
            : 0,
          started_at: new Date().toISOString(),
          can_pause: true,
          can_resume: false,
          can_cancel: true,
          exists: true,
          location: 'memory',
          message: 'Operation is being processed by RabbitMQ workers',
          actions_available: {
            pause: true,
            resume: false,
            cancel: true,
            view_status: true,
            view_calls: true
          }
        };
        
        // Cache the status
        cacheService.set(CacheKeys.BATCH_OPERATION(operationId), status, 5000);
        return status;
      }
    } catch (error) {
      console.log('RabbitMQ status not available, trying database status');
    }

    // Fallback to database status
    const response = await authorizedFetch(`${BATCH_CALLS_BASE_URL}/operations/${operationId}/check-status`);
    if (response.ok) {
      const data = await response.json();
      const status: BatchCallOperation = {
        ...data,
        can_pause: data.can_pause || false,
        can_resume: data.can_resume || false,
        can_cancel: data.can_cancel || false,
        exists: data.exists || false,
        location: data.location || 'database',
        message: data.message || '',
        actions_available: data.actions_available || {
          pause: false,
          resume: false,
          cancel: false,
          view_status: true,
          view_calls: true
        }
      };
      
      // Cache the status
      cacheService.set(CacheKeys.BATCH_OPERATION(operationId), status, 10000);
      return status;
    }

    throw new Error(`Failed to get status for operation ${operationId}`);
  } catch (error) {
    console.error('Error getting batch operation status:', error);
    throw error;
  }
}

/**
 * Get batch call details with cache
 */
export async function getBatchCallDetails(operationId: string): Promise<BatchCallDetail> {
  try {
    // Try to get from cache first
    const cached = cacheService.get<BatchCallDetail>(CacheKeys.BATCH_CALLS(operationId));
    if (cached) {
      return cached;
    }

    // Try RabbitMQ service first
    try {
      const batchCalls = await RabbitMQBatchApiService.getBatchCalls(operationId);
      if (batchCalls) {
        cacheService.set(CacheKeys.BATCH_CALLS(operationId), batchCalls, 15000);
        return batchCalls;
      }
    } catch (error) {
      console.log('RabbitMQ batch calls not available, trying database');
    }

    // Fallback to database
    const response = await authorizedFetch(`${BATCH_CALLS_BASE_URL}/calls/${operationId}`);
    if (response.ok) {
      const data = await response.json();
      cacheService.set(CacheKeys.BATCH_CALLS(operationId), data, 15000);
      return data;
    }

    throw new Error(`Failed to get batch call details for ${operationId}`);
  } catch (error) {
    console.error('Error getting batch call details:', error);
    throw error;
  }
}

/**
 * Get batch call summary with cache
 */
export async function getBatchCallSummary(operationId: string): Promise<BatchCallSummaryResponse> {
  try {
    // Try to get from cache first
    const cached = cacheService.get<BatchCallSummaryResponse>(`batch:summary:${operationId}`);
    if (cached) {
      return cached;
    }

    // Try RabbitMQ service first
    try {
      const queueStats = await RabbitMQBatchApiService.getQueueStats();
      if (queueStats) {
        const summary: BatchCallSummaryResponse = {
          bulk_operation_id: operationId,
          total_calls: queueStats.data.pending_calls + queueStats.data.completed_calls,
          successful_calls: queueStats.data.completed_calls,
          failed_calls: queueStats.data.error_calls
        };
        
        cacheService.set(`batch:summary:${operationId}`, summary, 10000);
        return summary;
      }
    } catch (error) {
      console.log('RabbitMQ summary not available, trying database');
    }

    // Fallback to database
    const response = await authorizedFetch(`${BATCH_CALLS_BASE_URL}/calls/${operationId}`);
    if (response.ok) {
      const data = await response.json();
      cacheService.set(`batch:summary:${operationId}`, data, 15000);
      return data;
    }

    throw new Error(`Failed to get batch call summary for ${operationId}`);
  } catch (error) {
    console.error('Error getting batch call summary:', error);
    throw error;
  }
}

/**
 * Pause batch operation using RabbitMQ
 */
export async function pauseBatchOperation(operationId: string): Promise<void> {
  try {
    await RabbitMQBatchApiService.controlWorker('pause');
    console.log(`Batch operation ${operationId} paused successfully`);
  } catch (error) {
    console.error('Error pausing batch operation:', error);
    throw error;
  }
}

/**
 * Resume batch operation using RabbitMQ
 */
export async function resumeBatchOperation(operationId: string): Promise<void> {
  try {
    await RabbitMQBatchApiService.controlWorker('resume');
    console.log(`Batch operation ${operationId} resumed successfully`);
  } catch (error) {
    console.error('Error resuming batch operation:', error);
    throw error;
  }
}

/**
 * Cancel batch operation using RabbitMQ
 */
export async function cancelBatchOperation(operationId: string): Promise<void> {
  try {
    await RabbitMQBatchApiService.stopBatch(operationId);
    console.log(`Batch operation ${operationId} cancelled successfully`);
  } catch (error) {
    console.error('Error cancelling batch operation:', error);
    throw error;
  }
}

/**
 * Stop campaign using RabbitMQ
 */
export async function stopCampaign(campaignId: string, orgId: string, userId: string): Promise<void> {
  try {
    await RabbitMQBatchApiService.stopCampaign(campaignId, orgId, userId);
    console.log(`Campaign ${campaignId} stopped successfully`);
  } catch (error) {
    console.error('Error stopping campaign:', error);
    throw error;
  }
}

/**
 * Emergency stop all operations using RabbitMQ
 */
export async function abortAllOperations(): Promise<void> {
  try {
    await RabbitMQBatchApiService.abortAllOperations();
    console.log('All operations aborted successfully');
  } catch (error) {
    console.error('Error aborting all operations:', error);
    throw error;
  }
}

/**
 * Get system health status
 */
export async function getSystemHealth(): Promise<any> {
  try {
    return await RabbitMQBatchApiService.getSystemStatus();
  } catch (error) {
    console.error('Error getting system health:', error);
    throw error;
  }
}

/**
 * Get queue statistics
 */
export async function getQueueStats(): Promise<any> {
  try {
    return await RabbitMQBatchApiService.getQueueStats();
  } catch (error) {
    console.error('Error getting queue stats:', error);
    throw error;
  }
}

/**
 * Get worker status
 */
export async function getWorkerStatus(): Promise<any> {
  try {
    return await RabbitMQBatchApiService.getWorkerStatus();
  } catch (error) {
    console.error('Error getting worker status:', error);
    throw error;
  }
}

/**
 * Poll operation status with smart caching
 */
export function pollOperationStatus(
  operationId: string,
  onUpdate: (status: BatchCallOperation) => void,
  onComplete: (status: BatchCallOperation) => void,
  onError: (error: Error) => void,
  interval: number = 5000
): () => void {
  let isPolling = true;
  let lastStatus: BatchCallOperation | null = null;

  const poll = async () => {
    if (!isPolling) return;

    try {
      const status = await getBatchOperationStatus(operationId);
      
      // Check if status has changed
      if (!lastStatus || JSON.stringify(status) !== JSON.stringify(lastStatus)) {
        lastStatus = status;
        onUpdate(status);
      }

      // Check if operation is complete
      if (status.status === 'completed' || status.status === 'failed' || status.status === 'cancelled') {
        onComplete(status);
        isPolling = false;
        return;
      }

      // Continue polling
      if (isPolling) {
        setTimeout(poll, interval);
      }
    } catch (error) {
      console.error('Polling error:', error);
      onError(error as Error);
      isPolling = false;
    }
  };

  // Start polling
  poll();

  // Return cleanup function
  return () => {
    isPolling = false;
  };
}

/**
 * Calculate call status counts from call statuses array
 */
export function calculateCallStatusCounts(callStatuses: any[]): Record<string, number> {
  const counts: Record<string, number> = {};
  
  callStatuses.forEach(status => {
    const statusKey = status.status || status.call_status || 'unknown';
    counts[statusKey] = (counts[statusKey] || 0) + 1;
  });
  
  return counts;
}

/**
 * Get status color class for UI
 */
export function getStatusColorClass(status: string): string {
  switch (status.toLowerCase()) {
    case 'completed':
    case 'success':
      return 'text-green-600';
    case 'failed':
    case 'error':
      return 'text-red-600';
    case 'processing':
    case 'active':
      return 'text-blue-600';
    case 'paused':
      return 'text-yellow-600';
    case 'cancelled':
      return 'text-gray-600';
    case 'pending':
      return 'text-orange-600';
    default:
      return 'text-gray-600';
  }
}

/**
 * Refresh all cache (useful for manual refresh)
 */
export async function refreshAllCache(): Promise<void> {
  await RabbitMQBatchApiService.refreshAllCache();
}

/**
 * Get cache statistics
 */
export function getCacheStats(): any {
  return cacheService.getStats();
}

export default {
  startBatchCall,
  getBatchOperationStatus,
  getBatchCallDetails,
  getBatchCallSummary,
  pauseBatchOperation,
  resumeBatchOperation,
  cancelBatchOperation,
  stopCampaign,
  abortAllOperations,
  getSystemHealth,
  getQueueStats,
  getWorkerStatus,
  pollOperationStatus,
  calculateCallStatusCounts,
  getStatusColorClass,
  refreshAllCache,
  getCacheStats
};
