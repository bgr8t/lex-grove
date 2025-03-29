/**
 * API Client with built-in CSRF protection
 * 
 * This module handles API requests with proper CSRF token handling
 * and authentication token inclusion.
 */

import { auth } from './firebase';

interface RequestOptions extends RequestInit {
  requireAuth?: boolean;
  skipCsrf?: boolean;
}

/**
 * Get the current CSRF token from localStorage or meta tag
 */
const getCsrfToken = (): string | null => {
  // Try to get from localStorage first
  const storedToken = localStorage.getItem('csrfToken');
  if (storedToken) {
    return storedToken;
  }
  
  // Try to get from meta tag as fallback
  const metaToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
  if (metaToken) {
    return metaToken;
  }
  
  return null;
};

/**
 * Store a new CSRF token
 */
const storeCsrfToken = (token: string): void => {
  localStorage.setItem('csrfToken', token);
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
    const csrfToken = getCsrfToken();
    if (csrfToken) {
      requestHeaders['X-CSRF-Token'] = csrfToken;
    } else {
      console.warn('No CSRF token available for state-changing request');
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
    if (newCsrfToken) {
      storeCsrfToken(newCsrfToken);
    }
    
    // Handle HTTP errors
    if (!response.ok) {
      // Try to get error details from response
      try {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error ${response.status}`);
      } catch (jsonError) {
        throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
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
export const refreshCsrfToken = async (): Promise<string | null> => {
  try {
    const response = await fetch('/api/csrf-token', {
      method: 'GET',
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error(`Failed to refresh CSRF token: ${response.status}`);
    }
    
    const newToken = response.headers.get('X-CSRF-Token');
    if (newToken) {
      storeCsrfToken(newToken);
      return newToken;
    }
    
    return null;
  } catch (error) {
    console.error('Failed to refresh CSRF token:', error);
    return null;
  }
}; 