import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import Tokens from 'csrf';
import helmet from 'helmet';
import { config } from 'dotenv';
import * as admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

// Import middleware
import { verifyAuth, requirePremiumAccess, requireAdmin } from './middleware/auth';
import { searchValidator, briefValidator, profileValidator, idValidator } from './middleware/validation';
import { generateCsrfToken, verifyCsrfToken } from './middleware/csrf';

// Import API functions
import { createCheckoutSession, handleStripeWebhook, checkSubscriptionStatus } from './index';

// Initialize environment variables
config();

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    databaseURL: `https://${process.env.VITE_FIREBASE_PROJECT_ID}.firebaseio.com`
  });
}

// Get Firestore instance
const db = getFirestore();

// Create CSRF tokens instance
const tokens = new Tokens();

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(helmet()); // Security headers
app.use(express.json()); // Parse JSON requests
app.use(cookieParser()); // Parse cookies
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? 'https://your-production-domain.com' 
    : 'http://localhost:8080',
  credentials: true
}));

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Route to get CSRF token
app.get('/api/csrf-token', generateCsrfToken, (req: Request, res: Response) => {
  res.json({ status: 'success' });
});

// API Routes

// Search case briefs
app.get('/api/search', searchValidator, async (req: Request, res: Response) => {
  try {
    const query = req.query.q as string;
    const filter = (req.query.filter as string) || 'all';
    const sort = (req.query.sort as string) || 'relevant';
    const limit = parseInt(req.query.limit as string) || 20;
    
    // Get user access level - defaults to 'public' if not authenticated
    let accessLevel = 'public';
    
    // If authentication token is provided, verify it to determine access level
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split('Bearer ')[1];
        const decodedToken = await admin.auth().verifyIdToken(token);
        
        // Get user profile to check membership status
        const userDoc = await db.collection('userProfiles').doc(decodedToken.uid).get();
        const userData = userDoc.data();
        
        if (userData) {
          if (userData.membershipStatus === 'premium' || userData.membershipStatus === 'contributor') {
            accessLevel = 'premium';
          } else {
            accessLevel = 'authenticated';
          }
          
          if (userData.role === 'admin') {
            accessLevel = 'admin';
          }
        } else {
          accessLevel = 'authenticated';
        }
      } catch (err) {
        console.error('Error verifying auth token:', err);
        // Proceed with public access level
      }
    }
    
    // Call Firestore to search for briefs
    const briefsSnapshot = await db.collection('caseBriefs')
      .orderBy(sort === 'recent' ? 'createdAt' : 'viewCount', 'desc')
      .limit(limit)
      .get();
    
    const allBriefs = briefsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Filter briefs based on query and user's access level
    const results = allBriefs
      .filter(brief => {
        // Simple text search (could be replaced with more sophisticated search)
        const searchTerms = query.toLowerCase().split(' ');
        const briefText = `${brief.title} ${brief.court} ${brief.facts} ${brief.issue}`.toLowerCase();
        return searchTerms.every(term => briefText.includes(term));
      })
      .map(brief => {
        // Filter sensitive data based on access level
        if (accessLevel === 'premium' || accessLevel === 'admin') {
          return brief; // Full access
        } else if (accessLevel === 'authenticated') {
          // Limited access for authenticated users
          return {
            id: brief.id,
            title: brief.title,
            court: brief.court,
            date: brief.date,
            citation: brief.citation,
            factsPreview: brief.facts ? brief.facts.substring(0, 150) + '...' : '',
            issuePreview: brief.issue ? brief.issue.substring(0, 150) + '...' : '',
            holdingPreview: brief.holding ? brief.holding.substring(0, 150) + '...' : '',
            viewCount: brief.viewCount,
            createdAt: brief.createdAt
          };
        } else {
          // Very limited access for public users
          return {
            id: brief.id,
            title: brief.title,
            court: brief.court,
            date: brief.date,
            factsPreview: brief.facts ? brief.facts.substring(0, 100) + '...' : '',
            viewCount: brief.viewCount,
            createdAt: brief.createdAt
          };
        }
      });
    
    res.json({
      query,
      accessLevel,
      totalResults: results.length,
      results
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'An error occurred while searching' });
  }
});

