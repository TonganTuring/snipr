'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebase/config';
import { GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut, User } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  rssFeedUrl: string | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signInWithGoogle: async () => {},
  signOut: async () => {},
  rssFeedUrl: null,
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [rssFeedUrl, setRssFeedUrl] = useState<string | null>(null);
  const router = useRouter();

  const createUserDocument = async (user: User) => {
    try {
      console.log('Creating user document for:', user.uid);
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        console.log('User document does not exist, creating new one');
        // Generate a unique feed identifier
        const feedId = uuidv4();
        
        // Create new user document with RSS feed info
        await setDoc(userRef, {
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          createdAt: new Date().toISOString(),
          podcastItems: [
            {
              title: "Welcome to Snipr",
              description: "Welcome to your personalized audio feed! This is a sample episode to demonstrate how Snipr works.",
              audioUrl: "https://d3ctxlq1ktw2nl.cloudfront.net/staging/2025-1-5/2d582855-00f2-1e03-ae12-a359f6807e49.mp3",
              guid: "welcome-episode-1",
              pubDate: new Date().toISOString(),
              duration: "02:30",
              length: "3000000"
            },
            {
              title: "Getting Started with Snipr",
              description: "Learn how to make the most of your Snipr feed by converting your favorite content into audio.",
              audioUrl: "https://d3ctxlq1ktw2nl.cloudfront.net/staging/2025-1-5/2d582855-00f2-1e03-ae12-a359f6807e49.mp3",
              guid: "getting-started-1",
              pubDate: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
              duration: "03:45",
              length: "4500000"
            }
          ],
          feedId: feedId
        });
        console.log('User document created successfully');
        
        // Set RSS feed URL with the unique feed identifier
        const baseUrl = window.location.origin;
        const feedUrl = `${baseUrl}/api/rss/${user.uid}/${feedId}`;
        console.log('Setting RSS feed URL:', feedUrl);
        setRssFeedUrl(feedUrl);
      } else {
        // Get existing feed URL for returning users
        const userData = userSnap.data();
        const baseUrl = window.location.origin;
        const feedUrl = `${baseUrl}/api/rss/${user.uid}/${userData.feedId}`;
        console.log('Setting existing RSS feed URL:', feedUrl);
        setRssFeedUrl(feedUrl);
      }
    } catch (error) {
      console.error('Error in createUserDocument:', error);
    }
  };

  useEffect(() => {
    console.log('Setting up auth state listener');
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      console.log('Auth state changed:', user?.uid);
      setUser(user);
      if (user) {
        await createUserDocument(user);
      } else {
        setRssFeedUrl(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      console.log('Starting Google sign in');
      const result = await signInWithPopup(auth, provider);
      console.log('Google sign in successful');
      await createUserDocument(result.user);
      router.push('/dashboard');
    } catch (error) {
      console.error('Error signing in with Google:', error);
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setRssFeedUrl(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOut, rssFeedUrl }}>
      {children}
    </AuthContext.Provider>
  );
} 