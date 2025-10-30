import React, { createContext, useContext, useEffect, useState } from 'react';
import { AUTH_KEYS, ENDPOINTS } from '@/auth/constants';
import { fetchWithAuth, refreshAccessToken } from '@/auth/authorizedFetch';

// Legacy keys for backward compatibility
const LEGACY_KEYS = {
  ACCESS: 'authToken',
  USER: 'userData',
  ROLE: 'userRole',
};

type User = any;
type Role = any;

type AuthContextType = {
  user: User | null;
  role: Role | null;
  hydrated: boolean;
  setAuthTokens: (access: string, refresh?: string) => void;
  clearAuth: () => void;
  refreshPermissions: () => Promise<void>;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // Local helpers
  const readStored = () => {
    try {
      // Prefer versioned keys
      const uStr = localStorage.getItem(AUTH_KEYS.USER) || localStorage.getItem(LEGACY_KEYS.USER);
      const rStr = localStorage.getItem(AUTH_KEYS.ROLE) || localStorage.getItem(LEGACY_KEYS.ROLE);
      const u = uStr ? JSON.parse(uStr) : null;
      const r = rStr ? JSON.parse(rStr) : null;
      return { user: u, role: r };
    } catch (e) {
      console.warn('Failed parsing stored auth', e);
      return { user: null, role: null };
    }
  };

  const writeStoredRole = (roleData: Role) => {
    localStorage.setItem(AUTH_KEYS.ROLE, JSON.stringify(roleData));
    try { localStorage.setItem(LEGACY_KEYS.ROLE, JSON.stringify(roleData)); } catch {}
    setRole(roleData);
  };

  const writeStoredUser = (userData: User) => {
    localStorage.setItem(AUTH_KEYS.USER, JSON.stringify(userData));
    try { localStorage.setItem(LEGACY_KEYS.USER, JSON.stringify(userData)); } catch {}
    setUser(userData);
  };

  const clearAuth = () => {
    localStorage.removeItem(AUTH_KEYS.ACCESS);
    localStorage.removeItem(AUTH_KEYS.REFRESH);
    localStorage.removeItem(AUTH_KEYS.USER);
    localStorage.removeItem(AUTH_KEYS.ROLE);
    localStorage.removeItem(LEGACY_KEYS.ACCESS);
    localStorage.removeItem(LEGACY_KEYS.USER);
    localStorage.removeItem(LEGACY_KEYS.ROLE);
    setUser(null);
    setRole(null);
  };

  const setAuthTokens = (access: string, refresh?: string) => {
    localStorage.setItem(AUTH_KEYS.ACCESS, access);
    try { localStorage.setItem(LEGACY_KEYS.ACCESS, access); } catch {}
    if (refresh) localStorage.setItem(AUTH_KEYS.REFRESH, refresh);
  };

  // permission refresh: fetch from backend and write to storage
  const refreshPermissions = async () => {
    try {
      const userJson = localStorage.getItem(AUTH_KEYS.USER) || localStorage.getItem(LEGACY_KEYS.USER);
      const u = userJson ? JSON.parse(userJson) : null;
      const userId = u?.id;
      if (!userId) return;
      const res = await fetchWithAuth(ENDPOINTS.PERMISSIONS(userId), { method: 'GET' });
      if (!res.ok) {
        console.warn('Failed to fetch permissions', res.status);
        return;
      }
      let roleData = await res.json();
      if (Array.isArray(roleData)) roleData = roleData[0];
      if (roleData) writeStoredRole(roleData);
    } catch (e) {
      console.error('refreshPermissions error', e);
    }
  };

  // Bootstrapping on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { user: storedUser, role: storedRole } = readStored();
      if (storedUser) setUser(storedUser);
      if (storedRole) setRole(storedRole);

      const access = localStorage.getItem(AUTH_KEYS.ACCESS) || localStorage.getItem(LEGACY_KEYS.ACCESS);
      const refresh = localStorage.getItem(AUTH_KEYS.REFRESH);
      if (!access && refresh) {
        const newAccess = await refreshAccessToken();
        if (!newAccess) {
          if (mounted) { clearAuth(); setHydrated(true); }
          return;
        }
      }

      const roleIncomplete = !storedRole || !storedRole.sidebar_items || !storedRole.navigation_items;
      const userId = storedUser?.id;
      if (roleIncomplete && userId) {
        try {
          const profileRes = await fetchWithAuth(ENDPOINTS.PROFILE(userId), { method: 'GET' });
          if (profileRes.ok) {
            const profile = await profileRes.json();
            if (mounted) writeStoredUser(profile);
          }
        } catch (e) { console.error('profile fetch failed', e); }
        await refreshPermissions();
      }
      if (mounted) setHydrated(true);
    })();
    return () => { mounted = false; };
  }, []);

  const value: AuthContextType = {
    user,
    role,
    hydrated,
    setAuthTokens,
    clearAuth,
    refreshPermissions,
    isAuthenticated: (!!user || !!localStorage.getItem(AUTH_KEYS.USER) || !!localStorage.getItem(LEGACY_KEYS.USER)) &&
                     (!!localStorage.getItem(AUTH_KEYS.ACCESS) || !!localStorage.getItem(LEGACY_KEYS.ACCESS)) as unknown as boolean,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};