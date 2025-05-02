import { DocumentData, Timestamp } from 'firebase/firestore';

// Define the Collection type
export interface Collection {
  id: string;
  name: string;
  description: string;
  createdAt: number;
  briefs: string[]; // Array of brief IDs
}

export interface UserProfile extends DocumentData {
  id?: string;
  uid: string;              // Firebase Auth user ID
  displayName?: string;
  email: string;
  photoURL?: string;
  contributions: {
    count: number;          // Current week's contributions
    target: number;         // Target contributions needed (default: 3)
    completed: boolean;     // Whether user has completed the target
    briefIds: string[];     // IDs of contributed briefs
    lastWeekReset?: number; // Timestamp of last weekly reset
  };
  membershipStatus: 'contributor' | 'premium';
  // Collections of case briefs
  collections?: Collection[];
  // Bookmarked briefs
  bookmarkedBriefs?: string[]; // IDs of bookmarked briefs
  // Subscription info for premium users
  subscriptionInfo?: {
    active: boolean;        // Whether subscription is still active
    startDate: number;      // When subscription started
    endDate: number;        // When subscription will end/ended
    lastUpdated: number;    // Last time subscription was checked/updated
  };
  // Stripe payment fields
  stripeCustomerId?: string;
  subscriptionId?: string;
  subscriptionStatus?: 'active' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'past_due' | 'trialing' | 'unpaid';
  subscriptionPeriodEnd?: Timestamp;
  currentSessionId?: string;
  sessionCreatedAt?: Timestamp;
  createdAt: number;
  updatedAt: number;
} 