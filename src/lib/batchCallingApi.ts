// 🚀 PERFORMANCE OPTIMIZATION v2.0 - CACHE BUSTING
// This file has been optimized to prevent individual /calls/{id} API calls on page load
// ⚠️ CRITICAL: getBatchOperationsList() now makes ONLY 1 API call to /operations

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

// API configuration
const API_BASE_URL = 'https://platform.voxiflow.com/backend/api/v1';
const BACKGROUND_SERVER_URL = 'http://13.200.143.144:9000';
const BATCH_CALLS_BASE_URL = '/bulk-calls';

/**
 * Start a new batch call operation
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

    const formData = new FormData();
    
    // Required fields (must match curl command exactly)
    formData.append('file', request.file);
    formData.append('campaign_id', request.campaign_id.trim());
    formData.append('org_id', request.org_id.trim());
    formData.append('user_id', request.user_id.trim());
    
    // Optional fields (only append if they have values)
    if (request.sleep_seconds && request.sleep_seconds > 0) {
      formData.append('sleep_seconds', request.sleep_seconds.toString());
    }
    if (request.external_call_url && request.external_call_url.trim()) {
      formData.append('external_call_url', request.external_call_url);
    }
    if (request.external_username && request.external_username.trim()) {
      formData.append('external_username', request.external_username);
    }
    if (request.external_password && request.external_password.trim()) {
      formData.append('external_password', request.external_password);
    }

    // Debug: Log the FormData contents
    for (let [key, value] of formData.entries()) {
      if (value instanceof File) {
        // File validation passed
      } else {
        // String validation passed
      }
    }

    // Verify that all required fields are present in FormData
    const requiredFields = ['file', 'campaign_id', 'org_id', 'user_id'];
    const missingFields = requiredFields.filter(field => {
      const value = formData.get(field);
      return !value || (typeof value === 'string' && value.trim() === '');
    });

    if (missingFields.length > 0) {
      throw new Error(`Missing required fields in FormData: ${missingFields.join(', ')}`);
    }

    // Use fetch directly instead of authorizedFetch to avoid header issues
    const token = localStorage.getItem('authToken');
    const fullUrl = `${API_BASE_URL}${BATCH_CALLS_BASE_URL}`;
    
    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        // Don't set Content-Type for FormData - let browser set it automatically
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Batch call start failed:', response.status, errorText);
      console.error('Response headers:', Object.fromEntries(response.headers.entries()));
      
      // Try to parse error as JSON for better error messages
      let errorMessage = `Failed to start batch call: ${response.status}`;
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.detail) {
          errorMessage += ` - ${JSON.stringify(errorJson.detail)}`;
        } else {
          errorMessage += ` - ${errorText}`;
        }
      } catch {
        errorMessage += ` - ${errorText}`;
      }
      
      throw new Error(errorMessage);
    }

    const result = await response.json();

    return result;
  } catch (error) {
    console.error('Failed to start batch call:', error);
    throw error;
  }
}

/**
 * Start a new batch call operation using RabbitMQ
 */
export async function startBatchCallWithRabbitMQ(request: BatchCallStartRequest): Promise<BatchCallStartResponse> {
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

    // Convert BatchCallStartRequest to BatchCallRequest for RabbitMQ service
    const rabbitMQRequest: BatchCallRequest = {
      file: request.file,
      campaign_id: request.campaign_id.trim(),
      org_id: request.org_id.trim(),
      user_id: request.user_id.trim(),
      sleep_seconds: request.sleep_seconds || 100,
      channels: request.channels || 1
    };

    // Use RabbitMQ service to upload bulk calls
    const result = await RabbitMQBatchApiService.uploadBulkCalls(rabbitMQRequest);
    
    // Convert RabbitMQ response to BatchCallStartResponse format
    const response: BatchCallStartResponse = {
      bulk_operation_id: result.batch_id,
      message: result.message,
      status: result.status,
      note: `RabbitMQ batch operation started successfully`
    };

    return response;
  } catch (error) {
    console.error('Failed to start RabbitMQ batch call:', error);
    throw error;
  }
}

