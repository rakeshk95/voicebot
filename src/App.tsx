import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PermissionProvider } from "./contexts/PermissionProvider";
import { AuthProvider, useAuth } from "./contexts/AuthProvider";
import { Layout } from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Campaigns from "./pages/Campaigns";
import CallHistory from "./pages/CallHistory";
import Users from "./pages/Users";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import Organizations from "./pages/Organizations";
import RolesPermissions from "./pages/RolesPermissions";
import NotFound from "./pages/NotFound";
import Login from '@/pages/Login';
import CampaignFormPage from './pages/CampaignFormPage';
import BatchCallingPage from './pages/BatchCalling';
import BatchCallingCreatePage from './pages/BatchCallingCreate';
import AgenticChat from './pages/AgenticChat';
import WhatsAppIntegration from './pages/WhatsAppIntegration';
import Integrations from './pages/Integrations';
import Templates from './pages/Templates';
import Automations from './pages/Automations';

const queryClient = new QueryClient();

// Protected Route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { hydrated, isAuthenticated } = useAuth();

  if (!hydrated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <PermissionProvider>
            <Router>
            <div className="min-h-screen overflow-x-hidden">
              <Routes>
                <Route path="/login" element={<Login />} />
                
                {/* Protected Routes */}
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <Layout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<Dashboard />} />
                  <Route path="organizations" element={<Organizations />} />
                  <Route path="campaigns" element={<Campaigns />} />
                  <Route path="campaigns/new" element={<CampaignFormPage mode="create" />} />
                  <Route path="campaigns/:id/edit" element={<CampaignFormPage mode="edit" />} />
                  <Route path="call-history" element={<CallHistory />} />
                  <Route path="batch-calling" element={<BatchCallingPage />} />
                  <Route path="batch-calling/create" element={<BatchCallingCreatePage />} />
                  <Route path="ai-chat" element={<AgenticChat />} />
                  <Route path="whatsapp" element={<WhatsAppIntegration />} />
                  <Route path="integrations" element={<Integrations />} />
                  <Route path="templates" element={<Templates />} />
                  <Route path="automations" element={<Automations />} />
                  <Route path="users" element={<Users />} />
                  <Route path="analytics" element={<Analytics />} />
                  <Route path="roles-permissions" element={<RolesPermissions />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="profile" element={<Profile />} />
                </Route>

                {/* Catch all route */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
            <Toaster />
            <Sonner />
            </Router>
          </PermissionProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
