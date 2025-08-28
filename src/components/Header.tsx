import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { User, LogOut, Settings } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface UserData {
  name: string;
  email: string;
  avatar?: string;
}

const defaultUserData: UserData = {
  name: 'Guest',
  email: 'guest@example.com',
  avatar: ''
};

export function Header() {
  const navigate = useNavigate();
  
  const getUserData = (): UserData => {
    try {
      const storedData = localStorage.getItem('userData');
      if (!storedData) return defaultUserData;
      
      const parsedData = JSON.parse(storedData);
      return {
        name: parsedData.name || defaultUserData.name,
        email: parsedData.email || defaultUserData.email,
        avatar: parsedData.avatar || defaultUserData.avatar
      };
    } catch (error) {
      console.error('Error parsing user data:', error);
      return defaultUserData;
    }
  };

  const userData = getUserData();

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    window.location.href = '/login';
  };

  return (
    <div className="flex justify-end items-center p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:bg-accent hover:text-accent-foreground transition-colors">
            <Avatar className="h-10 w-10 border-2 border-border/50">
              <AvatarImage src={userData.avatar} alt={userData.name} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {userData.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <div className="flex items-center justify-start gap-2 p-2">
            <div className="flex flex-col space-y-1 leading-none">
              <p className="font-medium">{userData.name}</p>
              <p className="text-sm text-muted-foreground">{userData.email}</p>
            </div>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => navigate('/profile')}>
            <User className="mr-2 h-4 w-4" />
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate('/settings')}>
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="text-red-600">
            <LogOut className="mr-2 h-4 w-4" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
