import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthProvider';

export interface StandardizedPermissions {
  read: string[];
  write: string[];
  delete: string[];
  admin: boolean;
  permissions_list: string[];
}

export interface UserRole {
  id: string;
  name: string;
  description?: string;
  permissions: StandardizedPermissions;
  sidebar_items: string[];
  navigation_items: string[];
}

interface PermissionContextType {
  userPermissions: StandardizedPermissions | null;
  userRole: UserRole | null;
  isLoading: boolean;
  hasPermission: (action: 'read' | 'write' | 'delete', resource: string) => boolean;
  canAccessSidebarItem: (item: string) => boolean;
  refreshPermissions: () => Promise<void>;
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

export const usePermissions = () => {
  const context = useContext(PermissionContext);
  if (context === undefined) {
    throw new Error('usePermissions must be used within a PermissionProvider');
  }
  return context;
};

export const PERMISSION_RESOURCES = [
  'dashboard',
  'users',
  'roles',
  'organizations',
  'campaigns',
  'call_history',
  'analytics',
  'settings'
] as const;

export const PermissionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { hydrated, role, refreshPermissions } = useAuth();
  const [userRole, setUserRole] = useState<UserRole | null>(role);
  const [isLoading, setIsLoading] = useState(true);
  const [userPermissions, setUserPermissions] = useState<StandardizedPermissions | null>(role ? role.permissions : null);

  useEffect(() => {
    setUserRole(role);
    setUserPermissions(role ? role.permissions : null);
    setIsLoading(false);
  }, [role]);

  const hasPermission = (action: 'read' | 'write' | 'delete', resource: string): boolean => {
    if (!userPermissions || !userRole) return false;
    if (userPermissions.admin) return true;
    if (userPermissions[action].includes(resource)) return true;
    return false;
  };

  const canAccessSidebarItem = (item: string) => {
    if (!userRole) return false;
    return userRole.sidebar_items.includes(item);
  };

  const value: PermissionContextType = {
    userPermissions,
    userRole,
    isLoading: isLoading || !hydrated,
    hasPermission,
    canAccessSidebarItem,
    refreshPermissions,
  };

  return <PermissionContext.Provider value={value}>{children}</PermissionContext.Provider>;
};