import { Request, Response, NextFunction } from 'express';
import Tokens from 'csrf';
import { requireEnvVar } from '../../utils/security';

// Create a new CSRF tokens instance
const tokens = new Tokens();

// CSRF token expiration time (1 hour)
const CSRF_TOKEN_EXPIRATION = 60 * 60 * 1000;

// Session declaration for Express
declare global {
  namespace Express {
    interface Request {
      session?: {
        csrfSecret?: string;
        csrfTokenExpiry?: number;
        [key: string]: any;
      };
    }
  }
}

/**
 * Middleware to generate a new CSRF token
 */
export const generateCsrfToken = (req: Request, res: Response, next: NextFunction) => {
  try {
    const now = Date.now();
    
    // Check if we need to generate a new token
    const shouldGenerateNewToken = !req.session?.csrfSecret || 
                                 !req.session?.csrfTokenExpiry || 
                                 now > req.session.csrfTokenExpiry;
    
    if (shouldGenerateNewToken) {
      // Generate new token
      const secret = tokens.secretSync();
      const token = tokens.create(secret);
      
      // Store the secret and expiry in the session
      if (req.session) {
        req.session.csrfSecret = secret;
        req.session.csrfTokenExpiry = now + CSRF_TOKEN_EXPIRATION;
      }
      
      // Add token to response headers
      res.header('X-CSRF-Token', token);
      res.header('X-CSRF-Token-Expiry', (now + CSRF_TOKEN_EXPIRATION).toString());
      
      // Make token available for templates
      res.locals.csrfToken = token;
    } else {
      // Use existing token
      const token = tokens.create(req.session.csrfSecret!);
      res.header('X-CSRF-Token', token);
      res.header('X-CSRF-Token-Expiry', req.session.csrfTokenExpiry.toString());
      res.locals.csrfToken = token;
    }
    
    next();
  } catch (error) {
    console.error('Error generating CSRF token:', error);
    return res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Failed to generate CSRF token'
    });
  }
};

/**
 * Middleware to verify CSRF token
 * This middleware should be used for all state-changing operations (POST, PUT, DELETE)
 */
export const verifyCsrfToken = (req: Request, res: Response, next: NextFunction) => {
  try {
    const now = Date.now();
    
    // Get token from request
    const token = req.headers['x-csrf-token'] as string || req.body?._csrf as string;
    const secret = req.session?.csrfSecret;
    const expiry = req.session?.csrfTokenExpiry;
    
    // Skip CSRF verification in development environment if configured to do so
    if (process.env.NODE_ENV === 'development' && process.env.BYPASS_CSRF === 'true') {
      console.warn('WARNING: CSRF verification bypassed in development mode');
      return next();
    }
    
    // Check if token exists and is not expired
    if (!token || !secret || !expiry || now > expiry) {
      return res.status(403).json({ 
        error: 'Forbidden',
        message: 'CSRF token missing or expired',
        shouldRefresh: true
      });
    }
    
    // Validate token
    if (!tokens.verify(secret, token)) {
      return res.status(403).json({ 
        error: 'Forbidden',
        message: 'Invalid CSRF token',
        shouldRefresh: true
      });
    }
    
    next();
  } catch (error) {
    console.error('CSRF verification error:', error);
    return res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'CSRF verification failed'
    });
  }
}; 