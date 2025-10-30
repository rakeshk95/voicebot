import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Activity, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Database, 
  ExternalLink,
  Filter,
  RefreshCw,
  Search,
  XCircle,
  Info
} from 'lucide-react';
import { authorizedFetch } from '@/lib/api';
import * as XLSX from 'xlsx-js-style';

interface BatchOperationLog {
  id: string;
  log_level: 'INFO' | 'WARNING' | 'ERROR' | 'DEBUG';
  log_type: 'PROCESSING' | 'API_CALL' | 'EXTERNAL_API' | 'RABBITMQ' | 'WORKER' | 'DATABASE';
  message: string;
  details?: string;
  call_index?: number;
  phone_number?: string;
  call_id?: string;
  timestamp: string;
  duration_ms?: number;
  error_code?: string;
  error_message?: string;
  external_api_url?: string;
  external_api_response_code?: number;
  worker_id?: string;
  queue_name?: string;
}

interface LogSummary {
  total_logs: number;
  log_levels: Record<string, number>;
  log_types: Record<string, number>;
  error_count: number;
  api_call_count: number;
  successful_calls: number;
  failed_calls: number;
  last_log?: string;
  first_log?: string;
}

interface BatchOperationLogsProps {
  batchOperationId: string;
  onClose?: () => void;
}