/**
 * Get the overall status of a batch operation
 * Uses the check-status endpoint to get status and capabilities
 */
export async function getBatchOperationStatus(bulkOperationId: string): Promise<BatchCallOperation> {
  try {
    console.log('Fetching operation status for:', bulkOperationId);
    
    const response = await authorizedFetch<any>(
      `${BATCH_CALLS_BASE_URL}/operations/${bulkOperationId}/check-status`
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to get operation status:', response.status, errorText);
      
      // Try to parse error as JSON for better error messages
      let errorMessage = `Failed to get operation status: ${response.status}`;
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.detail) {
          errorMessage += ` - ${JSON.stringify(errorJson.detail)}`;
        } else {
          errorMessage += ` - ${errorText}`;
        }
      } catch {
        errorMessage += ` - ${errorText}`;
      }
      
      throw new Error(errorMessage);
    }

    const result = await response.json();
    console.log('Operation check-status response:', result);
    
    // Map the new response format to BatchCallOperation
    const mappedOperation: BatchCallOperation = {
      bulk_operation_id: result.bulk_operation_id,
      status: result.status,
      started_at: new Date().toISOString(), // Default value since not in response
      completed_at: null, // Default value since not in response
      expected_total_calls: result.expected_total_calls || 0, // Total calls expected from the upload
      total_calls: result.total_calls || 0, // Actually processed calls
      completed_calls: result.completed_calls || 0, // Default value since not in response
      successful_calls: result.successful_calls || 0, // Default value since not in response
      failed_calls: result.failed_calls || 0, // Default value since not in response
      pending_calls: result.pending_calls || 0, // Default value since not in response
      progress_percentage: 0, // Default value since not in response
      error: null, // Default value since not in response
      is_active: true, // Default value since not in response
      // Add the new capabilities and actions
      exists: result.exists,
      location: result.location,
      can_pause: result.can_pause,
      can_resume: result.can_resume,
      can_cancel: result.can_cancel,
      message: result.message,
      actions_available: result.actions_available
    };
    
    return mappedOperation;
  } catch (error) {
    throw error;
  }
}

/**
 * Get the database status of a bulk operation
 */
