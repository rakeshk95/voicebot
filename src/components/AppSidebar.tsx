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
  ChevronRight
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import voxiflowLogo from '../assets/voxiflow-logo.png';

const navigationItems = [
  {
    title: 'CORE',
    items: [
      { title: 'Dashboard', url: '/', icon: LayoutDashboard },
      { title: 'Organizations', url: '/organizations', icon: Building2 },
      { title: 'Campaigns', url: '/campaigns', icon: BarChart },
      { title: 'Call History', url: '/call-history', icon: History },
    ]
  },
  {
    title: 'ANALYTICS',
    items: [
      { title: 'Users', url: '/users', icon: Users },
      // Removed Analytics (Reports) tab
    ]
  },
  {
    title: 'SYSTEM',
    items: [
      { title: 'Roles & Permissions', url: '/roles-permissions', icon: Shield },
      // Removed Settings tab
    ]
  }
];

export function AppSidebar() {
  const location = useLocation();
  const currentPath = location.pathname;

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    window.location.href = '/login';
  };

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
      <nav className="flex-1 px-4 mt-8 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 hover:scrollbar-thumb-gray-300">
        {navigationItems.map((group, index) => (
          <div key={group.title} className={index === 0 ? "" : "mt-8"}>
            <div className="mb-2">
              <h3 className="text-xs font-medium text-sidebar-muted px-2">
                {group.title}
              </h3>
            </div>
            <div className="space-y-1">
              {group.items.map((item) => (
                    <NavLink 
                  key={item.title}
                      to={item.url} 
                  className={({ isActive }) =>
                    cn(
                      "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 group relative",
                      isActive
                        ? "text-primary bg-primary/10"
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
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-sidebar-border">
        <button
          onClick={handleLogout}
          className="flex items-center px-3 py-2 text-sm font-medium text-sidebar-foreground rounded-lg hover:bg-destructive/10 hover:text-destructive w-full transition-colors duration-200 group"
        >
          <LogOut className="w-5 h-5 mr-3 text-sidebar-muted group-hover:text-destructive" />
          Logout
        </button>
      </div>
    </div>
  );
}
