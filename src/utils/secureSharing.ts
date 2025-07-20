/**
 * Secure sharing utilities with XSS protection, origin validation, and CSRF protection
 */

import React from 'react';
import { validateOrigin, canonicalizeUrl, sanitizeInput, sanitizeUrl, checkRateLimit } from './security';
import { apiRequest } from '@/lib/apiClient';

/**
 * Configuration for allowed share origins
 */
const ALLOWED_SHARE_ORIGINS = [
  // Add your production domains here
  'https://lexgrove.com',
  'https://www.lexgrove.com',
  // Allow localhost for development
  ...(process.env.NODE_ENV === 'development' ? ['http://localhost:3000', 'http://localhost:5173'] : []),
];

/**
 * Rate limiting configuration for sharing operations
 */
const SHARE_RATE_LIMITS = {
  clipboard: { limit: 20, windowMs: 60000 }, // 20 copies per minute
  webShare: { limit: 10, windowMs: 60000 },  // 10 shares per minute
  urlShare: { limit: 5, windowMs: 60000 },   // 5 URL shares per minute
};

/**
 * Secure clipboard operations with rate limiting and validation
 */
export class SecureClipboard {
  private static getUserKey(): string {
    // Use a combination of session storage and timestamp for rate limiting
    const sessionKey = sessionStorage.getItem('clipboard-session') || Math.random().toString(36);
    if (!sessionStorage.getItem('clipboard-session')) {
      sessionStorage.setItem('clipboard-session', sessionKey);
    }
    return `clipboard_${sessionKey}`;
  }

  /**
   * Securely copy text to clipboard with validation and rate limiting
   */
  static async copyText(text: string, context: string = 'general'): Promise<boolean> {
    try {
      // Rate limiting
      const userKey = this.getUserKey();
      if (!checkRateLimit(userKey, SHARE_RATE_LIMITS.clipboard.limit, SHARE_RATE_LIMITS.clipboard.windowMs)) {
        console.warn('Clipboard copy rate limit exceeded');
        return false;
      }

      // Sanitize input
      const sanitizedText = sanitizeInput(text);
      if (!sanitizedText) {
        console.warn('Empty or invalid text provided for clipboard');
        return false;
      }

      // Check if clipboard API is available
      if (!navigator.clipboard?.writeText) {
        throw new Error('Clipboard API not available');
      }

      // Copy to clipboard
      await navigator.clipboard.writeText(sanitizedText);
      
      // Log for security monitoring (in development only)
      if (process.env.NODE_ENV === 'development') {
        console.log(`Clipboard copy successful: ${context}`);
      }
      
      return true;
    } catch (error) {
      console.error('Clipboard copy failed:', error);
      
      // Fallback: create temporary input element
      try {
        const tempInput = document.createElement('input');
        tempInput.value = sanitizeInput(text);
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
        return true;
      } catch (fallbackError) {
        console.error('Clipboard fallback failed:', fallbackError);
        return false;
      }
    }
  }

  /**
   * Securely copy citation with proper formatting
   */
  static async copyCitation(citation: string, format: string = 'unknown'): Promise<boolean> {
    const sanitizedCitation = sanitizeInput(citation);
    return this.copyText(sanitizedCitation, `citation_${format}`);
  }

  /**
   * Securely copy URL with validation
   */
  static async copyUrl(url: string, context: string = 'url'): Promise<boolean> {
    const sanitizedUrl = sanitizeUrl(url);
    if (!sanitizedUrl) {
      console.warn('Invalid URL provided for clipboard');
      return false;
    }
    
    const canonicalUrl = canonicalizeUrl(sanitizedUrl);
    return this.copyText(canonicalUrl, `url_${context}`);
  }
}

/**
 * Secure sharing operations with origin validation and CSRF protection
 */
export class SecureSharing {
  private static getUserKey(): string {
    const sessionKey = sessionStorage.getItem('share-session') || Math.random().toString(36);
    if (!sessionStorage.getItem('share-session')) {
      sessionStorage.setItem('share-session', sessionKey);
    }
    return `share_${sessionKey}`;
  }

  /**
   * Share content using Web Share API with security validation
   */
  static async shareContent(shareData: {
    title?: string;
    text?: string;
    url?: string;
  }): Promise<boolean> {
    try {
      // Rate limiting
      const userKey = this.getUserKey();
      if (!checkRateLimit(userKey, SHARE_RATE_LIMITS.webShare.limit, SHARE_RATE_LIMITS.webShare.windowMs)) {
        console.warn('Share rate limit exceeded');
        return false;
      }

      // Validate and sanitize share data
      const sanitizedData: ShareData = {};
      
      if (shareData.title) {
        sanitizedData.title = sanitizeInput(shareData.title);
      }
      
      if (shareData.text) {
        sanitizedData.text = sanitizeInput(shareData.text);
      }
      
      if (shareData.url) {
        const sanitizedUrl = sanitizeUrl(shareData.url);
        if (sanitizedUrl) {
          sanitizedData.url = canonicalizeUrl(sanitizedUrl);
        }
      }

      // Check if Web Share API is available
      if (!navigator.share) {
        throw new Error('Web Share API not available');
      }

      // Validate origin if URL is being shared
      if (sanitizedData.url) {
        const urlOrigin = new URL(sanitizedData.url).origin;
        if (!validateOrigin(urlOrigin, ALLOWED_SHARE_ORIGINS)) {
          console.warn('Share blocked: Invalid origin', urlOrigin);
          return false;
        }
      }

      await navigator.share(sanitizedData);
      return true;
    } catch (error) {
      if (error.name === 'AbortError') {
        // User cancelled the share, this is not an error
        return false;
      }
      console.error('Web share failed:', error);
      return false;
    }
  }

