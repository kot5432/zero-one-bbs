'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@/lib/firestore';
import { firebaseAuth } from '@/lib/auth';

interface UserAuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const UserAuthContext = createContext<UserAuthContextType | undefined>(undefined);

export function UserAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const currentUser = await firebaseAuth.initAuthStateListener();
        setUser(currentUser);
        console.log('UserAuthContext: Auth initialized, user:', currentUser);
      } catch (error) {
        console.error('UserAuthContext: Auth initialization error:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const user = await firebaseAuth.signIn(email, password);
      setUser(user);
      console.log('UserAuthContext: User signed in:', user);
    } catch (error) {
      console.error('UserAuthContext: Sign in error:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, displayName: string) => {
    try {
      const user = await firebaseAuth.signUp(email, password, displayName);
      setUser(user);
      console.log('UserAuthContext: User signed up:', user);
    } catch (error) {
      console.error('UserAuthContext: Sign up error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseAuth.signOut();
      setUser(null);
      console.log('UserAuthContext: User signed out');
    } catch (error) {
      console.error('UserAuthContext: Sign out error:', error);
      throw error;
    }
  };

  return (
    <UserAuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </UserAuthContext.Provider>
  );
}

export function useUserAuth() {
  const context = useContext(UserAuthContext);
  if (context === undefined) {
    throw new Error('useUserAuth must be used within a UserAuthProvider');
  }
  return context;
}
