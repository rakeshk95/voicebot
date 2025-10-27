import { toast } from '@/components/ui/use-toast';

const API_BASE_URL = 'http://localhost:8000/api/v1';

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
        // Check if we have a token - if not, don't redirect (might be intentional)
        const token = localStorage.getItem('authToken');
        if (token) {
            console.warn('Received 401 response with valid token - session may have expired');
            
            // Only redirect if we're not already on the login page and not in a batch calling context
            if (!window.location.pathname.includes('/login')) {
                // Add a small delay to prevent rapid redirects
                setTimeout(() => {
                    toast({
                        title: "Session Expired",
                        description: "Your session has expired. Please log in again.",
                        variant: "destructive",
                    });
                    localStorage.removeItem('authToken');
                    window.location.href = '/login';
                }, 100);
            }
        }
        throw new Error("Unauthorized"); // Prevent further processing
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
        .then(response => response.json())
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