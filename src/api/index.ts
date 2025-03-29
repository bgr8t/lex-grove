import Stripe from 'stripe';
import { db } from '../lib/firebase';
import { doc, setDoc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';

// Initialize Stripe with secret key
// IMPORTANT: This file should only be used in a server environment, never client-side
const stripe = new Stripe('***REDACTED_STRIPE_TEST_KEY***', {
  apiVersion: '2025-02-24.acacia',
});

/**
 * Create a checkout session for subscription
 */
export async function createCheckoutSession(userId: string, priceId: string, successUrl: string, cancelUrl: string) {
  try {
    // Get user from Firestore
    const userRef = doc(db, 'userProfiles', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }
    
    const userData = userDoc.data();
    
    // Create a customer in Stripe if the user doesn't have one
    let customerId = userData.stripeCustomerId;
    
    if (!customerId) {
      // Create a new customer
      const customer = await stripe.customers.create({
        email: userData.email,
        name: userData.displayName || 'Lex Grove User',
        metadata: {
          userId: userId,
        },
      });
      
      customerId = customer.id;
      
      // Update the user record with the Stripe customer ID
      await updateDoc(userRef, {
        stripeCustomerId: customerId,
      });
    }
    
    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId: userId,
      },
    });
    
    // Store session ID in user's record (optional, for tracking/verification)
    await updateDoc(userRef, {
      currentSessionId: session.id,
      sessionCreatedAt: Timestamp.now(),
    });
    
    return session;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
}

/**
 * Handle Stripe webhook events
 */
export async function handleStripeWebhook(event: Stripe.Event) {
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        // Extract data from session
        const userId = session.metadata?.userId;
        const customerId = session.customer as string;
        
        if (userId && customerId) {
          // Get subscription
          const subscriptions = await stripe.subscriptions.list({
            customer: customerId,
            limit: 1,
          });
          
          if (subscriptions.data.length > 0) {
            const subscription = subscriptions.data[0];
            
            // Update user's subscription status in Firestore
            const userRef = doc(db, 'userProfiles', userId);
            await updateDoc(userRef, {
              subscriptionStatus: subscription.status,
              subscriptionId: subscription.id,
              membershipStatus: 'premium',
              subscriptionPeriodEnd: Timestamp.fromMillis(subscription.current_period_end * 1000),
              updatedAt: Timestamp.now(),
            });
          }
        }
        break;
      }
      
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        
        // Find user by customer ID
        // Note: In a real implementation, you might need a more efficient way to find users by customerID
        const userRef = doc(db, 'userProfiles', subscription.metadata?.userId || '');
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          // Update subscription status
          await updateDoc(userRef, {
            subscriptionStatus: subscription.status,
            membershipStatus: subscription.status === 'active' ? 'premium' : 'free',
            subscriptionPeriodEnd: Timestamp.fromMillis(subscription.current_period_end * 1000),
            updatedAt: Timestamp.now(),
          });
        }
        break;
      }
    }
  } catch (error) {
    console.error('Error handling webhook:', error);
    throw error;
  }
}

/**
 * Check if a user has an active subscription
 */
export async function checkSubscriptionStatus(userId: string) {
  try {
    const userRef = doc(db, 'userProfiles', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return false;
    }
    
    const userData = userDoc.data();
    
    // Check if user has an active subscription
    if (userData.membershipStatus === 'premium' && userData.subscriptionStatus === 'active') {
      // Check if subscription is still valid
      if (userData.subscriptionPeriodEnd && userData.subscriptionPeriodEnd.toMillis() > Date.now()) {
        return true;
      }
      
      // If subscription has expired, update status
      if (userData.subscriptionId) {
        try {
          // Verify with Stripe
          const subscription = await stripe.subscriptions.retrieve(userData.subscriptionId);
          
          if (subscription.status === 'active') {
            // Update expiration date
            await updateDoc(userRef, {
              subscriptionPeriodEnd: Timestamp.fromMillis(subscription.current_period_end * 1000),
              updatedAt: Timestamp.now(),
            });
            return true;
          } else {
            // Update status to free
            await updateDoc(userRef, {
              membershipStatus: 'free',
              subscriptionStatus: subscription.status,
              updatedAt: Timestamp.now(),
            });
            return false;
          }
        } catch (error) {
          console.error('Error verifying subscription with Stripe:', error);
          return false;
        }
      }
    }
    
    // Check if user is a contributor (which also provides premium access)
    if (userData.membershipStatus === 'contributor' && 
        userData.contributions?.completed === true) {
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error checking subscription status:', error);
    return false;
  }
}

// Add CSRF token endpoint to the beginning of your routes
app.get('/api/csrf-token', (req, res) => {
  // Generate CSRF token
  const csrfToken = tokens.secretSync();
  
  // Store in session
  if (req.session) {
    req.session.csrfSecret = csrfToken;
  }
  
  // Return as header and in response
  res.header('X-CSRF-Token', csrfToken);
  res.json({ status: 'success' });
}); 