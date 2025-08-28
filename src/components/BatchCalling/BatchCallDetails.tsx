import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
  ChevronDown,
  Filter,
  Calendar,
  Clock,
  User,
  MessageSquare
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
  const [filterApiType, setFilterApiType] = useState<'all' | 'external' | 'database' | 'local'>('all');
  const [sortBy, setSortBy] = useState<'created_at' | 'customer_name' | 'processing_duration_ms' | 'call_status'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
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

  // Helper function to get API type for filtering
  const getApiType = (call: BatchCallDetail): 'external' | 'database' | 'local' => {
    const parsedResponse = parseExternalApiResponse(call.external_api_response);
    
    if (parsedResponse?.external_api_used) {
      return 'external';
    } else if (parsedResponse?.fallback_to_database) {
      return 'database';
    } else {
      return 'local';
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

  // Enhanced filtering and sorting
  const filteredAndSortedCalls = callDetails?.calls
    ?.filter(call => {
      const matchesSearch = 
        call.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        call.phone_number.includes(searchTerm) ||
        call.call_message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        call.id.toString().includes(searchTerm);
      
      const matchesStatus = filterStatus === 'all' || call.call_status === filterStatus;
      const matchesApiType = filterApiType === 'all' || getApiType(call) === filterApiType;
      
      return matchesSearch && matchesStatus && matchesApiType;
    })
    ?.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'created_at':
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
        case 'customer_name':
          aValue = a.customer_name.toLowerCase();
          bValue = b.customer_name.toLowerCase();
          break;
        case 'processing_duration_ms':
          aValue = a.processing_duration_ms;
          bValue = b.processing_duration_ms;
          break;
        case 'call_status':
          aValue = a.call_status.toLowerCase();
          bValue = b.call_status.toLowerCase();
          break;
        default:
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
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
      'Completed At',
      'Call ID',
      'Internal Call ID'
    ];

    const csvContent = [
      headers.join(','),
      ...filteredAndSortedCalls.map(call => {
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
          call.processing_end_time,
          parsedResponse?.call_id || '',
          parsedResponse?.internal_call_id || ''
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

  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterStatus('all');
    setFilterApiType('all');
    setSortBy('created_at');
    setSortOrder('desc');
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
                <div className="grid grid-cols-4 gap-3">
                  <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="text-xl font-bold text-blue-600">{callDetails.total_calls}</div>
                    <div className="text-xs text-blue-700 font-medium">Total Calls</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="text-xl font-bold text-green-600">{callDetails.successful_calls}</div>
                    <div className="text-xs text-green-700 font-medium">Successful</div>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
                    <div className="text-xl font-bold text-red-600">{callDetails.failed_calls}</div>
                    <div className="text-xs text-red-700 font-medium">Failed</div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="text-xl font-bold text-purple-600">
                      {callDetails.calls.filter(call => parseExternalApiResponse(call.external_api_response)?.external_api_used).length}
                    </div>
                    <div className="text-xs text-purple-700 font-medium">External API</div>
                  </div>
                </div>

                {/* Operation Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-3 bg-gray-50 rounded-lg border">
                    <h4 className="font-semibold text-gray-800 mb-1 text-sm">Operation Information</h4>
                    <div className="space-y-0.5 text-xs">
                      <p><span className="font-medium">Operation ID:</span> {callDetails.bulk_operation_id.slice(-8)}</p>
                      <p><span className="font-medium">Organization:</span> {callDetails.org_id}</p>
                      <p><span className="font-medium">Campaign:</span> {callDetails.campaign_id}</p>
                    </div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg border">
                    <h4 className="font-semibold text-gray-800 mb-1 text-sm">Performance Metrics</h4>
                    <div className="space-y-0.5 text-xs">
                      <p><span className="font-medium">Success Rate:</span> {((callDetails.successful_calls / (callDetails.expected_total_calls || callDetails.total_calls || 1)) * 100).toFixed(1)}%</p>
                      <p><span className="font-medium">Failure Rate:</span> {((callDetails.failed_calls / (callDetails.expected_total_calls || callDetails.total_calls || 1)) * 100).toFixed(1)}%</p>
                      <p><span className="font-medium">Avg Duration:</span> {(callDetails.calls.reduce((sum, call) => sum + call.processing_duration_ms, 0) / callDetails.calls.length).toFixed(0)}ms</p>
                    </div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg border">
                    <h4 className="font-semibold text-gray-800 mb-1 text-sm">Call Distribution</h4>
                    <div className="space-y-0.5 text-xs">
                      <p><span className="font-medium">Total:</span> {callDetails.total_calls}</p>
                      <p><span className="font-medium">Pending:</span> {callDetails.pending_calls}</p>
                      <p><span className="font-medium">Expected:</span> {callDetails.expected_total_calls}</p>
                    </div>
                  </div>
                </div>

                {/* Enhanced Filters */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Filter className="h-4 w-4" />
                      Filters & Search
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                      {/* Search */}
                      <div className="relative">
                        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                        <Input
                          placeholder="Search calls..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-8 h-8 text-sm"
                        />
                      </div>

                      {/* Status Filter */}
                      <Select value={filterStatus} onValueChange={(value: 'all' | 'success' | 'error') => setFilterStatus(value)}>
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue placeholder="All Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="success">Success</SelectItem>
                          <SelectItem value="error">Error</SelectItem>
                        </SelectContent>
                      </Select>

                      {/* API Type Filter */}
                      <Select value={filterApiType} onValueChange={(value: 'all' | 'external' | 'database' | 'local') => setFilterApiType(value)}>
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue placeholder="All API Types" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All API Types</SelectItem>
                          <SelectItem value="external">External API</SelectItem>
                          <SelectItem value="database">Database Fallback</SelectItem>
                          <SelectItem value="local">Local Only</SelectItem>
                        </SelectContent>
                      </Select>

                      {/* Sort By */}
                      <Select value={sortBy} onValueChange={(value: typeof sortBy) => setSortBy(value)}>
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="created_at">Created Date</SelectItem>
                          <SelectItem value="customer_name">Customer Name</SelectItem>
                          <SelectItem value="processing_duration_ms">Duration</SelectItem>
                          <SelectItem value="call_status">Status</SelectItem>
                        </SelectContent>
                      </Select>

                      {/* Sort Order */}
                      <Select value={sortOrder} onValueChange={(value: 'asc' | 'desc') => setSortOrder(value)}>
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="desc">Descending</SelectItem>
                          <SelectItem value="asc">Ascending</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <Button variant="outline" size="sm" onClick={clearFilters} className="h-8 text-sm">
                        <Filter className="h-3 w-3 mr-1" />
                        Clear Filters
                      </Button>
                      <Button variant="outline" size="sm" onClick={exportToCSV} className="h-8 text-sm">
                        <Download className="h-3 w-3 mr-1" />
                        Export CSV
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Results Count */}
                <div className="text-sm text-muted-foreground">
                  Showing {filteredAndSortedCalls.length} of {callDetails.total_calls} calls
                </div>

                {/* Calls Table */}
                <Card>
                  <CardContent className="p-0">
                    <div className="relative">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-50">
                            <TableHead className="font-semibold cursor-pointer w-12" onClick={() => handleSort('created_at')}>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Row
                                {sortBy === 'created_at' && (
                                  <ChevronDown className={`h-2 w-2 transition-transform ${sortOrder === 'asc' ? 'rotate-180' : ''}`} />
                                )}
                              </div>
                            </TableHead>
                            <TableHead className="font-semibold cursor-pointer w-28" onClick={() => handleSort('customer_name')}>
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                Customer
                                {sortBy === 'customer_name' && (
                                  <ChevronDown className={`h-2 w-2 transition-transform ${sortOrder === 'asc' ? 'rotate-180' : ''}`} />
                                )}
                              </div>
                            </TableHead>
                            <TableHead className="font-semibold w-24">Phone</TableHead>
                            <TableHead className="font-semibold cursor-pointer w-16" onClick={() => handleSort('call_status')}>
                              <div className="flex items-center gap-1">
                                Status
                                {sortBy === 'call_status' && (
                                  <ChevronDown className={`h-2 w-2 transition-transform ${sortOrder === 'asc' ? 'rotate-180' : ''}`} />
                                )}
                              </div>
                            </TableHead>
                            <TableHead className="font-semibold w-20">API</TableHead>
                            <TableHead className="font-semibold cursor-pointer w-16" onClick={() => handleSort('processing_duration_ms')}>
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Time
                                {sortBy === 'processing_duration_ms' && (
                                  <ChevronDown className={`h-2 w-2 transition-transform ${sortOrder === 'asc' ? 'rotate-180' : ''}`} />
                                )}
                              </div>
                            </TableHead>
                            <TableHead className="font-semibold w-24">Created</TableHead>
                            <TableHead className="font-semibold w-32">Message</TableHead>
                            <TableHead className="font-semibold w-24">Details</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredAndSortedCalls.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={9} className="text-center py-8">
                                <div className="flex flex-col items-center">
                                  <Info className="h-12 w-12 text-gray-400 mb-4" />
                                  <p className="text-lg font-medium text-gray-500">No calls found</p>
                                  <p className="text-sm text-gray-400">Try adjusting your search or filter criteria.</p>
                                </div>
                              </TableCell>
                            </TableRow>
                          ) : (
                            filteredAndSortedCalls.map((call) => {
                              const parsedResponse = parseExternalApiResponse(call.external_api_response);
                              return (
                                <TableRow key={call.id} className="hover:bg-gray-50">
                                  <TableCell className="font-mono text-xs w-12">
                                    #{call.excel_row}
                                  </TableCell>
                                  <TableCell className="w-28">
                                    <div className="font-medium truncate text-sm" title={call.customer_name}>
                                      {call.customer_name}
                                    </div>
                                  </TableCell>
                                  <TableCell className="font-mono text-xs w-24">
                                    {call.phone_number}
                                  </TableCell>
                                  <TableCell className="w-16">
                                    {getStatusBadge(call.call_status)}
                                  </TableCell>
                                  <TableCell className="w-20">
                                    {getExternalApiBadge(call)}
                                  </TableCell>
                                  <TableCell className="font-mono text-xs w-16">
                                    {formatDuration(call.processing_duration_ms)}
                                  </TableCell>
                                  <TableCell className="text-xs w-24">
                                    <div className="truncate" title={formatDateTime(call.created_at)}>
                                      {new Date(call.created_at).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </div>
                                  </TableCell>
                                  <TableCell className="w-32">
                                    <div className="truncate text-xs" title={call.call_message}>
                                      {call.call_message}
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-xs w-24">
                                    {parsedResponse ? (
                                      <div className="space-y-0.5">
                                        <div className="truncate" title={parsedResponse.call_id || 'N/A'}>
                                          <span className="font-medium">ID:</span> {parsedResponse.call_id || 'N/A'}
                                        </div>
                                        <div className="truncate" title={parsedResponse.status || 'N/A'}>
                                          <span className="font-medium">Status:</span> {parsedResponse.status || 'N/A'}
                                        </div>
                                      </div>
                                    ) : (
                                      <span className="text-gray-500">No external API data</span>
                                    )}
                                  </TableCell>
                                </TableRow>
                              );
                            })
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
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
