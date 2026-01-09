import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  sendPasswordResetEmail,
  confirmPasswordReset,
  updateProfile,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import BettingService from '../services/BettingService';

// Types
interface User {
  id: string;
  email: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;

  is_verified?: boolean;
  role?: string;

  created_at?: string;
  updated_at?: string;
  email_verified?: boolean;

}



interface AuthContextType {
  user: User | null;

  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (userData: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  refreshUser: () => Promise<void>;
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, username?: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => void;
  refreshProfile: () => Promise<void>;
  forgotPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (token: string, password: string) => Promise<{ success: boolean; error?: string }>;
}

interface RegisterData {
  email: string;
  password: string;
  username: string;
  first_name: string;
  last_name: string;
  avatar_url?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  // Initialize auth state on app load
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        // User is signed in
        await loadUserProfile(firebaseUser);
      } else {
        // User is signed out
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Load user profile from Firestore
  const loadUserProfile = async (firebaseUser: FirebaseUser) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data() as User;
        setUser({
          ...userData,
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          email_verified: firebaseUser.emailVerified
        });
        
        // Load or create betting user data
        await loadBettingUserData(firebaseUser.uid, userData.username || userData.email?.split('@')[0] || 'User', firebaseUser.email || '');

      } else {
        // Create new user profile
        const newUser: User = {
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          username: firebaseUser.displayName || '',
          first_name: '',
          last_name: '',
          avatar_url: firebaseUser.photoURL || '',

          is_verified: false,
          role: 'user',

          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          email_verified: firebaseUser.emailVerified,

        };
        
        await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
        setUser(newUser);
        
        // Create betting user data
        await loadBettingUserData(firebaseUser.uid, newUser.username || newUser.email?.split('@')[0] || 'User', newUser.email);

      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
      setUser(null);
    }
  };

  // Load or create betting user data
  const loadBettingUserData = async (firebaseUserId: string, username: string, email: string) => {
    try {
      const bettingService = BettingService.getInstance();
      
      // Check if betting user already exists
      const existingBettingUser = await bettingService.getUserByFirebaseId(firebaseUserId);
      
      if (!existingBettingUser) {
        // Create new betting user
        await bettingService.createUserFromFirebase(firebaseUserId, username, email);
      }
      
      // Store the betting user ID for quick access
      const bettingUser = await bettingService.getUserByFirebaseId(firebaseUserId);
      if (bettingUser) {
        localStorage.setItem('betting_user_id', bettingUser.id);
      }
    } catch (error) {
      console.error('Failed to load betting user data:', error);
    }
  };

  // Legacy login function
  const login = async (email: string, password: string) => {
    return signIn(email, password);
  };

  // Legacy register function
  const register = async (userData: RegisterData) => {
    return signUp(userData.email, userData.password, userData.username);
  };

  // Legacy logout function
  const logout = () => {
    signOut();
  };

  // Legacy updateUser function
  const updateUser = async (userData: Partial<User>) => {
    if (user && auth.currentUser) {
      try {
        const updatedUser = { ...user, ...userData, updated_at: new Date().toISOString() };
        await updateDoc(doc(db, 'users', user.id), userData);
        setUser(updatedUser);
      } catch (error) {
        console.error('Failed to update user:', error);
      }
    }
  };

  // Legacy refreshUser function
  const refreshUser = async () => {
    if (auth.currentUser) {
      await loadUserProfile(auth.currentUser);
    }
  };

  // Sign in with Firebase
  const signIn = async (email: string, password: string, rememberMe: boolean = false): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      
      // Firefox compatibility: Handle persistence setting with error handling
      try {
        await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
      } catch (persistenceError) {
        console.warn('Persistence setting failed, continuing with default:', persistenceError);
        // Continue without setting persistence if it fails (Firefox compatibility)
      }

      const result = await signInWithEmailAndPassword(auth, email, password);
      
      if (result.user) {
        // User profile will be loaded by onAuthStateChanged
        return { success: true };
      } else {
        return { success: false, error: 'Sign in failed' };
      }
    } catch (error: any) {
      console.error('Sign in error:', error);
      let errorMessage = 'Sign in failed';
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your connection and try again';
      } else if (error.code === 'auth/operation-not-allowed') {
        errorMessage = 'Sign-in method not enabled. Please contact support';
      }
      
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  // Sign up with Firebase
  const signUp = async (
    email: string, 
    password: string, 
    username?: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);

      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      if (result.user) {
        // Update display name if username provided
        if (username) {
          try {
            await updateProfile(result.user, { displayName: username });
          } catch (profileError) {
            console.warn('Failed to update profile, continuing:', profileError);
            // Continue even if profile update fails
          }
        }
        
        // User profile will be created by loadUserProfile
        return { success: true };
      } else {
        return { success: false, error: 'Sign up failed' };
      }
    } catch (error: any) {
      console.error('Sign up error:', error);
      let errorMessage = 'Sign up failed';
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'An account with this email already exists';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Use at least 6 characters';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your connection and try again';
      } else if (error.code === 'auth/operation-not-allowed') {
        errorMessage = 'Sign-up method not enabled. Please contact support';
      }
      
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  // Sign out with Firebase
  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  // Forgot password with Firebase
  const forgotPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (error: any) {
      console.error('Forgot password error:', error);
      let errorMessage = 'Failed to send reset email';
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      }
      
      return { success: false, error: errorMessage };
    }
  };

  // Reset password with Firebase
  const resetPassword = async (token: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await confirmPasswordReset(auth, token, password);
      return { success: true };
    } catch (error: any) {
      console.error('Reset password error:', error);
      let errorMessage = 'Failed to reset password';
      
      if (error.code === 'auth/invalid-action-code') {
        errorMessage = 'Invalid or expired reset link';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Use at least 6 characters';
      }
      
      return { success: false, error: errorMessage };
    }
  };

  // Refresh user profile
  const refreshProfile = async () => {
    if (auth.currentUser) {
      await loadUserProfile(auth.currentUser);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    updateUser,
    refreshUser,
    signIn,
    signUp,
    signOut,
    refreshProfile,
    forgotPassword,
    resetPassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
