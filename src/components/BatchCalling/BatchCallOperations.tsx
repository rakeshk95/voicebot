import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
  Phone
} from 'lucide-react';
import { BatchOperationsList } from '@/types/batchCalling';

interface BatchCallOperationsProps {
  operations: BatchOperationsList | null;
  onOperationSelect: (operationId: string) => void;
  onOperationAction: (operationId: string, action: 'pause' | 'resume' | 'cancel') => void;
  selectedOperation: string | null;
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

export const BatchCallOperations: React.FC<BatchCallOperationsProps> = ({
  operations,
  onOperationSelect,
  onOperationAction,
  selectedOperation
}) => {
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
      {/* Summary */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Batch Operations</h3>
          <p className="text-sm text-muted-foreground">
            {operations.total_operations} total operations, {operations.active_operations} active
          </p>
        </div>

      </div>

      {/* Operations List */}
      <div className="grid gap-4">
        {Object.entries(operations.operations).map(([operationId, operation]) => {
          const isSelected = selectedOperation === operationId;
          
          const progressPercentage = (operation.expected_total_calls || operation.total_calls) > 0 
            ? (operation.completed_calls / (operation.expected_total_calls || operation.total_calls)) * 100 
            : 0;

          return (
            <Card 
              key={operationId} 
              className={`cursor-pointer transition-all hover:shadow-md ${
                isSelected ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => onOperationSelect(operationId)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Badge className={getStatusColor(operation.status)}>
                      {getStatusIcon(operation.status)}
                      <span className="ml-1 capitalize">{operation.status}</span>
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      ID: {operationId.slice(-8)}
                    </span>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(operation.started_at)}</span>
                    </div>
                  </div>
                </div>
              </CardHeader>

                             <CardContent className="space-y-4">
                 {/* Progress Section */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">
                      {operation.completed_calls} / {operation.total_calls || operation.expected_total_calls || 0} calls
                    </span>
                  </div>
                  <Progress value={progressPercentage} className="h-2" />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{progressPercentage.toFixed(1)}% complete</span>
                    <span>
                      {operation.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="space-y-1">
                    <div className="text-2xl font-bold text-blue-600">
                      {operation.expected_total_calls || operation.total_calls || 0}
                    </div>
                    <div className="text-xs text-muted-foreground">Expected Calls</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-2xl font-bold text-green-600">
                      {operation.completed_calls}
                    </div>
                    <div className="text-xs text-muted-foreground">Completed</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-2xl font-bold text-orange-600">
                      {(operation.expected_total_calls || operation.total_calls || 0) - operation.completed_calls}
                    </div>
                    <div className="text-xs text-muted-foreground">Remaining</div>
                  </div>
                </div>

                {/* Action Buttons - Only show when appropriate */}
                {operation.is_active && (
                  <div className="flex items-center justify-center space-x-2 pt-2 border-t">
                    {/* Pause Button - Only show for processing operations with pending calls */}
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
                        <Pause className="h-4 w-4 mr-1" />
                        Pause
                      </Button>
                    )}
                    
                    {/* Resume Button - Only show for paused operations */}
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
                        <Play className="h-4 w-4 mr-1" />
                        Resume
                      </Button>
                    )}
                    
                    {/* Cancel Button - Only show for active operations with pending calls */}
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
                        <Square className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                    )}
                    
                    {/* Status indicator for completed operations */}
                    {operation.status === 'completed' && (
                      <div className="flex items-center space-x-2 text-sm text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        <span>Completed</span>
                      </div>
                    )}
                    
                    {/* Status indicator for failed operations */}
                    {operation.status === 'failed' && (
                      <div className="flex items-center space-x-2 text-sm text-red-600">
                        <XCircle className="h-4 w-4" />
                        <span>Failed</span>
                      </div>
                    )}
                    
                    {/* Status indicator for cancelled operations */}
                    {operation.status === 'cancelled' && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Square className="h-4 w-4" />
                        <span>Cancelled</span>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
