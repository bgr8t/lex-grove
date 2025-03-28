import { DocumentData, Timestamp } from 'firebase/firestore';

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