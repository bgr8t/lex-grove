import Stripe from 'stripe';
import { buffer } from 'micro';
import { NextApiRequest, NextApiResponse } from 'next';
import { updateUserSubscriptionStatus } from '@/lib/services/userProfileService';

// Initialize Stripe with server-side secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

if (!webhookSecret) {
  console.error('Missing STRIPE_WEBHOOK_SECRET environment variable');
}

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const buf = await buffer(req);
    const sig = req.headers['stripe-signature'];

    if (!sig || !webhookSecret) {
      throw new Error('Missing stripe signature or webhook secret');
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return res.status(400).json({ error: 'Webhook signature verification failed' });
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.client_reference_id;
        
        if (!userId) {
          throw new Error('Missing client_reference_id in session');
        }

        await updateUserSubscriptionStatus(userId, true);
        break;
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata.userId;
        
        if (!userId) {
          throw new Error('Missing userId in subscription metadata');
        }

        await updateUserSubscriptionStatus(userId, false);
        break;
      }
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ 
      error: 'Internal server error processing webhook',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 