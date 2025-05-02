import { Request, Response, NextFunction } from 'express';
import * as admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { requireEnvVar } from '../../utils/security';

// Initialize Firebase Admin if it hasn't been initialized yet
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    // You can also use a service account key file: 
    // credential: admin.credential.cert(require('path/to/serviceAccountKey.json')),
    databaseURL: `https://${requireEnvVar('VITE_FIREBASE_PROJECT_ID')}.firebaseio.com`
  });
}

// Get Firestore instance
const adminDb = getFirestore();

// Define a custom Request type that includes user data
declare global {
  namespace Express {
    interface Request {
      user?: {
        uid: string;
        email?: string;
        membershipStatus?: 'free' | 'premium' | 'contributor';
        role?: string;
        lastTokenRefresh?: number;
      };
    }
  }
}

/**
 * Middleware to verify Firebase authentication token
 */
export const verifyAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Missing or invalid authorization header'
      });
    }
    
    const token = authHeader.split('Bearer ')[1];
    
    try {
      // Verify the token
      const decodedToken = await admin.auth().verifyIdToken(token, true); // Check for token revocation
      
      // Check token age for refresh
      const tokenAge = Date.now() - (decodedToken.iat * 1000);
      const shouldRefresh = tokenAge > 30 * 60 * 1000; // 30 minutes
      
      // Get user profile from Firestore to check membership status
      const userDoc = await adminDb.collection('userProfiles').doc(decodedToken.uid).get();
      
      // Attach user data to request object
      req.user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        membershipStatus: userDoc.exists ? userDoc.data()?.membershipStatus : 'free',
        role: userDoc.exists ? userDoc.data()?.role : 'user',
        lastTokenRefresh: shouldRefresh ? Date.now() : undefined
      };
      
      // If token needs refresh, add header to response
      if (shouldRefresh) {
        res.setHeader('X-Token-Refresh', 'true');
      }
      
      next();
    } catch (tokenError) {
      console.error('Token verification failed:', tokenError);
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Invalid or expired token',
        shouldRefresh: true
      });
    }
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'An error occurred during authentication'
    });
  }
};

/**
 * Check if user has premium or contributor access
 */
export const requirePremiumAccess = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ 
      error: 'Unauthorized',
      message: 'Authentication required'
    });
  }
  
  if (req.user.membershipStatus !== 'premium' && req.user.membershipStatus !== 'contributor') {
    return res.status(403).json({ 
      error: 'Forbidden',
      message: 'Premium or contributor access required'
    });
  }
  
  next();
};

/**
 * Check if user has admin role
 */
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ 
      error: 'Unauthorized',
      message: 'Authentication required'
    });
  }
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      error: 'Forbidden',
      message: 'Admin access required'
    });
  }
  
  next();
}; 