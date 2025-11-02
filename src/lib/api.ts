import { toast } from '@/components/ui/use-toast';

// Production API URL
export const API_BASE_URL = 'https://platform.voxiflow.com/api/v1';

interface ApiResponse<T> extends Response {
    json(): Promise<T>;
}

// Cache for API responses
const apiCache = new Map<string, { data: any; timestamp: number; promise?: Promise<any> }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Request deduplication
const pendingRequests = new Map<string, Promise<any>>();


export async function authorizedFetch<T>(url: string, options?: RequestInit): Promise<ApiResponse<T>> {
    const token = localStorage.getItem('authToken');
    const isFormData = options?.body instanceof FormData;

    // Build headers without forcing Content-Type for FormData
    const headers: Record<string, any> = {
        ...options?.headers,
        'Authorization': token ? `Bearer ${token}` : '',
    };
    if (!isFormData) {
        headers['Content-Type'] = 'application/json';
    }

    console.log('🔍 authorizedFetch - URL:', url);
    console.log('🔍 authorizedFetch - Token present:', !!token);
    console.log('🔍 authorizedFetch - Method:', options?.method || 'GET');
    console.log('🔍 authorizedFetch - Is FormData:', isFormData);

    const response: ApiResponse<T> = await fetch(`${API_BASE_URL}${url}`, {
        ...options,
        headers,
    });

    console.log('🔍 authorizedFetch - Response status:', response.status);

    if (response.status === 401) {
        // Keep sessions persistent: do not show toast or logout automatically.
        // Let callers handle it explicitly if needed.
        throw new Error("Unauthorized");
    }

    return response;
}

// Cached fetch function to prevent duplicate API calls
export async function cachedFetch<T>(url: string, options?: RequestInit): Promise<T> {
    const cacheKey = `${url}-${JSON.stringify(options || {})}`;
    const now = Date.now();
    
    // Check if we have a valid cached response
    const cached = apiCache.get(cacheKey);
    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
        console.log(`API Cache hit for: ${url}`);
        return cached.data;
    }
    
    // Check if there's already a pending request
    if (pendingRequests.has(cacheKey)) {
        console.log(`API Request deduplication for: ${url}`);
        return pendingRequests.get(cacheKey)!;
    }
    
    // Create new request
    const requestPromise = authorizedFetch(url, options)
        .then(response => response.json() as T)
        .then(data => {
            // Cache the successful response
            apiCache.set(cacheKey, { data, timestamp: now });
            pendingRequests.delete(cacheKey);
            return data;
        })
        .catch(error => {
            pendingRequests.delete(cacheKey);
            throw error;
        });
    
    pendingRequests.set(cacheKey, requestPromise);
    return requestPromise;
}

// Clear cache for specific endpoint or all
export function clearApiCache(url?: string) {
    if (url) {
        // Clear specific URL cache
        for (const key of apiCache.keys()) {
            if (key.startsWith(url)) {
                apiCache.delete(key);
            }
        }
    } else {
        // Clear all cache
        apiCache.clear();
    }
    console.log('API Cache cleared', url ? `for ${url}` : 'completely');
}

export const getAuthToken = (): string | null => {
    return localStorage.getItem('authToken');
};

// Enhanced fetch function for refresh operations that handles errors gracefully
export async function refreshFetch<T>(url: string, options?: RequestInit): Promise<T> {
    try {
        const response = await authorizedFetch<T>(url, options);
        return await response.json() as T;
    } catch (error) {
        // For refresh operations, we want to show the error on the current page
        // instead of redirecting to login
        if (error instanceof Error && error.message.includes('Unauthorized')) {
            console.warn('Refresh operation failed due to authentication error');
            throw new Error('Authentication failed. Please check your session and try again.');
        }
        throw error;
    }
}

// Utility to check if token is valid without making API calls
export const isTokenValid = (): boolean => {
    const token = localStorage.getItem('authToken');
    if (!token) return false;
    
    try {
        // Basic JWT token validation (check if it's not expired)
        const payload = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Math.floor(Date.now() / 1000);
        return payload.exp > currentTime;
    } catch {
        // If token is not a JWT or can't be parsed, assume it's invalid
        return false;
    }
};

// Enhanced token validation with better error handling
export const validateToken = (): { isValid: boolean; error?: string } => {
    const token = localStorage.getItem('authToken');
    if (!token) {
        return { isValid: false, error: 'No authentication token found' };
    }
    
    try {
        // Check if token is a valid JWT format
        const parts = token.split('.');
        if (parts.length !== 3) {
            return { isValid: false, error: 'Invalid token format' };
        }
        
        // Parse the payload
        const payload = JSON.parse(atob(parts[1]));
        const currentTime = Math.floor(Date.now() / 1000);
        
        // Check if token is expired
        if (payload.exp && payload.exp < currentTime) {
            return { isValid: false, error: 'Token has expired' };
        }
        
        return { isValid: true };
    } catch (error) {
        return { isValid: false, error: 'Token validation failed' };
    }
}; 