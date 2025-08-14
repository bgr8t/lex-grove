import express from 'express';
import cors from 'cors';
import formidable from 'formidable';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));

// Parse JSON for most routes
app.use(express.json({ limit: '1mb' }));

// Simple route to test server is working
app.get('/api/test', (req, res) => {
  res.json({ message: 'API server is running', timestamp: new Date().toISOString() });
});

// Import the summarize-brief handler directly - simplified approach
app.post('/api/summarize-brief', async (req, res) => {
  try {
    // Import the handler using require and ts-node
    const ts = await import('ts-node/esm/transpile-only.mjs');
    const { createRequire } = await import('module');
    const require = createRequire(import.meta.url);
    
    // Register TypeScript
    require('ts-node').register({
      transpileOnly: true,
      compilerOptions: {
        module: 'commonjs'
      }
    });
    
    // Import the handler
    const handler = require('./src/pages/api/summarize-brief.ts').default;
    await handler(req, res);
  } catch (error) {
    console.error('Error in summarize-brief route:', error);
    console.error('Error details:', error.message);
    res.status(500).json({ error: 'Failed to process PDF summarization request' });
  }
});

// Import and handle the generate-embeddings API route
app.post('/api/generate-embeddings', async (req, res) => {
  try {
    const { default: handler } = await import('./src/pages/api/generate-embeddings.ts');
    await handler(req, res);
  } catch (error) {
    console.error('Error in generate-embeddings route:', error);
    res.status(500).json({ error: 'Failed to load generate-embeddings handler' });
  }
});

// Import and handle other existing API routes
app.post('/api/generate-document', async (req, res) => {
  try {
    const { default: handler } = await import('./src/pages/api/generate-document.ts');
    await handler(req, res);
  } catch (error) {
    console.error('Error in generate-document route:', error);
    res.status(500).json({ error: 'Failed to load generate-document handler' });
  }
});

app.post('/api/pinecone-query', async (req, res) => {
  try {
    const { default: handler } = await import('./src/pages/api/pinecone-query.ts');
    await handler(req, res);
  } catch (error) {
    console.error('Error in pinecone-query route:', error);
    res.status(500).json({ error: 'Failed to load pinecone-query handler' });
  }
});

app.post('/api/pinecone-upsert', async (req, res) => {
  try {
    const { default: handler } = await import('./src/pages/api/pinecone-upsert.ts');
    await handler(req, res);
  } catch (error) {
    console.error('Error in pinecone-upsert route:', error);
    res.status(500).json({ error: 'Failed to load pinecone-upsert handler' });
  }
});

app.get('/api/check-subscription', async (req, res) => {
  try {
    const { default: handler } = await import('./src/pages/api/check-subscription.ts');
    await handler(req, res);
  } catch (error) {
    console.error('Error in check-subscription route:', error);
    res.status(500).json({ error: 'Failed to load check-subscription handler' });
  }
});

app.post('/api/create-checkout-session', async (req, res) => {
  try {
    const { default: handler } = await import('./src/pages/api/create-checkout-session.ts');
    await handler(req, res);
  } catch (error) {
    console.error('Error in create-checkout-session route:', error);
    res.status(500).json({ error: 'Failed to load create-checkout-session handler' });
  }
});

// Catch-all for other API routes
app.all('/api/*', (req, res) => {
  res.status(404).json({ error: `API route ${req.path} not found` });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Express error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
  console.log(`CORS enabled for: http://localhost:5173`);
});

export default app;