export async function getBulkOperationDbStatus(bulkOperationId: string): Promise<any> {
  try {
    const response = await authorizedFetch<any>(
      `${BATCH_CALLS_BASE_URL}/operations/${bulkOperationId}/db-status`
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get database status: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    throw error;
  }
}

/**
 * Get the memory status of a bulk operation
 */
export async function getBulkOperationMemoryStatus(bulkOperationId: string): Promise<any> {
  try {
    console.log('Fetching memory status for operation:', bulkOperationId);
    
    const response = await authorizedFetch<any>(
      `${BATCH_CALLS_BASE_URL}/operations/${bulkOperationId}/check-status`
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to get memory status:', response.status, errorText);
      throw new Error(`Failed to get memory status: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('Memory status received:', result);
    return result;
  } catch (error) {
    console.error('Failed to get memory status:', error);
    throw error;
  }
}

/**
 * Get the check-status response for a batch operation (capabilities and actions)
 */
export async function getBulkOperationCheckStatus(bulkOperationId: string): Promise<any> {
  try {
    console.log('Fetching operation check-status for:', bulkOperationId);
    
    const response = await authorizedFetch<any>(
      `${BATCH_CALLS_BASE_URL}/operations/${bulkOperationId}/check-status`
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to get operation check-status:', response.status, errorText);
      throw new Error(`Failed to get operation check-status: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('Operation check-status received:', result);
    return result;
  } catch (error) {
    console.error('Failed to get operation check-status:', error);
    throw error;
  }
}

/**
 * Get detailed status of individual calls in a batch operation (lazy loading)
 * This should only be called when specific call details are needed
 */
export async function getBatchCallDetails(bulkOperationId: string): Promise<BatchCallResponse> {
  try {
    console.log('Fetching call details for operation:', bulkOperationId);
    
    // According to Swagger docs, the primary endpoint is /bulk-calls/calls/{bulk_operation_id}
    const primaryEndpoint = `${BATCH_CALLS_BASE_URL}/calls/${bulkOperationId}`;
    console.log('Trying primary endpoint:', primaryEndpoint);
    console.log('Full URL will be:', `https://platform.voxiflow.com/backend${primaryEndpoint}`);
    
    const response = await authorizedFetch<BatchCallResponse>(primaryEndpoint);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to get call details from primary endpoint:', response.status, errorText);
      console.error('Response headers:', Object.fromEntries(response.headers.entries()));
      
      // Try the alternative endpoint as fallback
      console.log('Trying alternative endpoint as fallback...');
      const alternativeEndpoint = `${BATCH_CALLS_BASE_URL}/operations/${bulkOperationId}/calls`;
      console.log('Trying alternative endpoint:', alternativeEndpoint);
      console.log('Full alternative URL will be:', `https://platform.voxiflow.com/backend${alternativeEndpoint}`);
      
      const alternativeResponse = await authorizedFetch<BatchCallResponse>(alternativeEndpoint);
      
      if (!alternativeResponse.ok) {
        const alternativeErrorText = await alternativeResponse.text();
        console.error('Failed to get call details from alternative endpoint:', alternativeResponse.status, alternativeErrorText);
        console.error('Alternative response headers:', Object.fromEntries(alternativeResponse.headers.entries()));
        throw new Error(`Failed to get call details: ${response.status} - ${errorText}`);
      }
      
      const alternativeResult = await alternativeResponse.json();
      console.log('Call details received from alternative endpoint:', alternativeResult);
      return alternativeResult;
    }

    const result = await response.json();
    console.log('Call details received from primary endpoint:', result);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    // Validate the response structure
    if (!result.bulk_operation_id) {
      console.warn('Call details response missing bulk_operation_id:', result);
    }
    
    // Validate the new expected_total_calls field
    if (typeof result.expected_total_calls !== 'number') {
      console.warn('Call details response missing expected_total_calls:', result);
    }
    
    // Log call statuses if available (new API structure)
    if (result.call_statuses) {
      console.log(`Call details: ${Object.keys(result.call_statuses).length} call statuses found`);
      Object.entries(result.call_statuses).forEach(([rowIndex, status]: [string, any]) => {
        console.log(`Row ${rowIndex}: ${status.status} - ${status.progress}`);
      });
    }
    
    // Log traditional calls array if available (legacy structure)
    if (result.calls && result.calls.length > 0) {
      console.log(`Call details: ${result.calls.length} calls found in calls array`);
      result.calls.forEach((call, index) => {
        console.log(`Call ${index}: ${call.call_status} - ${call.customer_name} (${call.phone_number})`);
      });
    }
    
    // Map the API response to our interface with proper field mapping
    const mappedResult: BatchCallResponse = {
      bulk_operation_id: result.bulk_operation_id,
      expected_total_calls: result.expected_total_calls || result.total_calls || 0,
      total_calls: result.total_calls || 0,
      successful_calls: result.successful_calls || 0,
      failed_calls: result.failed_calls || 0,
      pending_calls: result.pending_calls || 0,
      org_id: result.org_id,
      campaign_id: result.campaign_id,
      operation_name: result.operation_name,
      calls: result.calls || []
    };
    
    return mappedResult;
  } catch (error) {
    console.error('Failed to get call details:', error);
    throw error;
  }
}

/**
 * Get calls summary for a batch operation (total, successful, failed counts)
 */
export async function getBatchCallSummary(bulkOperationId: string): Promise<BatchCallSummaryResponse> {
  try {
    console.log('Fetching calls summary for operation:', bulkOperationId);
    
    const response = await authorizedFetch<BatchCallSummaryResponse>(
      `${BATCH_CALLS_BASE_URL}/calls/${bulkOperationId}`
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to get calls summary:', response.status, errorText);
      throw new Error(`Failed to get calls summary: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('Calls summary received:', result);
    
    // Validate the response structure
    if (!result.bulk_operation_id || typeof result.expected_total_calls !== 'number') {
      throw new Error('Invalid calls summary response format - missing expected_total_calls');
    }
    
    // Map the API response to our interface with proper field mapping
    const mappedResult: BatchCallSummaryResponse = {
      bulk_operation_id: result.bulk_operation_id,
      expected_total_calls: result.expected_total_calls,
      total_calls: result.total_calls || 0,
      successful_calls: result.successful_calls || 0,
      failed_calls: result.failed_calls || 0,
      pending_calls: result.pending_calls || 0,
      org_id: result.org_id,
      campaign_id: result.campaign_id,
      operation_name: result.operation_name
    };
    
    return mappedResult;
  } catch (error) {
    console.error('Failed to get calls summary:', error);
    throw error;
  }
}

/**
 * Simple health check to test if the API is reachable
 */
export async function testApiConnection(): Promise<boolean> {
  try {
    console.log('Testing API connection...');
    const response = await fetch('https://platform.voxiflow.com/backend/api/v1/bulk-calls/summary', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`,
      },
    });
    
    console.log('API connection test response:', response.status, response.statusText);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const data = await response.json();
      console.log('API connection test successful:', data);
      return true;
    } else {
      const errorText = await response.text();
      console.error('API connection test failed:', response.status, errorText);
      return false;
    }
  } catch (error) {
    console.error('API connection test error:', error);
    return false;
  }
}

