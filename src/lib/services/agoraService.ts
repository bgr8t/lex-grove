import { FirestoreService } from '../firestore';
import { AgoraArticle, CreateAgoraArticle } from '../models/agoraArticle';
import { auth, db } from '../firebase';
import {
  doc,
  updateDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  increment
} from 'firebase/firestore';

// Agora Article Service - simple CRUD operations
class AgoraArticleService extends FirestoreService<AgoraArticle> {
  constructor() {
    super('agoraArticles');
  }

  // Create a new article
  async createArticle(articleData: CreateAgoraArticle): Promise<AgoraArticle> {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('Authentication required');
    }

    const now = Date.now();
    const slug = this.generateSlug(articleData.title);
    
    const article: Omit<AgoraArticle, 'id'> = {
      ...articleData,
      authorId: user.uid,
      authorName: user.displayName || 'Anonymous',
      slug,
      viewCount: 0,
      likeCount: 0,
      tags: articleData.tags || [],
      status: articleData.status || 'draft',
      createdAt: now,
      updatedAt: now,
    };

    if (user.photoURL) {
      article.authorAvatar = user.photoURL;
    }

    return await this.create(article);
  }

  // Generate URL-friendly slug
  generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  // Get published articles with pagination
  async getPublishedArticles(pageSize: number = 20): Promise<AgoraArticle[]> {
    const articlesRef = collection(db, 'agoraArticles');
    const q = query(
      articlesRef,
      where('status', '==', 'published'),
      orderBy('publishedAt', 'desc'),
      limit(pageSize)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as AgoraArticle);
  }

  // Get articles by author
  async getArticlesByAuthor(authorId: string): Promise<AgoraArticle[]> {
    const articlesRef = collection(db, 'agoraArticles');
    const q = query(
      articlesRef,
      where('authorId', '==', authorId),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as AgoraArticle);
  }

  // Get draft articles by author
  async getDraftsByAuthor(authorId: string): Promise<AgoraArticle[]> {
    const articlesRef = collection(db, 'agoraArticles');
    const q = query(
      articlesRef,
      where('authorId', '==', authorId),
      where('status', '==', 'draft'),
      orderBy('updatedAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as AgoraArticle);
  }

  // Get article by slug
  async getArticleBySlug(slug: string): Promise<AgoraArticle | null> {
    const articlesRef = collection(db, 'agoraArticles');
    const q = query(
      articlesRef,
      where('slug', '==', slug),
      where('status', '==', 'published'),
      limit(1)
    );
    
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as AgoraArticle;
  }

  // Increment view count
  async incrementViewCount(articleId: string): Promise<void> {
    const articleRef = doc(db, 'agoraArticles', articleId);
    await updateDoc(articleRef, {
      viewCount: increment(1),
      updatedAt: Date.now()
    });
  }

  // Publish article
  async publishArticle(articleId: string): Promise<void> {
    const articleRef = doc(db, 'agoraArticles', articleId);
    await updateDoc(articleRef, {
      status: 'published',
      publishedAt: Date.now(),
      updatedAt: Date.now()
    });
  }

  // Enhanced search with multiple filters
  async searchArticles(
    searchTerm: string = '',
    filters: {
      tags?: string[];
      legalArea?: string;
      difficulty?: 'beginner' | 'intermediate' | 'advanced';
      authorId?: string;
    } = {}
  ): Promise<AgoraArticle[]> {
    // Get all published articles first (we'll do client-side filtering for simplicity)
    // In production, you'd want to implement server-side filtering with proper indexes
    const articles = await this.getPublishedArticles(100);
    
    let filteredArticles = articles;

    // Apply text search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filteredArticles = filteredArticles.filter(article =>
        article.title.toLowerCase().includes(searchLower) ||
        article.excerpt.toLowerCase().includes(searchLower) ||
        article.content.toLowerCase().includes(searchLower) ||
        (article.tags || []).some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    // Apply tag filters
    if (filters.tags && filters.tags.length > 0) {
      filteredArticles = filteredArticles.filter(article =>
        filters.tags!.some(filterTag => 
          (article.tags || []).includes(filterTag)
        )
      );
    }

    // Apply legal area filter
    if (filters.legalArea) {
      filteredArticles = filteredArticles.filter(article =>
        article.legalArea === filters.legalArea
      );
    }

    // Apply difficulty filter
    if (filters.difficulty) {
      filteredArticles = filteredArticles.filter(article =>
        article.difficulty === filters.difficulty
      );
    }

    // Apply author filter
    if (filters.authorId) {
      filteredArticles = filteredArticles.filter(article =>
        article.authorId === filters.authorId
      );
    }

    return filteredArticles;
  }

  // Get all unique tags from published articles
  async getAllTags(): Promise<string[]> {
    const articles = await this.getPublishedArticles(1000); // Get more articles for tag analysis
    const allTags = articles
      .flatMap(article => article.tags || [])
      .filter((tag, index, self) => self.indexOf(tag) === index) // Remove duplicates
      .sort();
    
    return allTags;
  }

  // Get popular tags (with usage count)
  async getPopularTags(limit: number = 20): Promise<{ tag: string; count: number }[]> {
    const articles = await this.getPublishedArticles(1000);
    const tagCounts: Record<string, number> = {};
    
    articles.forEach(article => {
      (article.tags || []).forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    return Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  // Get articles by tag
  async getArticlesByTag(tag: string): Promise<AgoraArticle[]> {
    return this.searchArticles('', { tags: [tag] });
  }

  // Get articles by legal area
  async getArticlesByLegalArea(legalArea: string): Promise<AgoraArticle[]> {
    return this.searchArticles('', { legalArea });
  }

  // Get articles by difficulty
  async getArticlesByDifficulty(difficulty: 'beginner' | 'intermediate' | 'advanced'): Promise<AgoraArticle[]> {
    return this.searchArticles('', { difficulty });
  }
}

// Export service instance
export const agoraArticleService = new AgoraArticleService(); 