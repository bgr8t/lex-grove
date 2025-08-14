/**
 * PDF Security Utilities
 * Implements additional security measures for PDF processing
 * Follows Cursor security rules: validate everything, sanitize inputs, prevent abuse
 */

export class PdfSecurityValidator {
  
  /**
   * Validate file signature (magic bytes) to ensure it's actually a PDF
   * Prevents MIME type spoofing attacks
   */
  static async validatePdfSignature(file: File): Promise<boolean> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const arr = new Uint8Array(e.target?.result as ArrayBuffer).subarray(0, 8);
          const header = Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
          
          // PDF magic bytes: %PDF (25 50 44 46)
          // Also check for common PDF versions
          const isPdf = header.toLowerCase().startsWith('25504446') || // %PDF
                       header.toLowerCase().startsWith('255044462d'); // %PDF-
          
          resolve(isPdf);
        } catch (error) {
          console.error('Error validating PDF signature:', error);
          resolve(false);
        }
      };
      
      reader.onerror = () => resolve(false);
      reader.readAsArrayBuffer(file.slice(0, 8));
    });
  }

  /**
   * Rate limiting for processing requests
   * Prevents abuse and manages API quota
   */
  static checkRateLimit(userId: string): { allowed: boolean; remainingTime?: number } {
    const key = `pdf_process_${userId}`;
    const now = Date.now();
    const window = 60000; // 1 minute window
    const maxRequests = 5; // Max 5 requests per minute

    try {
      const stored = localStorage.getItem(key);
      const requests: number[] = stored ? JSON.parse(stored) : [];
      
      // Filter recent requests within the time window
      const recentRequests = requests.filter((time: number) => now - time < window);
      
      if (recentRequests.length >= maxRequests) {
        // Calculate remaining time until oldest request expires
        const oldestRequest = Math.min(...recentRequests);
        const remainingTime = window - (now - oldestRequest);
        
        return { 
          allowed: false, 
          remainingTime: Math.ceil(remainingTime / 1000) // Convert to seconds
        };
      }

      // Add current request and store
      recentRequests.push(now);
      localStorage.setItem(key, JSON.stringify(recentRequests));
      
      return { allowed: true };
    } catch (error) {
      console.error('Error checking rate limit:', error);
      // Allow request if localStorage fails (graceful degradation)
      return { allowed: true };
    }
  }

  /**
   * Validate file content for potential security risks
   * Basic checks for malformed or suspicious PDFs
   */
  static async validateFileContent(file: File): Promise<{ isValid: boolean; reason?: string }> {
    try {
      // Check file size boundaries
      if (file.size < 100) {
        return { isValid: false, reason: 'File too small to be a valid PDF' };
      }

      if (file.size > 50 * 1024 * 1024) { // 50MB absolute limit
        return { isValid: false, reason: 'File too large for security reasons' };
      }

      // Check PDF signature
      const hasValidSignature = await this.validatePdfSignature(file);
      if (!hasValidSignature) {
        return { isValid: false, reason: 'File is not a valid PDF' };
      }

      // Additional checks could be added here:
      // - PDF version validation
      // - Embedded content scanning
      // - Password protection detection

      return { isValid: true };
    } catch (error) {
      console.error('Error validating file content:', error);
      return { isValid: false, reason: 'Unable to validate file' };
    }
  }

  /**
   * Sanitize filename to prevent path traversal and other attacks
   * Ensures safe file handling
   */
  static sanitizeFilename(filename: string): string {
    return filename
      .replace(/[<>:"/\\|?*\x00-\x1f]/g, '') // Remove dangerous characters
      .replace(/^\.+/, '') // Remove leading dots
      .replace(/\.+$/, '') // Remove trailing dots
      .substring(0, 255) // Limit length
      .trim();
  }

  /**
   * Check if user has sufficient permissions for PDF processing
   * Can be extended to include subscription checks, user roles, etc.
   */
  static async validateUserPermissions(userId: string): Promise<{ allowed: boolean; reason?: string }> {
    try {
      // Basic authentication check
      if (!userId) {
        return { allowed: false, reason: 'User not authenticated' };
      }

      // Check rate limiting
      const rateLimit = this.checkRateLimit(userId);
      if (!rateLimit.allowed) {
        return { 
          allowed: false, 
          reason: `Rate limit exceeded. Try again in ${rateLimit.remainingTime} seconds.`
        };
      }

      // Additional permission checks could be added here:
      // - Subscription status
      // - User role validation
      // - Feature flags

      return { allowed: true };
    } catch (error) {
      console.error('Error validating user permissions:', error);
      return { allowed: false, reason: 'Unable to validate permissions' };
    }
  }

  /**
   * Comprehensive security validation for PDF uploads
   * Combines all security checks into one convenient method
   */
  static async performSecurityValidation(
    file: File, 
    userId: string
  ): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];

    try {
      // Validate user permissions
      const permissionCheck = await this.validateUserPermissions(userId);
      if (!permissionCheck.allowed) {
        errors.push(permissionCheck.reason || 'Permission denied');
      }

      // Validate file content
      const contentCheck = await this.validateFileContent(file);
      if (!contentCheck.isValid) {
        errors.push(contentCheck.reason || 'Invalid file content');
      }

      // Validate filename
      const sanitizedName = this.sanitizeFilename(file.name);
      if (sanitizedName !== file.name) {
        console.warn('Filename was sanitized:', { original: file.name, sanitized: sanitizedName });
      }

      return {
        isValid: errors.length === 0,
        errors
      };
    } catch (error) {
      console.error('Error during security validation:', error);
      return {
        isValid: false,
        errors: ['Security validation failed']
      };
    }
  }

  /**
   * Clear rate limiting data for a user (admin function)
   */
  static clearRateLimit(userId: string): void {
    try {
      const key = `pdf_process_${userId}`;
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error clearing rate limit:', error);
    }
  }

  /**
   * Get remaining rate limit quota for a user
   */
  static getRateLimitStatus(userId: string): { remaining: number; resetTime: number } {
    try {
      const key = `pdf_process_${userId}`;
      const now = Date.now();
      const window = 60000; // 1 minute
      const maxRequests = 5;

      const stored = localStorage.getItem(key);
      const requests: number[] = stored ? JSON.parse(stored) : [];
      
      const recentRequests = requests.filter((time: number) => now - time < window);
      const remaining = Math.max(0, maxRequests - recentRequests.length);
      
      const resetTime = recentRequests.length > 0 
        ? Math.min(...recentRequests) + window 
        : now;

      return { remaining, resetTime };
    } catch (error) {
      console.error('Error getting rate limit status:', error);
      return { remaining: 5, resetTime: Date.now() };
    }
  }
}

