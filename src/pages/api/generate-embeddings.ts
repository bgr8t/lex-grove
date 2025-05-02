import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

// Initialize OpenAI with server-side environment variable
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST instead.' });
  }

  try {
    console.log('Received embedding request');
    const { input, model } = req.body;

    if (!input || !Array.isArray(input)) {
      console.error('Invalid input format:', input);
      return res.status(400).json({ error: 'Input must be an array of strings' });
    }

    if (!model) {
      console.error('Model name not provided');
      return res.status(400).json({ error: 'Model name is required' });
    }

    console.log(`Generating embeddings using model: ${model}`);
    console.log(`Input texts (truncated): ${input.map((text: string) => text.substring(0, 50) + '...')}`);
    
    // Generate embeddings with OpenAI
    try {
      const embedding = await openai.embeddings.create({
        model,
        input,
        encoding_format: "float",
      });

      console.log(`Successfully generated ${embedding.data.length} embeddings`);
      console.log(`First embedding dimensions: ${embedding.data[0]?.embedding.length}`);
      
      // Return only the embedding data
      return res.status(200).json({
        embeddings: embedding.data.map(item => item.embedding)
      });
    } catch (openaiError: any) {
      console.error('OpenAI API Error:', openaiError);
      console.error('Error details:', openaiError.message);
      return res.status(500).json({ 
        error: openaiError.message || 'Failed to generate embeddings',
        details: openaiError.toString() 
      });
    }
  } catch (error: any) {
    console.error('Error in generate-embeddings handler:', error);
    return res.status(500).json({ error: error.message || 'Failed to generate embeddings' });
  }
} 