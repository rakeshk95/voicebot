import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { 
  Play, 
  Pause, 
  Square, 
  Eye, 
  RotateCcw, 
  Download, 
  Filter,
  Search,
  TrendingUp,
  Clock,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
  BarChart3
} from 'lucide-react';

interface BatchOperation {
  id: string;
  operation_name: string;
  created_by: string;
  created_at: string;
  status: 'running' | 'completed' | 'failed' | 'paused' | 'cancelled';
  total_calls: number;
  successful_calls: number;
  failed_calls: number;
  pending_calls: number;
  avg_duration: number;
  retry_count: number;
  progress_percentage: number;
  campaign_id: string;
  org_id: string;
  can_pause: boolean;
  can_resume: boolean;
  can_cancel: boolean;
}

interface InsightsData {
  total_batches: number;
  total_calls_made: number;
  overall_success_rate: number;
  avg_call_duration: number;
  total_failures_pending_retry: number;
}

interface BatchSummaryPageProps {
  showHeader?: boolean;
}

const BatchSummaryPage: React.FC<BatchSummaryPageProps> = ({ showHeader = true }) => {
  const [batches, setBatches] = useState<BatchOperation[]>([]);
  const [insights, setInsights] = useState<InsightsData>({
    total_batches: 0,
    total_calls_made: 0,
    overall_success_rate: 0,
    avg_call_duration: 0,
    total_failures_pending_retry: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [createdByFilter, setCreatedByFilter] = useState<string>('all');
  const { toast } = useToast();

  // Mock data for now - will be replaced with real API calls
  useEffect(() => {
    const mockBatches: BatchOperation[] = [
      {
        id: 'batch_001',
        operation_name: 'Marketing Campaign Q4',
        created_by: 'John Doe',
        created_at: '2025-01-11T10:30:00Z',
        status: 'running',
        total_calls: 150,
        successful_calls: 45,
        failed_calls: 12,
        pending_calls: 93,
        avg_duration: 28.5,
        retry_count: 3,
        progress_percentage: 38.0,
        campaign_id: 'camp_001',
        org_id: 'org_001',
        can_pause: true,
        can_resume: false,
        can_cancel: true
      },
      {
        id: 'batch_002',
        operation_name: 'Customer Follow-up',
        created_by: 'Jane Smith',
        created_at: '2025-01-11T09:15:00Z',
        status: 'completed',
        total_calls: 75,
        successful_calls: 68,
        failed_calls: 7,
        pending_calls: 0,
        avg_duration: 32.1,
        retry_count: 1,
        progress_percentage: 100.0,
        campaign_id: 'camp_002',
        org_id: 'org_001',
        can_pause: false,
        can_resume: false,
        can_cancel: false
      },
      {
        id: 'batch_003',
        operation_name: 'Lead Qualification',
        created_by: 'Mike Johnson',
        created_at: '2025-01-11T08:45:00Z',
        status: 'failed',
        total_calls: 200,
        successful_calls: 23,
        failed_calls: 177,
        pending_calls: 0,
        avg_duration: 15.2,
        retry_count: 0,
        progress_percentage: 100.0,
        campaign_id: 'camp_003',
        org_id: 'org_001',
        can_pause: false,
        can_resume: false,
        can_cancel: false
      }
    ];

    const mockInsights: InsightsData = {
      total_batches: 15,
      total_calls_made: 2847,
      overall_success_rate: 73.2,
      avg_call_duration: 24.8,
      total_failures_pending_retry: 45
    };

    setBatches(mockBatches);
    setInsights(mockInsights);
    setLoading(false);
  }, []);

  const getStatusBadge = (status: string) => {
    const variants = {
      running: 'default',
      completed: 'default',
      failed: 'destructive',
      paused: 'secondary',
      cancelled: 'outline'
    } as const;

    const colors = {
      running: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      paused: 'bg-yellow-100 text-yellow-800',
      cancelled: 'bg-gray-100 text-gray-800'
    };

    return (
      <Badge className={colors[status as keyof typeof colors]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getSuccessRate = (successful: number, total: number) => {
    if (total === 0) return 0;
    return ((successful / total) * 100).toFixed(1);
  };

  const getFailureRate = (failed: number, total: number) => {
    if (total === 0) return 0;
    return ((failed / total) * 100).toFixed(1);
  };

  const filteredBatches = batches.filter(batch => {
    const matchesSearch = batch.operation_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         batch.created_by.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || batch.status === statusFilter;
    const matchesDate = dateFilter === 'all' || true; // Implement date filtering logic
    const matchesCreatedBy = createdByFilter === 'all' || batch.created_by === createdByFilter;
    
    return matchesSearch && matchesStatus && matchesDate && matchesCreatedBy;
  });

  const handleBatchAction = (batchId: string, action: string) => {
    toast({
      title: "Action Triggered",
      description: `${action} action initiated for batch ${batchId}`,
    });
  };

  const handleViewDetails = (batchId: string) => {
    // Navigate to batch detail view
    toast({
      title: "Opening Details",
      description: `Opening detailed view for batch ${batchId}`,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      {showHeader && (
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Batch Calling Dashboard</h1>
            <p className="text-muted-foreground">Monitor and manage all your batch calling operations</p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Play className="h-4 w-4 mr-2" />
            Start New Batch
          </Button>
        </div>
      )}

      {/* Insights Widgets */}
      {showHeader && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Batches</p>
                  <p className="text-2xl font-bold">{insights.total_batches}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Calls</p>
                  <p className="text-2xl font-bold">{insights.total_calls_made.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                  <p className="text-2xl font-bold">{insights.overall_success_rate}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avg Duration</p>
                  <p className="text-2xl font-bold">{insights.avg_call_duration}s</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending Retries</p>
                  <p className="text-2xl font-bold">{insights.total_failures_pending_retry}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filters</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search batches..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="running">Running</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Date Range</label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Created By</label>
              <Select value={createdByFilter} onValueChange={setCreatedByFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Users" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="John Doe">John Doe</SelectItem>
                  <SelectItem value="Jane Smith">Jane Smith</SelectItem>
                  <SelectItem value="Mike Johnson">Mike Johnson</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Batches Table */}
      <Card>
        <CardHeader>
          <CardTitle>Batch Operations ({filteredBatches.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Batch Name</TableHead>
                <TableHead>Created By</TableHead>
                <TableHead>Date / Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total Calls</TableHead>
                <TableHead>Success %</TableHead>
                <TableHead>Failure %</TableHead>
                <TableHead>Avg Duration</TableHead>
                <TableHead>Retry Count</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBatches.map((batch) => (
                <TableRow key={batch.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell>
                    <div className="font-medium">{batch.operation_name}</div>
                    <div className="text-sm text-muted-foreground">ID: {batch.id}</div>
                  </TableCell>
                  <TableCell>{batch.created_by}</TableCell>
                  <TableCell>
                    {new Date(batch.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(batch.status)}
                      {batch.status === 'running' && (
                        <div className="w-16">
                          <Progress value={batch.progress_percentage} className="h-1" />
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{batch.total_calls}</TableCell>
                  <TableCell>
                    <span className="text-green-600 font-medium">
                      {getSuccessRate(batch.successful_calls, batch.total_calls)}%
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-red-600 font-medium">
                      {getFailureRate(batch.failed_calls, batch.total_calls)}%
                    </span>
                  </TableCell>
                  <TableCell>{batch.avg_duration}s</TableCell>
                  <TableCell>{batch.retry_count}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewDetails(batch.id)}
                        className="h-8 w-8 p-0"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      
                      {batch.can_pause && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleBatchAction(batch.id, 'pause')}
                          className="h-8 w-8 p-0"
                        >
                          <Pause className="h-4 w-4" />
                        </Button>
                      )}
                      
                      {batch.can_resume && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleBatchAction(batch.id, 'resume')}
                          className="h-8 w-8 p-0"
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                      )}
                      
                      {batch.failed_calls > 0 && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleBatchAction(batch.id, 'retry')}
                          className="h-8 w-8 p-0"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      )}
                      
                      {batch.can_cancel && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleBatchAction(batch.id, 'cancel')}
                          className="h-8 w-8 p-0"
                        >
                          <Square className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default BatchSummaryPage;
