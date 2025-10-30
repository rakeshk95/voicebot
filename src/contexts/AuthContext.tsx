import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { toast } from '@/components/ui/use-toast';

type AuthContextType = {
  hydrated: boolean;
  isAuthenticated: boolean;
  token: string | null;
  logout: (opts?: { silent?: boolean }) => void;
  refreshAuthState: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const readToken = () => {
  // Prefer localStorage; fall back to sessionStorage and self-heal into localStorage
  let t = localStorage.getItem('authToken');
  if (!t || t === 'null' || t === 'undefined') {
    const s = sessionStorage.getItem('authToken');
    if (s && s !== 'null' && s !== 'undefined') {
      try { localStorage.setItem('authToken', s); } catch {}
      t = s;
    }
  }
  return t || null;
};

const isJwtExpired = (token: string | null): boolean => {
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) return true;
    return false;
  } catch {
    // Not a JWT or parse failed – treat as valid to avoid aggressive logouts
    return false;
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize token synchronously from localStorage to avoid early redirects on hard refresh
  const [token, setToken] = useState<string | null>(() => readToken());
  const [hydrated, setHydrated] = useState<boolean>(true);

  const applyTokenFromStorage = () => {
    const t = readToken();
    setToken(t);
  };

  const refreshAuthState = () => {
    applyTokenFromStorage();
  };

  const logout = (opts?: { silent?: boolean }) => {
    localStorage.removeItem('authToken');
    setToken(null);
    if (!opts?.silent) {
      toast({ title: 'Signed out', description: 'Your session has ended.' });
    }
    // Let listeners (e.g., PermissionContext) know auth changed
    window.dispatchEvent(new CustomEvent('auth:changed'));
  };

  // No-op hydration; token already read synchronously. Left for future extensibility.
  useEffect(() => {
    setHydrated(true);
  }, []);

  // Session does not expire automatically – disable auto-expiry checks
  useEffect(() => {
    // Intentionally left blank to keep sessions persistent until explicit logout
  }, []);

  // Listen to storage changes across tabs (keep token in sync)
  useEffect(() => {
    const onAuthChanged = () => {
      applyTokenFromStorage();
    };
    const onStorage = (ev: StorageEvent) => {
      if (ev.key === 'authToken') applyTokenFromStorage();
    };
    window.addEventListener('auth:changed', onAuthChanged as EventListener);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('auth:changed', onAuthChanged as EventListener);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const value = useMemo<AuthContextType>(() => ({
    hydrated,
    isAuthenticated: !!token,
    token,
    logout,
    refreshAuthState,
  }), [hydrated, token]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};


