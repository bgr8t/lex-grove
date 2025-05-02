/**
 * API Client with built-in CSRF protection and token refresh
 * 
 * This module handles API requests with proper CSRF token handling,
 * authentication token inclusion, and automatic token refresh.
 */

import { auth } from './firebase';

interface RequestOptions extends RequestInit {
  requireAuth?: boolean;
  skipCsrf?: boolean;
}

interface ApiError extends Error {
  status?: number;
  shouldRefresh?: boolean;
}

/**
 * Get the current CSRF token from localStorage or meta tag
 */
const getCsrfToken = (): { token: string | null; expiry: number | null } => {
  // Try to get from localStorage first
  const storedToken = localStorage.getItem('csrfToken');
  const storedExpiry = localStorage.getItem('csrfTokenExpiry');
  
  if (storedToken && storedExpiry) {
    const expiry = parseInt(storedExpiry, 10);
    if (Date.now() < expiry) {
      return { token: storedToken, expiry };
    }
  }
  
  // Try to get from meta tag as fallback
  const metaToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
  const metaExpiry = document.querySelector('meta[name="csrf-token-expiry"]')?.getAttribute('content');
  
  if (metaToken && metaExpiry) {
    const expiry = parseInt(metaExpiry, 10);
    if (Date.now() < expiry) {
      return { token: metaToken, expiry };
    }
  }
  
  return { token: null, expiry: null };
};

/**
 * Store a new CSRF token and its expiry
 */
const storeCsrfToken = (token: string, expiry: number): void => {
  localStorage.setItem('csrfToken', token);
  localStorage.setItem('csrfTokenExpiry', expiry.toString());
  
  // Update meta tags
  let metaToken = document.querySelector('meta[name="csrf-token"]');
  let metaExpiry = document.querySelector('meta[name="csrf-token-expiry"]');
  
  if (!metaToken) {
    metaToken = document.createElement('meta');
    metaToken.setAttribute('name', 'csrf-token');
    document.head.appendChild(metaToken);
  }
  
  if (!metaExpiry) {
    metaExpiry = document.createElement('meta');
    metaExpiry.setAttribute('name', 'csrf-token-expiry');
    document.head.appendChild(metaExpiry);
  }
  
  metaToken.setAttribute('content', token);
  metaExpiry.setAttribute('content', expiry.toString());
};

/**
 * Make an API request with CSRF protection and authentication
 */
export const apiRequest = async <T = any>(url: string, options: RequestOptions = {}): Promise<T> => {
  const { 
    method = 'GET', 
    headers = {}, 
    body,
    requireAuth = false,
    skipCsrf = false,
    ...restOptions 
  } = options;
  
  // Prepare headers
  const requestHeaders: HeadersInit = {
    ...headers,
    'Content-Type': 'application/json',
  };
  
  // Add CSRF token for state-changing methods if not explicitly skipped
  if (!skipCsrf && (method === 'POST' || method === 'PUT' || method === 'DELETE' || method === 'PATCH')) {
    const { token, expiry } = getCsrfToken();
    if (token && expiry) {
      requestHeaders['X-CSRF-Token'] = token;
    } else {
      // Try to refresh CSRF token
      try {
        await refreshCsrfToken();
        const { token: newToken } = getCsrfToken();
        if (newToken) {
          requestHeaders['X-CSRF-Token'] = newToken;
        } else {
          throw new Error('Failed to obtain CSRF token');
        }
      } catch (error) {
        console.error('Error refreshing CSRF token:', error);
        throw new Error('CSRF token required but not available');
      }
    }
  }
  
  // Add authentication token if required or user is logged in
  if (requireAuth || auth.currentUser) {
    try {
      const token = await auth.currentUser?.getIdToken();
      if (token) {
        requestHeaders['Authorization'] = `Bearer ${token}`;
      } else if (requireAuth) {
        throw new Error('Authentication required but no token available');
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
      if (requireAuth) {
        throw new Error('Failed to authenticate request');
      }
    }
  }
  
  // Make the request
  try {
    const response = await fetch(url, {
      method,
      headers: requestHeaders,
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'include', // Include cookies
      ...restOptions
    });
    
    // Check for and store new CSRF token from response headers
    const newCsrfToken = response.headers.get('X-CSRF-Token');
    const newCsrfExpiry = response.headers.get('X-CSRF-Token-Expiry');
    if (newCsrfToken && newCsrfExpiry) {
      storeCsrfToken(newCsrfToken, parseInt(newCsrfExpiry, 10));
    }
    
    // Check for token refresh header
    if (response.headers.get('X-Token-Refresh') === 'true') {
      try {
        await auth.currentUser?.getIdToken(true); // Force refresh
      } catch (error) {
        console.error('Error refreshing auth token:', error);
      }
    }
    
    // Handle HTTP errors
    if (!response.ok) {
      // Try to get error details from response
      try {
        const errorData = await response.json();
        const error = new Error(errorData.message || `HTTP error ${response.status}`) as ApiError;
        error.status = response.status;
        error.shouldRefresh = errorData.shouldRefresh;
        throw error;
      } catch (jsonError) {
        const error = new Error(`HTTP error ${response.status}: ${response.statusText}`) as ApiError;
        error.status = response.status;
        throw error;
      }
    }
    
    // Check if response is empty
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      return await response.json();
    } else {
      return {} as T;
    }
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

/**
 * Request a new CSRF token from the server
 */
export const refreshCsrfToken = async (): Promise<void> => {
  try {
    const response = await fetch('/api/csrf-token', {
      method: 'GET',
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error(`Failed to refresh CSRF token: ${response.status}`);
    }
    
    const newToken = response.headers.get('X-CSRF-Token');
    const newExpiry = response.headers.get('X-CSRF-Token-Expiry');
    
    if (newToken && newExpiry) {
      storeCsrfToken(newToken, parseInt(newExpiry, 10));
    } else {
      throw new Error('Invalid CSRF token response');
    }
  } catch (error) {
    console.error('Failed to refresh CSRF token:', error);
    throw error;
  }
}; 