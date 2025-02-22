'use client';

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
          <span className="bg-gradient-to-r from-[#68D3FF] to-[#4DFFA2] bg-clip-text text-transparent">
            Read less, listen more
          </span>
        </h1>
        
        <p className="text-xl text-gray-300 max-w-2xl mb-12">
          Turn books, newsletters, videos, and YouTube channels into podcasts - all powered by AI.
        </p>

        <button 
          onClick={signInWithGoogle}
          className="bg-gradient-to-r from-emerald-500 to-blue-500 text-white px-8 py-4 rounded-full text-lg font-medium hover:opacity-90 transition-opacity"
        >
          {user ? 'Go to Dashboard' : 'Get Your Personal Podcast'}
        </button>
      </main>
    </div>
  );
}