/**
 * Browser capability detection for PDF processing
 * Ensures the user's browser supports required features
 */
export class BrowserCapabilityChecker {
  
  /**
   * Check if browser supports required APIs
   */
  static checkSupport(): { isSupported: boolean; missingFeatures: string[] } {
    const missingFeatures: string[] = [];

    // Check FileReader API
    if (typeof FileReader === 'undefined') {
      missingFeatures.push('FileReader API');
    }

    // Check fetch API
    if (typeof fetch === 'undefined') {
      missingFeatures.push('Fetch API');
    }

    // Check localStorage
    try {
      localStorage.setItem('test', 'test');
      localStorage.removeItem('test');
    } catch {
      missingFeatures.push('LocalStorage');
    }

    // Check ArrayBuffer support
    if (typeof ArrayBuffer === 'undefined') {
      missingFeatures.push('ArrayBuffer');
    }

    return {
      isSupported: missingFeatures.length === 0,
      missingFeatures
    };
  }

  /**
   * Get browser performance recommendations
   */
  static getPerformanceRecommendations(): string[] {
    const recommendations: string[] = [];

    // Check available memory (if supported)
    if ('memory' in performance && (performance as any).memory) {
      const memory = (performance as any).memory;
      if (memory.usedJSHeapSize > memory.jsHeapSizeLimit * 0.8) {
        recommendations.push('High memory usage detected - consider refreshing the page');
      }
    }

    // Check connection speed (if supported)
    if ('connection' in navigator && (navigator as any).connection) {
      const connection = (navigator as any).connection;
      if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
        recommendations.push('Slow network detected - PDF processing may take longer');
      }
    }

    return recommendations;
  }
}
