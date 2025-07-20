import { Request, Response, NextFunction } from 'express';

// Extend Express session interface
declare module 'express-session' {
  interface SessionData {
    createdAt?: number;
    rotatedAt?: number;
    previousSessionId?: string;
  }
}

/**
 * Session rotation utility
 * Rotates session IDs periodically to enhance security
 */
export class SessionRotationManager {
  private rotationThreshold: number;

  constructor(rotationThresholdHours: number = 4) {
    this.rotationThreshold = rotationThresholdHours * 60 * 60 * 1000; // Convert to milliseconds
  }

  /**
   * Middleware to handle session rotation
   */
  middleware = (req: Request, res: Response, next: NextFunction): void => {
    if (!req.session) {
      return next();
    }

    const now = Date.now();
    const sessionAge = now - (req.session.createdAt || now);

    // Initialize session timestamp if not exists
    if (!req.session.createdAt) {
      req.session.createdAt = now;
    }

    // Check if session needs rotation
    if (sessionAge > this.rotationThreshold) {
      this.rotateSession(req, next);
    } else {
      next();
    }
  };

  /**
   * Rotate the session ID
   */
  private rotateSession(req: Request, next: NextFunction): void {
    if (!req.session) {
      return next();
    }

    const oldSessionId = req.session.id;
    const now = Date.now();

    // Regenerate session ID
    req.session.regenerate((err) => {
      if (err) {
        console.error('Session rotation error:', err);
        return next();
      }

      // Preserve important session data
      if (req.session) {
        req.session.createdAt = now;
        req.session.rotatedAt = now;
        req.session.previousSessionId = oldSessionId;

        // Save the rotated session
        req.session.save((saveErr) => {
          if (saveErr) {
            console.error('Session save error after rotation:', saveErr);
          } else {
            console.log(`Session rotated: ${oldSessionId} -> ${req.session?.id}`);
          }
          next();
        });
      } else {
        next();
      }
    });
  }

  /**
   * Force rotate a session (useful for security events)
   */
  forceRotate(req: Request, callback: (err?: any) => void): void {
    if (!req.session) {
      return callback(new Error('No session to rotate'));
    }

    const oldSessionId = req.session.id;
    const now = Date.now();

    req.session.regenerate((err) => {
      if (err) {
        return callback(err);
      }

      if (req.session) {
        req.session.createdAt = now;
        req.session.rotatedAt = now;
        req.session.previousSessionId = oldSessionId;

        req.session.save((saveErr) => {
          if (!saveErr) {
            console.log(`Session force-rotated: ${oldSessionId} -> ${req.session?.id}`);
          }
          callback(saveErr);
        });
      } else {
        callback(new Error('Session lost during rotation'));
      }
    });
  }

  /**
   * Get session age in milliseconds
   */
  getSessionAge(req: Request): number {
    if (!req.session?.createdAt) {
      return 0;
    }
    return Date.now() - req.session.createdAt;
  }

  /**
   * Check if session is due for rotation
   */
  isDueForRotation(req: Request): boolean {
    return this.getSessionAge(req) > this.rotationThreshold;
  }
}

// Export singleton instance
export const sessionRotationManager = new SessionRotationManager(4); // 4 hours 