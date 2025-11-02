/**
 * WebSocket Hook for Real-time Batch Call Updates
 * Provides real-time updates for batch calling operations
 */

import { useEffect, useRef, useState, useCallback } from 'react';

export interface BatchCallUpdate {
  operation_id: string;
  status: string;
  progress_percentage: number;
  total_calls: number;
  completed_calls: number;
  successful_calls: number;
  failed_calls: number;
  pending_calls: number;
  current_row: number;
  error_message?: string;
  timestamp: string;
}

export interface UseBatchCallWebSocketOptions {
  operationId?: string;
  autoConnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export interface UseBatchCallWebSocketReturn {
  isConnected: boolean;
  lastUpdate: BatchCallUpdate | null;
  error: string | null;
  connect: () => void;
  disconnect: () => void;
  sendMessage: (message: any) => void;
}

export function useBatchCallWebSocket(
  options: UseBatchCallWebSocketOptions = {}
): UseBatchCallWebSocketReturn {
  const {
    operationId,
    autoConnect = true,
    reconnectInterval = 5000,
    maxReconnectAttempts = 5
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<BatchCallUpdate | null>(null);
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const shouldReconnectRef = useRef(true);

  // Get WebSocket URL
  const getWebSocketUrl = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // Use backend port 8000 for WebSocket connections
    const baseUrl = `${protocol}//platform.voxiflow.com`;
    
    const url = operationId ? `${baseUrl}/ws/batch-calls/${operationId}` : `${baseUrl}/ws/batch-calls`;
    console.log('🔗 Generated WebSocket URL:', url);
    return url;
  }, [operationId]);

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }

    try {
      const wsUrl = getWebSocketUrl();
      console.log('🔌 Connecting to WebSocket:', wsUrl);

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('✅ WebSocket connected successfully');
        setIsConnected(true);
        setError(null);
        reconnectAttemptsRef.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📨 WebSocket message received:', data);

          if (data.type === 'batch_call_update') {
            setLastUpdate(data.payload);
          } else if (data.type === 'error') {
            setError(data.message);
          }
        } catch (err) {
          console.error('❌ Error parsing WebSocket message:', err);
          setError('Failed to parse WebSocket message');
        }
      };

      ws.onclose = (event) => {
        console.log('🔌 WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);
        wsRef.current = null;

        // Attempt to reconnect if not manually closed
        if (shouldReconnectRef.current && reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          console.log(`🔄 Attempting to reconnect (${reconnectAttemptsRef.current}/${maxReconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          setError('Max reconnection attempts reached');
        }
      };

      ws.onerror = (event) => {
        console.error('❌ WebSocket error event:', event);
        setError('WebSocket connection error');
      };

    } catch (err) {
      console.error('❌ Error creating WebSocket connection:', err);
      setError('Failed to create WebSocket connection');
    }
  }, [getWebSocketUrl, reconnectInterval, maxReconnectAttempts]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    shouldReconnectRef.current = false;
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      console.log('🔌 Manually disconnecting WebSocket');
      wsRef.current.close();
      wsRef.current = null;
    }

    setIsConnected(false);
  }, []);

  // Send message through WebSocket
  const sendMessage = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      try {
        const messageStr = JSON.stringify(message);
        wsRef.current.send(messageStr);
        console.log('📤 WebSocket message sent:', message);
      } catch (err) {
        console.error('❌ Error sending WebSocket message:', err);
        setError('Failed to send WebSocket message');
      }
    } else {
      console.warn('⚠️ WebSocket not connected, cannot send message');
      setError('WebSocket not connected');
    }
  }, []);

  // Auto-connect effect
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      shouldReconnectRef.current = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  return {
    isConnected,
    lastUpdate,
    error,
    connect,
    disconnect,
    sendMessage
  };
}

/**
 * Hook for subscribing to specific operation updates
 */
export function useOperationUpdates(operationId: string) {
  const { isConnected, lastUpdate, error, connect, disconnect } = useBatchCallWebSocket({
    operationId,
    autoConnect: true
  });

  return {
    isConnected,
    update: lastUpdate,
    error,
    connect,
    disconnect
  };
}

/**
 * Hook for subscribing to all operations updates
 */
export function useAllOperationsUpdates() {
  const { isConnected, lastUpdate, error, connect, disconnect } = useBatchCallWebSocket({
    autoConnect: true
  });

  return {
    isConnected,
    update: lastUpdate,
    error,
    connect,
    disconnect
  };
}
