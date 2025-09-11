import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  Server, 
  Database, 
  Users, 
  BarChart3,
  AlertTriangle,
  Activity
} from 'lucide-react';
import { 
  getSystemMonitoring,
  getRealTimeMonitoring,
  getSystemMetrics,
  getQueueHealth,
  getWorkerMetrics,
  getSystemAlerts,
  pauseAllWorkers,
  resumeAllWorkers,
  restartAllWorkers,
  scaleWorkers,
  emergencyStopAll
} from '@/lib/batchCallingApi';

interface TestResult {
  name: string;
  status: 'success' | 'error' | 'pending';
  message: string;
  data?: any;
}

export const RabbitMQIntegrationTest: React.FC = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [testing, setTesting] = useState(false);
  const { toast } = useToast();

  const runTest = async (testName: string, testFn: () => Promise<any>) => {
    const testResult: TestResult = {
      name: testName,
      status: 'pending',
      message: 'Running test...'
    };
    
    setTestResults(prev => [...prev.filter(t => t.name !== testName), testResult]);
    
    try {
      const data = await testFn();
      const successResult: TestResult = {
        name: testName,
        status: 'success',
        message: 'Test passed successfully',
        data
      };
      setTestResults(prev => [...prev.filter(t => t.name !== testName), successResult]);
      return successResult;
    } catch (error) {
      const errorResult: TestResult = {
        name: testName,
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      };
      setTestResults(prev => [...prev.filter(t => t.name !== testName), errorResult]);
      return errorResult;
    }
  };

  const runAllTests = async () => {
    setTesting(true);
    setTestResults([]);
    
    const tests = [
      {
        name: 'System Monitoring',
        fn: () => getSystemMonitoring()
      },
      {
        name: 'Real-time Monitoring',
        fn: () => getRealTimeMonitoring()
      },
      {
        name: 'System Metrics',
        fn: () => getSystemMetrics()
      },
      {
        name: 'Queue Health',
        fn: () => getQueueHealth()
      },
      {
        name: 'Worker Metrics',
        fn: () => getWorkerMetrics()
      },
      {
        name: 'System Alerts',
        fn: () => getSystemAlerts()
      }
    ];

    for (const test of tests) {
      await runTest(test.name, test.fn);
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    setTesting(false);
    
    const successCount = testResults.filter(t => t.status === 'success').length;
    const totalCount = tests.length;
    
    toast({
      title: "Integration Test Complete",
      description: `${successCount}/${totalCount} tests passed`,
      variant: successCount === totalCount ? "default" : "destructive"
    });
  };

  const runControlTests = async () => {
    setTesting(true);
    
    const controlTests = [
      {
        name: 'Pause All Workers',
        fn: () => pauseAllWorkers()
      },
      {
        name: 'Resume All Workers',
        fn: () => resumeAllWorkers()
      },
      {
        name: 'Scale Workers (2)',
        fn: () => scaleWorkers(2)
      }
    ];

    for (const test of controlTests) {
      await runTest(test.name, test.fn);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    setTesting(false);
    
    toast({
      title: "Control Tests Complete",
      description: "Worker control operations tested",
    });
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'pending':
        return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800">Success</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800">Error</Badge>;
      case 'pending':
        return <Badge className="bg-blue-100 text-blue-800">Running</Badge>;
    }
  };

  const successCount = testResults.filter(t => t.status === 'success').length;
  const errorCount = testResults.filter(t => t.status === 'error').length;
  const pendingCount = testResults.filter(t => t.status === 'pending').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">RabbitMQ Integration Test</h2>
          <p className="text-muted-foreground">
            Test the RabbitMQ API endpoints and monitoring features
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button onClick={clearResults} variant="outline" disabled={testing}>
            Clear Results
          </Button>
          <Button onClick={runAllTests} disabled={testing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${testing ? 'animate-spin' : ''}`} />
            {testing ? 'Testing...' : 'Run All Tests'}
          </Button>
        </div>
      </div>

      {/* Test Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tests</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{testResults.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Successful</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{successCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{errorCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Running</CardTitle>
            <RefreshCw className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{pendingCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Test Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monitoring Tests */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Monitoring Tests</span>
            </CardTitle>
            <CardDescription>
              Test system monitoring and metrics endpoints
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={() => runTest('System Monitoring', () => getSystemMonitoring())}
                disabled={testing}
                variant="outline"
                size="sm"
              >
                <Server className="h-4 w-4 mr-2" />
                System Status
              </Button>
              <Button
                onClick={() => runTest('Real-time Monitoring', () => getRealTimeMonitoring())}
                disabled={testing}
                variant="outline"
                size="sm"
              >
                <Activity className="h-4 w-4 mr-2" />
                Real-time
              </Button>
              <Button
                onClick={() => runTest('System Metrics', () => getSystemMetrics())}
                disabled={testing}
                variant="outline"
                size="sm"
              >
                <Server className="h-4 w-4 mr-2" />
                Metrics
              </Button>
              <Button
                onClick={() => runTest('Queue Health', () => getQueueHealth())}
                disabled={testing}
                variant="outline"
                size="sm"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Queue Health
              </Button>
              <Button
                onClick={() => runTest('Worker Metrics', () => getWorkerMetrics())}
                disabled={testing}
                variant="outline"
                size="sm"
              >
                <Users className="h-4 w-4 mr-2" />
                Workers
              </Button>
              <Button
                onClick={() => runTest('System Alerts', () => getSystemAlerts())}
                disabled={testing}
                variant="outline"
                size="sm"
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Alerts
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Control Tests */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Control Tests</span>
            </CardTitle>
            <CardDescription>
              Test worker control and management endpoints
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={() => runTest('Pause Workers', () => pauseAllWorkers())}
                disabled={testing}
                variant="outline"
                size="sm"
                className="border-yellow-300 text-yellow-700 hover:bg-yellow-50"
              >
                Pause All
              </Button>
              <Button
                onClick={() => runTest('Resume Workers', () => resumeAllWorkers())}
                disabled={testing}
                variant="outline"
                size="sm"
                className="border-green-300 text-green-700 hover:bg-green-50"
              >
                Resume All
              </Button>
              <Button
                onClick={() => runTest('Restart Workers', () => restartAllWorkers())}
                disabled={testing}
                variant="outline"
                size="sm"
                className="border-blue-300 text-blue-700 hover:bg-blue-50"
              >
                Restart All
              </Button>
              <Button
                onClick={() => runTest('Scale Workers', () => scaleWorkers(2))}
                disabled={testing}
                variant="outline"
                size="sm"
                className="border-purple-300 text-purple-700 hover:bg-purple-50"
              >
                Scale to 2
              </Button>
            </div>
            <Button
              onClick={runControlTests}
              disabled={testing}
              className="w-full"
              variant="outline"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${testing ? 'animate-spin' : ''}`} />
              Run Control Tests
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Test Results */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
            <CardDescription>
              Detailed results from the integration tests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${
                    result.status === 'success'
                      ? 'bg-green-50 border-green-200'
                      : result.status === 'error'
                      ? 'bg-red-50 border-red-200'
                      : 'bg-blue-50 border-blue-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(result.status)}
                      <div>
                        <h4 className="font-medium">{result.name}</h4>
                        <p className="text-sm text-muted-foreground">{result.message}</p>
                      </div>
                    </div>
                    {getStatusBadge(result.status)}
                  </div>
                  {result.data && (
                    <details className="mt-3">
                      <summary className="text-sm font-medium cursor-pointer">
                        View Response Data
                      </summary>
                      <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto max-h-40">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

