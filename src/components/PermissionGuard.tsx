import React, { ReactNode } from 'react';
import { usePermissions } from '@/contexts/PermissionProvider';

interface PermissionGuardProps {
  children: ReactNode;
  action: 'read' | 'write';
  resource: string;
  fallback?: ReactNode;
  requireAll?: boolean;
  resources?: string[];
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  action,
  resource,
  fallback = null,
  requireAll = false,
  resources
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions();

  let hasAccess = false;

  if (resources && resources.length > 0) {
    if (requireAll) {
      hasAccess = hasAllPermissions(action, resources);
    } else {
      hasAccess = hasAnyPermission(action, resources);
    }
  } else {
    hasAccess = hasPermission(action, resource);
  }

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

// Convenience components for common permission checks
export const CanRead: React.FC<Omit<PermissionGuardProps, 'action'> & { resource: string }> = (props) => (
  <PermissionGuard {...props} action="read" />
);

export const CanWrite: React.FC<Omit<PermissionGuardProps, 'action'> & { resource: string }> = (props) => (
  <PermissionGuard {...props} action="write" />
);

export const CanManage: React.FC<Omit<PermissionGuardProps, 'action' | 'resource'> & { resource: string }> = (props) => (
  <PermissionGuard {...props} action="write" resource={props.resource} />
); 