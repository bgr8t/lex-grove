import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  User,
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  UserCredential,
  Auth,
  fetchSignInMethodsForEmail
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { userProfileService } from '@/lib/services/userProfileService';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  membershipStatus: 'contributor' | 'premium' | null;
  signUp: (email: string, password: string) => Promise<UserCredential>;
  login: (email: string, password: string) => Promise<UserCredential>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (displayName: string) => Promise<void>;
  checkEmailExists: (email: string) => Promise<boolean>;
  checkMembershipStatus: () => Promise<'contributor' | 'premium' | null>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [membershipStatus, setMembershipStatus] = useState<'contributor' | 'premium' | null>(null);

  // Sign up function
  async function signUp(email: string, password: string) {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Create a complete user profile after successful signup
      try {
        await userProfileService.createUserProfile({
          uid: userCredential.user.uid,
          email: email,
          displayName: userCredential.user.displayName || '',
          membershipStatus: null as any,
          contributions: {
            count: 0,
            target: 3,
            completed: false,
            briefIds: []
          }
        });
        console.log("User profile created successfully");
      } catch (error) {
        console.error("Error creating user profile:", error);
        // Continue even if profile creation fails, we can try again later
      }
      
      return userCredential;
    } catch (error) {
      console.error("Error during signup:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }

  // Login function
  async function login(email: string, password: string) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  // Logout function
  async function logout() {
    return signOut(auth);
  }

  // Reset password function
  async function resetPassword(email: string) {
    return sendPasswordResetEmail(auth, email);
  }

  // Update user profile
  async function updateUserProfile(displayName: string) {
    if (auth.currentUser) {
      return updateProfile(auth.currentUser, { displayName });
    }
    throw new Error('No user is signed in');
  }

  // Check if email exists
  async function checkEmailExists(email: string): Promise<boolean> {
    try {
      const methods = await fetchSignInMethodsForEmail(auth, email);
      return methods.length > 0;
    } catch (error) {
      console.error("Error checking email existence:", error);
      return false;
    }
  }

  // Check membership status
  async function checkMembershipStatus(): Promise<'contributor' | 'premium' | null> {
    if (!currentUser) return null;
    
    try {
      // Use the user profile service to check status
      const status = await userProfileService.checkSubscriptionStatus(currentUser.uid);
      
      // If status is null, double check if user has completed contributions
      if (status === null) {
        const profile = await userProfileService.getUserProfileByUid(currentUser.uid);
        if (profile && profile.contributions && profile.contributions.completed) {
          console.log("Found completed contributions but status is null, forcing update to contributor");
          // Force update to contributor status
          await userProfileService.update(profile.id!, {
            membershipStatus: 'contributor',
            updatedAt: Date.now()
          });
          
          // Set as contributor and return
          setMembershipStatus('contributor');
          return 'contributor';
        }
      }
      
      setMembershipStatus(status);
      return status;
    } catch (error) {
      console.error('Error checking membership status:', error);
      return null;
    }
  }

  useEffect(() => {
    // Subscribe to auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        try {
          // Check if user profile exists
          const profile = await userProfileService.getUserProfileByUid(user.uid);
          
          // If no profile exists, create one
          if (!profile) {
            console.log("No profile found for user, creating one...");
            await userProfileService.createUserProfile({
              uid: user.uid,
              email: user.email || '',
              displayName: user.displayName || '',
              membershipStatus: null as any,
              contributions: {
                count: 0,
                target: 3,
                completed: false,
                briefIds: []
              }
            });
            console.log("Created profile for existing user");
          }
          
          // Check membership status
          await checkMembershipStatus();
        } catch (error) {
          console.error("Error verifying user profile:", error);
        }
      } else {
        setMembershipStatus(null);
      }
      
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    loading,
    membershipStatus,
    signUp,
    login,
    logout,
    resetPassword,
    updateUserProfile,
    checkEmailExists,
    checkMembershipStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
} 