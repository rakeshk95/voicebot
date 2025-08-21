import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import logoImage from "@/assets/voxiflow-logo.png";
import { triggerAuthChange } from '@/contexts/PermissionContext';

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formBody = new URLSearchParams();
      formBody.append('username', formData.email);
      formBody.append('password', formData.password);

      const response = await fetch('http://192.168.2.153:8001/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formBody,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Invalid credentials');
      }

      const data = await response.json();
      console.log('Login response:', data);
      
      // Extract user data and token
      const userData = data.user || data;
      const accessToken = data.access_token;
      const userId = userData?.id || userData?.user_id;
      
      console.log('Extracted user data:', userData);
      console.log('User ID:', userId);
      console.log('Access token:', accessToken);

      if (!userId || !accessToken) {
        throw new Error('Invalid response: missing user ID or access token');
      }

      // Store auth data
      localStorage.setItem('authToken', accessToken);
      localStorage.setItem('userData', JSON.stringify(userData));

      // Fetch user permissions immediately after login
      try {
        console.log('Fetching user permissions for user ID:', userId);
        const permissionsResponse = await fetch(`http://192.168.2.153:8001/api/v1/roles/user/${userId}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (permissionsResponse.ok) {
          const userRoles = await permissionsResponse.json();
          console.log('User roles fetched successfully:', userRoles);
          
          // Store user role information with proper structure
          if (userRoles && userRoles.length > 0) {
            const primaryRole = userRoles[0];
            
            // Generate sidebar and navigation items based on permissions
            const generateUIItems = (permissions: any) => {
              const sidebarItems: string[] = [];
              const navigationItems: string[] = [];

              // Always include dashboard
              sidebarItems.push('dashboard');
              navigationItems.push('home');

              // Add items based on permissions
              if (permissions.admin || (permissions.read && permissions.read.includes('users'))) {
                sidebarItems.push('users');
                navigationItems.push('users');
              }

              if (permissions.admin || (permissions.read && permissions.read.includes('campaigns'))) {
                sidebarItems.push('campaigns');
                navigationItems.push('campaigns');
              }

              if (permissions.admin || (permissions.read && permissions.read.includes('organizations'))) {
                sidebarItems.push('organizations');
                navigationItems.push('organizations');
              }

              if (permissions.admin || (permissions.read && permissions.read.includes('roles'))) {
                sidebarItems.push('roles-permissions');
                navigationItems.push('roles');
              }

              // Always include call-history for now (for testing)
              sidebarItems.push('call-history');
              navigationItems.push('call-history');
              
              // Original permission check (commented out for debugging)
              // if (permissions.admin || (permissions.read && permissions.read.includes('call_history'))) {
              //   sidebarItems.push('call-history');
              //   navigationItems.push('call-history');
              // }

              return { sidebarItems, navigationItems };
            };

            // Parse permissions and generate UI items
            let parsedPermissions = primaryRole.role_permissions;
            if (typeof parsedPermissions === 'string') {
              try {
                parsedPermissions = JSON.parse(parsedPermissions);
              } catch (e) {
                console.warn('Failed to parse permissions JSON:', e);
                parsedPermissions = primaryRole.role_permissions;
              }
            }

            const { sidebarItems, navigationItems } = generateUIItems(parsedPermissions);
            
            console.log('Login: Raw permissions:', primaryRole.role_permissions);
            console.log('Login: Parsed permissions:', parsedPermissions);
            console.log('Login: Generated sidebar items:', sidebarItems);
            console.log('Login: Generated navigation items:', navigationItems);

            // Store complete role data with proper structure
            const roleData = {
              id: primaryRole.role_id || primaryRole.id,
              name: primaryRole.role_name || primaryRole.name,
              description: primaryRole.role_description || primaryRole.description,
              permissions: parsedPermissions,
              sidebar_items: sidebarItems,
              navigation_items: navigationItems
            };

            localStorage.setItem('userRole', JSON.stringify(roleData));
            console.log('Stored role data:', roleData);
          }
        } else {
          console.warn('Failed to fetch user permissions:', permissionsResponse.status);
        }
      } catch (permissionError) {
        console.warn('Error fetching user permissions:', permissionError);
      }

      toast({
        title: "Success",
        description: "Logged in successfully",
        variant: "default",
      });

      // Navigate to dashboard
      navigate('/');
      
      // Trigger auth change event to refresh permissions in PermissionContext
      console.log('Triggering auth change event');
      triggerAuthChange();
      
    } catch (error: any) {
      console.error("Login failed:", error);
      toast({
        title: "Error",
        description: error.message || "Login failed. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen w-full flex items-center justify-center bg-gradient-to-br from-white to-[#E8F5F8] overflow-hidden">
      <div className="w-full max-w-md px-6">
        {/* Logo and Title */}
        <div className="flex flex-col items-center space-y-4 mb-6">
          <div className="w-56 h-auto relative">
            <img 
              src={logoImage}
              alt="VoxiFlow" 
              className="w-full h-full object-contain"
            />
          </div>
          <p className="text-[#0891B2] text-lg font-light">
            Every conversation should feel natural
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white p-6 rounded-2xl shadow-lg space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="hello@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-[#0891B2] hover:bg-[#0891B2]/90 text-white mt-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Signing in...
                </div>
              ) : (
                'Start Talking'
              )}
            </Button>
          </form>

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => {/* Google SSO logic */}}
          >
            <img
              src="https://www.google.com/favicon.ico"
              alt="Google"
              className="w-5 h-5 mr-2"
            />
            Google
          </Button>
        </div>
      </div>
    </div>
  );
} 