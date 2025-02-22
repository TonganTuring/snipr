'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { updateProfile, updateEmail } from 'firebase/auth';
import Image from 'next/image';

export default function Settings() {
  const { user, rssFeedUrl } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setEmail(user.email || '');
      setPhotoURL(user.photoURL || '');
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // Update display name and photo URL if changed
      if (displayName !== user.displayName || photoURL !== user.photoURL) {
        await updateProfile(user, {
          displayName: displayName,
          photoURL: photoURL,
        });
      }

      // Update email if changed
      if (email !== user.email) {
        await updateEmail(user, email);
      }

      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: 'Failed to update profile. Please try again.' 
      });
      console.error('Error updating profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (rssFeedUrl) {
      try {
        await navigator.clipboard.writeText(rssFeedUrl);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch (err) {
        console.error('Failed to copy text: ', err);
      }
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-4xl font-bold mb-8">Settings</h1>
      
      {/* RSS Feed URL Section */}
      <div className="mb-8 p-6 bg-gray-800/50 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Your Personal Podcast Feed</h2>
        <p className="text-gray-300 mb-4">
          Use this RSS feed URL to subscribe to your personal podcast feed in any podcast player:
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={rssFeedUrl || ''}
            readOnly
            className="flex-1 bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-2 text-sm"
          />
          <button
            onClick={copyToClipboard}
            className="btn-primary whitespace-nowrap"
          >
            {copySuccess ? 'Copied!' : 'Copy URL'}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Profile Picture */}
        <div className="flex items-center space-x-4">
          <div className="relative w-20 h-20 rounded-full overflow-hidden bg-gray-800">
            {photoURL ? (
              <Image
                src={photoURL}
                alt="Profile"
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                No Photo
              </div>
            )}
          </div>
          <div>
            <input
              type="url"
              value={photoURL}
              onChange={(e) => setPhotoURL(e.target.value)}
              placeholder="Enter photo URL"
              className="bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-sm text-gray-400 mt-1">
              Enter the URL of your profile picture
            </p>
          </div>
        </div>

        {/* Display Name */}
        <div>
          <label htmlFor="displayName" className="block text-sm font-medium mb-2">
            Display Name
          </label>
          <input
            type="text"
            id="displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-2">
            Email
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Message Display */}
        {message.text && (
          <div className={`p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-800/50 text-green-200' : 'bg-red-800/50 text-red-200'
          }`}>
            {message.text}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary w-full disabled:opacity-50"
        >
          {isLoading ? 'Updating...' : 'Update Profile'}
        </button>
      </form>
    </div>
  );
}