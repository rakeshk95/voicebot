import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft,
  Download,
  RotateCcw,
  Play,
  Pause,
  Square,
  CheckCircle,
  XCircle,
  Clock,
  Phone,
  FileText,
  Volume2,
  Search,
  Filter,
  BarChart3,
  PieChart,
  TrendingUp,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';

interface CallRecord {
  id: string;
  phone_number: string;
  customer_name: string;
  status: 'completed' | 'failed' | 'in_progress' | 'pending';
  duration: number;
  attempts: number;
  failure_reason?: string;
  last_attempt: string;
  recording_url?: string;
  transcript?: string;
  disposition?: string;
  retry_status: 'none' | 'retried' | 'pending_retry';
  bot_intent?: string;
  emotion?: string;
}

interface BatchDetail {
  id: string;
  operation_name: string;
  created_by: string;
  created_at: string;
  completed_at?: string;
  status: 'running' | 'completed' | 'failed' | 'paused' | 'cancelled';
  total_calls: number;
  successful_calls: number;
  failed_calls: number;
  pending_calls: number;
  avg_duration: number;
  total_talk_time: number;
  progress_percentage: number;
  campaign_id: string;
  org_id: string;
  can_pause: boolean;
  can_resume: boolean;
  can_cancel: boolean;
  calls: CallRecord[];
}

interface BatchDetailViewProps {
  batchId: string;
  onBack: () => void;
}

