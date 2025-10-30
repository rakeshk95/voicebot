import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Mail, Lock, Sparkles, Zap, Users, MessageSquare } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import logoImage from "@/assets/voxiflow-logo.png";
import { triggerAuthChange } from '@/contexts/PermissionContext';
import { AUTH_KEYS } from "@/auth/constants";
import { useAuth } from "@/contexts/AuthProvider";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const navigate = useNavigate();
  const { toast } = useToast();
  const { setAuthTokens } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formBody = new URLSearchParams();
      formBody.append('username', formData.email);
      formBody.append('password', formData.password);

      const response = await fetch('https://platform.voxiflow.com/backend/api/v1/auth/login', {
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
      const accessToken = data.access_token;
      const refreshToken = data.refresh_token;
      const userId = data.user_id;
      
      if (!userId || !accessToken) {
        throw new Error('Invalid response: missing user ID or access token');
      }

      setAuthTokens(accessToken, refreshToken);

      // Fetch user and role
      const userResponse = await fetch(`https://platform.voxiflow.com/backend/api/v1/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!userResponse.ok) {
        throw new Error('Failed to fetch user details');
      }

      const userData = await userResponse.json();
      localStorage.setItem(AUTH_KEYS.USER, JSON.stringify(userData));

      // Fetch role(s)
      let primaryRole = null;
      try {
        const permissionsResponse = await fetch(`https://platform.voxiflow.com/backend/api/v1/roles/user/${userId}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (permissionsResponse.ok) {
          const userRoles = await permissionsResponse.json();
          if (userRoles && userRoles.length > 0) {
            primaryRole = userRoles[0];
            let parsedPermissions = primaryRole.role_permissions;
            if (typeof parsedPermissions === 'string') {
              try { parsedPermissions = JSON.parse(parsedPermissions); } catch { parsedPermissions = primaryRole.role_permissions; }
            }
            // Minimal sidebar/navigation auto-gen (or remove if backend provides these)
            const sidebarItems = ['dashboard','call-history','campaigns','users','organizations','roles-permissions'];
            const navigationItems = ['home','dashboard','call-history','campaigns','users','organizations','roles'];
            const roleData = {
              id: primaryRole.role_id || primaryRole.id,
              name: primaryRole.role_name || primaryRole.name,
              description: primaryRole.role_description || primaryRole.description,
              permissions: parsedPermissions,
              sidebar_items: sidebarItems,
              navigation_items: navigationItems
            };
            localStorage.setItem(AUTH_KEYS.ROLE, JSON.stringify(roleData));
          }
        }
      } catch {}

      toast({
        title: "Success",
        description: "Logged in successfully",
        variant: "default",
      });

      // FULL page reload is safest to fully rehydrate context after login
      window.location.href = '/';
      
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
    <div className="h-screen w-full relative overflow-hidden">
      {/* Enhanced Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-blue-900 to-teal-900">
        {/* Animated gradient orbs - matching logo colors */}
        <div className="absolute top-0 -left-4 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-25 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-96 h-96 bg-teal-400 rounded-full mix-blend-multiply filter blur-xl opacity-25 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-cyan-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-xl opacity-15 animate-blob animation-delay-6000"></div>
        <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-sky-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-3000"></div>
        
        {/* Enhanced floating particles */}
        <div className="absolute inset-0">
          {[...Array(40)].map((_, i) => (
            <div
              key={i}
              className={`absolute w-1 h-1 rounded-full opacity-40 animate-pulse ${
                i % 4 === 0 ? 'bg-blue-300' : 
                i % 4 === 1 ? 'bg-teal-300' : 
                i % 4 === 2 ? 'bg-cyan-300' : 'bg-sky-300'
              }`}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${3 + Math.random() * 4}s`
              }}
            />
          ))}
        </div>

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-5">
          <div className="w-full h-full" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: '20px 20px'
          }}></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 h-screen flex items-center justify-center px-4 lg:px-8">
        <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-12 lg:gap-16 items-center h-full">
          
          {/* Left Side - Branding & Features */}
          <div className="hidden lg:flex flex-col justify-center space-y-6 text-white">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-teal-500 rounded-xl flex items-center justify-center shadow-xl">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-blue-100 to-teal-200 bg-clip-text text-transparent">
                    Welcome to VoxiFlow
                  </h1>
                  <div className="w-12 h-0.5 bg-gradient-to-r from-blue-400 to-teal-500 rounded-full mt-1"></div>
                </div>
              </div>
              
              <p className="text-base text-blue-100 leading-relaxed max-w-md">
                Every conversation should feel natural. Experience the future of voice communication with AI-powered intelligence.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center space-x-3 p-3 bg-white/10 rounded-lg backdrop-blur-xl border border-white/20 hover:bg-white/15 transition-all duration-300 group">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-md flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <MessageSquare className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-medium text-white text-sm">Smart Conversations</h3>
                  <p className="text-xs text-blue-200">AI-powered natural language processing</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-white/10 rounded-lg backdrop-blur-xl border border-white/20 hover:bg-white/15 transition-all duration-300 group">
                <div className="w-8 h-8 bg-gradient-to-r from-teal-400 to-sky-500 rounded-md flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Users className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-medium text-white text-sm">Team Collaboration</h3>
                  <p className="text-xs text-blue-200">Seamless multi-user workflows</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-white/10 rounded-lg backdrop-blur-xl border border-white/20 hover:bg-white/15 transition-all duration-300 group">
                <div className="w-8 h-8 bg-gradient-to-r from-cyan-400 to-indigo-500 rounded-md flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-medium text-white text-sm">Lightning Fast</h3>
                  <p className="text-xs text-blue-200">Real-time processing and responses</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="w-full max-w-md mx-auto lg:mx-0 flex flex-col justify-center">
            {/* Logo and Title */}
            <div className="flex flex-col items-center space-y-4 mb-6">
              <div className="w-52 h-auto relative group">
                {/* Integrated logo design */}
                <div className="relative bg-gradient-to-br from-white/5 via-white/10 to-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10 shadow-2xl group-hover:shadow-3xl transition-all duration-500 group-hover:scale-105">
                  <img 
                    src={logoImage}
                    alt="VoxiFlow" 
                    className="w-full h-full object-contain transition-all duration-500 group-hover:drop-shadow-2xl"
                    style={{
                      filter: 'brightness(1.1) contrast(1.2) saturate(1.3) drop-shadow(0 0 30px rgba(59, 130, 246, 0.4))',
                      mixBlendMode: 'screen'
                    }}
                  />
                </div>
                {/* Animated glow effect behind */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400/30 via-teal-500/30 to-cyan-400/30 rounded-2xl blur-xl -z-10 group-hover:blur-2xl transition-all duration-500 animate-pulse"></div>
              </div>
              <div className="text-center space-y-2">
                <h2 className="text-xl font-bold text-white">Welcome Back</h2>
                <p className="text-blue-200 text-sm">
                  Sign in to continue your journey
                </p>
                <div className="w-8 h-0.5 bg-gradient-to-r from-blue-400 to-teal-500 rounded-full mx-auto mt-1"></div>
              </div>
            </div>

            {/* Login Form */}
            <div className="bg-white/10 backdrop-blur-xl p-5 rounded-2xl shadow-2xl border border-white/20 space-y-4 relative">
              {/* Connection line from logo to form */}
              <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-px h-6 bg-gradient-to-b from-white/30 to-transparent"></div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-white font-medium text-sm">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="hello@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full pl-9 bg-white/20 border-white/30 text-white placeholder-gray-300 focus:bg-white/30 focus:border-blue-400 transition-all duration-300 h-10 rounded-lg text-sm"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-white font-medium text-sm">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full pl-9 pr-9 bg-white/20 border-white/30 text-white placeholder-gray-300 focus:bg-white/30 focus:border-blue-400 transition-all duration-300 h-10 rounded-lg text-sm"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-300 hover:text-white transition-colors duration-200"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-blue-500 to-teal-600 hover:from-blue-600 hover:to-teal-700 text-white font-semibold py-2 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none h-10 text-sm"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Signing in...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <Zap className="w-4 h-4 mr-2" />
                      Start Talking
                    </div>
                  )}
                </Button>
              </form>

              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/20"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-3 bg-transparent text-white/70">Or continue with</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full bg-white/10 border-white/30 text-white hover:bg-white/20 hover:border-white/40 transition-all duration-300 py-2 rounded-lg h-10 text-sm"
                onClick={() => {/* Google SSO logic */}}
              >
                <img
                  src="https://www.google.com/favicon.ico"
                  alt="Google"
                  className="w-4 h-4 mr-2"
                />
                Continue with Google
              </Button>
            </div>

            {/* Footer */}
            <div className="text-center mt-4">
              <p className="text-blue-200 text-xs">
                Don't have an account? 
                <span className="text-white font-medium hover:text-blue-300 cursor-pointer transition-colors duration-200 ml-1">
                  Contact your administrator
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Custom CSS for animations */}
      <style>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .animation-delay-6000 {
          animation-delay: 6s;
        }
      `}</style>
    </div>
  );
} 