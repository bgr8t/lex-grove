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
      authorAvatar: user.photoURL || undefined,
      slug,
      viewCount: 0,
      likeCount: 0,
      status: articleData.status || 'draft',
      createdAt: now,
      updatedAt: now,
    };

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

  // Get article by slug
  async getArticleBySlug(slug: string): Promise<AgoraArticle | null> {
    const articlesRef = collection(db, 'agoraArticles');
    const q = query(articlesRef, where('slug', '==', slug), limit(1));
    
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

  // Simple search in published articles
  async searchArticles(searchTerm: string): Promise<AgoraArticle[]> {
    // Get all published articles first (we'll do client-side filtering for simplicity)
    const articles = await this.getPublishedArticles(100);
    
    if (!searchTerm) return articles;
    
    const searchLower = searchTerm.toLowerCase();
    return articles.filter(article =>
      article.title.toLowerCase().includes(searchLower) ||
      article.excerpt.toLowerCase().includes(searchLower) ||
      article.content.toLowerCase().includes(searchLower)
    );
  }
}

// Export service instance
export const agoraArticleService = new AgoraArticleService(); 