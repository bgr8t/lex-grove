import express from 'express';
import cors from 'cors';
import { Pinecone } from '@pinecone-database/pinecone';
import { OpenAI } from 'openai';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { flashcardsRouter } from './src/api/flashcards.js';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: resolve(__dirname, '.env.local') });
dotenv.config({ path: resolve(__dirname, '.env') });

// Initialize Pinecone client
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY
});

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Constants
const INDEX_NAME = process.env.PINECONE_INDEX_NAME || 'lex-grove-mvp';
const NAMESPACE = 'briefs';

const app = express();
app.use(cors());
// Increase body size limit to 50MB
app.use(express.json({ limit: '50mb' }));
app.use(express.text({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Log all requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Add flashcards router
app.use('/api/flashcards', flashcardsRouter(express.Router()));

// Generate embeddings API
app.post('/api/generate-embeddings', async (req, res) => {
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
    console.log(`Input texts (truncated): ${input.map(text => text.substring(0, 50) + '...')}`);

    try {
      const embedding = await openai.embeddings.create({
        model,
        input,
        encoding_format: "float",
      });

      console.log(`Successfully generated ${embedding.data.length} embeddings`);
      console.log(`First embedding dimensions: ${embedding.data[0]?.embedding.length}`);
      
      return res.status(200).json({
        embeddings: embedding.data.map(item => item.embedding)
      });
    } catch (openaiError) {
      console.error('OpenAI API Error:', openaiError);
      return res.status(500).json({ 
        error: openaiError.message || 'Failed to generate embeddings',
        details: openaiError.toString() 
      });
    }
  } catch (error) {
    console.error('Error in generate-embeddings handler:', error);
    return res.status(500).json({ error: error.message || 'Failed to generate embeddings' });
  }
});

// Pinecone upsert API
app.post('/api/pinecone-upsert', async (req, res) => {
  try {
    console.log('Received upsert request with body:', JSON.stringify(req.body));
    
    const { id, values, metadata } = req.body;

    if (!id || !values || !metadata) {
      console.error('Missing required fields in request:', { id: !!id, values: !!values, metadata: !!metadata });
      return res.status(400).json({ error: 'Missing required fields: id, values, or metadata' });
    }

    console.log(`Upserting document ${id} to Pinecone index "${INDEX_NAME}" in namespace "${NAMESPACE}"`);
    console.log('API Key (partially redacted):', `${process.env.PINECONE_API_KEY?.substring(0, 8)}...`);
    
    // Get the index instance
    const index = pinecone.index(INDEX_NAME);
    console.log('Successfully connected to index');

    const vectorForLogging = {
      id,
      dimensions: values.length,
      metadataKeys: Object.keys(metadata),
    };
    console.log('Prepared vector for upsert:', vectorForLogging);

    try {
      await index.namespace(NAMESPACE).upsert([
        {
          id,
          values,
          metadata
        }
      ]);
      console.log('Upsert operation successful');
      return res.status(200).json({ success: true });
    } catch (upsertError) {
      console.error('Upsert operation failed with error:', upsertError);
      return res.status(500).json({ 
        error: upsertError.message || 'Failed to upsert document to Pinecone',
        details: upsertError.toString()
      });
    }
  } catch (error) {
    console.error('Error in pinecone-upsert handler:', error);
    return res.status(500).json({ error: error.message || 'Failed to upsert document to Pinecone' });
  }
});

// Pinecone query API
app.post('/api/pinecone-query', async (req, res) => {
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
  } catch (error) {
    console.error('Error querying Pinecone:', error);
    return res.status(500).json({ error: error.message || 'Failed to query Pinecone' });
  }
});

// Test route
app.get('/api/test', (req, res) => {
  res.status(200).json({ message: 'API server is running!' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
  console.log(`OpenAI API Key configured: ${!!process.env.OPENAI_API_KEY}`);
  console.log(`Pinecone API Key configured: ${!!process.env.PINECONE_API_KEY}`);
  console.log(`Pinecone Index Name: ${INDEX_NAME}`);
}); 