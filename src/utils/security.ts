/**
 * Security utilities for handling sensitive data, environment variables, and XSS protection
 */

import xss from 'xss';
import DOMPurify from 'dompurify';

/**
 * Masks sensitive data for logging
 * @param value The sensitive value to mask
 * @param showLength Whether to show the length of the masked value
 * @returns A masked version of the value
 */
export const maskSensitiveData = (value: string | undefined | null, showLength = false): string => {
  if (!value) return 'not-configured';
  const length = value.length;
  const prefix = value.substring(0, 4);
  const suffix = value.substring(length - 4);
  return `${prefix}...${suffix}${showLength ? ` (${length} chars)` : ''}`;
};

/**
 * Requires an environment variable to be set
 * @param name The name of the environment variable
 * @param defaultValue Optional default value for development mode
 * @returns The value of the environment variable
 * @throws Error if the environment variable is not set in production
 */
export const requireEnvVar = (name: string, defaultValue?: string): string => {
  const value = import.meta.env[name];
  
  if (!value) {
    if (import.meta.env.MODE === 'development' && defaultValue) {
      console.warn(`Using default value for ${name} in development mode`);
      return defaultValue;
    }
    throw new Error(`Required environment variable ${name} is not set`);
  }
  
  return value;
};

/**
 * Logs environment variable status securely
 * @param vars Array of environment variable names to check
 * @returns Object containing the status of each variable
 */
export const checkEnvVars = (vars: string[]): Record<string, string> => {
  const status: Record<string, string> = {};
  vars.forEach(name => {
    const value = import.meta.env[name];
    status[name] = value ? 'configured' : 'not-configured';
  });
  return status;
};

/**
 * Logs sensitive data securely
 * @param data The data to log
 * @param sensitiveKeys Keys of sensitive data to mask
 */
export const secureLog = (data: Record<string, any>, sensitiveKeys: string[] = []): void => {
  if (import.meta.env.MODE !== 'development') return;
  const maskedData = { ...data };
  sensitiveKeys.forEach(key => {
    if (key in maskedData) {
      maskedData[key] = maskSensitiveData(maskedData[key]);
    }
  });
  console.log('Secure Log:', maskedData);
};

// =============================================================================
// XSS PROTECTION AND INPUT SANITIZATION
// =============================================================================

/**
 * XSS protection configuration
 */
const xssOptions = {
  whiteList: {
    // Allow basic formatting tags
    p: [],
    br: [],
    strong: [],
    b: [],
    em: [],
    i: [],
    u: [],
    h1: [],
    h2: [],
    h3: [],
    h4: [],
    h5: [],
    h6: [],
    blockquote: [],
    ul: [],
    ol: [],
    li: [],
    // Allow links with restricted attributes
    a: ['href', 'title'],
    // Allow code blocks
    code: [],
    pre: [],
    // Allow tables
    table: [],
    thead: [],
    tbody: [],
    tr: [],
    th: [],
    td: [],
  },
  stripIgnoreTag: false, // Must be false to allow onIgnoreTag to be called
  stripIgnoreTagBody: ['script', 'style', 'iframe', 'object', 'embed'],
  allowCommentTag: false,
  onIgnoreTag: (tag: string, html: string, options: any) => {
    // Log suspicious tags for monitoring
    if (import.meta.env.MODE === 'development') {
      console.warn(`XSS: Ignored potentially dangerous tag: ${tag}`);
    }
    return '';
  },
  onIgnoreTagAttr: (tag: string, name: string, value: string, isWhiteAttr: boolean) => {
    // Log suspicious attributes
    if (import.meta.env.MODE === 'development') {
      console.warn(`XSS: Ignored potentially dangerous attribute: ${name}="${value}" in tag ${tag}`);
    }
    return '';
  },
};

/**
 * Sanitizes user input to prevent XSS attacks
 * @param input The user input to sanitize
 * @param options Optional XSS options override
 * @returns Sanitized string safe for display
 */
export const sanitizeInput = (input: string | null | undefined, options?: any): string => {
  if (!input) return '';
  
  try {
    // First pass: XSS library for tag filtering
    const xssSanitized = xss(input, options || xssOptions);
    
    // Second pass: DOMPurify for additional protection (if in browser environment)
    if (typeof window !== 'undefined' && DOMPurify?.sanitize) {
      return DOMPurify.sanitize(xssSanitized, {
        ALLOWED_TAGS: ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'ul', 'ol', 'li', 'a', 'code', 'pre'],
        ALLOWED_ATTR: ['href', 'title'],
        ALLOW_DATA_ATTR: false,
        ALLOW_UNKNOWN_PROTOCOLS: false,
        RETURN_DOM: false,
        RETURN_DOM_FRAGMENT: false,
      });
    }
    
    return xssSanitized;
  } catch (error) {
    console.error('Error sanitizing input:', error);
    // Fallback: strip all HTML tags if sanitization fails
    return input.replace(/<[^>]*>/g, '');
  }
};