/**
 * Get real-time call progress for a bulk operation
 */
export async function getCallProgress(bulkOperationId: string): Promise<any> {
  try {
    console.log('Fetching call progress for operation:', bulkOperationId);
    
    const response = await authorizedFetch<any>(
      `${BATCH_CALLS_BASE_URL}/operations/${bulkOperationId}/progress`
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to get call progress:', response.status, errorText);
      throw new Error(`Failed to get call progress: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('Call progress received:', result);
    return result;
  } catch (error) {
    console.error('Failed to get call progress:', error);
    throw error;
  }
}

/**
 * Get comprehensive statistics for a bulk operation
 */
export async function getOperationStatistics(bulkOperationId: string): Promise<any> {
  try {
    console.log('Fetching operation statistics for:', bulkOperationId);
    
    const response = await authorizedFetch<any>(
      `${BATCH_CALLS_BASE_URL}/operations/${bulkOperationId}/statistics`
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to get operation statistics:', response.status, errorText);
      throw new Error(`Failed to get operation statistics: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('Operation statistics received:', result);
    return result;
  } catch (error) {
    console.error('Failed to get operation statistics:', error);
    throw error;
  }
}

/**
 * Get call status by specific row index
 */
export async function getCallStatusByRow(bulkOperationId: string, rowIndex: number): Promise<any> {
  try {
    console.log(`Fetching call status for operation ${bulkOperationId}, row ${rowIndex}`);
    
    const response = await authorizedFetch<any>(
      `${BATCH_CALLS_BASE_URL}/operations/${bulkOperationId}/calls/${rowIndex}`
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to get call status by row:', response.status, errorText);
      throw new Error(`Failed to get call status by row: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('Call status by row received:', result);
    return result;
  } catch (error) {
    console.error('Failed to get call status by row:', error);
    throw error;
  }
}

/**
 * Get summary of all batch operations
 */
export async function getBatchOperationsSummary(): Promise<BatchCallSummary> {
  try {
    console.log('Fetching operations summary...');
    
    const response = await authorizedFetch<BatchCallSummary>(
      `${BATCH_CALLS_BASE_URL}/summary`
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to get operations summary:', response.status, errorText);
      throw new Error(`Failed to get operations summary: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('Operations summary received:', result);
    return result;
  } catch (error) {
    console.error('Failed to get operations summary:', error);
    throw error;
  }
}

/**
 * Get list of all batch operations (optimized - NO individual call details API calls on page load)
 * ⚠️ PERFORMANCE CRITICAL: This function must NEVER call getBatchCallDetails or similar functions
 * 🚀 CACHE BUSTING: Version 2.0 - Optimized for performance
 */
export async function getBatchOperationsList(): Promise<BatchOperationsList> {
  // 🚀 PERFORMANCE FIX: This function now makes ONLY 1 API call to /operations
  // ❌ NO MORE individual /calls/{id} API calls on page load
  console.log('🚀 [CACHE BUSTING] getBatchOperationsList() called - using optimized version');
  return getBatchOperationsListOptimized();
}

/**
 * OPTIMIZED VERSION: Get list of all batch operations (NO individual call details API calls)
 * This is the actual implementation that prevents the performance issue
 */
async function getBatchOperationsListOptimized(): Promise<BatchOperationsList> {
  try {
    console.log('🚀 [OPTIMIZED v2.0] Fetching operations list (NO individual call details)...');
    console.log('⚠️ PERFORMANCE FIX: This function will NOT make individual /calls/{id} API calls');
    
    // Get the operations list from /operations endpoint ONLY
    const operationsResponse = await authorizedFetch<any>(
      `${BATCH_CALLS_BASE_URL}/operations`
    );

    if (!operationsResponse.ok) {
      const errorText = await operationsResponse.text();
      console.error('❌ Failed to get operations list:', operationsResponse.status, errorText);
      throw new Error(`Failed to get operations list: ${operationsResponse.status} - ${errorText}`);
    }

    const operationsResult = await operationsResponse.json();
    console.log('✅ Operations list received (1 API call only):', {
      total: Object.keys(operationsResult.operations || {}).length
    });
    
    // ⚠️ CRITICAL: Use operations data directly - DO NOT make individual /calls/{id} API calls
    const operations: Record<string, any> = {};
    let totalOperations = 0;
    let activeOperations = 0;
    
    for (const [operationId, operation] of Object.entries(operationsResult.operations || {})) {
      operations[operationId] = {
        ...(operation as any),
        // Use basic operation data without detailed call information
        expected_total_calls: (operation as any).total_calls || 0,
        total_calls: (operation as any).total_calls || 0,
        successful_calls: (operation as any).successful_calls || 0,
        failed_calls: (operation as any).failed_calls || 0,
        pending_calls: (operation as any).pending_calls || 0,
        completed_calls: (operation as any).completed_calls || 0,
        org_id: (operation as any).org_id,
        campaign_id: (operation as any).campaign_id
      };
      
      totalOperations++;
      if ((operation as any).is_active) {
        activeOperations++;
      }
    }
    
    const result: BatchOperationsList = {
      total_operations: totalOperations,
      active_operations: activeOperations,
      operations
    };
    
    console.log('✅ [OPTIMIZED v2.0] Operations list complete (NO individual call details loaded)');
    console.log('🎯 PERFORMANCE SUCCESS: Only 1 API call made to /bulk-calls/operations');
    console.log('🚫 NO individual /calls/{id} API calls were made');
    return result;
  } catch (error) {
    console.error('❌ Failed to get operations list:', error);
    throw error;
  }
}

/**
 * Get list of all batch operations with detailed call information (slower)
 * Use this only when detailed call information is specifically needed
 * ⚠️ DISABLED: This function is disabled to prevent performance issues
 */
export async function getBatchOperationsListWithDetails(): Promise<BatchOperationsList> {
  console.log('⚠️ [DISABLED] getBatchOperationsListWithDetails() called - redirecting to optimized version');
  console.log('🚀 PERFORMANCE FIX: Using optimized version instead of detailed version');
  console.log('❌ BLOCKING: Individual /calls/{id} API calls are disabled for performance');
  return getBatchOperationsListOptimized();
}

/**
 * Pause an active batch operation
 */
export async function pauseBatchOperation(bulkOperationId: string): Promise<{ message: string; status: string }> {
  try {
    console.log('Pausing operation:', bulkOperationId);
    
    const response = await authorizedFetch<{ message: string; status: string }>(
      `${BATCH_CALLS_BASE_URL}/operations/${bulkOperationId}/pause`,
      {
        method: 'POST',
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to pause operation:', response.status, errorText);
      throw new Error(`Failed to pause operation: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('Operation paused successfully:', result);
    return result;
  } catch (error) {
    console.error('Failed to pause operation:', error);
    throw error;
  }
}

/**
 * Resume a paused batch operation
 */
export async function resumeBatchOperation(bulkOperationId: string): Promise<{ message: string; status: string }> {
  try {
    console.log('Resuming operation:', bulkOperationId);
    
    const response = await authorizedFetch<{ message: string; status: string }>(
      `${BATCH_CALLS_BASE_URL}/operations/${bulkOperationId}/resume`,
      {
        method: 'POST',
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to resume operation:', response.status, errorText);
      throw new Error(`Failed to resume operation: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('Operation resumed successfully:', result);
    return result;
  } catch (error) {
    console.error('Failed to resume operation:', error);
    throw error;
  }
}

/**
 * Cancel a batch operation
 */
export async function cancelBatchOperation(bulkOperationId: string): Promise<{ message: string; status: string }> {
  try {
    console.log('Cancelling operation:', bulkOperationId);
    
    const response = await authorizedFetch<{ message: string; status: string }>(
      `${BATCH_CALLS_BASE_URL}/operations/${bulkOperationId}/cancel`,
      {
        method: 'POST',
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to cancel operation:', response.status, errorText);
      throw new Error(`Failed to cancel operation: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('Operation cancelled successfully:', result);
    return result;
  } catch (error) {
    console.error('Failed to cancel operation:', error);
    throw error;
  }
}

/**
 * Get enhanced operation status with call statuses (new API structure)
 * PERFORMANCE OPTIMIZED: No longer makes individual /calls/{id} API calls
 */
export async function getEnhancedOperationStatus(bulkOperationId: string): Promise<BatchCallOperation> {
  try {
    console.log('Fetching enhanced operation status for:', bulkOperationId);
    
    // PERFORMANCE FIX: Only get the operation status, no individual call details
    const operationStatus = await getBatchOperationStatus(bulkOperationId);
    
    // PERFORMANCE OPTIMIZATION: Skip individual call details API call
    // This prevents the performance issue where individual /calls/{id} requests are made
    console.log('🚀 PERFORMANCE FIX: Skipping individual call details API call to prevent performance issues');
    
    return operationStatus;
  } catch (error) {
    console.error('Failed to get enhanced operation status:', error);
    throw error;
  }
}

/**
 * Get detailed operation information directly from the /calls endpoint
 * This is the endpoint that returns expected_total_calls and other detailed information
 */
export async function getOperationDetailsFromCallsEndpoint(bulkOperationId: string): Promise<any> {
  try {
    console.log(`Fetching operation details from /calls endpoint for: ${bulkOperationId}`);
    
    const response = await authorizedFetch<any>(
      `${BATCH_CALLS_BASE_URL}/calls/${bulkOperationId}`
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to get operation details from /calls endpoint:', response.status, errorText);
      throw new Error(`Failed to get operation details: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('Operation details from /calls endpoint:', result);
    return result;
  } catch (error) {
    console.error('Failed to get operation details from /calls endpoint:', error);
    throw error;
  }
}

/**
 * Poll operation status with configurable interval
 * PERFORMANCE OPTIMIZED: Uses basic operation status instead of enhanced status
 */
export function pollOperationStatus(
  bulkOperationId: string,
  onUpdate: (status: BatchCallOperation) => void,
  onComplete: (status: BatchCallOperation) => void,
  onError: (error: Error) => void,
  intervalMs: number = 5000
): () => void {
  console.log(`Starting polling for operation ${bulkOperationId} every ${intervalMs}ms`);
  
  const pollInterval = setInterval(async () => {
    try {
      console.log(`Polling operation ${bulkOperationId}...`);
      // PERFORMANCE FIX: Use basic operation status instead of enhanced status
      // This prevents individual /calls/{id} API calls during polling
      const status = await getBatchOperationStatus(bulkOperationId);
      
      console.log(`Operation ${bulkOperationId} status:`, status.status, `Progress: ${status.progress_percentage}%`);
      
      onUpdate(status);
      
      if (status.status === 'completed' || status.status === 'failed' || status.status === 'cancelled') {
        console.log(`Operation ${bulkOperationId} completed with status: ${status.status}`);
        clearInterval(pollInterval);
        onComplete(status);
      }
    } catch (error) {
      console.error(`Polling error for operation ${bulkOperationId}:`, error);
      clearInterval(pollInterval);
      onError(error as Error);
    }
  }, intervalMs);

  // Return cleanup function
  return () => {
    console.log(`Stopping polling for operation ${bulkOperationId}`);
    clearInterval(pollInterval);
  };
}

/**
 * Utility function to calculate status counts from call_statuses
 */
export function calculateCallStatusCounts(callStatuses: Record<string, any> | undefined): {
  pending: number;
  started: number;
  completed: number;
  failed: number;
} {
  if (!callStatuses) {
    return { pending: 0, started: 0, completed: 0, failed: 0 };
  }

  return Object.values(callStatuses).reduce((acc, call) => {
    const status = call.status || 'pending';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, { pending: 0, started: 0, completed: 0, failed: 0 } as Record<string, number>);
}

/**
 * Utility function to get status color class for UI
 */
export function getStatusColorClass(status: string): string {
  switch (status) {
    case 'pending':
      return 'text-yellow-600 bg-yellow-100 border-yellow-200';
    case 'started':
      return 'text-blue-600 bg-blue-100 border-blue-200';
    case 'completed':
      return 'text-green-600 bg-green-100 border-green-200';
    case 'failed':
      return 'text-red-600 bg-red-100 border-red-200';
    case 'processing':
      return 'text-blue-600 bg-blue-100 border-blue-200';
    case 'paused':
      return 'text-orange-600 bg-orange-100 border-orange-200';
    case 'cancelled':
      return 'text-gray-600 bg-gray-100 border-gray-200';
    default:
      return 'text-gray-600 bg-gray-100 border-gray-200';
  }
}

// ============================================================================
// RabbitMQ System Monitoring Functions
// ============================================================================

/**
 * Get system monitoring data
 */
export async function getSystemMonitoring() {
  return RabbitMQBatchApiService.getSystemStatus();
}

/**
 * Get real-time monitoring data
 */
export async function getRealTimeMonitoring() {
  return RabbitMQBatchApiService.getRealTimeMonitoring();
}

/**
 * Get system metrics
 */
export async function getSystemMetrics() {
  return RabbitMQBatchApiService.getSystemMetrics();
}

/**
 * Get queue health metrics
 */
export async function getQueueHealth() {
  return RabbitMQBatchApiService.getQueueHealth();
}

/**
 * Get worker metrics
 */
export async function getWorkerMetrics() {
  return RabbitMQBatchApiService.getWorkerMetrics();
}

/**
 * Get system alerts
 */
export async function getSystemAlerts() {
  return RabbitMQBatchApiService.getSystemAlerts();
}

/**
 * Pause all workers
 */
export async function pauseAllWorkers() {
  return RabbitMQBatchApiService.pauseAllWorkers();
}

/**
 * Resume all workers
 */
export async function resumeAllWorkers() {
  return RabbitMQBatchApiService.resumeAllWorkers();
}

/**
 * Restart all workers
 */
export async function restartAllWorkers() {
  return RabbitMQBatchApiService.restartAllWorkers();
}

/**
 * Scale workers
 */
export async function scaleWorkers(count: number) {
  return RabbitMQBatchApiService.scaleWorkers(count);
}

/**
 * Emergency stop all operations
 */
export async function emergencyStopAll() {
  return RabbitMQBatchApiService.emergencyStopAll();
}
