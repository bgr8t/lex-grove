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
  
  // Publishing metadata
  status: 'draft' | 'published';
  publishedAt?: number;      // Timestamp when published
  slug: string;              // URL-friendly identifier
  
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
  status?: 'draft' | 'published';
} 