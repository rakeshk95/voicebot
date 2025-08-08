import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getUserData, getAuthToken } from '@/utils/localStorage';

// Create a simple event system to notify when auth changes
const authEventTarget = new EventTarget();
export const triggerAuthChange = () => {
  authEventTarget.dispatchEvent(new CustomEvent('authChanged'));
};

export interface UserPermissions {
  read: string[];
  write: string[];
}

export interface UserRole {
  id: string;
  name: string;
  permissions: UserPermissions;
}

interface PermissionContextType {
  userPermissions: UserPermissions | null;
  userRole: UserRole | null;
  isLoading: boolean;
  hasPermission: (action: 'read' | 'write', resource: string) => boolean;
  hasAnyPermission: (action: 'read' | 'write', resources: string[]) => boolean;
  hasAllPermissions: (action: 'read' | 'write', resources: string[]) => boolean;
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

interface PermissionProviderProps {
  children: ReactNode;
}

export const PermissionProvider: React.FC<PermissionProviderProps> = ({ children }) => {
  const [userPermissions, setUserPermissions] = useState<UserPermissions | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserPermissions = async () => {
    try {
      console.log('PermissionContext: Starting to fetch user permissions');
      const userData = getUserData();
      console.log('PermissionContext: User data from localStorage:', userData);
      
      if (!userData || Object.keys(userData).length === 0) {
        console.log('PermissionContext: No user data found, setting permissions to null');
        setUserPermissions(null);
        setUserRole(null);
        setIsLoading(false);
        return;
      }

      const user = userData;
      const userId = user.id || user.user_id;
      console.log('PermissionContext: User ID:', userId);

      if (!userId) {
        console.log('PermissionContext: No user ID found, setting permissions to null');
        setUserPermissions(null);
        setUserRole(null);
        setIsLoading(false);
        return;
      }

      // Fetch user roles from the API
      const response = await fetch(`http://localhost:8000/api/v1/roles/user/${userId}`, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.error('Failed to fetch user permissions');
        setUserPermissions(null);
        setUserRole(null);
        setIsLoading(false);
        return;
      }

      const userRoles = await response.json();
      console.log('PermissionContext: User roles from API:', userRoles);

      // Get the first role (assuming single role per user for now)
      const role = userRoles[0];
      if (!role) {
        console.log('PermissionContext: No role found in response');
        setUserPermissions(null);
        setUserRole(null);
        setIsLoading(false);
        return;
      }

      // Parse permissions based on the format from your database
      let permissions: UserPermissions = { read: [], write: [] };

      if (Array.isArray(role.permissions)) {
        // Handle array format like ["*"] or ["read:users", "write:users"]
        if (role.permissions.includes('*')) {
          permissions = { read: ['*'], write: ['*'] };
        } else {
          permissions.read = role.permissions
            .filter((p: string) => p.startsWith('read:'))
            .map((p: string) => p.replace('read:', ''));
          permissions.write = role.permissions
            .filter((p: string) => p.startsWith('write:'))
            .map((p: string) => p.replace('write:', ''));
        }
      } else if (typeof role.permissions === 'object') {
        // Handle object format like {"read": ["users", "roles"], "write": ["users"]}
        permissions = role.permissions;
      }

      console.log('PermissionContext: Setting user role and permissions:', {
        roleId: role.id,
        roleName: role.name,
        permissions
      });
      
      setUserRole({
        id: role.id,
        name: role.name,
        permissions
      });
      setUserPermissions(permissions);
    } catch (error) {
      console.error('Error fetching user permissions:', error);
      setUserPermissions(null);
      setUserRole(null);
    } finally {
      setIsLoading(false);
    }
  };

  const hasPermission = (action: 'read' | 'write', resource: string): boolean => {
    if (!userPermissions) return false;
    
    // Check for wildcard permissions
    if (userPermissions[action].includes('*')) return true;
    
    // Check for specific resource permissions
    return userPermissions[action].includes(resource);
  };

  const hasAnyPermission = (action: 'read' | 'write', resources: string[]): boolean => {
    return resources.some(resource => hasPermission(action, resource));
  };

  const hasAllPermissions = (action: 'read' | 'write', resources: string[]): boolean => {
    return resources.every(resource => hasPermission(action, resource));
  };

  const refreshPermissions = async () => {
    setIsLoading(true);
    await fetchUserPermissions();
  };

  useEffect(() => {
    console.log('PermissionContext: useEffect triggered, fetching permissions');
    fetchUserPermissions();
    
    // Listen for auth changes
    const handleAuthChange = () => {
      console.log('PermissionContext: Auth change detected, refreshing permissions');
      fetchUserPermissions();
    };
    
    authEventTarget.addEventListener('authChanged', handleAuthChange);
    
    return () => {
      authEventTarget.removeEventListener('authChanged', handleAuthChange);
    };
  }, []);

  const value: PermissionContextType = {
    userPermissions,
    userRole,
    isLoading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    refreshPermissions
  };

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
}; 