import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Phone,
  BarChart3,
  Settings,
  Building2,
  Shield,
  History,
} from "lucide-react";

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Organizations', href: '/organizations', icon: Building2 },
  { name: 'Campaigns', href: '/campaigns', icon: Phone },
  { name: 'Call History', href: '/call-history', icon: History },
  { name: 'Users', href: '/users', icon: Users },
  { name: 'Roles & Permissions', href: '/roles-permissions', icon: Shield },
];

export function Sidebar() {
  return (
    <div className="fixed inset-y-0 left-0 w-64 bg-gray-900">
      {/* Logo */}
      <div className="flex items-center h-16 px-4 bg-gray-900">
        <div className="flex items-center flex-shrink-0 text-white px-4">
          <Phone className="h-8 w-8" />
          <span className="ml-2 text-xl font-bold">Voxiflow</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="mt-6 flex-1 space-y-1 px-3">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              cn(
                'group flex items-center px-4 py-2 text-sm font-medium rounded-lg',
                isActive
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              )
            }
          >
            <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
            {item.name}
          </NavLink>
        ))}
      </nav>

      {/* User Info */}
      <div className="absolute bottom-0 left-0 right-0 border-t border-gray-800 p-4">
        <div className="flex items-center w-full">
          <div className="flex-shrink-0">
            <div className="h-8 w-8 rounded-full bg-gray-800 flex items-center justify-center">
              <Users className="h-4 w-4 text-gray-400" />
            </div>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-white">
              {JSON.parse(localStorage.getItem('userData') || '{}')?.email || 'User'}
            </p>
            <p className="text-xs font-medium text-gray-400">View Profile</p>
          </div>
        </div>
      </div>
    </div>
  );
} 