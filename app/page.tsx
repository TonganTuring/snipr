'use client';

import Link from 'next/link';
import Navbar from './components/Navbar';
import { useAuth } from './context/AuthContext';

export default function Home() {
  const { signInWithGoogle, user } = useAuth();

  return (
    <div className="h-screen --background flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4">
        <h1 className="text-6xl md:text-7xl font-bold mb-6">
          Read less, listen more
        </h1>
        
        <p className="text-xl text-gray-300 max-w-2xl mb-12">
          Turn books, newsletters, videos, and YouTube channels into podcasts - all powered by AI.
        </p>

        {user ? (
          <Link 
            href="/dashboard"
            className="btn-primary"
          >
            Go to Dashboard
          </Link>
        ) : (
          <button
            onClick={signInWithGoogle}
            className="btn-primary"
          >
            Get Your Personal Podcast
          </button>
        )}
      </main>
    </div>
  );
}
