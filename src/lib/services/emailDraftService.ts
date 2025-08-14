import { FirestoreService } from '../firestore';
import { EmailDraft } from '../models/emailDraft';
import { auth, db } from '../firebase';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';

class EmailDraftService extends FirestoreService<EmailDraft> {
  constructor() {
    super('emailDrafts');
  }

  /**
   * Get all drafts for current user with security validation
   * @param userId - User ID to get drafts for
   * @param limitCount - Maximum number of drafts to return
   * @returns Promise<EmailDraft[]>
   */
  async getDraftsByUser(userId: string, limitCount: number = 50): Promise<EmailDraft[]> {
    // Validate user authentication
    const currentUser = auth.currentUser;
    if (!currentUser || currentUser.uid !== userId) {
      throw new Error('Unauthorized access to drafts');
    }

    try {
      const draftsRef = collection(db, 'emailDrafts');
      const q = query(
        draftsRef,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      }) as EmailDraft);
    } catch (error) {
      console.error('Error fetching drafts:', error);
      throw new Error('Failed to fetch draft history');
    }
  }

  /**
   * Save a new draft with security validation
   * @param draft - Draft data without id, createdAt, updatedAt
   * @returns Promise<EmailDraft>
   */
  async saveDraft(draft: Omit<EmailDraft, 'id' | 'createdAt' | 'updatedAt'>): Promise<EmailDraft> {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User must be authenticated to save drafts');
    }

    // Validate that the draft belongs to the current user
    if (draft.userId !== user.uid) {
      throw new Error('Cannot save draft for another user');
    }

    // Validate and sanitize input data
    const sanitizedDraft = this.validateAndSanitizeDraft(draft);

    const now = Date.now();
    const draftData: Omit<EmailDraft, 'id'> = {
      ...sanitizedDraft,
      createdAt: now,
      updatedAt: now
    };

    try {
      return await this.create(draftData);
    } catch (error) {
      console.error('Error saving draft:', error);
      throw new Error('Failed to save draft');
    }
  }

  /**
   * Update an existing draft with ownership verification
   * @param draftId - ID of the draft to update
   * @param updates - Partial draft data to update
   */
  async updateDraft(draftId: string, updates: Partial<EmailDraft>): Promise<void> {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User must be authenticated to update drafts');
    }

    // Verify ownership before update
    const existingDraft = await this.getById(draftId);
    if (!existingDraft || existingDraft.userId !== user.uid) {
      throw new Error('Unauthorized to update this draft');
    }

    try {
      const draftRef = doc(db, 'emailDrafts', draftId);
      await updateDoc(draftRef, {
        ...updates,
        updatedAt: Date.now()
      });
    } catch (error) {
      console.error('Error updating draft:', error);
      throw new Error('Failed to update draft');
    }
  }

  /**
   * Delete a draft with ownership verification
   * @param draftId - ID of the draft to delete
   */
  async deleteDraft(draftId: string): Promise<void> {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User must be authenticated to delete drafts');
    }

    // Verify ownership before deletion
    const draft = await this.getById(draftId);
    if (!draft || draft.userId !== user.uid) {
      throw new Error('Unauthorized to delete this draft');
    }

    try {
      await this.delete(draftId);
    } catch (error) {
      console.error('Error deleting draft:', error);
      throw new Error('Failed to delete draft');
    }
  }

  /**
   * Get draft by ID with ownership verification
   * @param draftId - ID of the draft to retrieve
   * @returns Promise<EmailDraft | null>
   */
  async getDraftById(draftId: string): Promise<EmailDraft | null> {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User must be authenticated to access drafts');
    }

    try {
      const draft = await this.getById(draftId);
      if (!draft || draft.userId !== user.uid) {
        return null; // Return null instead of throwing error for not found
      }

      return draft;
    } catch (error) {
      console.error('Error fetching draft:', error);
      throw new Error('Failed to fetch draft');
    }
  }

  /**
   * Validate and sanitize draft data for security
   * @param draft - Raw draft data
   * @returns Sanitized draft data
   */
  private validateAndSanitizeDraft(draft: Omit<EmailDraft, 'id' | 'createdAt' | 'updatedAt'>): Omit<EmailDraft, 'id' | 'createdAt' | 'updatedAt'> {
    // Validate required fields
    if (!draft.userId || typeof draft.userId !== 'string') {
      throw new Error('Invalid user ID');
    }

    if (!draft.content || typeof draft.content !== 'string') {
      throw new Error('Draft content is required');
    }

    if (!draft.context || typeof draft.context !== 'string') {
      throw new Error('Draft context is required');
    }

    // Sanitize content length for cost efficiency
    const maxContentLength = 10000;
    const maxContextLength = 5000;
    const maxInstructionsLength = 2000;

    return {
      userId: draft.userId.trim(),
      content: draft.content.trim().slice(0, maxContentLength),
      context: draft.context.trim().slice(0, maxContextLength),
      instructions: (draft.instructions || '').trim().slice(0, maxInstructionsLength),
      preferences: {
        tone: draft.preferences.tone,
        length: draft.preferences.length,
        role: (draft.preferences.role || '').trim().slice(0, 100),
        organization: (draft.preferences.organization || '').trim().slice(0, 100),
        signature: (draft.preferences.signature || '').trim().slice(0, 200)
      },
      privacySettings: {
        mode: draft.privacySettings.mode,
        removeMetadata: Boolean(draft.privacySettings.removeMetadata),
        neutralLanguage: Boolean(draft.privacySettings.neutralLanguage),
        avoidLocation: Boolean(draft.privacySettings.avoidLocation),
        attorneyClient: Boolean(draft.privacySettings.attorneyClient)
      }
    };
  }

  /**
   * Get drafts count for a user (for UI display)
   * @param userId - User ID
   * @returns Promise<number>
   */
  async getDraftsCount(userId: string): Promise<number> {
    const user = auth.currentUser;
    if (!user || user.uid !== userId) {
      throw new Error('Unauthorized access');
    }

    try {
      const drafts = await this.getDraftsByUser(userId, 1000); // Get all for count
      return drafts.length;
    } catch (error) {
      console.error('Error getting drafts count:', error);
      return 0;
    }
  }
}

export const emailDraftService = new EmailDraftService();
