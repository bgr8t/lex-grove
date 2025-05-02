import { CaseBrief } from '../models/caseBrief';

const MODEL_NAME = 'text-embedding-3-small';

interface PineconeMatch {
  id: string;
  score: number;
  metadata: {
    briefId: string;
    title: string;
    court?: string;
    citation?: string;
    date?: string;
    factSnippet?: string;
    issueSnippet?: string;
    holdingSnippet?: string;
    [key: string]: any;
  };
}

class PineconeService {
  // Test function to check Pinecone connectivity
  async testConnection(): Promise<boolean> {
    try {
      console.log('Testing connection to API server and Pinecone...');
      
      // Test API server
      const response = await fetch('/api/test');
      if (!response.ok) {
        console.error('Failed to connect to API server');
        return false;
      }
      
      // Generate a dummy embedding for testing
      const dummyText = 'Test connection to Pinecone';
      const embeddings = await this.generateEmbeddings([dummyText]);
      
      if (embeddings.length === 0) {
        console.error('Failed to generate test embeddings');
        return false;
      }
      
      // Test Pinecone upsert
      await this.upsertDocument('test-connection', embeddings[0], { test: true });
      console.log('Successfully connected to Pinecone');
      return true;
    } catch (error) {
      console.error('Error testing Pinecone connection:', error);
      return false;
    }
  }

  // Generate embeddings using a proxy to protect API key
  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    try {
      console.log('Generating embeddings for texts:', texts.map(t => t.substring(0, 50) + '...'));
      
      // Use a server-side API proxy endpoint instead of direct OpenAI call
      const response = await fetch('/api/generate-embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: texts,
          model: MODEL_NAME
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Embedding generation failed:', errorText);
        throw new Error(`Failed to generate embeddings: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      console.log('Successfully generated embeddings with dimensions:', data.embeddings[0]?.length || 'no embeddings returned');
      return data.embeddings;
    } catch (error) {
      console.error('Error generating embeddings:', error);
      throw error;
    }
  }

  // Insert a document into Pinecone
  async upsertDocument(briefId: string, embedding: number[], metadata: Record<string, any>): Promise<void> {
    try {
      console.log(`Upserting document ${briefId} to Pinecone with metadata:`, metadata);
      
      // Use server endpoint for security
      const response = await fetch('/api/pinecone-upsert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: briefId,
          values: embedding,
          metadata
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Pinecone upsert failed:', errorText);
        throw new Error(`Failed to upsert document to Pinecone: ${response.status} ${errorText}`);
      }
      
      console.log(`Successfully upserted document ${briefId} to Pinecone`);
    } catch (error) {
      console.error('Error upserting document to Pinecone:', error);
      throw error;
    }
  }

  // Save a case brief to Pinecone
  async saveCaseBrief(brief: CaseBrief): Promise<void> {
    try {
      console.log('Starting saveCaseBrief process for brief:', brief.id);
      
      // Combine brief content for embedding - include ALL relevant fields
      const briefContent = [
        `Title: ${brief.title || ''}`,
        `Court: ${brief.court || ''}`,
        `Citation: ${brief.citation || ''}`,
        `Facts: ${brief.facts || ''}`,
        `Issue: ${brief.issue || ''}`,
        `Holding: ${brief.holding || ''}`,
        `Reasoning: ${brief.reasoning || ''}`
      ].filter(content => content.split(': ')[1] !== '').join('\n\n');

      console.log('Combined content for embedding:', briefContent.substring(0, 100) + '...');

      // Generate embedding for the brief
      const embeddings = await this.generateEmbeddings([briefContent]);
      if (embeddings.length === 0) {
        console.error('No embeddings were generated');
        throw new Error('Failed to generate embeddings for brief');
      }

      // Prepare metadata for search with more fields for better filtering
      const metadata = {
        title: brief.title,
        court: brief.court,
        citation: brief.citation,
        date: brief.date,
        userId: brief.userId,
        createdAt: brief.createdAt,
        briefId: brief.id,
        // Add snippets for search result preview
        factSnippet: brief.facts?.substring(0, 150) || '',
        issueSnippet: brief.issue?.substring(0, 150) || '',
        holdingSnippet: brief.holding?.substring(0, 150) || '',
      };

      console.log('Prepared metadata for Pinecone:', metadata);

      // Save to Pinecone
      await this.upsertDocument(brief.id || '', embeddings[0], metadata);
      console.log('saveCaseBrief completed successfully');
    } catch (error) {
      console.error('Error saving case brief to Pinecone:', error);
      throw error;
    }
  }

  // Search for similar briefs in Pinecone
  async searchSimilarBriefs(query: string, topK: number = 5): Promise<PineconeMatch[]> {
    try {
      console.log(`Searching for similar briefs with query "${query}" and topK=${topK}`);
      
      // Generate embedding for the query
      const embeddings = await this.generateEmbeddings([query]);
      if (embeddings.length === 0) {
        console.error('No embeddings were generated for search query');
        throw new Error('Failed to generate embeddings for query');
      }

      // Query Pinecone
      const response = await fetch('/api/pinecone-query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vector: embeddings[0],
          topK,
          includeMetadata: true
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Pinecone query failed:', errorText);
        throw new Error(`Failed to query Pinecone: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      console.log('Search results from Pinecone:', data);
      
      // Return the complete match information with proper typing
      return data.matches.map((match: any) => ({
        id: match.metadata.briefId,
        score: match.score,
        metadata: match.metadata
      }));
    } catch (error) {
      console.error('Error searching similar briefs:', error);
      return [];
    }
  }
}

export const pineconeService = new PineconeService(); 