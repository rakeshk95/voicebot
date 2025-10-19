import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
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
  Cog,
  PhoneCall,
  MessageCircle,
  Plug,
  FileText,
  Zap,
  Sparkles,
  ChevronDown
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePermissions } from '@/contexts/PermissionContext';
import { refreshUserPermissions } from '@/utils/refreshPermissions';
import voxiflowLogo from '../assets/voxiflow-logo.png';

// These mappings are no longer needed with the new organized structure

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const { 
    canAccessSidebarItem, 
    userRole, 
    userPermissions, 
    isLoading 
  } = usePermissions();

  // State for collapsible sections
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'CORE': true,
    'MASTERS': false,
    'AI_TOOLS': false,
    'INTEGRATIONS': false,
    'CONTENT': false,
    'SYSTEM': false
  });

  const toggleSection = (sectionName: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionName]: !prev[sectionName]
    }));
  };

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

  // Helper function to generate items for a specific role
  const generateItemsForRole = (role: any) => {
    // Define sections with their items
    const sections = {
      CORE: [
        { key: 'dashboard', title: 'Dashboard', icon: LayoutDashboard, url: '/' },
        { key: 'campaigns', title: 'Campaigns', icon: BarChart, url: '/campaigns' },
        { key: 'call-history', title: 'Call History', icon: History, url: '/call-history' },
        { key: 'batch-calling', title: 'Batch Calling', icon: PhoneCall, url: '/batch-calling' }
      ],
      MASTERS: [
        { key: 'users', title: 'Users', icon: Users, url: '/users' },
        { key: 'organizations', title: 'Organizations', icon: Building2, url: '/organizations' },
        { key: 'roles-permissions', title: 'Roles & Permissions', icon: Shield, url: '/roles-permissions' }
      ],
      AI_TOOLS: [
        { key: 'ai-chat', title: 'AI Chat', icon: MessageCircle, url: '/ai-chat' },
        { key: 'automations', title: 'Automations', icon: Zap, url: '/automations' }
      ],
      INTEGRATIONS: [
        { key: 'whatsapp', title: 'WhatsApp', icon: MessageCircle, url: '/whatsapp' },
        { key: 'integrations', title: 'Integrations', icon: Plug, url: '/integrations' }
      ],
      CONTENT: [
        { key: 'templates', title: 'Templates', icon: FileText, url: '/templates' }
      ],
      SYSTEM: [
        { key: 'settings', title: 'Settings', icon: Settings, url: '/settings' }
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
        // For superuser, show everything
        if (role.name === 'superuser') {
          return true;
        }
        
        // Check if item is in role's sidebar_items
        const hasAccess = role.sidebar_items && role.sidebar_items.includes(item.key);
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

    console.log('AppSidebar: Final organized items for role:', organizedItems);
    return organizedItems;
  };

  // Generate sidebar items based on user permissions
  const generateSidebarItems = () => {
    if (!userRole) {
      console.log('AppSidebar: No user role, returning empty array');
      return [];
    }

    console.log('AppSidebar: Generating sidebar items for role:', userRole.name);
    console.log('AppSidebar: Available sidebar items:', userRole.sidebar_items);
    
    // Use the helper function for normal role processing
    return generateItemsForRole(userRole);
  };

  const organizedSidebarItems = generateSidebarItems();
  console.log('AppSidebar: Generated organized sidebar items:', organizedSidebarItems);

  // Get user data from localStorage
  const userData = localStorage.getItem('userData') 
    ? JSON.parse(localStorage.getItem('userData') || '{}')
    : { name: 'Guest', email: 'guest@example.com' };

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
    <div className="fixed left-0 top-0 h-screen w-64 bg-gradient-to-b from-white via-slate-50/50 to-gray-100/30 border-r border-gray-200/50 shadow-xl flex flex-col z-30">
      {/* Logo Container */}
      <div className="pt-4 shrink-0">
        <div className="px-6 pb-4 border-b border-gray-200/30">
          <div className="flex items-center">
            <img 
              src={voxiflowLogo} 
              alt="Voxiflow" 
              className="w-[140px] h-auto"
            />
          </div>
          <p className="text-xs text-gray-500 mt-2 font-medium">
            Every conversation should feel natural
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 mt-4">
        {organizedSidebarItems.length > 0 ? (
          <div className="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent pr-1">
            {organizedSidebarItems.map((section, index) => (
              <div key={section.section} className="space-y-1">
                {index > 0 && <Separator className="my-2 bg-gray-200/50" />}
                
                {/* Collapsible Section Header */}
                <button
                  onClick={() => toggleSection(section.section)}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold text-gray-600 uppercase tracking-wider bg-gray-100/50 hover:bg-gray-200/50 rounded-md transition-all duration-200 group"
                >
                  <span>{section.section.replace('_', ' ')}</span>
                  {expandedSections[section.section] ? (
                    <ChevronDown className="h-3 w-3 text-gray-500 group-hover:text-gray-700 transition-colors" />
                  ) : (
                    <ChevronRight className="h-3 w-3 text-gray-500 group-hover:text-gray-700 transition-colors" />
                  )}
                </button>
                
                {/* Collapsible Section Items */}
                {expandedSections[section.section] && (
                  <div className="space-y-1 ml-2">
                    {section.items.map((item) => (
                      <NavLink 
                        key={item.title}
                        to={item.url} 
                        className={({ isActive }) =>
                          cn(
                            "flex items-center px-3 py-2 text-sm font-medium rounded-xl transition-all duration-300 group relative overflow-hidden",
                            isActive
                              ? "text-white bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/25 border border-blue-500/20"
                              : "text-gray-700 hover:text-gray-900 hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50/30 hover:shadow-sm border border-transparent hover:border-gray-200/50"
                          )
                        }
                        // PERFORMANCE FIX: Prevent multiple navigation triggers
                        onClick={(e) => {
                          // Add small delay to prevent rapid navigation
                          if (e.currentTarget.getAttribute('aria-current') === 'page') {
                            e.preventDefault();
                            return;
                          }
                        }}
                      >
                        <item.icon className={cn(
                          "w-4 h-4 mr-3 transition-all duration-300",
                          currentPath === item.url 
                            ? "text-white scale-110" 
                            : "text-gray-500 group-hover:text-blue-600 group-hover:scale-105"
                        )} />
                        <span className="font-medium">{item.title}</span>
                        {currentPath === item.url && (
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full shadow-sm" />
                        )}
                        {/* Hover effect overlay */}
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-indigo-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-24">
            <div className="text-center">
              <div className="w-6 h-6 text-sidebar-muted mb-2">
                <Shield className="w-full h-full" />
              </div>
              <p className="text-xs text-sidebar-muted">No accessible items</p>
              <p className="text-xs text-sidebar-muted mt-1">Contact administrator for access</p>
            </div>
          </div>
        )}
      </nav>

      {/* Profile Section */}
      <div className="p-4 border-t border-gray-200/50 mt-auto bg-gradient-to-r from-gray-50/50 to-blue-50/30">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              className="w-full flex items-center justify-between p-3 hover:bg-white/80 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md border border-gray-200/50 hover:border-blue-200/50"
            >
              <div className="flex items-center space-x-3">
                <Avatar className="h-9 w-9 border-2 border-white shadow-md">
                  <AvatarImage src={userData.avatar} alt={userData.name} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-sm">
                    {userData.name?.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start">
                  <span className="text-sm font-semibold text-gray-900 truncate max-w-[120px]">
                    {userData.name || 'User'}
                  </span>
                  <span className="text-xs text-gray-500 truncate max-w-[120px]">
                    {userData.email || 'user@example.com'}
                  </span>
                </div>
              </div>
              <ChevronDown className="h-4 w-4 text-gray-400 hover:text-gray-600 transition-colors" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-64 ml-4 mt-2 shadow-xl border border-gray-200/50 bg-white/95 backdrop-blur-sm" align="end" side="top" forceMount>
            <div className="flex items-center justify-start gap-3 p-4 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 border-b border-gray-200/50">
              <Avatar className="h-12 w-12 border-2 border-white shadow-lg">
                <AvatarImage src={userData.avatar} alt={userData.name} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold">
                  {userData.name?.charAt(0)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col space-y-1 leading-none">
                <p className="font-semibold text-gray-900">{userData.name || 'User'}</p>
                <p className="text-xs text-gray-500">{userData.email || 'user@example.com'}</p>
                <div className="flex items-center gap-1 mt-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-green-600 font-medium">Online</span>
                </div>
              </div>
            </div>
            <div className="p-1">
              <DropdownMenuItem onClick={() => navigate('/profile')} className="cursor-pointer hover:bg-blue-50/50 rounded-lg mx-1 my-0.5">
                <User className="mr-3 h-4 w-4 text-blue-600" />
                <span className="font-medium">Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/settings')} className="cursor-pointer hover:bg-blue-50/50 rounded-lg mx-1 my-0.5">
                <Settings className="mr-3 h-4 w-4 text-gray-600" />
                <span className="font-medium">Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-2" />
              <DropdownMenuItem onClick={refreshUserPermissions} className="text-blue-600 cursor-pointer hover:bg-blue-50/50 rounded-lg mx-1 my-0.5 focus:text-blue-600">
                <Shield className="mr-3 h-4 w-4" />
                <span className="font-medium">Refresh Permissions</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer hover:bg-red-50/50 rounded-lg mx-1 my-0.5 focus:text-red-600">
                <LogOut className="mr-3 h-4 w-4" />
                <span className="font-medium">Log out</span>
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
