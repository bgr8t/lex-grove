import { Request, Response, NextFunction } from 'express';
import Tokens from 'csrf';

// Create a new CSRF tokens instance
const tokens = new Tokens();

// Session declaration for Express
declare global {
  namespace Express {
    interface Request {
      session?: {
        csrfSecret?: string;
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
    // Generate a new CSRF token or use an existing one from session
    const secret = req.session?.csrfSecret || tokens.secretSync();
    const token = tokens.create(secret);
    
    // Store the secret in the session for later verification
    if (req.session) {
      req.session.csrfSecret = secret;
    }
    
    // Add token to response headers
    res.header('X-CSRF-Token', token);
    
    // Make token available for templates
    res.locals.csrfToken = token;
    
    next();
  } catch (error) {
    console.error('Error generating CSRF token:', error);
    return res.status(500).json({ error: 'Failed to generate CSRF token' });
  }
};

/**
 * Middleware to verify CSRF token
 * This middleware should be used for all state-changing operations (POST, PUT, DELETE)
 */
export const verifyCsrfToken = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get token from request
    const token = req.headers['x-csrf-token'] as string || req.body?._csrf as string;
    const secret = req.session?.csrfSecret;
    
    // Skip CSRF verification in development environment if configured to do so
    if (process.env.NODE_ENV === 'development' && process.env.BYPASS_CSRF === 'true') {
      console.warn('WARNING: CSRF verification bypassed in development mode');
      return next();
    }
    
    // Validate token
    if (!token || !secret) {
      return res.status(403).json({ 
        error: 'CSRF token missing', 
        details: 'A valid CSRF token is required for this operation'
      });
    }
    
    if (!tokens.verify(secret, token)) {
      return res.status(403).json({ 
        error: 'CSRF token invalid', 
        details: 'The provided CSRF token is invalid or expired'
      });
    }
    
    next();
  } catch (error) {
    console.error('CSRF verification error:', error);
    return res.status(500).json({ error: 'CSRF verification failed' });
  }
}; 