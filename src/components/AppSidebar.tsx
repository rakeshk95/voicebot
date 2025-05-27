
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  BarChart, 
  Activity,
  Phone,
  History
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';

const navigationItems = [
  { title: 'Dashboard', url: '/', icon: LayoutDashboard },
  { title: 'Campaigns', url: '/campaigns', icon: BarChart },
  { title: 'Call History', url: '/call-history', icon: History },
  { title: 'Users', url: '/users', icon: Users },
  { title: 'Analytics', url: '/analytics', icon: Activity },
  { title: 'Settings', url: '/settings', icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const collapsed = state === 'collapsed';

  const isActive = (path: string) => currentPath === path;
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg border-l-4 border-white' 
      : 'hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:text-blue-700 hover:border-l-4 hover:border-blue-300 transition-all duration-300 transform hover:translate-x-1';

  return (
    <Sidebar 
      className="bg-gradient-to-b from-white via-slate-50 to-blue-50 border-r border-slate-200 shadow-2xl"
      collapsible="offcanvas"
    >
      <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-xl">
            <Phone className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">VoiceBot AI</h1>
            <p className="text-sm text-blue-100">Campaign Manager</p>
          </div>
        </div>
      </div>

      <SidebarTrigger className="m-4 bg-white border border-slate-200 hover:bg-slate-50 shadow-md hover:shadow-lg transition-all duration-200" />

      <SidebarContent className="px-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end 
                      className={`${getNavCls({ isActive: isActive(item.url) })} rounded-xl mx-1 px-4 py-4 flex items-center space-x-4 font-medium shadow-sm`}
                    >
                      <div className="flex-shrink-0">
                        <item.icon className="h-6 w-6" />
                      </div>
                      <span className="text-sm font-medium">{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer section */}
      <div className="mt-auto p-4 border-t border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50">
        <div className="flex items-center space-x-3 p-3 bg-white rounded-xl shadow-md">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
            <Users className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">Admin User</p>
            <p className="text-xs text-slate-500 truncate">admin@voicebot.ai</p>
          </div>
        </div>
      </div>
    </Sidebar>
  );
}
