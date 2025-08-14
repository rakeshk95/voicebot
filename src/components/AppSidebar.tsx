import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  BarChart, 
  Activity,
  Phone,
  History,
  Building2,
  Shield,
  LogOut,
  ChevronRight,
  User,
  Cog
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { usePermissions } from '@/contexts/PermissionContext';
import voxiflowLogo from '../assets/voxiflow-logo.png';

// These mappings are no longer needed with the new organized structure

export function AppSidebar() {
  const location = useLocation();
  const currentPath = location.pathname;
  const { 
    canAccessSidebarItem, 
    userRole, 
    userPermissions, 
    isLoading 
  } = usePermissions();

  console.log('AppSidebar: Current permissions:', userPermissions);
  console.log('AppSidebar: Current user role:', userRole);
  console.log('AppSidebar: User role sidebar items:', userRole?.sidebar_items);
  console.log('AppSidebar: User role navigation items:', userRole?.navigation_items);

  // Debug: Check localStorage directly
  console.log('AppSidebar: localStorage userData:', localStorage.getItem('userData'));
  console.log('AppSidebar: localStorage userRole:', localStorage.getItem('userRole'));
  console.log('AppSidebar: localStorage authToken:', localStorage.getItem('authToken'));

  // Temporary debug display (remove after fixing)
  const debugInfo = {
    userRole: userRole,
    userPermissions: userPermissions,
    isLoading: isLoading,
    localStorageUserData: localStorage.getItem('userData'),
    localStorageUserRole: localStorage.getItem('userRole'),
    localStorageAuthToken: localStorage.getItem('authToken')
  };
  console.log('AppSidebar: Complete debug info:', debugInfo);

  // Generate sidebar items based on user permissions
  const generateSidebarItems = () => {
    if (!userRole) {
      console.log('AppSidebar: No user role, returning empty array');
      return [];
    }

    console.log('AppSidebar: Generating sidebar items for role:', userRole.name);
    console.log('AppSidebar: Available sidebar items:', userRole.sidebar_items);

    // Define sections with their items
    const sections = {
      CORE: [
        { key: 'dashboard', title: 'Dashboard', icon: LayoutDashboard, url: '/' },
        { key: 'organizations', title: 'Organizations', icon: Building2, url: '/organizations' },
        { key: 'campaigns', title: 'Campaigns', icon: BarChart, url: '/campaigns' },
        { key: 'call-history', title: 'Call History', icon: History, url: '/call-history' }
      ],
      ANALYTICS: [
        { key: 'users', title: 'Users', icon: Users, url: '/users' }
      ],
      SYSTEM: [
        { key: 'roles-permissions', title: 'Roles & Permissions', icon: Shield, url: '/roles-permissions' }
      ]
    };

    const organizedItems: Array<{
      section: string;
      items: Array<{
        title: string;
        url: string;
        icon: React.ComponentType<any>;
        permission: string;
        key: string;
      }>;
    }> = [];

    // Process each section
    Object.entries(sections).forEach(([sectionName, sectionItems]) => {
      const accessibleItems = sectionItems.filter(item => {
        const hasAccess = canAccessSidebarItem(item.key);
        console.log(`AppSidebar: Checking access for ${item.key}:`, hasAccess);
        return hasAccess;
      });

      if (accessibleItems.length > 0) {
        organizedItems.push({
          section: sectionName,
          items: accessibleItems.map(item => ({
            title: item.title,
            url: item.url,
            icon: item.icon,
            permission: item.key,
            key: item.key
          }))
        });
      }
    });

    console.log('AppSidebar: Final organized items:', organizedItems);
    return organizedItems;
  };

  const organizedSidebarItems = generateSidebarItems();
  console.log('AppSidebar: Generated organized sidebar items:', organizedSidebarItems);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    localStorage.removeItem('userRole');
    window.location.href = '/login';
  };

  // Show loading state while permissions are being fetched
  if (isLoading) {
    return (
      <div className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-sidebar-border flex flex-col z-30">
        <div className="pt-4 shrink-0">
          <div className="px-6">
            <img 
              src={voxiflowLogo} 
              alt="Voxiflow" 
              className="w-[180px] h-auto"
            />
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-sm text-gray-500">Loading permissions...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-sidebar-border flex flex-col z-30">
      {/* Logo Container */}
      <div className="pt-4 shrink-0">
        <div className="px-6">
          <img 
            src={voxiflowLogo} 
            alt="Voxiflow" 
            className="w-[180px] h-auto"
          />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 mt-4 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 hover:scrollbar-thumb-gray-300">
        {organizedSidebarItems.length > 0 ? (
          <div className="space-y-8">
            {organizedSidebarItems.map((section, index) => (
              <div key={section.section} className="space-y-3">
                {index > 0 && <Separator className="my-4" />}
                {/* Section Header */}
                <div className="px-3 py-2">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {section.section}
                  </h3>
                </div>
                
                {/* Section Items */}
                <div className="space-y-1">
                  {section.items.map((item) => (
                    <NavLink 
                      key={item.title}
                      to={item.url} 
                      className={({ isActive }) =>
                        cn(
                          "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 group relative",
                          isActive
                            ? "text-primary bg-blue-50 border-r-2 border-primary"
                            : "text-sidebar-foreground hover:text-primary hover:bg-primary/5"
                        )
                      }
                    >
                      <item.icon className={cn(
                        "w-5 h-5 mr-3 transition-colors duration-200",
                        currentPath === item.url ? "text-primary" : "text-sidebar-muted group-hover:text-primary"
                      )} />
                      {item.title}
                      {currentPath === item.url && (
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary rounded-l-full" />
                      )}
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <div className="w-8 h-8 text-sidebar-muted mb-2">
                <Shield className="w-full h-full" />
              </div>
              <p className="text-sm text-sidebar-muted">No accessible items</p>
              <p className="text-xs text-sidebar-muted mt-1">Contact administrator for access</p>
            </div>
          </div>
        )}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-sidebar-border mt-auto">
        <button
          onClick={handleLogout}
          className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-red-50 hover:text-red-600 w-full transition-colors duration-200 group"
        >
          <LogOut className="w-5 h-5 mr-3 text-gray-500 group-hover:text-red-600" />
          Logout
        </button>
      </div>
    </div>
  );
}
