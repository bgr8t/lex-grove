import { NextApiRequest, NextApiResponse } from 'next';
import { checkSubscriptionStatus } from '../../api';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const userId = req.query.userId as string;

    if (!userId) {
      return res.status(400).json({ error: 'Missing userId parameter' });
    }

    const isActive = await checkSubscriptionStatus(userId);
    return res.status(200).json({ active: isActive });
  } catch (error: any) {
    console.error('Error checking subscription status:', error);
    return res.status(500).json({ 
      error: 'Error checking subscription status',
      message: error.message
    });
  }
} 