import { DocumentData, Timestamp } from 'firebase/firestore';

export interface UserProfile extends DocumentData {
  id?: string;
  uid: string;              // Firebase Auth user ID
  displayName?: string;
  email: string;
  photoURL?: string;
  contributions: {
    count: number;          // Total contributions
    target: number;         // Target contributions needed (default: 3)
    completed: boolean;     // Whether user has completed the target
    briefIds: string[];     // IDs of contributed briefs
  };
  membershipStatus: 'free' | 'contributor' | 'premium';
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