/**
 * Sanitizes HTML content more strictly for user-generated content
 * @param html The HTML content to sanitize
 * @returns Sanitized HTML safe for innerHTML
 */
export const sanitizeHTML = (html: string | null | undefined): string => {
  if (!html) return '';
  
  return sanitizeInput(html, {
    ...xssOptions,
    whiteList: {
      // More restrictive whitelist for HTML content
      p: [],
      br: [],
      strong: [],
      em: [],
      ul: [],
      ol: [],
      li: [],
      blockquote: [],
      code: [],
      pre: [],
    },
  });
};

/**
 * Sanitizes URLs to prevent javascript: and data: URL attacks
 * @param url The URL to sanitize
 * @returns Sanitized URL or empty string if invalid
 */
export const sanitizeUrl = (url: string | null | undefined): string => {
  if (!url) return '';
  
  const trimmedUrl = url.trim().toLowerCase();
  
  // Block dangerous protocols
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:', 'ftp:'];
  if (dangerousProtocols.some(protocol => trimmedUrl.startsWith(protocol))) {
    console.warn('XSS: Blocked dangerous URL protocol:', url);
    return '';
  }
  
  // Allow only http, https, and relative URLs
  if (trimmedUrl.startsWith('http://') || 
      trimmedUrl.startsWith('https://') || 
      trimmedUrl.startsWith('/') || 
      trimmedUrl.startsWith('./') || 
      trimmedUrl.startsWith('../') ||
      trimmedUrl.startsWith('#')) {
    return url.trim();
  }
  
  // For relative URLs without protocol, assume https if it looks like a domain
  if (trimmedUrl.includes('.') && !trimmedUrl.includes('/')) {
    return `https://${url.trim()}`;
  }
  
  return '';
};

/**
 * Validates and sanitizes origin URLs for share functionality
 * @param origin The origin URL to validate
 * @param allowedOrigins Array of allowed origin patterns
 * @returns true if origin is valid, false otherwise
 */
export const validateOrigin = (origin: string | null | undefined, allowedOrigins: string[] = []): boolean => {
  if (!origin) return false;
  
  try {
    const url = new URL(origin);
    
    // Always allow same origin
    if (typeof window !== 'undefined' && url.origin === window.location.origin) {
      return true;
    }
    
    // Check against allowed origins
    return allowedOrigins.some(allowed => {
      if (allowed === '*') return true;
      if (allowed.includes('*')) {
        const pattern = allowed.replace(/\*/g, '.*');
        return new RegExp(`^${pattern}$`).test(url.origin);
      }
      return url.origin === allowed;
    });
  } catch (error) {
    console.warn('Invalid origin URL:', origin);
    return false;
  }
};

/**
 * Canonicalizes URLs to prevent bypass attacks
 * @param url The URL to canonicalize
 * @returns Canonicalized URL
 */
export const canonicalizeUrl = (url: string): string => {
  if (!url) return '';
  
  try {
    // Handle relative URLs by creating a URL relative to current origin
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://localhost';
    const fullUrl = new URL(url, baseUrl);
    
    // Normalize the URL
    return fullUrl.toString();
  } catch (error) {
    console.warn('Error canonicalizing URL:', url, error);
    return '';
  }
};

/**
 * Sanitizes form data object by applying XSS protection to all string values
 * @param data The form data object to sanitize
 * @returns Sanitized form data
 */
export const sanitizeFormData = <T extends Record<string, any>>(data: T): T => {
  const sanitized = { ...data } as Record<string, any>;
  
  Object.keys(sanitized).forEach(key => {
    const value = sanitized[key];
    if (typeof value === 'string') {
      sanitized[key] = sanitizeInput(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item => 
        typeof item === 'string' ? sanitizeInput(item) : item
      );
    }
  });
  
  return sanitized as T;
};

/**
 * Rate limiting helper for preventing abuse
 * @param key Unique key for the rate limit (e.g., user ID, IP)
 * @param limit Maximum number of requests
 * @param windowMs Time window in milliseconds
 * @returns true if within rate limit, false if exceeded
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export const checkRateLimit = (key: string, limit: number, windowMs: number): boolean => {
  const now = Date.now();
  const record = rateLimitStore.get(key);
  
  if (!record || now > record.resetTime) {
    // First request or window expired
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (record.count >= limit) {
    return false; // Rate limit exceeded
  }
  
  record.count++;
  return true;
};