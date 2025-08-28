export interface BatchCallOperation {
  bulk_operation_id: string;
  status: 'starting' | 'processing' | 'paused' | 'completed' | 'failed' | 'cancelled';
  started_at: string;
  completed_at: string | null;
  expected_total_calls: number;  // Total calls expected from the upload
  total_calls: number;           // Actually processed calls
  completed_calls: number;
  successful_calls: number;
  failed_calls: number;
  pending_calls: number; // New field for pending calls
  progress_percentage: number;
  error: string | null;
  is_active: boolean;
  // New field for individual call statuses
  call_statuses?: Record<string, {
    status: 'pending' | 'started' | 'completed' | 'failed';
    started_at: string;
    completed_at: string | null;
    progress: 'waiting' | 'processing' | 'success' | 'error';
  }>;
  // New properties from check-status endpoint
  exists?: boolean;
  location?: 'memory' | 'database';
  can_pause?: boolean;
  can_resume?: boolean;
  can_cancel?: boolean;
  message?: string;
  actions_available?: {
    pause: boolean;
    resume: boolean;
    cancel: boolean;
    view_status: boolean;
    view_calls: boolean;
  };
}

export interface BatchCallDetail {
  id: number;
  customer_name: string;
  phone_number: string;
  excel_row: number;
  call_status: string;
  call_message: string;
  external_api_response: string; // JSON string that needs parsing
  external_api_status_code: number | null;
  external_api_error: string | null;
  processing_duration_ms: number;
  created_at: string;
  processing_end_time: string;
}

// Helper interface for parsed external API response
export interface ParsedExternalApiResponse {
  call_id: string;
  status: string;
  internal_call_id: string;
  external_api_used: boolean;
  fallback_to_database: boolean;
}

export interface BatchCallResponse {
  bulk_operation_id: string;
  expected_total_calls: number;  // Total calls expected from the upload
  total_calls: number;           // Actually processed calls
  successful_calls: number;
  failed_calls: number;
  pending_calls: number;         // Calls still pending
  org_id: string;
  campaign_id: string;
  operation_name?: string;       // Name of the operation
  calls: BatchCallDetail[];
  // New field for call statuses from the API
  call_statuses?: Record<string, {
    status: 'pending' | 'started' | 'completed' | 'failed';
    started_at: string;
    completed_at: string | null;
    progress: 'waiting' | 'processing' | 'success' | 'error';
  }>;
}

// New interface for the /calls endpoint response
export interface BatchCallSummaryResponse {
  bulk_operation_id: string;
  expected_total_calls: number;  // Total calls expected from the upload
  total_calls: number;           // Actually processed calls
  successful_calls: number;
  failed_calls: number;
  pending_calls: number;         // Calls still pending
  org_id: string;
  campaign_id: string;
  operation_name?: string;       // Name of the operation
}

export interface BatchCallSummary {
  operation_summary: {
    pending: number;
    total: number;
    completed: number;
    failed: number;
    paused: number;
    processing: number;
  };
  call_summary: {
    expected_total_calls: number;  // Total calls expected from the upload
    total_calls: number;           // Actually processed calls
    completed_calls: number;
    successful_calls: number;
    failed_calls: number;
    pending_calls: number;
  };
}

export interface BatchCallStartRequest {
  file: File;
  campaign_id: string;
  org_id: string;
  user_id: string; // This will be automatically set from backend
  channels?: number; // Number of channels for parallel processing
  sleep_seconds?: number;
  external_call_url?: string;
  external_username?: string;
  external_password?: string;
}

export interface BatchCallStartResponse {
  message: string;
  bulk_operation_id: string;
  status: string;
  note: string;
}

export interface BatchOperationsList {
  total_operations: number;
  active_operations: number;
  operations: Record<string, {
    status: string;
    started_at: string;
    expected_total_calls: number;  // Total calls expected from the upload
    total_calls: number;           // Actually processed calls
    completed_calls: number;
    successful_calls: number;      // Successfully completed calls
    failed_calls: number;          // Failed calls
    pending_calls: number;         // Calls still pending
    is_active: boolean;
  }>;
}

export interface BatchCallStatus {
  status: string;
  total_calls: number;
  completed_calls: number;
  progress_percentage: number;
  is_active: boolean;
}
