import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { usePermissions } from '@/contexts/PermissionProvider';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: {
    action: 'read' | 'write';
    resource: string;
  };
  fallback?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredPermission,
  fallback
}) => {
  const location = useLocation();
  const { hasPermission, isLoading } = usePermissions();
  const token = localStorage.getItem('authToken');

  // Check authentication
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Show loading while permissions are being fetched
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Check permissions if required
  if (requiredPermission && !hasPermission(requiredPermission.action, requiredPermission.resource)) {
    if (fallback) {
      return <>{fallback}</>;
    }
    
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">
            You don't have permission to access this page.
          </p>
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}; 
