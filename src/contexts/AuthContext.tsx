import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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
  fetchSignInMethodsForEmail,
  signInWithPopup,
  sendEmailVerification
} from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
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
  signInWithGoogle: () => Promise<UserCredential>;
  sendVerificationEmail: () => Promise<void>;
  reloadUser: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = React.useContext(AuthContext);
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
    let userCredential: UserCredential | null = null;
    
    try {
      // Step 1: Create user account
      userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log("User account created successfully");
      
      // Step 2: Create user profile (critical step)
      try {
        await userProfileService.createUserProfile({
          uid: userCredential.user.uid,
          email: email,
          displayName: userCredential.user.displayName || '',
          membershipStatus: 'contributor',
          contributions: {
            count: 0,
            target: 3,
            completed: false,
            briefIds: []
          }
        });
        console.log("User profile created successfully");
      } catch (profileError) {
        console.error("Error creating user profile:", profileError);
        
        // Rollback: Delete the Firebase Auth user if profile creation fails
        try {
          await userCredential.user.delete();
          console.log("Rolled back user creation due to profile creation failure");
        } catch (deleteError) {
          console.error("Failed to rollback user creation:", deleteError);
        }
        
        throw new Error("Registration failed: Unable to create user profile. Please try again.");
      }
      
      // Step 3: Send verification email (non-critical, user can resend)
      try {
        await sendEmailVerification(userCredential.user);
        console.log("Verification email sent successfully");
      } catch (emailError) {
        console.error("Error sending verification email:", emailError);
        // Don't fail registration for email issues - user can resend later
        console.log("Registration completed but verification email failed - user can resend");
      }
      
      return userCredential;
    } catch (error: any) {
      console.error("Error during signup:", error);
      
      // Provide more specific error messages
      if (error.code === 'auth/email-already-in-use') {
        throw new Error("An account with this email already exists. Please try logging in instead.");
      } else if (error.code === 'auth/weak-password') {
        throw new Error("Password is too weak. Please choose a stronger password.");
      } else if (error.code === 'auth/invalid-email') {
        throw new Error("Invalid email address. Please check your email and try again.");
      } else if (error.message && error.message.includes("profile")) {
        // Re-throw profile creation errors as-is
        throw error;
      } else {
        throw new Error("Registration failed. Please check your connection and try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  // Login function
  async function login(email: string, password: string) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  // Google Sign-in function
  async function signInWithGoogle() {
    setLoading(true);
    try {
      const userCredential = await signInWithPopup(auth, googleProvider);
      const user = userCredential.user;

      // Check if user profile exists
      const profile = await userProfileService.getUserProfileByUid(user.uid);
      
      // If no profile exists, create one
      if (!profile) {
        await userProfileService.createUserProfile({
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || '',
          membershipStatus: 'contributor',
          contributions: {
            count: 0,
            target: 3,
            completed: false,
            briefIds: []
          }
        });
        console.log("Created profile for Google user");
      }
      
      return userCredential;
    } catch (error) {
      console.error("Error during Google sign-in:", error);
      throw error;
    } finally {
      setLoading(false);
    }
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

  // Resend verification email
  async function sendVerificationEmail() {
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser);
    } else {
      throw new Error('No user is signed in');
    }
  }

  // Reload user
  async function reloadUser() {
    if (auth.currentUser) {
      await auth.currentUser.reload();
      setCurrentUser({ ...auth.currentUser });
    }
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
      if (user) {
        await user.reload();
      }
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
              membershipStatus: 'contributor',
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
    checkMembershipStatus,
    signInWithGoogle,
    sendVerificationEmail,
    reloadUser
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
} 