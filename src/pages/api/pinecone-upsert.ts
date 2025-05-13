import { NextApiRequest, NextApiResponse } from 'next';
import { Pinecone } from '@pinecone-database/pinecone';
import { requireEnvVar } from '../../utils/security';

// Initialize Pinecone client
const pinecone = new Pinecone({
  apiKey: requireEnvVar('PINECONE_API_KEY')
});

// Constants
const INDEX_NAME = requireEnvVar('PINECONE_INDEX_NAME');
const NAMESPACE = 'briefs'; // Namespace to organize vectors

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST instead.' });
  }

  try {
    const { id, values, metadata } = req.body;

    if (!id || !values || !metadata) {
      return res.status(400).json({ error: 'Missing required fields: id, values, or metadata' });
    }

    // Get the index instance
    const index = pinecone.index(INDEX_NAME);

    // Prepare the vector for upsert
    const vector = {
      id,
      values,
      metadata
    };

    // Upsert the vector
    await index.upsert([vector]);

    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to upsert vector' });
  }
} 