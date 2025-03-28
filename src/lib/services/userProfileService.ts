import { FirestoreService } from '../firestore';
import { UserProfile } from '../models/userProfile';
import { auth } from '../firebase';
import { doc, updateDoc, setDoc, getDoc } from 'firebase/firestore';
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
    
    // Add subscription info for premium users
    const profile: Omit<UserProfile, 'id'> = {
      ...profileData,
      uid,
      createdAt: now,
      updatedAt: now
    };
    
    // If user is premium, ensure they have subscription info
    if (profileData.membershipStatus === 'premium' && !profileData.subscriptionInfo) {
      // Calculate subscription end date (30 days from now)
      const subscriptionEndDate = now + (30 * 24 * 60 * 60 * 1000);
      
      profile.subscriptionInfo = {
        active: true,
        startDate: now,
        endDate: subscriptionEndDate,
        lastUpdated: now
      };
    }
    
    // Make sure contributions object exists
    if (!profile.contributions) {
      profile.contributions = {
        count: 0,
        target: 3,
        completed: profileData.membershipStatus === 'premium', // Premium users get automatic completion
        briefIds: []
      };
    }

    return this.create(profile);
  }

  // Add a contribution (case brief) to user profile
  async addContribution(briefId: string): Promise<UserProfile | null> {
    const profile = await this.getCurrentUserProfile();
    if (!profile) {
      throw new Error('User profile not found');
    }

    // Initialize contributions if it doesn't exist
    const contributions = profile.contributions || {
      count: 0,
      target: 3,
      completed: false,
      briefIds: [],
      lastWeekReset: Date.now()
    };

    // Check if we need to reset weekly count
    const now = Date.now();
    const oneWeek = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
    const shouldResetWeekly = contributions.lastWeekReset && 
      (now - contributions.lastWeekReset > oneWeek);

    // If it's a new week, reset the count
    if (shouldResetWeekly) {
      contributions.count = 0;
      contributions.lastWeekReset = now;
      contributions.completed = false;
    }

    // Update the contributions
    contributions.count += 1;
    contributions.briefIds = [...contributions.briefIds, briefId];

    // Check if target is reached
    if (contributions.count >= contributions.target && !contributions.completed) {
      contributions.completed = true;
      
      // Upgrade membership
      await this.update(profile.id, {
        contributions,
        membershipStatus: 'contributor',
        updatedAt: now
      });
    } else {
      // Just update contributions
      await this.update(profile.id, {
        contributions,
        updatedAt: now
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
  async updateMembershipStatus(userId: string, status: 'contributor' | 'premium'): Promise<void> {
    if (!userId) throw new Error('User ID is required');
    
    try {
      const userRef = doc(db, 'userProfiles', userId);
      
      // First check if profile exists and has contributions
      const profileSnap = await getDoc(userRef);
      let updateData: any = {
        membershipStatus: status,
        updatedAt: Date.now()
      };
      
      // Add subscription info for premium users
      if (status === 'premium') {
        // Calculate subscription end date (30 days from now)
        const subscriptionEndDate = Date.now() + (30 * 24 * 60 * 60 * 1000);
        
        updateData.subscriptionInfo = {
          active: true,
          startDate: Date.now(),
          endDate: subscriptionEndDate,
          lastUpdated: Date.now()
        };
      }
      
      // For contributor status, make sure the contributions object is correctly set
      if (!profileSnap.exists() || !profileSnap.data().contributions) {
        updateData.contributions = {
          count: 0,
          target: 3,
          completed: status === 'premium', // Premium users skip contribution requirement
          briefIds: []
        };
      } else if (status === 'premium') {
        // If user already has contributions but is becoming premium,
        // mark contributions as completed
        updateData.contributions = {
          ...profileSnap.data().contributions,
          completed: true
        };
      }
      
      // Use setDoc with merge option to handle cases where the document doesn't exist
      await setDoc(userRef, updateData, { merge: true });
    } catch (error) {
      console.error('Error updating membership status:', error);
      throw error;
    }
  }

  // Check and handle subscription status
  async checkSubscriptionStatus(userId: string): Promise<'premium' | 'contributor' | null> {
    try {
      const userRef = doc(db, 'userProfiles', userId);
      const profileSnap = await getDoc(userRef);
      
      if (!profileSnap.exists()) {
        return null;
      }
      
      const profileData = profileSnap.data() as UserProfile;
      const currentStatus = profileData.membershipStatus;
      
      // If user is premium, check if subscription is still active
      if (currentStatus === 'premium' && profileData.subscriptionInfo) {
        const { endDate, active } = profileData.subscriptionInfo;
        
        // If subscription has ended, update status based on contributions
        if (active && endDate < Date.now()) {
          // Subscription expired
          const hasCompletedContributions = 
            profileData.contributions && 
            profileData.contributions.completed;
          
          // Update subscription info
          await updateDoc(userRef, {
            'subscriptionInfo.active': false,
            'subscriptionInfo.lastUpdated': Date.now(),
            // If they have completed contributions, become contributor, otherwise lose access
            membershipStatus: hasCompletedContributions ? 'contributor' : null,
            updatedAt: Date.now()
          });
          
          return hasCompletedContributions ? 'contributor' : null;
        }
        
        return 'premium';
      }
      
      // For contributors or users with no status, check if they have completed their contributions
      // If they've completed contributions but don't have contributor status, update them
      if (profileData.contributions && profileData.contributions.completed) {
        if (currentStatus !== 'contributor') {
          // User has completed contributions but doesn't have contributor status
          // Update them to contributor status
          await updateDoc(userRef, {
            membershipStatus: 'contributor',
            updatedAt: Date.now()
          });
          return 'contributor';
        }
        return 'contributor';
      }
      
      return currentStatus as 'premium' | 'contributor' | null;
    } catch (error) {
      console.error('Error checking subscription status:', error);
      return null;
    }
  }
}

// Export a singleton instance
export const userProfileService = new UserProfileService(); 