  /**
   * Share URL with fallback to clipboard
   */
  static async shareUrl(url: string, title?: string, text?: string): Promise<boolean> {
    const shareSuccess = await this.shareContent({ url, title, text });
    
    if (!shareSuccess) {
      // Fallback to copying URL to clipboard
      return SecureClipboard.copyUrl(url, 'share_fallback');
    }
    
    return true;
  }

  /**
   * Share article content with security validation
   */
  static async shareArticle(article: {
    title: string;
    excerpt?: string;
    url: string;
  }): Promise<boolean> {
    return this.shareContent({
      title: article.title,
      text: article.excerpt,
      url: article.url,
    });
  }
}

/**
 * Secure link generation with CSRF protection
 */
export class SecureLinkSharing {
  /**
   * Generate a secure shareable link with CSRF protection
   */
  static async generateShareLink(
    resourceType: string,
    resourceId: string,
    options: {
      expiresIn?: number; // seconds
      maxUses?: number;
      allowedOrigins?: string[];
    } = {}
  ): Promise<string | null> {
    try {
      // Rate limiting
      const userKey = `linkgen_${sessionStorage.getItem('user-session') || 'anonymous'}`;
      if (!checkRateLimit(userKey, SHARE_RATE_LIMITS.urlShare.limit, SHARE_RATE_LIMITS.urlShare.windowMs)) {
        console.warn('Share link generation rate limit exceeded');
        return null;
      }

      // Sanitize inputs
      const sanitizedResourceType = sanitizeInput(resourceType);
      const sanitizedResourceId = sanitizeInput(resourceId);
      
      if (!sanitizedResourceType || !sanitizedResourceId) {
        console.warn('Invalid resource data for share link generation');
        return null;
      }

      // Call API to generate secure share link
      const response = await apiRequest<{ shareUrl: string }>('/api/shares/generate', {
        method: 'POST',
        body: JSON.stringify({
          resourceType: sanitizedResourceType,
          resourceId: sanitizedResourceId,
          options: {
            expiresIn: options.expiresIn || 3600, // 1 hour default
            maxUses: options.maxUses || 100,
            allowedOrigins: options.allowedOrigins || ALLOWED_SHARE_ORIGINS,
          },
        }),
        requireAuth: true,
      });

      return response.shareUrl;
    } catch (error) {
      console.error('Share link generation failed:', error);
      return null;
    }
  }

  /**
   * Validate a share link before accessing
   */
  static async validateShareLink(shareToken: string): Promise<boolean> {
    try {
      const sanitizedToken = sanitizeInput(shareToken);
      if (!sanitizedToken) {
        return false;
      }

      const response = await apiRequest<{ valid: boolean }>('/api/shares/validate', {
        method: 'POST',
        body: JSON.stringify({ token: sanitizedToken }),
        skipCsrf: true, // Share links should be accessible without CSRF tokens
      });

      return response.valid;
    } catch (error) {
      console.error('Share link validation failed:', error);
      return false;
    }
  }
}

/**
 * Utility functions for secure sharing
 */
export const secureSharing = {
  // Clipboard operations
  copyText: SecureClipboard.copyText.bind(SecureClipboard),
  copyCitation: SecureClipboard.copyCitation.bind(SecureClipboard),
  copyUrl: SecureClipboard.copyUrl.bind(SecureClipboard),
  
  // Web sharing
  shareContent: SecureSharing.shareContent.bind(SecureSharing),
  shareUrl: SecureSharing.shareUrl.bind(SecureSharing),
  shareArticle: SecureSharing.shareArticle.bind(SecureSharing),
  
  // Secure link sharing
  generateShareLink: SecureLinkSharing.generateShareLink.bind(SecureLinkSharing),
  validateShareLink: SecureLinkSharing.validateShareLink.bind(SecureLinkSharing),
};

/**
 * React hook for secure sharing functionality
 */
export const useSecureSharing = () => {
  const [isSharing, setIsSharing] = React.useState(false);
  const [shareError, setShareError] = React.useState<string | null>(null);

  const handleSecureShare = React.useCallback(async (
    shareData: { title?: string; text?: string; url?: string },
    fallbackMessage?: string
  ) => {
    setIsSharing(true);
    setShareError(null);

    try {
      const success = await secureSharing.shareContent(shareData);
      
      if (!success) {
        setShareError(fallbackMessage || 'Sharing failed');
      }
      
      return success;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown sharing error';
      setShareError(errorMessage);
      return false;
    } finally {
      setIsSharing(false);
    }
  }, []);

  return {
    isSharing,
    shareError,
    handleSecureShare,
    copyText: secureSharing.copyText,
    copyCitation: secureSharing.copyCitation,
    copyUrl: secureSharing.copyUrl,
  };
};

export default secureSharing; 