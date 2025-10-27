import React from 'react';
import ErrorBoundary from '@/components/ErrorBoundary';
import { UnifiedBatchCallingDashboard } from '@/components/BatchCalling/UnifiedBatchCallingDashboard';

const BatchCallingPage: React.FC = () => {
  console.log('🚀 BatchCallingPage rendering...');
  
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50 overflow-x-hidden">
        <UnifiedBatchCallingDashboard />
      </div>
    </ErrorBoundary>
  );
};

export default BatchCallingPage;
