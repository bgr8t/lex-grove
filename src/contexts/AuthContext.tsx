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
  signUp: (email: string, password: string) => Promise<UserCredential>;
  login: (email: string, password: string) => Promise<UserCredential>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (displayName: string) => Promise<void>;
  checkEmailExists: (email: string) => Promise<boolean>;
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

  // Sign up function
  async function signUp(email: string, password: string) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Create a user profile after successful signup
    try {
      await userProfileService.createUserProfile(
        email,
        userCredential.user.displayName || undefined
      );
    } catch (error) {
      console.error("Error creating user profile:", error);
      // Continue even if profile creation fails, we can try again later
    }
    
    return userCredential;
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

  useEffect(() => {
    // Subscribe to auth state changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    loading,
    signUp,
    login,
    logout,
    resetPassword,
    updateUserProfile,
    checkEmailExists
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
} 