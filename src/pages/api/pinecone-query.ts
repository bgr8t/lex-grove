import { NextApiRequest, NextApiResponse } from 'next';
import { Pinecone } from '@pinecone-database/pinecone';

// Initialize Pinecone client
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY || '***REDACTED_PINECONE_API_KEY***'
});

// Constants
const INDEX_NAME = process.env.PINECONE_INDEX_NAME || 'lex-grove-mvp'; // The name of your index
const NAMESPACE = 'briefs'; // Namespace to organize vectors

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST instead.' });
  }

  try {
    const { vector, topK = 5, includeMetadata = true, filter } = req.body;

    if (!vector || !Array.isArray(vector)) {
      return res.status(400).json({ error: 'Vector must be an array of numbers' });
    }

    // Get the index instance
    const index = pinecone.index(INDEX_NAME);

    // Query the namespace
    const queryResponse = await index.namespace(NAMESPACE).query({
      topK,
      vector,
      includeMetadata,
      filter
    });

    return res.status(200).json(queryResponse);
  } catch (error: any) {
    console.error('Error querying Pinecone:', error);
    return res.status(500).json({ error: error.message || 'Failed to query Pinecone' });
  }
} 