import React, { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Play, 
  Pause, 
  Square, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Calendar,
  Users,
  Phone,
  Search,
  Filter,
  RefreshCw,
  Building2,
  Target
} from 'lucide-react';
import { BatchOperationsList } from '@/types/batchCalling';

interface BatchOperationsTableProps {
  operations: BatchOperationsList | null;
  onOperationSelect: (operationId: string) => void;
  onOperationAction: (operationId: string, action: 'pause' | 'resume' | 'cancel') => void;
  selectedOperation: string | null;
  organizations: Array<{ id: string; name: string }>;
  campaigns: Array<{ id: string; name: string; org_id: string }>;
  loading?: boolean;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'processing':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'completed':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'failed':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'paused':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'cancelled':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    case 'starting':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'processing':
      return <Play className="h-4 w-4" />;
    case 'completed':
      return <CheckCircle className="h-4 w-4" />;
    case 'failed':
      return <XCircle className="h-4 w-4" />;
    case 'paused':
      return <Pause className="h-4 w-4" />;
    case 'cancelled':
      return <Square className="h-4 w-4" />;
    case 'starting':
      return <Clock className="h-4 w-4" />;
    default:
      return <AlertCircle className="h-4 w-4" />;
  }
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const BatchOperationsTable: React.FC<BatchOperationsTableProps> = ({
  operations,
  onOperationSelect,
  onOperationAction,
  selectedOperation,
  organizations,
  campaigns,
  loading = false
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [orgFilter, setOrgFilter] = useState<string>('all');
  const [campaignFilter, setCampaignFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Filter operations based on selected filters
  const filteredOperations = useMemo(() => {
    if (!operations?.operations) return [];

    return Object.entries(operations.operations).filter(([operationId, operation]) => {
      // Status filter
      if (statusFilter !== 'all' && operation.status !== statusFilter) {
        return false;
      }

      // Organization filter (if org_id is available in operation)
      if (orgFilter !== 'all' && operation.org_id && operation.org_id !== orgFilter) {
        return false;
      }

      // Campaign filter (if campaign_id is available in operation)
      if (campaignFilter !== 'all' && operation.campaign_id && operation.campaign_id !== campaignFilter) {
        return false;
      }

      // Search term filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const operationIdLower = operationId.toLowerCase();
        const orgName = organizations.find(org => org.id === operation.org_id)?.name?.toLowerCase() || '';
        const campaignName = campaigns.find(camp => camp.id === operation.campaign_id)?.name?.toLowerCase() || '';
        
        if (!operationIdLower.includes(searchLower) && 
            !orgName.includes(searchLower) && 
            !campaignName.includes(searchLower)) {
          return false;
        }
      }

      return true;
    });
  }, [operations, statusFilter, orgFilter, campaignFilter, searchTerm, organizations, campaigns]);

  if (!operations || operations.total_operations === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <Phone className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No batch operations found</p>
            <p className="text-sm mb-4">Upload an Excel file to start your first batch operation</p>
            
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-md text-left max-w-md mx-auto">
              <p className="text-sm text-blue-800 font-medium mb-2">How to get started:</p>
              <ol className="text-xs text-blue-700 space-y-1 list-decimal list-inside">
                <li>Go to the <strong>New Operation</strong> tab</li>
                <li>Prepare an Excel file with customer data</li>
                <li>Select your organization and campaign</li>
                <li>Configure calling parameters</li>
                <li>Upload and start the operation</li>
              </ol>
              <p className="text-xs text-blue-600 mt-2">
                Once you have operations running, they will appear here for monitoring and management.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search operations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="starting">Starting</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            {/* Organization Filter */}
            <Select value={orgFilter} onValueChange={setOrgFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Organizations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Organizations</SelectItem>
                {organizations.map((org) => (
                  <SelectItem key={org.id} value={org.id}>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      {org.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Campaign Filter */}
            <Select value={campaignFilter} onValueChange={setCampaignFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Campaigns" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Campaigns</SelectItem>
                {campaigns
                  .filter(campaign => orgFilter === 'all' || campaign.org_id === orgFilter)
                  .map((campaign) => (
                    <SelectItem key={campaign.id} value={campaign.id}>
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        {campaign.name}
                      </div>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>

            {/* Clear Filters */}
            <Button
              variant="outline"
              onClick={() => {
                setStatusFilter('all');
                setOrgFilter('all');
                setCampaignFilter('all');
                setSearchTerm('');
              }}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Batch Operations</h3>
          <p className="text-sm text-muted-foreground">
            {filteredOperations.length} of {operations.total_operations} operations shown
          </p>
        </div>
      </div>

      {/* Operations Table */}
      <Card>
        <CardContent className="p-0">
          <div className="relative overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold">Operation ID</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Organization</TableHead>
                  <TableHead className="font-semibold">Campaign</TableHead>
                  <TableHead className="font-semibold">Progress</TableHead>
                  <TableHead className="font-semibold">Calls</TableHead>
                  <TableHead className="font-semibold">Started At</TableHead>
                  <TableHead className="font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2" />
                        Loading operations...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredOperations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      No operations match the selected filters
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOperations.map(([operationId, operation]) => {
                    const isSelected = selectedOperation === operationId;
                    const progressPercentage = (operation.expected_total_calls || operation.total_calls) > 0 
                      ? (operation.completed_calls / (operation.expected_total_calls || operation.total_calls)) * 100 
                      : 0;
                    
                    const orgName = organizations.find(org => org.id === operation.org_id)?.name || 'N/A';
                    const campaignName = campaigns.find(camp => camp.id === operation.campaign_id)?.name || 'N/A';

                    return (
                      <TableRow 
                        key={operationId} 
                        className={`cursor-pointer hover:bg-gray-50 ${
                          isSelected ? 'bg-blue-50' : ''
                        }`}
                        onClick={() => onOperationSelect(operationId)}
                      >
                        <TableCell>
                          <div className="font-mono text-sm">
                            {operationId.slice(-8)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(operation.status)}>
                            {getStatusIcon(operation.status)}
                            <span className="ml-1 capitalize">{operation.status}</span>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{orgName}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Target className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{campaignName}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-2">
                            <Progress value={progressPercentage} className="h-2" />
                            <div className="text-xs text-muted-foreground">
                              {progressPercentage.toFixed(1)}% complete
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm font-medium">
                              {operation.completed_calls} / {operation.expected_total_calls || operation.total_calls || 0}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {operation.successful_calls} successful, {operation.failed_calls} failed
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{formatDate(operation.started_at)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {/* Pause Button */}
                            {operation.status === 'processing' && (operation.pending_calls || 0) > 0 && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onOperationAction(operationId, 'pause');
                                }}
                                className="border-yellow-300 text-yellow-700 hover:bg-yellow-50"
                              >
                                <Pause className="h-4 w-4" />
                              </Button>
                            )}
                            
                            {/* Resume Button */}
                            {operation.status === 'paused' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onOperationAction(operationId, 'resume');
                                }}
                                className="border-green-300 text-green-700 hover:bg-green-50"
                              >
                                <Play className="h-4 w-4" />
                              </Button>
                            )}
                            
                            {/* Cancel Button */}
                            {(operation.status === 'processing' || operation.status === 'paused') && (operation.pending_calls || 0) > 0 && (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onOperationAction(operationId, 'cancel');
                                }}
                                className="border-red-300 text-red-700 hover:bg-red-50"
                              >
                                <Square className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
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
  );
};
