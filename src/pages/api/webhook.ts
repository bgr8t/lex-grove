import { NextApiRequest, NextApiResponse } from 'next';
import { handleStripeWebhook } from '../../api';
import Stripe from 'stripe';

// This is your Stripe CLI webhook secret for testing your webhook handler locally
const endpointSecret = 'whsec_12345';  // Replace with your webhook secret in production

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const stripe = new Stripe('***REDACTED_STRIPE_TEST_KEY***', {
    apiVersion: '2025-02-24.acacia',
  });

  const sig = req.headers['stripe-signature'] as string;

  try {
    let event;

    // Verify webhook signature
    try {
      const body = await buffer(req);
      event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
    } catch (err: any) {
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    await handleStripeWebhook(event);

    // Return a 200 response to acknowledge receipt of the event
    res.status(200).json({ received: true });
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    return res.status(500).json({ 
      error: 'Error processing webhook',
      message: error.message
    });
  }
}

// This is needed to parse the request body as a buffer for Stripe signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};

// Helper function to get the raw request body
async function buffer(req: NextApiRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];

    req.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
    });

    req.on('end', () => {
      resolve(Buffer.concat(chunks));
    });

    req.on('error', reject);
  });
} 