const BatchDetailView: React.FC<BatchDetailViewProps> = ({ batchId, onBack }) => {
  const [batch, setBatch] = useState<BatchDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCalls, setSelectedCalls] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showRetryModal, setShowRetryModal] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Mock data - will be replaced with real API calls
    const mockBatch: BatchDetail = {
      id: batchId,
      operation_name: 'Marketing Campaign Q4',
      created_by: 'John Doe',
      created_at: '2025-01-11T10:30:00Z',
      completed_at: undefined,
      status: 'running',
      total_calls: 150,
      successful_calls: 45,
      failed_calls: 12,
      pending_calls: 93,
      avg_duration: 28.5,
      total_talk_time: 1282.5,
      progress_percentage: 38.0,
      campaign_id: 'camp_001',
      org_id: 'org_001',
      can_pause: true,
      can_resume: false,
      can_cancel: true,
      calls: [
        {
          id: 'call_001',
          phone_number: '+91-9876543210',
          customer_name: 'Rakesh Kumar',
          status: 'completed',
          duration: 32,
          attempts: 1,
          last_attempt: '2025-01-11T10:35:00Z',
          recording_url: 'https://example.com/recording1.mp3',
          transcript: 'Hello, I am interested in your product...',
          disposition: 'Interested',
          retry_status: 'none',
          bot_intent: 'Product Inquiry',
          emotion: 'Positive'
        },
        {
          id: 'call_002',
          phone_number: '+91-9876543211',
          customer_name: 'Priya Sharma',
          status: 'failed',
          duration: 0,
          attempts: 3,
          failure_reason: 'Line Busy',
          last_attempt: '2025-01-11T10:40:00Z',
          retry_status: 'pending_retry'
        },
        {
          id: 'call_003',
          phone_number: '+91-9876543212',
          customer_name: 'Amit Patel',
          status: 'in_progress',
          duration: 0,
          attempts: 1,
          last_attempt: '2025-01-11T10:45:00Z',
          retry_status: 'none'
        }
      ]
    };

    setBatch(mockBatch);
    setLoading(false);
  }, [batchId]);

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
      failed: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle },
      in_progress: { bg: 'bg-blue-100', text: 'text-blue-800', icon: Clock },
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock }
    };

    const variant = variants[status as keyof typeof variants];
    const Icon = variant.icon;

    return (
      <Badge className={`${variant.bg} ${variant.text} flex items-center space-x-1`}>
        <Icon className="h-3 w-3" />
        <span>{status.replace('_', ' ').toUpperCase()}</span>
      </Badge>
    );
  };

  const filteredCalls = batch?.calls.filter(call => {
    const matchesSearch = call.phone_number.includes(searchTerm) || 
                         call.customer_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || call.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  const handleSelectCall = (callId: string, checked: boolean) => {
    if (checked) {
      setSelectedCalls([...selectedCalls, callId]);
    } else {
      setSelectedCalls(selectedCalls.filter(id => id !== callId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedCalls(filteredCalls.map(call => call.id));
    } else {
      setSelectedCalls([]);
    }
  };

  const handleRetrySelected = () => {
    if (selectedCalls.length === 0) {
      toast({
        title: "No Calls Selected",
        description: "Please select calls to retry",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Retry Initiated",
      description: `Retrying ${selectedCalls.length} failed calls`,
    });
    setShowRetryModal(false);
    setSelectedCalls([]);
  };

  const handleExport = () => {
    toast({
      title: "Export Started",
      description: "CSV export will be downloaded shortly",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Batch not found</p>
        <Button onClick={onBack} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{batch.operation_name}</h1>
            <p className="text-muted-foreground">Batch ID: {batch.id}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {batch.can_pause && (
            <Button variant="outline">
              <Pause className="h-4 w-4 mr-2" />
              Pause
            </Button>
          )}
          {batch.can_resume && (
            <Button variant="outline">
              <Play className="h-4 w-4 mr-2" />
              Resume
            </Button>
          )}
          {batch.failed_calls > 0 && (
            <Button variant="outline" onClick={() => setShowRetryModal(true)}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Retry Failures
            </Button>
          )}
          <Button onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Summary Header */}
      <Card>
        <CardHeader>
          <CardTitle>Batch Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Created By</p>
              <p className="text-lg font-semibold">{batch.created_by}</p>
              <p className="text-sm text-muted-foreground">
                {new Date(batch.created_at).toLocaleString()}
              </p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              <div className="flex items-center space-x-2 mt-1">
                <Badge className={
                  batch.status === 'running' ? 'bg-blue-100 text-blue-800' :
                  batch.status === 'completed' ? 'bg-green-100 text-green-800' :
                  batch.status === 'failed' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }>
                  {batch.status.toUpperCase()}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {batch.progress_percentage.toFixed(1)}% complete
                </span>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">Call Statistics</p>
              <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                <div>
                  <span className="text-green-600 font-medium">{batch.successful_calls}</span>
                  <span className="text-muted-foreground"> successful</span>
                </div>
                <div>
                  <span className="text-red-600 font-medium">{batch.failed_calls}</span>
                  <span className="text-muted-foreground"> failed</span>
                </div>
                <div>
                  <span className="text-blue-600 font-medium">{batch.pending_calls}</span>
                  <span className="text-muted-foreground"> pending</span>
                </div>
                <div>
                  <span className="text-gray-600 font-medium">{batch.total_calls}</span>
                  <span className="text-muted-foreground"> total</span>
                </div>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">Duration</p>
              <p className="text-lg font-semibold">{batch.avg_duration}s</p>
              <p className="text-sm text-muted-foreground">average per call</p>
            </div>
          </div>

          {batch.status === 'running' && (
            <div className="mt-4">
              <Progress value={batch.progress_percentage} className="h-2" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Progress Visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <PieChart className="h-5 w-5" />
              <span>Call Status Distribution</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-green-500 rounded"></div>
                  <span>Successful</span>
                </div>
                <span className="font-medium">{batch.successful_calls} ({((batch.successful_calls / batch.total_calls) * 100).toFixed(1)}%)</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-red-500 rounded"></div>
                  <span>Failed</span>
                </div>
                <span className="font-medium">{batch.failed_calls} ({((batch.failed_calls / batch.total_calls) * 100).toFixed(1)}%)</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-blue-500 rounded"></div>
                  <span>Pending</span>
                </div>
                <span className="font-medium">{batch.pending_calls} ({((batch.pending_calls / batch.total_calls) * 100).toFixed(1)}%)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Success Trend</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-32 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <BarChart3 className="h-8 w-8 mx-auto mb-2" />
                <p>Success trend chart would be here</p>
                <p className="text-sm">(Real-time data visualization)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Calls Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Calls ({filteredCalls.length})</CardTitle>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search calls..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedCalls.length === filteredCalls.length && filteredCalls.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Phone Number</TableHead>
                <TableHead>Customer Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Attempts</TableHead>
                <TableHead>Failure Reason</TableHead>
                <TableHead>Last Attempt</TableHead>
                <TableHead>Recording</TableHead>
                <TableHead>Transcript</TableHead>
                <TableHead>Disposition</TableHead>
                <TableHead>Retry Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCalls.map((call) => (
                <TableRow key={call.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedCalls.includes(call.id)}
                      onCheckedChange={(checked) => handleSelectCall(call.id, checked as boolean)}
                    />
                  </TableCell>
                  <TableCell className="font-mono">{call.phone_number}</TableCell>
                  <TableCell>{call.customer_name}</TableCell>
                  <TableCell>{getStatusBadge(call.status)}</TableCell>
                  <TableCell>{call.duration}s</TableCell>
                  <TableCell>{call.attempts}</TableCell>
                  <TableCell>
                    {call.failure_reason && (
                      <span className="text-red-600 text-sm">{call.failure_reason}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(call.last_attempt).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {call.recording_url && (
                      <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                        <Volume2 className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                  <TableCell>
                    {call.transcript && (
                      <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                        <FileText className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                  <TableCell>
                    {call.disposition && (
                      <Badge variant="outline">{call.disposition}</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {call.retry_status === 'pending_retry' && (
                      <Badge className="bg-yellow-100 text-yellow-800">
                        Pending Retry
                      </Badge>
                    )}
                    {call.retry_status === 'retried' && (
                      <Badge className="bg-blue-100 text-blue-800">
                        Retried
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      {call.status === 'failed' && (
                        <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      )}
                      {call.recording_url && (
                        <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                          <Download className="h-4 w-4" />
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

      {/* Retry Modal */}
      {showRetryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Retry Failed Calls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Retry {batch.failed_calls} failed calls from this batch?
              </p>
              <div className="flex items-center space-x-2">
                <Checkbox id="retry-limit" />
                <label htmlFor="retry-limit" className="text-sm">
                  Set retry limit (max 3 attempts)
                </label>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowRetryModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleRetrySelected}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Retry Calls
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default BatchDetailView;
