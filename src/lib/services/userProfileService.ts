import { FirestoreService } from '../firestore';
import { UserProfile } from '../models/userProfile';
import { auth } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

// Create UserProfile service that extends FirestoreService
class UserProfileService extends FirestoreService<UserProfile> {
  constructor() {
    super('userProfiles');
  }

  // Get current user's profile
  async getCurrentUserProfile(): Promise<UserProfile | null> {
    const user = auth.currentUser;
    if (!user) return null;
    
    return this.getUserProfileByUid(user.uid);
  }

  // Get user profile by Firebase Auth UID
  async getUserProfileByUid(uid: string): Promise<UserProfile | null> {
    const profiles = await this.query([{ field: 'uid', operator: '==', value: uid }]);
    return profiles.length > 0 ? profiles[0] : null;
  }

  // Create new user profile
  async createUserProfile(profileData: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>): Promise<UserProfile> {
    const now = Date.now();
    
    // If uid is not provided, use the current user's uid
    const uid = profileData.uid || auth.currentUser?.uid;
    
    if (!uid) {
      throw new Error('No authenticated user found');
    }

    const profile: Omit<UserProfile, 'id'> = {
      ...profileData,
      uid,
      createdAt: now,
      updatedAt: now
    };

    return this.create(profile);
  }

  // Add a contribution (case brief) to user profile
  async addContribution(briefId: string): Promise<UserProfile | null> {
    const profile = await this.getCurrentUserProfile();
    if (!profile) {
      throw new Error('User profile not found');
    }

    // Update the contributions
    const contributions = {
      ...profile.contributions,
      count: profile.contributions.count + 1,
      briefIds: [...profile.contributions.briefIds, briefId]
    };

    // Check if target is reached
    if (contributions.count >= contributions.target && !profile.contributions.completed) {
      contributions.completed = true;
      
      // Upgrade membership
      await this.update(profile.id, {
        contributions,
        membershipStatus: 'contributor',
        updatedAt: Date.now()
      });
    } else {
      // Just update contributions
      await this.update(profile.id, {
        contributions,
        updatedAt: Date.now()
      });
    }

    // Return updated profile
    return this.getUserProfileByUid(profile.uid);
  }

  // Get contribution progress percentage
  async getContributionProgress(): Promise<number> {
    const profile = await this.getCurrentUserProfile();
    if (!profile) return 0;
    
    const { count, target } = profile.contributions;
    return Math.min(Math.floor((count / target) * 100), 100);
  }

  // Update user membership status
  async updateMembershipStatus(userId: string, status: 'free' | 'contributor' | 'premium'): Promise<void> {
    if (!userId) throw new Error('User ID is required');
    
    try {
      const userRef = doc(db, 'userProfiles', userId);
      
      await updateDoc(userRef, {
        membershipStatus: status,
        updatedAt: Date.now()
      });
    } catch (error) {
      console.error('Error updating membership status:', error);
      throw error;
    }
  }
}

// Export a singleton instance
export const userProfileService = new UserProfileService(); 