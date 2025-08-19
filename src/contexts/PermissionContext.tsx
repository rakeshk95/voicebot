import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getUserData, getAuthToken } from '@/utils/localStorage';

// Create a simple event system to notify when auth changes
const authEventTarget = new EventTarget();
export const triggerAuthChange = () => {
  authEventTarget.dispatchEvent(new CustomEvent('authChanged'));
};

// Helper function to get role data from localStorage
const getRoleData = () => {
  try {
    const roleData = localStorage.getItem('userRole');
    if (roleData && roleData !== 'undefined') {
      return JSON.parse(roleData);
    }
    return null;
  } catch (error) {
    console.error('Error parsing role data:', error);
    return null;
  }
};

// Standardized permissions structure
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
  hasAnyPermission: (action: 'read' | 'write' | 'delete', resources: string[]) => boolean;
  hasAllPermissions: (action: 'read' | 'write' | 'delete', resources: string[]) => boolean;
  canAccessSidebarItem: (item: string) => boolean;
  canAccessNavigationItem: (item: string) => boolean;
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
  const [userPermissions, setUserPermissions] = useState<StandardizedPermissions | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false); // Add flag to prevent multiple simultaneous calls

  // Parse permissions from various database formats
  const parsePermissions = (rawPermissions: any): StandardizedPermissions => {
    console.log('PermissionContext: Parsing raw permissions:', rawPermissions);
    
    let permissions: StandardizedPermissions = {
      read: [],
      write: [],
      delete: [],
      admin: false,
      permissions_list: []
    };

    try {
      // Handle string JSON format
      if (typeof rawPermissions === 'string') {
        rawPermissions = JSON.parse(rawPermissions);
      }

      // Handle array format like ["*"] or ["read:users", "write:users"]
      if (Array.isArray(rawPermissions)) {
        if (rawPermissions.includes('*')) {
          // Admin privileges
          permissions.admin = true;
          permissions.read = ['*'];
          permissions.write = ['*'];
          permissions.delete = ['*'];
          permissions.permissions_list = ['*'];
        } else {
          // Parse format like ["read:users", "write:users", "read:org", "write:org"]
          rawPermissions.forEach((perm: string) => {
            if (perm.startsWith('read:')) {
              const resource = perm.replace('read:', '');
              permissions.read.push(resource);
              permissions.permissions_list.push(resource);
            } else if (perm.startsWith('write:')) {
              const resource = perm.replace('write:', '');
              permissions.write.push(resource);
              permissions.permissions_list.push(resource);
            } else if (perm.startsWith('delete:')) {
              const resource = perm.replace('delete:', '');
              permissions.delete.push(resource);
              permissions.permissions_list.push(resource);
            }
          });
        }
      }

      // Handle object format like { "read": ["users", "org"], "write": ["users"] }
      if (typeof rawPermissions === 'object' && !Array.isArray(rawPermissions)) {
        if (rawPermissions.read && Array.isArray(rawPermissions.read)) {
          permissions.read = [...permissions.read, ...rawPermissions.read];
          permissions.permissions_list = [...permissions.permissions_list, ...rawPermissions.read];
        }
        if (rawPermissions.write && Array.isArray(rawPermissions.write)) {
          permissions.write = [...permissions.write, ...rawPermissions.write];
          permissions.permissions_list = [...permissions.permissions_list, ...rawPermissions.write];
        }
        if (rawPermissions.delete && Array.isArray(rawPermissions.delete)) {
          permissions.delete = [...permissions.delete, ...rawPermissions.delete];
          permissions.permissions_list = [...permissions.permissions_list, ...rawPermissions.delete];
        }
        if (rawPermissions.admin) {
          permissions.admin = true;
        }
      }

      // Remove duplicates
      permissions.read = [...new Set(permissions.read)];
      permissions.write = [...new Set(permissions.write)];
      permissions.delete = [...new Set(permissions.delete)];
      permissions.permissions_list = [...new Set(permissions.permissions_list)];

      console.log('PermissionContext: Parsed permissions:', permissions);
      return permissions;
    } catch (error) {
      console.error('PermissionContext: Error parsing permissions:', error);
      return permissions;
    }
  };

  // Generate sidebar and navigation items based on permissions
  const generateUIItems = (permissions: StandardizedPermissions) => {
    console.log('PermissionContext: generateUIItems called with permissions:', permissions);
    
    const sidebarItems: string[] = [];
    const navigationItems: string[] = [];

    // Always include dashboard
    sidebarItems.push('dashboard');
    navigationItems.push('home');

    // Add items based on permissions
    if (permissions.admin || permissions.read.includes('users')) {
      console.log('PermissionContext: Adding users to sidebar items');
      sidebarItems.push('users');
      navigationItems.push('users');
    }

    if (permissions.admin || permissions.read.includes('campaigns')) {
      console.log('PermissionContext: Adding campaigns to sidebar items');
      sidebarItems.push('campaigns');
      navigationItems.push('campaigns');
    }

    if (permissions.admin || permissions.read.includes('organizations')) {
      console.log('PermissionContext: Adding organizations to sidebar items');
      sidebarItems.push('organizations');
      navigationItems.push('organizations');
    }

    if (permissions.admin || permissions.read.includes('roles')) {
      console.log('PermissionContext: Adding roles-permissions to sidebar items');
      sidebarItems.push('roles-permissions');
      navigationItems.push('roles');
    }

    if (permissions.admin || permissions.read.includes('call_history')) {
      console.log('PermissionContext: Adding call-history to sidebar items');
      sidebarItems.push('call-history');
      navigationItems.push('call-history');
    }

    // Add profile and settings for all users
    sidebarItems.push('profile');
    navigationItems.push('profile');

    console.log('PermissionContext: Generated sidebar items:', sidebarItems);
    console.log('PermissionContext: Generated navigation items:', navigationItems);

    return { sidebarItems, navigationItems };
  };

  const fetchUserPermissions = async () => {
    // Prevent multiple simultaneous calls
    if (isFetching) {
      console.log('PermissionContext: Already fetching permissions, skipping...');
      return;
    }

    setIsFetching(true);
    try {
      const token = getAuthToken();
      if (!token) {
        console.log('PermissionContext: No auth token, skipping permissions fetch');
        setUserPermissions(null);
        setUserRole(null);
        return;
      }

      // Get role data directly from localStorage
      const role = getRoleData();
      if (!role) {
        console.log('PermissionContext: No role data found, skipping permissions fetch');
        setUserPermissions(null);
        setUserRole(null);
        return;
      }

      console.log('PermissionContext: Retrieved role data:', role);

      const permissions = parsePermissions(role.permissions);
      
      // Parse sidebar and navigation items, or generate them if they're missing
      let sidebarItems = Array.isArray(role.sidebar_items) ? role.sidebar_items : [];
      let navigationItems = Array.isArray(role.navigation_items) ? role.navigation_items : [];
      
      // If sidebar items are missing, generate them from permissions
      if (sidebarItems.length === 0) {
        console.log('PermissionContext: No sidebar items found, generating from permissions');
        const { sidebarItems: generatedSidebar, navigationItems: generatedNav } = generateUIItems(permissions);
        sidebarItems = generatedSidebar;
        navigationItems = generatedNav;
      }

      // If still no sidebar items, provide basic fallback items
      if (sidebarItems.length === 0) {
        console.log('PermissionContext: Still no sidebar items, providing fallback items');
        sidebarItems = ['dashboard', 'organizations', 'campaigns', 'users', 'call-history'];
        navigationItems = ['home', 'organizations', 'campaigns', 'users', 'call-history'];
      }

      console.log('PermissionContext: Final sidebar items:', sidebarItems);
      console.log('PermissionContext: Final navigation items:', navigationItems);

      setUserRole({
        id: role.id,
        name: role.name,
        description: role.description,
        permissions,
        sidebar_items: sidebarItems,
        navigation_items: navigationItems
      });
      setUserPermissions(permissions);
    } catch (error) {
      console.error('Error fetching user permissions:', error);
      setUserPermissions(null);
      setUserRole(null);
    } finally {
      setIsLoading(false);
      setIsFetching(false);
    }
  };

  const hasPermission = (action: 'read' | 'write' | 'delete', resource: string): boolean => {
    if (!userPermissions) return false;
    
    // Check for admin privileges
    if (userPermissions.admin) return true;
    
    // Check for wildcard permissions
    if (userPermissions[action].includes('*')) return true;
    
    // Check for specific resource permissions
    if (userPermissions[action].includes(resource)) return true;
    
    // Check for "own" resource permissions (e.g., "own" grants access to user's own data)
    if (userPermissions[action].includes('own')) return true;
    
    // Check for resource-specific "own" permissions (e.g., "own:campaigns")
    if (userPermissions[action].some(p => p.startsWith('own:') && p.endsWith(`:${resource}`))) return true;
    
    // Check if resource is in permissions_list
    if (userPermissions.permissions_list.includes(resource)) return true;
    
    return false;
  };

  const hasAnyPermission = (action: 'read' | 'write' | 'delete', resources: string[]): boolean => {
    return resources.some(resource => hasPermission(action, resource));
  };

  const hasAllPermissions = (action: 'read' | 'write' | 'delete', resources: string[]): boolean => {
    return resources.every(resource => hasPermission(action, resource));
  };

  const canAccessSidebarItem = (item: string): boolean => {
    console.log(`PermissionContext: canAccessSidebarItem(${item}) called`);
    console.log(`PermissionContext: userRole:`, userRole);
    
    // Temporarily bypass permission check for batch-calling and campaigns to test
    if (item === 'batch-calling' || item === 'campaigns') {
      console.log(`PermissionContext: Bypassing permission check for ${item}`);
      return true;
    }
    
    if (!userRole) {
      console.log(`PermissionContext: canAccessSidebarItem(${item}): No user role`);
      return false;
    }
    
    console.log(`PermissionContext: Available sidebar items:`, userRole.sidebar_items);
    const hasAccess = userRole.sidebar_items.includes(item);
    console.log(`PermissionContext: canAccessSidebarItem(${item}): ${hasAccess} (available items: ${userRole.sidebar_items.join(', ')})`);
    return hasAccess;
  };

  const canAccessNavigationItem = (item: string): boolean => {
    if (!userRole) return false;
    return userRole.navigation_items.includes(item);
  };

  const refreshPermissions = async () => {
    setIsLoading(true);
    await fetchUserPermissions();
  };

  useEffect(() => {
    console.log('PermissionContext: useEffect triggered, fetching permissions');
    
    // Only fetch if not already fetching
    if (!isFetching) {
      fetchUserPermissions();
    }
    
    // Listen for auth changes
    const handleAuthChange = () => {
      console.log('PermissionContext: Auth change detected, refreshing permissions');
      if (!isFetching) {
        fetchUserPermissions();
      }
    };
    
    authEventTarget.addEventListener('authChanged', handleAuthChange);
    
    return () => {
      authEventTarget.removeEventListener('authChanged', handleAuthChange);
    };
  }, []); // Remove isFetching from dependencies to avoid infinite loops

  const value: PermissionContextType = {
    userPermissions,
    userRole,
    isLoading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canAccessSidebarItem,
    canAccessNavigationItem,
    refreshPermissions
  };

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
}; 