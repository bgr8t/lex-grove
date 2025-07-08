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
  try {
    logger.info('Processing Stripe webhook event:', { type: event.type });

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        // Extract data from session
        const userId = session.metadata?.userId;
        const customerId = session.customer as string;
        
        if (!userId || !customerId) {
          logger.error('Missing userId or customerId in session', { session });
          return;
        }

        logger.info('Processing completed checkout session', { userId, customerId });
        
        // Update user's subscription status in Firestore
        const userRef = db.collection('userProfiles').doc(userId);
        await userRef.update({
          stripeCustomerId: customerId,
          membershipStatus: 'premium',
          subscriptionStatus: 'active',
          updatedAt: new Date(),
        });

        logger.info('Successfully updated user profile', { userId });
        break;
      }
      
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId;
        
        if (!userId) {
          logger.error('Missing userId in subscription metadata', { subscription });
          return;
        }

        logger.info('Processing subscription update', { 
          userId, 
          status: subscription.status 
        });
        
        // Update user's subscription status
        const userRef = db.collection('userProfiles').doc(userId);
        await userRef.update({
          subscriptionStatus: subscription.status,
          membershipStatus: subscription.status === 'active' ? 'premium' : 'contributor',
          subscriptionPeriodEnd: new Date(subscription.current_period_end * 1000),
          updatedAt: new Date(),
        });

        logger.info('Successfully updated subscription status', { 
          userId, 
          status: subscription.status 
        });
        break;
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId;
        
        if (!userId) {
          logger.error('Missing userId in subscription metadata', { subscription });
          return;
        }

        logger.info('Processing subscription deletion', { userId });
        
        // Update user status to free
        const userRef = db.collection('userProfiles').doc(userId);
        await userRef.update({
          subscriptionStatus: 'canceled',
          membershipStatus: 'contributor',
          updatedAt: new Date(),
        });

        logger.info('Successfully processed subscription deletion', { userId });
        break;
      }
      
      default:
        logger.info('Unhandled event type', { type: event.type });
        break;
    }
  } catch (error) {
    logger.error('Error handling webhook:', error);
    throw error;
  }
} 