import React from 'react';
import ErrorBoundary from '@/components/ErrorBoundary';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const SimpleBatchDashboard: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <div className="p-6 overflow-x-hidden">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Batch Operations</h1>
        <p className="text-gray-600 mt-2">Manage and monitor your calling campaigns</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Operations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Calls</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0%</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Operations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
          </CardContent>
        </Card>
      </div>
      
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Recent Operations</h2>
        <Button onClick={() => navigate('/batch-calling/create')}>
          New Batch
        </Button>
      </div>
      
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            <p>No batch operations found.</p>
            <p className="text-sm mt-2">Create your first batch to get started.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const BatchCallingPage: React.FC = () => {
  console.log('🚀 BatchCallingPage rendering...');
  
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50 overflow-x-hidden">
        <SimpleBatchDashboard />
      </div>
    </ErrorBoundary>
  );
};

export default BatchCallingPage;
