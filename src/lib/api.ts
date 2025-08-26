import { toast } from '@/components/ui/use-toast';

const API_BASE_URL = 'http://192.168.29.119:8000/api/v1';

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
    const headers = {
        ...options?.headers,
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': options?.body instanceof FormData ? undefined : 'application/json',
    };

    const response: ApiResponse<T> = await fetch(`${API_BASE_URL}${url}`, {
        ...options,
        headers,
    });

    if (response.status === 401) {
        toast({
            title: "Session Expired",
            description: "Your session has expired. Please log in again.",
            variant: "destructive",
        });
        localStorage.removeItem('authToken');
        // Redirect to login page
        window.location.href = '/login'; // Assuming your login page is at /login
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