export const BatchOperationLogs: React.FC<BatchOperationLogsProps> = ({
  batchOperationId,
  onClose
}) => {
  const [logs, setLogs] = useState<BatchOperationLog[]>([]);
  const [errorLogs, setErrorLogs] = useState<BatchOperationLog[]>([]);
  const [apiCallLogs, setApiCallLogs] = useState<BatchOperationLog[]>([]);
  const [summary, setSummary] = useState<LogSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedLogType, setSelectedLogType] = useState<string>('all');
  const [selectedLogLevel, setSelectedLogLevel] = useState<string>('all');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      
      const [logsRes, errorLogsRes, apiLogsRes, summaryRes] = await Promise.all([
        authorizedFetch(`/batch-operation-logs/${batchOperationId}/logs`),
        authorizedFetch(`/batch-operation-logs/${batchOperationId}/logs/errors`),
        authorizedFetch(`/batch-operation-logs/${batchOperationId}/logs/api-calls`),
        authorizedFetch(`/batch-operation-logs/${batchOperationId}/logs/summary`)
      ]);

      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setLogs(logsData.logs || []);
      }

      if (errorLogsRes.ok) {
        const errorData = await errorLogsRes.json();
        setErrorLogs(errorData.error_logs || []);
      }

      if (apiLogsRes.ok) {
        const apiData = await apiLogsRes.json();
        setApiCallLogs(apiData.api_call_logs || []);
      }

      if (summaryRes.ok) {
        const summaryData = await summaryRes.json();
        setSummary(summaryData.summary);
      }

    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const toRows = (items: BatchOperationLog[]) => {
    return items.map((l) => ({
      id: l.id,
      level: l.log_level,
      type: l.log_type,
      message: l.message,
      details: l.details || '',
      call_index: l.call_index ?? '',
      phone_number: l.phone_number || '',
      call_id: l.call_id || '',
      timestamp: l.timestamp,
      duration_ms: l.duration_ms ?? '',
      error_code: l.error_code || '',
      error_message: l.error_message || '',
      external_api_url: l.external_api_url || '',
      external_api_response_code: l.external_api_response_code ?? '',
      worker_id: l.worker_id || '',
      queue_name: l.queue_name || ''
    }));
  };

  const downloadCSV = (rows: any[], filename: string) => {
    const headers = Object.keys(rows[0] || {});
    const csv = [headers.join(',')]
      .concat(rows.map(r => headers.map(h => JSON.stringify(r[h] ?? '')).join(',')))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadXLSX = (rows: any[], filename: string) => {
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Logs');
    const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExport = (format: 'csv' | 'xlsx') => {
    const rows = toRows(logs);
    if (rows.length === 0) return;
    const filename = `batch_logs_${batchOperationId}_${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.${format}`;
    if (format === 'csv') downloadCSV(rows, filename);
    else downloadXLSX(rows, filename);
  };

  useEffect(() => {
    fetchLogs();
  }, [batchOperationId]);

  const getLogLevelIcon = (level: string) => {
    switch (level) {
      case 'ERROR': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'WARNING': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'INFO': return <Info className="h-4 w-4 text-blue-500" />;
      case 'DEBUG': return <Database className="h-4 w-4 text-gray-500" />;
      default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getLogTypeIcon = (type: string) => {
    switch (type) {
      case 'API_CALL': return <ExternalLink className="h-4 w-4 text-purple-500" />;
      case 'EXTERNAL_API': return <ExternalLink className="h-4 w-4 text-indigo-500" />;
      case 'RABBITMQ': return <Database className="h-4 w-4 text-green-500" />;
      case 'WORKER': return <Activity className="h-4 w-4 text-blue-500" />;
      case 'DATABASE': return <Database className="h-4 w-4 text-orange-500" />;
      default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getLogLevelBadgeVariant = (level: string) => {
    switch (level) {
      case 'ERROR': return 'destructive';
      case 'WARNING': return 'secondary';
      case 'INFO': return 'default';
      case 'DEBUG': return 'outline';
      default: return 'outline';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const filteredLogs = logs.filter(log => {
    const typeMatch = selectedLogType === 'all' || log.log_type === selectedLogType;
    const levelMatch = selectedLogLevel === 'all' || log.log_level === selectedLogLevel;
    return typeMatch && levelMatch;
  });

  if (loading) {
    return (
      <Card className="w-full max-w-6xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>Loading Logs...</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>Batch Operation Logs</span>
            </CardTitle>
            <CardDescription>
              Operation ID: {batchOperationId}
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Button onClick={fetchLogs} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={() => handleExport('xlsx')} variant="outline" size="sm">
              Export Excel
            </Button>
            {onClose && (
              <Button onClick={onClose} variant="outline" size="sm">
                Close
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Activity className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">Total Logs</span>
                </div>
                <div className="text-2xl font-bold">{summary.total_logs}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <span className="text-sm font-medium">Errors</span>
                </div>
                <div className="text-2xl font-bold text-red-600">{summary.error_count}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <ExternalLink className="h-4 w-4 text-purple-500" />
                  <span className="text-sm font-medium">API Calls</span>
                </div>
                <div className="text-2xl font-bold text-purple-600">{summary.api_call_count}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">Last Log</span>
                </div>
                <div className="text-xs text-gray-600">
                  {summary.last_log ? formatTimestamp(summary.last_log) : 'N/A'}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs defaultValue="all" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all" onClick={() => setSelectedLogType('all')}>
              All Logs ({logs.length})
            </TabsTrigger>
            <TabsTrigger value="errors" onClick={() => setSelectedLogType('ERROR')}>
              Errors ({errorLogs.length})
            </TabsTrigger>
            <TabsTrigger value="api-calls" onClick={() => setSelectedLogType('API_CALL')}>
              API Calls ({apiCallLogs.length})
            </TabsTrigger>
            <TabsTrigger value="processing" onClick={() => setSelectedLogType('PROCESSING')}>
              Processing
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <div className="flex items-center space-x-4 mb-4">
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4" />
                <span className="text-sm font-medium">Filter by Level:</span>
                <select
                  value={selectedLogLevel}
                  onChange={(e) => setSelectedLogLevel(e.target.value)}
                  className="px-2 py-1 border rounded text-sm"
                >
                  <option value="all">All</option>
                  <option value="ERROR">Error</option>
                  <option value="WARNING">Warning</option>
                  <option value="INFO">Info</option>
                  <option value="DEBUG">Debug</option>
                </select>
              </div>
            </div>

            <ScrollArea className="h-96">
              <div className="space-y-2">
                {filteredLogs.map((log) => (
                  <Card key={log.id} className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        {getLogLevelIcon(log.log_level)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge variant={getLogLevelBadgeVariant(log.log_level)}>
                            {log.log_level}
                          </Badge>
                          <Badge variant="outline" className="flex items-center space-x-1">
                            {getLogTypeIcon(log.log_type)}
                            <span>{log.log_type}</span>
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {formatTimestamp(log.timestamp)}
                          </span>
                          {log.duration_ms && (
                            <span className="text-xs text-gray-500">
                              ({log.duration_ms}ms)
                            </span>
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-900 mb-2">{log.message}</p>
                        
                        {log.call_index !== undefined && (
                          <div className="text-xs text-gray-600 mb-1">
                            Call #{log.call_index}
                            {log.phone_number && ` - ${log.phone_number}`}
                          </div>
                        )}
                        
                        {log.external_api_url && (
                          <div className="text-xs text-gray-600 mb-1">
                            API: {log.external_api_url}
                            {log.external_api_response_code && (
                              <span className={`ml-2 px-1 py-0.5 rounded text-xs ${
                                log.external_api_response_code >= 400 
                                  ? 'bg-red-100 text-red-800' 
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {log.external_api_response_code}
                              </span>
                            )}
                          </div>
                        )}
                        
                        {log.worker_id && (
                          <div className="text-xs text-gray-600 mb-1">
                            Worker: {log.worker_id}
                          </div>
                        )}
                        
                        {log.error_message && (
                          <div className="text-xs text-red-600 bg-red-50 p-2 rounded mt-2">
                            Error: {log.error_message}
                          </div>
                        )}
                        
                        {log.details && (
                          <details className="mt-2">
                            <summary className="text-xs text-gray-600 cursor-pointer">
                              View Details
                            </summary>
                            <pre className="text-xs bg-gray-50 p-2 rounded mt-1 overflow-auto">
                              {JSON.stringify(JSON.parse(log.details), null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="errors" className="space-y-4">
            <ScrollArea className="h-96">
              <div className="space-y-2">
                {errorLogs.map((log) => (
                  <Card key={log.id} className="p-4 border-red-200">
                    <div className="flex items-start space-x-3">
                      <XCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-1" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge variant="destructive">{log.log_level}</Badge>
                          <Badge variant="outline" className="flex items-center space-x-1">
                            {getLogTypeIcon(log.log_type)}
                            <span>{log.log_type}</span>
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {formatTimestamp(log.timestamp)}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-900 mb-2">{log.message}</p>
                        
                        {log.error_message && (
                          <div className="text-sm text-red-600 bg-red-50 p-2 rounded mb-2">
                            {log.error_message}
                          </div>
                        )}
                        
                        {log.call_index !== undefined && (
                          <div className="text-xs text-gray-600 mb-1">
                            Call #{log.call_index}
                            {log.phone_number && ` - ${log.phone_number}`}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="api-calls" className="space-y-4">
            <ScrollArea className="h-96">
              <div className="space-y-2">
                {apiCallLogs.map((log) => (
                  <Card key={log.id} className="p-4">
                    <div className="flex items-start space-x-3">
                      <ExternalLink className="h-4 w-4 text-purple-500 flex-shrink-0 mt-1" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge variant="outline">{log.log_level}</Badge>
                          <Badge variant="outline" className="flex items-center space-x-1">
                            <ExternalLink className="h-3 w-3" />
                            <span>{log.log_type}</span>
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {formatTimestamp(log.timestamp)}
                          </span>
                          {log.duration_ms && (
                            <span className="text-xs text-gray-500">
                              ({log.duration_ms}ms)
                            </span>
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-900 mb-2">{log.message}</p>
                        
                        {log.external_api_url && (
                          <div className="text-xs text-gray-600 mb-1">
                            URL: {log.external_api_url}
                          </div>
                        )}
                        
                        {log.external_api_response_code && (
                          <div className="text-xs text-gray-600 mb-1">
                            Response: 
                            <span className={`ml-1 px-1 py-0.5 rounded text-xs ${
                              log.external_api_response_code >= 400 
                                ? 'bg-red-100 text-red-800' 
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {log.external_api_response_code}
                            </span>
                          </div>
                        )}
                        
                        {log.call_index !== undefined && (
                          <div className="text-xs text-gray-600 mb-1">
                            Call #{log.call_index}
                            {log.phone_number && ` - ${log.phone_number}`}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="processing" className="space-y-4">
            <ScrollArea className="h-96">
              <div className="space-y-2">
                {logs.filter(log => log.log_type === 'PROCESSING').map((log) => (
                  <Card key={log.id} className="p-4">
                    <div className="flex items-start space-x-3">
                      <Activity className="h-4 w-4 text-blue-500 flex-shrink-0 mt-1" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge variant="outline">{log.log_level}</Badge>
                          <Badge variant="outline" className="flex items-center space-x-1">
                            <Activity className="h-3 w-3" />
                            <span>{log.log_type}</span>
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {formatTimestamp(log.timestamp)}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-900 mb-2">{log.message}</p>
                        
                        {log.details && (
                          <details className="mt-2">
                            <summary className="text-xs text-gray-600 cursor-pointer">
                              View Details
                            </summary>
                            <pre className="text-xs bg-gray-50 p-2 rounded mt-1 overflow-auto">
                              {JSON.stringify(JSON.parse(log.details), null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
