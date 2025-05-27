
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
  SidebarGroupLabel,
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
      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' 
      : 'hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:text-blue-700 transition-all duration-200';

  return (
    <Sidebar className={`${collapsed ? 'w-16' : 'w-64'} bg-gradient-to-b from-slate-50 to-white border-r border-slate-200 shadow-lg`}>
      <div className="p-4 border-b border-slate-200 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-md">
            <Phone className="w-5 h-5 text-blue-600" />
          </div>
          {!collapsed && (
            <div>
              <h1 className="text-lg font-bold text-white">VoiceBot AI</h1>
              <p className="text-xs text-blue-100">Campaign Manager</p>
            </div>
          )}
        </div>
      </div>

      <SidebarTrigger className="m-3 bg-white border border-slate-200 hover:bg-slate-50 shadow-sm" />

      <SidebarContent className="px-3 py-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-slate-600 font-semibold text-xs uppercase tracking-wide px-3 py-2">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end 
                      className={`${getNavCls({ isActive: isActive(item.url) })} rounded-xl mx-1 px-3 py-3 flex items-center space-x-3 font-medium`}
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      {!collapsed && <span className="text-sm">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
