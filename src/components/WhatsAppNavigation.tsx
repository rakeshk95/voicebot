import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Building2, 
  MessageSquare, 
  Send,
  ChevronRight
} from 'lucide-react';

const WhatsAppNavigation: React.FC = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  const whatsappNavItems = [
    {
      title: 'Dashboard',
      href: '/whatsapp',
      icon: LayoutDashboard,
      description: 'Overview and analytics'
    },
    {
      title: 'Business Accounts',
      href: '/whatsapp/accounts',
      icon: Building2,
      description: 'Manage WhatsApp Business accounts'
    },
    {
      title: 'Campaigns',
      href: '/whatsapp/campaigns',
      icon: MessageSquare,
      description: 'Create and manage campaigns'
    },
    {
      title: 'Messages',
      href: '/whatsapp/messages',
      icon: Send,
      description: 'View and send messages'
    }
  ];

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-6 w-6 text-green-600" />
              <h2 className="text-lg font-semibold text-gray-900">WhatsApp</h2>
            </div>
            
            <nav className="flex space-x-8">
              {whatsappNavItems.map((item) => {
                const isActive = currentPath === item.href;
                return (
                  <NavLink
                    key={item.href}
                    to={item.href}
                    className={cn(
                      'flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-green-100 text-green-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                    {isActive && <ChevronRight className="h-3 w-3" />}
                  </NavLink>
                );
              })}
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppNavigation;
