import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  addDoc,
  Unsubscribe,
  serverTimestamp,
  getDocs,
  Timestamp,
  DocumentData
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { FirestoreService } from '../firestore';
import { Comment } from '../models/comment';

class CommentsService extends FirestoreService<Comment> {
  constructor() {
    super('comments');
  }

  // Get all comments for a brief
  async getCommentsByBriefId(briefId: string): Promise<Comment[]> {
    return this.query(
      [{ field: 'briefId', operator: '==', value: briefId }],
      { field: 'createdAt', direction: 'desc' }
    );
  }

  // Subscribe to comments for a brief with real-time updates
  subscribeToComments(briefId: string, callback: (comments: Comment[]) => void): Unsubscribe {
    const commentsRef = collection(db, 'comments');
    const q = query(
      commentsRef,
      where('briefId', '==', briefId),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const comments: Comment[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        comments.push({
          id: doc.id,
          briefId: data.briefId,
          userId: data.userId,
          userDisplayName: data.userDisplayName,
          content: data.content,
          createdAt: data.createdAt instanceof Timestamp ? 
            data.createdAt.toMillis() : 
            data.createdAt,
          updatedAt: data.updatedAt instanceof Timestamp ? 
            data.updatedAt.toMillis() : 
            data.updatedAt,
        });
      });
      callback(comments);
    }, (error) => {
      console.error("Error listening to comments:", error);
    });
  }

  // Add a new comment
  async addComment(comment: Omit<Comment, 'id' | 'updatedAt'>): Promise<Comment> {
    if (!auth.currentUser) {
      throw new Error("User must be logged in to add a comment");
    }

    // Add timestamp fields
    const commentWithTimestamps = {
      ...comment,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    return this.create(commentWithTimestamps);
  }

  // Update a comment
  async updateComment(id: string, content: string): Promise<void> {
    if (!auth.currentUser) {
      throw new Error("User must be logged in to update a comment");
    }

    return this.update(id, {
      content,
      updatedAt: Date.now()
    });
  }

  // Delete a comment
  async deleteComment(id: string): Promise<void> {
    if (!auth.currentUser) {
      throw new Error("User must be logged in to delete a comment");
    }

    return this.delete(id);
  }

  // Check if a user can edit/delete a comment
  async canModifyComment(commentId: string): Promise<boolean> {
    if (!auth.currentUser) return false;
    
    try {
      const comment = await this.getById(commentId);
      if (!comment) return false;
      
      // User can modify if they created the comment
      return comment.userId === auth.currentUser.uid;
    } catch (error) {
      console.error("Error checking comment permission:", error);
      return false;
    }
  }
}

export const commentsService = new CommentsService(); 