// Get case brief by ID
app.get('/api/briefs/:id', idValidator, async (req: Request, res: Response) => {
  try {
    const briefId = req.params.id;
    
    // Get user access level - defaults to 'public' if not authenticated
    let accessLevel = 'public';
    let userId = null;
    
    // If authentication token is provided, verify it to determine access level
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split('Bearer ')[1];
        const decodedToken = await admin.auth().verifyIdToken(token);
        userId = decodedToken.uid;
        
        // Get user profile to check membership status
        const userDoc = await db.collection('userProfiles').doc(userId).get();
        const userData = userDoc.data();
        
        if (userData) {
          if (userData.membershipStatus === 'premium' || userData.membershipStatus === 'contributor') {
            accessLevel = 'premium';
          } else {
            accessLevel = 'authenticated';
          }
          
          if (userData.role === 'admin') {
            accessLevel = 'admin';
          }
        } else {
          accessLevel = 'authenticated';
        }
      } catch (err) {
        console.error('Error verifying auth token:', err);
        // Proceed with public access level
      }
    }
    
    // Get brief from database
    const briefDoc = await db.collection('caseBriefs').doc(briefId).get();
    
    if (!briefDoc.exists) {
      return res.status(404).json({ error: 'Brief not found' });
    }
    
    const brief = {
      id: briefDoc.id,
      ...briefDoc.data()
    };
    
    // Increment view count (don't await to improve performance)
    db.collection('caseBriefs').doc(briefId).update({
      viewCount: admin.firestore.FieldValue.increment(1)
    }).catch(err => console.error(`Error incrementing view count for brief ${briefId}:`, err));
    
    // Check if user is the owner of the brief
    const isOwner = userId && brief.userId === userId;
    
    // Filter sensitive data based on access level
    let result;
    if (isOwner || accessLevel === 'premium' || accessLevel === 'admin') {
      result = brief; // Full access
    } else if (accessLevel === 'authenticated') {
      // Limited access for authenticated users
      result = {
        id: brief.id,
        title: brief.title,
        court: brief.court,
        date: brief.date,
        citation: brief.citation,
        factsPreview: brief.facts ? brief.facts.substring(0, 150) + '...' : '',
        issuePreview: brief.issue ? brief.issue.substring(0, 150) + '...' : '',
        holdingPreview: brief.holding ? brief.holding.substring(0, 150) + '...' : '',
        viewCount: brief.viewCount,
        createdAt: brief.createdAt
      };
    } else {
      // Very limited access for public users
      result = {
        id: brief.id,
        title: brief.title,
        court: brief.court,
        date: brief.date,
        factsPreview: brief.facts ? brief.facts.substring(0, 100) + '...' : '',
        viewCount: brief.viewCount,
        createdAt: brief.createdAt
      };
    }
    
    res.json({
      accessLevel,
      isOwner,
      brief: result
    });
  } catch (error) {
    console.error('Error fetching brief:', error);
    res.status(500).json({ error: 'An error occurred while fetching the brief' });
  }
});

// Create new case brief
app.post('/api/briefs', verifyAuth, verifyCsrfToken, briefValidator, async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user.uid) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const userId = req.user.uid;
    
    // Create brief in database
    const briefData = {
      ...req.body,
      userId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      viewCount: 0
    };
    
    const briefRef = db.collection('caseBriefs').doc();
    await briefRef.set(briefData);
    
    res.status(201).json({ 
      id: briefRef.id,
      ...briefData
    });
  } catch (error) {
    console.error('Error creating brief:', error);
    res.status(500).json({ error: 'An error occurred while creating the brief' });
  }
});

// Update case brief
app.put('/api/briefs/:id', verifyAuth, verifyCsrfToken, idValidator, briefValidator, async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user.uid) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const briefId = req.params.id;
    const userId = req.user.uid;
    
    // Get brief to check ownership
    const briefDoc = await db.collection('caseBriefs').doc(briefId).get();
    
    if (!briefDoc.exists) {
      return res.status(404).json({ error: 'Brief not found' });
    }
    
    const brief = briefDoc.data();
    
    // Check if user is owner or admin
    if (brief!.userId !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You do not have permission to update this brief' });
    }
    
    // Update brief
    const updateData = {
      ...req.body,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    await db.collection('caseBriefs').doc(briefId).update(updateData);
    
    res.json({
      id: briefId,
      ...updateData
    });
  } catch (error) {
    console.error('Error updating brief:', error);
    res.status(500).json({ error: 'An error occurred while updating the brief' });
  }
});

// Delete case brief
app.delete('/api/briefs/:id', verifyAuth, verifyCsrfToken, idValidator, async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user.uid) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const briefId = req.params.id;
    const userId = req.user.uid;
    
    // Get brief to check ownership
    const briefDoc = await db.collection('caseBriefs').doc(briefId).get();
    
    if (!briefDoc.exists) {
      return res.status(404).json({ error: 'Brief not found' });
    }
    
    const brief = briefDoc.data();
    
    // Check if user is owner or admin
    if (brief!.userId !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You do not have permission to delete this brief' });
    }
    
    // Delete brief
    await db.collection('caseBriefs').doc(briefId).delete();
    
    res.json({
      success: true,
      message: 'Brief deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting brief:', error);
    res.status(500).json({ error: 'An error occurred while deleting the brief' });
  }
});

// Stripe webhook handler
app.post('/api/webhook', express.raw({ type: 'application/json' }), async (req: Request, res: Response) => {
  const signature = req.headers['stripe-signature'] as string;
  
  try {
    // Verify webhook signature
    const event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );
    
    // Handle webhook event
    await handleStripeWebhook(event);
    
    res.json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 