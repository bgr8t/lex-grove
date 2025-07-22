import { DocumentData } from 'firebase/firestore';

// Core Agora article model - minimal viable structure
export interface AgoraArticle extends DocumentData {
  id?: string;
  title: string;
  content: string;           // Markdown content
  excerpt: string;           // Brief description/preview
  
  // Author information
  authorId: string;          // Firebase Auth user ID
  authorName: string;        // Display name
  authorAvatar?: string;     // Author photo URL
  sources?: string;
  
  // Publishing metadata
  status: 'draft' | 'published';
  publishedAt?: number;      // Timestamp when published
  slug: string;              // URL-friendly identifier
  
  // Content categorization
  tags: string[];            // Topic tags for classification and search
  legalArea?: string;        // Legal practice area (optional)
  difficulty?: 'beginner' | 'intermediate' | 'advanced'; // Content difficulty level
  
  // Engagement metrics
  viewCount: number;
  likeCount: number;
  
  // Access control
  isPremium: boolean;        // Whether article requires subscription
  
  // Timestamps
  createdAt: number;
  updatedAt: number;
}

// Minimal article creation interface
export interface CreateAgoraArticle {
  title: string;
  content: string;
  excerpt: string;
  isPremium: boolean;
  sources?: string;
  tags?: string[];           // Optional tags for new articles
  legalArea?: string;        // Optional legal practice area
  difficulty?: 'beginner' | 'intermediate' | 'advanced'; // Optional difficulty level
  status?: 'draft' | 'published';
} 