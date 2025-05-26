
import React from 'react';
import { Button } from '@/components/ui/button';
import { Bell, Search, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { SidebarTrigger } from '@/components/ui/sidebar';

export const Header = () => {
  return (
    <header className="border-b bg-white px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <SidebarTrigger />
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search campaigns, users..."
              className="pl-10 w-96"
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon">
            <Bell className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <User className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </header>
  );
};
