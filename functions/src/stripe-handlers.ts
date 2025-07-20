import * as admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import type { Stripe } from 'stripe';
import * as logger from "firebase-functions/logger";

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = getFirestore();

export async function handleStripeWebhook(event: Stripe.Event) {
  const eventId = event.id;
  const processedEventRef = db.collection('processedStripeEvents').doc(eventId);
  const doc = await processedEventRef.get();

  if (doc.exists) {
    logger.info('Event already processed', { eventId });
    return;
  }

  try {
    logger.info('Processing Stripe webhook event:', { type: event.type, eventId });

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        // Extract and validate data from session
        const userId = session.metadata?.userId || session.client_reference_id;
        const customerId = session.customer as string;
        
        if (!userId) {
          logger.error('Missing userId in session metadata and client_reference_id', { 
            sessionId: session.id,
            metadata: session.metadata,
            client_reference_id: session.client_reference_id 
          });
          return;
        }

        if (!customerId) {
          logger.error('Missing customerId in session', { sessionId: session.id, userId });
          return;
        }

        logger.info('Processing completed checkout session', { 
          userId, 
          customerId, 
          sessionId: session.id 
        });
        
        // Use a transaction to ensure atomic updates
        await db.runTransaction(async (transaction) => {
          const userRef = db.collection('userProfiles').doc(userId);
          const userDoc = await transaction.get(userRef);
          
          if (!userDoc.exists) {
            logger.error('User profile not found', { userId });
            throw new Error(`User profile not found: ${userId}`);
          }
          
          const userData = userDoc.data();
          
          // Check if user already has an active subscription
          if (userData?.subscriptionStatus === 'active' && userData?.stripeCustomerId) {
            logger.warn('User already has active subscription', { 
              userId, 
              existingCustomerId: userData.stripeCustomerId,
              newCustomerId: customerId 
            });
            
            // Only update if it's a different customer (edge case)
            if (userData.stripeCustomerId !== customerId) {
              logger.info('Updating to new customer ID', { userId, customerId });
            } else {
              logger.info('Skipping duplicate subscription activation', { userId });
              return;
            }
          }
          
          // Update user's subscription status
          transaction.update(userRef, {
            stripeCustomerId: customerId,
            membershipStatus: 'premium',
            subscriptionStatus: 'active',
            lastCheckoutSessionId: session.id,
            subscriptionUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          
          logger.info('Successfully updated user profile in transaction', { userId });
        });

        break;
      }
      
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId;
        
        if (!userId) {
          logger.error('Missing userId in subscription metadata', { 
            subscriptionId: subscription.id,
            customerId: subscription.customer,
            metadata: subscription.metadata 
          });
          return;
        }

        logger.info('Processing subscription update', { 
          userId, 
          subscriptionId: subscription.id,
          status: subscription.status,
          customerId: subscription.customer
        });
        
        // Use transaction for atomic update
        await db.runTransaction(async (transaction) => {
          const userRef = db.collection('userProfiles').doc(userId);
          const userDoc = await transaction.get(userRef);
          
          if (!userDoc.exists) {
            logger.error('User profile not found for subscription update', { userId });
            throw new Error(`User profile not found: ${userId}`);
          }
          
          // Update user's subscription status
          transaction.update(userRef, {
            subscriptionId: subscription.id,
            subscriptionStatus: subscription.status,
            membershipStatus: subscription.status === 'active' ? 'premium' : 'contributor',
            subscriptionPeriodEnd: admin.firestore.Timestamp.fromMillis(subscription.current_period_end * 1000),
            subscriptionUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        });

        logger.info('Successfully updated subscription status', { 
          userId, 
          subscriptionId: subscription.id,
          status: subscription.status 
        });
        break;
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId;
        
        if (!userId) {
          logger.error('Missing userId in subscription metadata for deletion', { 
            subscriptionId: subscription.id,
            customerId: subscription.customer,
            metadata: subscription.metadata 
          });
          return;
        }

        logger.info('Processing subscription deletion', { 
          userId, 
          subscriptionId: subscription.id 
        });
        
        // Use transaction for atomic update
        await db.runTransaction(async (transaction) => {
          const userRef = db.collection('userProfiles').doc(userId);
          const userDoc = await transaction.get(userRef);
          
          if (!userDoc.exists) {
            logger.error('User profile not found for subscription deletion', { userId });
            throw new Error(`User profile not found: ${userId}`);
          }
          
          // Update user status to free
          transaction.update(userRef, {
            subscriptionStatus: 'canceled',
            membershipStatus: 'contributor',
            subscriptionCanceledAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        });

        logger.info('Successfully processed subscription deletion', { 
          userId, 
          subscriptionId: subscription.id 
        });
        break;
      }
      
      default:
        logger.info('Unhandled event type', { type: event.type, eventId });
        break;
    }
    
    // Mark event as processed
    await processedEventRef.set({
      eventId: event.id,
      eventType: event.type,
      processed: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    logger.info('Event processing completed successfully', { eventId, type: event.type });
    
  } catch (error) {
    logger.error('Error handling webhook:', { 
      eventId, 
      eventType: event.type, 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined 
    });
    
    // Don't mark as processed if there was an error
    // This allows Stripe to retry the webhook
    throw error;
  }
} 