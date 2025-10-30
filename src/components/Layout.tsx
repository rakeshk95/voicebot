import React, { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { AppSidebar } from './AppSidebar';

export function Layout() {
  const navigate = useNavigate();

  useEffect(() => {
    // Delay redirect until after hydration to avoid false negatives on hard refresh
    const timer = setTimeout(() => {
      const token = localStorage.getItem('authToken');
      if (!token || token === 'null' || token === 'undefined') {
        navigate('/login', { replace: true });
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen flex bg-background overflow-x-hidden">
      {/* Sidebar */}
      <AppSidebar />
      
      {/* Main Content */}
      <div className="flex-1 ml-64 flex flex-col min-h-screen overflow-x-hidden">
        <main className="flex-1 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
