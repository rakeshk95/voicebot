import { toast } from '@/components/ui/use-toast';

const API_BASE_URL = 'https://platform.voxiflow.com/backend/api/v1';

interface ApiResponse<T> extends Response {
    json(): Promise<T>;
}

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

export const getAuthToken = (): string | null => {
    return localStorage.getItem('authToken');
}; 