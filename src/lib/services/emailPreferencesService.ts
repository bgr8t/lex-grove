import { FirestoreService } from '../firestore';
import { auth } from '../firebase';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

export interface EmailPreferences {
  tone: 'friendly' | 'formal' | 'professional' | 'casual';
  length: 'short' | 'medium' | 'long';
  language: 'en' | 'fr';
  role: string;
  organization: string;
  signature: string;
}

export interface PrivacyPreferences {
  mode: 'standard' | 'privacy';
  removeMetadata: boolean;
  neutralLanguage: boolean;
  avoidLocation: boolean;
  attorneyClient: boolean;
}

export interface UserEmailPreferences {
  uid: string;
  emailPreferences: EmailPreferences;
  privacyPreferences: PrivacyPreferences;
  createdAt: number;
  updatedAt: number;
}

class EmailPreferencesService extends FirestoreService<UserEmailPreferences> {
  constructor() {
    super('emailPreferences');
  }

  // Get current user's email preferences
  async getCurrentUserPreferences(): Promise<UserEmailPreferences | null> {
    const user = auth.currentUser;
    if (!user) return null;
    return this.getUserPreferencesByUid(user.uid);
  }

  // Get user email preferences by UID
  async getUserPreferencesByUid(uid: string): Promise<UserEmailPreferences | null> {
    try {
      const docRef = doc(db, 'emailPreferences', uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { uid, ...docSnap.data() } as UserEmailPreferences;
      }

      return null;
    } catch (error) {
      console.error('Error fetching user email preferences:', error);
      return null;
    }
  }

  // Create or update user email preferences
  async saveUserPreferences(
    emailPreferences: EmailPreferences,
    privacyPreferences: PrivacyPreferences
  ): Promise<UserEmailPreferences> {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No authenticated user found');
    }

    const now = Date.now();
    
    // Check if preferences already exist
    const existing = await this.getUserPreferencesByUid(user.uid);
    
    const preferences: UserEmailPreferences = {
      uid: user.uid,
      emailPreferences,
      privacyPreferences,
      createdAt: existing?.createdAt || now,
      updatedAt: now
    };

    try {
      await setDoc(doc(db, 'emailPreferences', user.uid), preferences, { merge: true });
      return preferences;
    } catch (error) {
      console.error('Error saving user email preferences:', error);
      throw new Error('Failed to save preferences');
    }
  }

  // Update only email preferences - SIMPLIFIED to always rewrite
  async updateEmailPreferences(emailPreferences: EmailPreferences): Promise<void> {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No authenticated user found');
    }

    const now = Date.now();
    const docRef = doc(db, 'emailPreferences', user.uid);
    
    try {
      // Always get the current document to preserve other data
      const docSnapshot = await getDoc(docRef);
      
      if (!docSnapshot.exists()) {
        // Create new document with full structure
        const newDocument = {
          uid: user.uid,
          emailPreferences,
          privacyPreferences: this.getDefaultPrivacyPreferences(),
          createdAt: now,
          updatedAt: now
        };
        await setDoc(docRef, newDocument);
      } else {
        // Rewrite the entire document but preserve existing structure
        const currentData = docSnapshot.data();
        const updatedDocument = {
          ...currentData,
          emailPreferences, // Completely replace emailPreferences
          updatedAt: now
        };
        
        await setDoc(docRef, updatedDocument);
      }
    } catch (error) {
      console.error('🚨 FIRESTORE ERROR: Failed to update email preferences:', error);
      throw new Error(`Failed to update email preferences: ${error.message}`);
    }
  }

  // Update only privacy preferences - SIMPLIFIED to always rewrite
  async updatePrivacyPreferences(privacyPreferences: PrivacyPreferences): Promise<void> {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No authenticated user found');
    }

    const now = Date.now();
    const docRef = doc(db, 'emailPreferences', user.uid);

    try {
      // Always get the current document to preserve other data
      const docSnapshot = await getDoc(docRef);
      
      if (!docSnapshot.exists()) {
        // Create new document with full structure
        const newDocument = {
          uid: user.uid,
          emailPreferences: this.getDefaultEmailPreferences(),
          privacyPreferences,
          createdAt: now,
          updatedAt: now
        };
        await setDoc(docRef, newDocument);
      } else {
        // Rewrite the entire document but preserve existing structure
        const currentData = docSnapshot.data();
        const updatedDocument = {
          ...currentData,
          privacyPreferences, // Completely replace privacyPreferences
          updatedAt: now
        };
        
        await setDoc(docRef, updatedDocument);
      }
    } catch (error) {
      console.error('🚨 FIRESTORE ERROR: Failed to update privacy preferences:', error);
      throw new Error(`Failed to update privacy preferences: ${error.message}`);
    }
  }

  // Get default email preferences
  getDefaultEmailPreferences(): EmailPreferences {
    return {
      tone: 'professional',
      length: 'medium',
      language: 'en',
      role: '',
      organization: '',
      signature: ''
    };
  }

  // Get default privacy preferences
  getDefaultPrivacyPreferences(): PrivacyPreferences {
    return {
      mode: 'standard',
      removeMetadata: false,
      neutralLanguage: false,
      avoidLocation: false,
      attorneyClient: false,
    };
  }

  // Initialize preferences for new users
  async initializeUserPreferences(): Promise<UserEmailPreferences> {
    const defaultEmail = this.getDefaultEmailPreferences();
    const defaultPrivacy = this.getDefaultPrivacyPreferences();
    
    return this.saveUserPreferences(defaultEmail, defaultPrivacy);
  }
}

// Export a singleton instance
export const emailPreferencesService = new EmailPreferencesService();
