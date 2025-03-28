import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';

// Initialize Stripe with the secret key from environment variables
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '***REDACTED_STRIPE_TEST_KEY_2***', {
  apiVersion: '2025-02-24.acacia', // Use the latest API version
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { priceId, userId } = req.body;
    
    // Check if price ID is valid
    if (!priceId || priceId === 'price_placeholder') {
      return res.status(400).json({
        error: 'Invalid price ID. Please add your Stripe price ID in .env.local'
      });
    }

    console.log('Creating checkout session:', {
      priceId,
      userId,
      origin: req.headers.origin
    });

    // Create a checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${req.headers.origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/`,
      client_reference_id: userId,
    });

    console.log('Session created:', session.id);
    
    // Return the session ID
    res.status(200).json({ sessionId: session.id });
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    
    // Return more detailed error information
    res.status(500).json({
      error: 'Failed to create checkout session',
      message: error.message,
      type: error.type,
      code: error.code,
      detail: error.detail
    });
  }
} 