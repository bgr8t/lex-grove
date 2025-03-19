import { CaseBrief } from '../models/caseBrief';

const PINECONE_API_KEY = '***REDACTED_PINECONE_OLD_KEY***';
const PINECONE_INDEX_URL = 'https://lex-grove-mvp-l8mt5ui.svc.aped-4627-b74a.pinecone.io';
const VOYAGE_API_KEY = '***REDACTED_VOYAGE_API_KEY***';
const MODEL_NAME = 'voyage-law-2';

// Interface for embedding request
interface EmbeddingRequest {
  model: string;
  input: string[];
}

// Interface for embedding response
interface EmbeddingResponse {
  object: string;
  data: {
    object: string;
    embedding: number[];
    index: number;
  }[];
  model: string;
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

// Interface for Pinecone upsert request
interface PineconeUpsertRequest {
  vectors: {
    id: string;
    values: number[];
    metadata: Record<string, any>;
  }[];
  namespace?: string;
}

class PineconeService {
  // Generate embeddings using Voyage AI model
  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    try {
      const response = await fetch('https://api.voyageai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${VOYAGE_API_KEY}`
        },
        body: JSON.stringify({
          model: MODEL_NAME,
          input: texts
        } as EmbeddingRequest)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to generate embeddings: ${response.status} ${errorText}`);
      }

      const data = await response.json() as EmbeddingResponse;
      return data.data.map(item => item.embedding);
    } catch (error) {
      console.error('Error generating embeddings:', error);
      throw error;
    }
  }

  // Insert a document into Pinecone
  async upsertDocument(briefId: string, embedding: number[], metadata: Record<string, any>): Promise<void> {
    try {
      const response = await fetch(`${PINECONE_INDEX_URL}/vectors/upsert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Api-Key': PINECONE_API_KEY
        },
        body: JSON.stringify({
          vectors: [
            {
              id: briefId,
              values: embedding,
              metadata
            }
          ]
        } as PineconeUpsertRequest)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to upsert document to Pinecone: ${response.status} ${errorText}`);
      }
    } catch (error) {
      console.error('Error upserting document to Pinecone:', error);
      throw error;
    }
  }

  // Save a case brief to Pinecone
  async saveCaseBrief(brief: CaseBrief): Promise<void> {
    try {
      // Combine brief content for embedding
      const briefContent = [
        brief.title,
        brief.facts,
        brief.issue,
        brief.holding,
        brief.reasoning
      ].filter(Boolean).join('\n\n');

      // Generate embedding for the brief
      const embeddings = await this.generateEmbeddings([briefContent]);
      if (embeddings.length === 0) {
        throw new Error('Failed to generate embeddings for brief');
      }

      // Prepare metadata for search
      const metadata = {
        title: brief.title,
        court: brief.court,
        date: brief.date,
        userId: brief.userId,
        createdAt: brief.createdAt,
        briefId: brief.id
      };

      // Save to Pinecone
      await this.upsertDocument(brief.id || '', embeddings[0], metadata);
    } catch (error) {
      console.error('Error saving case brief to Pinecone:', error);
      throw error;
    }
  }

  // Search for similar briefs in Pinecone
  async searchSimilarBriefs(query: string, topK: number = 5): Promise<string[]> {
    try {
      // Generate embedding for the query
      const embeddings = await this.generateEmbeddings([query]);
      if (embeddings.length === 0) {
        throw new Error('Failed to generate embeddings for query');
      }

      // Query Pinecone
      const response = await fetch(`${PINECONE_INDEX_URL}/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Api-Key': PINECONE_API_KEY
        },
        body: JSON.stringify({
          vector: embeddings[0],
          topK,
          includeMetadata: true
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to query Pinecone: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      return data.matches.map((match: any) => match.metadata.briefId);
    } catch (error) {
      console.error('Error searching similar briefs:', error);
      return [];
    }
  }
}

export const pineconeService = new PineconeService(); 