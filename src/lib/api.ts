const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const apiCall = async (endpoint: string, methodOrOptions?: string | RequestInit, data?: any) => {
    const token = localStorage.getItem('adminToken');

    let options: RequestInit = {};
    
    // Handle both old signature (endpoint, method, data) and new signature (endpoint, options)
    if (typeof methodOrOptions === 'string') {
        // Old signature: apiCall(endpoint, method, data)
        options = {
            method: methodOrOptions,
            ...(data ? { body: JSON.stringify(data) } : {})
        };
    } else {
        // New signature: apiCall(endpoint, options)
        options = methodOrOptions || {};
    }

    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
    };

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        // Handle 401 specifically for authentication issues
        if (response.status === 401) {
            // Clear invalid token
            localStorage.removeItem('adminToken');
            
            // Redirect to login if not already there
            if (!window.location.pathname.includes('/login')) {
                window.location.href = '/login';
            }
            
            throw new Error('Not authorized, token failed');
        }
        
        let errorData;
        try {
            errorData = await response.json();
        } catch {
            // If response is not JSON, create a generic error
            errorData = { message: `HTTP ${response.status}: ${response.statusText}` };
        }
        
        throw new Error(errorData.message || 'Something went wrong');
    }

    return response.json();
};
