import { AUTH_KEYS, ENDPOINTS } from './constants';

type FetchOptions = RequestInit & { _retry?: boolean };

async function parseJSONSafe(res: Response) {
  try { return await res.json(); } catch { return null; }
}

export async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem(AUTH_KEYS.REFRESH);
  if (!refreshToken) return null;

  try {
    const res = await fetch(ENDPOINTS.REFRESH, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken })
    });
    if (!res.ok) return null;
    const data = await res.json();
    const newAccess = data.access_token || data.token || null;
    const newRefresh = data.refresh_token || null;
    if (newAccess) localStorage.setItem(AUTH_KEYS.ACCESS, newAccess);
    if (newRefresh) localStorage.setItem(AUTH_KEYS.REFRESH, newRefresh);
    return newAccess;
  } catch (err) {
    console.error('refreshAccessToken failed', err);
    return null;
  }
}

export async function fetchWithAuth(input: RequestInfo, init: FetchOptions = {}) {
  const access = localStorage.getItem(AUTH_KEYS.ACCESS);
  const headers = new Headers(init.headers || {});
  if (access) headers.set('Authorization', `Bearer ${access}`);
  headers.set('Accept', 'application/json');

  const response = await fetch(input, { ...init, headers });
  if (response.status !== 401) return response;

  // Handle 401: attempt silent refresh once
  if (init._retry) return response; // don't loop
  const newAccess = await refreshAccessToken();
  if (!newAccess) return response; // refresh failed

  // retry original request with new token
  const retryHeaders = new Headers(init.headers || {});
  retryHeaders.set('Authorization', `Bearer ${newAccess}`);
  retryHeaders.set('Accept', 'application/json');
  return fetch(input, { ...init, headers: retryHeaders, _retry: true } as any);
}