import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  Download, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Phone,
  ExternalLink,
  Database,
  AlertCircle,
  Info,
  ChevronDown
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { getBatchCallDetails } from '@/lib/batchCallingApi';
import { BatchCallOperation, BatchCallResponse, BatchCallDetail, ParsedExternalApiResponse } from '@/types/batchCalling';

interface BatchCallDetailsProps {
  operations: BatchCallOperation[];
}

export const BatchCallDetails: React.FC<BatchCallDetailsProps> = ({ operations }) => {
  const [selectedOperationId, setSelectedOperationId] = useState<string>('');
  const [callDetails, setCallDetails] = useState<BatchCallResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'success' | 'error'>('all');
  const { toast } = useToast();

  // Helper function to parse external API response
  const parseExternalApiResponse = (responseString: string): ParsedExternalApiResponse | null => {
    try {
      return JSON.parse(responseString);
    } catch (error) {
      console.warn('Failed to parse external API response:', error);
      return null;
    }
  };

  // Helper function to get external API badge
  const getExternalApiBadge = (call: BatchCallDetail) => {
    const parsedResponse = parseExternalApiResponse(call.external_api_response);
    
    if (parsedResponse?.external_api_used) {
      return (
        <Badge className="bg-blue-100 text-blue-800 border-blue-200">
          <ExternalLink className="h-3 w-3 mr-1" />
          External API
        </Badge>
      );
    } else if (parsedResponse?.fallback_to_database) {
      return (
        <Badge className="bg-orange-100 text-orange-800 border-orange-200">
          <Database className="h-3 w-3 mr-1" />
          Database Fallback
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-gray-100 text-gray-800 border-gray-200">
          <Database className="h-3 w-3 mr-1" />
          Local Only
        </Badge>
      );
    }
  };

  const fetchCallDetails = async (operationId: string) => {
    try {
      setLoading(true);
      
      const details = await getBatchCallDetails(operationId);
      setCallDetails(details);
      
    } catch (error) {
      let errorMessage = 'Failed to fetch call details. Please check the operation ID and try again.';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOperationSelect = (operationId: string) => {
    setSelectedOperationId(operationId);
    if (operationId) {
      fetchCallDetails(operationId);
    } else {
      setCallDetails(null);
    }
  };

  const filteredCalls = callDetails?.calls?.filter(call => {
    const matchesSearch = 
      call.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      call.phone_number.includes(searchTerm) ||
      call.call_message.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || call.call_status === filterStatus;
    
    return matchesSearch && matchesStatus;
  }) || [];

  const exportToCSV = () => {
    if (!callDetails || !callDetails.calls || callDetails.calls.length === 0) {
      toast({
        title: "No Data to Export",
        description: "There are no call details available to export",
        variant: "destructive",
      });
      return;
    }

    const headers = [
      'Row',
      'Customer Name',
      'Phone Number',
      'Status',
      'Message',
      'External API Used',
      'Fallback to Database',
      'Processing Duration (ms)',
      'Created At',
      'Completed At'
    ];

    const csvContent = [
      headers.join(','),
      ...filteredCalls.map(call => {
        const parsedResponse = parseExternalApiResponse(call.external_api_response);
        return [
          call.excel_row,
          `"${call.customer_name}"`,
          call.phone_number,
          call.call_status,
          `"${call.call_message}"`,
          parsedResponse?.external_api_used ? 'Yes' : 'No',
          parsedResponse?.fallback_to_database ? 'Yes' : 'No',
          call.processing_duration_ms,
          call.created_at,
          call.processing_end_time
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `batch-call-details-${selectedOperationId.slice(-8)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export Successful",
      description: "Call details exported to CSV",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Success
          </Badge>
        );
      case 'error':
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            <XCircle className="h-3 w-3 mr-1" />
            Error
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800 border-gray-200">
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        );
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Operation Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Phone className="h-5 w-5" />
            <span>Select Operation to View Call Details</span>
          </CardTitle>
          <CardDescription>
            Choose a batch operation from the dropdown to see detailed call information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="flex-1 max-w-md">
              <Select value={selectedOperationId} onValueChange={handleOperationSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an operation..." />
                </SelectTrigger>
                <SelectContent>
                  {operations.map((operation) => (
                    <SelectItem key={operation.bulk_operation_id} value={operation.bulk_operation_id}>
                      <div className="flex items-center justify-between w-full">
                        <span className="truncate">{operation.bulk_operation_id.slice(-8)}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          {operation.status}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedOperationId && (
              <Button variant="outline" size="sm" onClick={() => fetchCallDetails(selectedOperationId)}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Call Details Display */}
      {selectedOperationId && (
        <Card>
          <CardHeader>
            <CardTitle>Call Details for Operation: {selectedOperationId.slice(-8)}</CardTitle>
            <CardDescription>
              Detailed information about individual calls in this batch operation
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center space-x-2 py-8">
                <RefreshCw className="h-6 w-6 animate-spin" />
                <span>Loading call details...</span>
              </div>
            ) : callDetails ? (
              <div className="space-y-6">
                {/* Summary Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="text-2xl font-bold text-blue-600">{callDetails.total_calls}</div>
                    <div className="text-sm text-blue-700 font-medium">Total Calls</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="text-2xl font-bold text-green-600">{callDetails.successful_calls}</div>
                    <div className="text-sm text-green-700 font-medium">Successful</div>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                    <div className="text-2xl font-bold text-red-600">{callDetails.failed_calls}</div>
                    <div className="text-sm text-red-700 font-medium">Failed</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="text-2xl font-bold text-purple-600">
                      {callDetails.calls.filter(call => parseExternalApiResponse(call.external_api_response)?.external_api_used).length}
                    </div>
                    <div className="text-sm text-purple-700 font-medium">External API</div>
                  </div>
                </div>

                {/* Operation Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <h4 className="font-semibold text-gray-800 mb-2">Operation Information</h4>
                    <div className="space-y-1 text-sm">
                      <p><span className="font-medium">Operation ID:</span> {callDetails.bulk_operation_id}</p>
                      <p><span className="font-medium">Organization:</span> {callDetails.org_id}</p>
                      <p><span className="font-medium">Campaign:</span> {callDetails.campaign_id}</p>
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <h4 className="font-semibold text-gray-800 mb-2">Performance Metrics</h4>
                    <div className="space-y-1 text-sm">
                      <p><span className="font-medium">Success Rate:</span> {((callDetails.successful_calls / (callDetails.expected_total_calls || callDetails.total_calls || 1)) * 100).toFixed(1)}%</p>
                      <p><span className="font-medium">Failure Rate:</span> {((callDetails.failed_calls / (callDetails.expected_total_calls || callDetails.total_calls || 1)) * 100).toFixed(1)}%</p>
                      <p><span className="font-medium">Avg Duration:</span> {(callDetails.calls.reduce((sum, call) => sum + call.processing_duration_ms, 0) / callDetails.calls.length).toFixed(0)}ms</p>
                    </div>
                  </div>
                </div>

                {/* Filters and Export */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="relative max-w-sm">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search calls..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                    <Select value={filterStatus} onValueChange={(value: 'all' | 'success' | 'error') => setFilterStatus(value)}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="success">Success</SelectItem>
                        <SelectItem value="error">Error</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button variant="outline" size="sm" onClick={exportToCSV}>
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                </div>

                {/* Results Count */}
                <div className="text-sm text-muted-foreground">
                  Showing {filteredCalls.length} of {callDetails.total_calls} calls
                </div>

                {/* Individual Call Cards */}
                <div className="space-y-3">
                  {filteredCalls.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Info className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                      <p className="text-lg font-medium">No calls found</p>
                      <p className="text-sm">Try adjusting your search or filter criteria.</p>
                    </div>
                  ) : (
                    filteredCalls.map((call) => {
                      const parsedResponse = parseExternalApiResponse(call.external_api_response);
                      return (
                        <div key={call.id} className="p-4 bg-white border rounded-lg hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <span className="text-lg font-semibold text-gray-900">#{call.excel_row}</span>
                              <span className="text-lg font-medium text-gray-800">{call.customer_name}</span>
                              <span className="text-sm text-gray-600 font-mono">{call.phone_number}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge className={call.call_status === 'success' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'}>
                                {call.call_status === 'success' ? <CheckCircle className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
                                {call.call_status.charAt(0).toUpperCase() + call.call_status.slice(1)}
                              </Badge>
                              {getExternalApiBadge(call)}
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="font-medium text-gray-700">Message:</span>
                              <p className="text-gray-600 mt-1">{call.call_message}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Processing:</span>
                              <p className="text-gray-600 mt-1">{formatDuration(call.processing_duration_ms)}</p>
                              <p className="text-gray-500 text-xs">Created: {formatDateTime(call.created_at)}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">External API:</span>
                              {parsedResponse ? (
                                <div className="text-gray-600 mt-1 space-y-1">
                                  <p className="text-xs"><span className="font-medium">Call ID:</span> {parsedResponse.call_id}</p>
                                  <p className="text-xs"><span className="font-medium">Status:</span> {parsedResponse.status}</p>
                                  <p className="text-xs"><span className="font-medium">Internal ID:</span> {parsedResponse.internal_call_id}</p>
                                </div>
                              ) : (
                                <p className="text-gray-500 text-xs mt-1">No external API data</p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Info className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-lg font-medium">No call details available</p>
                <p className="text-sm">Select an operation and click refresh to load call details.</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Instructions when no operation selected */}
      {!selectedOperationId && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <Phone className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-lg font-medium">Select an Operation</p>
              <p className="text-sm">Choose a batch operation from the dropdown above to view detailed call information.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
