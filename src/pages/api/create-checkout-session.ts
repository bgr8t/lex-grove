import { NextApiRequest, NextApiResponse } from 'next';
import { createCheckoutSession } from '../../api';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, priceId, successUrl, cancelUrl } = req.body;

    if (!userId || !priceId || !successUrl || !cancelUrl) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const session = await createCheckoutSession(userId, priceId, successUrl, cancelUrl);
    return res.status(200).json({ id: session.id });
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    return res.status(500).json({ 
      error: 'Error creating checkout session',
      message: error.message
    });
  }
} 