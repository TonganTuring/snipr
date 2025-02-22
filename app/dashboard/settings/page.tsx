'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { updateProfile, updateEmail } from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import Image from 'next/image';

export default function Settings() {
  const { user, rssFeedUrl } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [podcastImageURL, setPodcastImageURL] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [copySuccess, setCopySuccess] = useState(false);
  const profileImageInputRef = useRef<HTMLInputElement>(null);
  const podcastImageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        setDisplayName(user.displayName || '');
        setEmail(user.email || '');
        setPhotoURL(user.photoURL || '');
        
        // Fetch podcast image from Firestore
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setPodcastImageURL(userData.podcastImageURL || user.photoURL || '');
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }
    };

    fetchUserData();
  }, [user]);

  const handleImageUpload = async (file: File, type: 'profile' | 'podcast') => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const storage = getStorage();
      const folder = type === 'profile' ? 'profile-images' : 'podcast-images';
      
      // Create a unique filename with timestamp
      const timestamp = Date.now();
      const fileExtension = file.name.split('.').pop();
      const fileName = `${timestamp}.${fileExtension}`;
      const imageRef = ref(storage, `${folder}/${user.uid}/${fileName}`);
      
      // Set metadata with CORS headers
      const metadata = {
        contentType: file.type,
        customMetadata: {
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=31536000',
        }
      };

      // Upload with exponential backoff retry
      let attempts = 0;
      const maxAttempts = 3;
      
      while (attempts < maxAttempts) {
        try {
          // Upload the file with metadata
          await uploadBytes(imageRef, file, metadata);
          break; // If successful, break the retry loop
        } catch (error) {
          attempts++;
          if (attempts === maxAttempts) throw error;
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempts) * 1000));
        }
      }
      
      // Get the download URL with retry
      attempts = 0;
      let downloadURL;
      
      while (attempts < maxAttempts) {
        try {
          downloadURL = await getDownloadURL(imageRef);
          break;
        } catch (error) {
          attempts++;
          if (attempts === maxAttempts) throw error;
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempts) * 1000));
        }
      }
      
      if (!downloadURL) {
        throw new Error('Failed to get download URL');
      }
      
      if (type === 'profile') {
        // Update Firebase Auth profile
        await updateProfile(user, {
          photoURL: downloadURL
        });
        setPhotoURL(downloadURL);
      } else {
        // Update podcast image in Firestore
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          podcastImageURL: downloadURL
        });
        setPodcastImageURL(downloadURL);
      }
      
      setMessage({ type: 'success', text: `${type === 'profile' ? 'Profile' : 'Podcast'} image uploaded successfully!` });
    } catch (error) {
      console.error('Error uploading image:', error);
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : `Failed to upload ${type} image. Please try again.`
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'profile' | 'podcast') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Please upload an image file.' });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Image size should be less than 5MB.' });
      return;
    }

    handleImageUpload(file, type);
  };

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

      // Update podcast image in Firestore if changed
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        podcastImageURL: podcastImageURL
      });

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

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Profile Picture */}
        <div>
          <label className="block text-sm font-medium mb-4">Profile Image</label>
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="relative w-32 h-32 rounded-full overflow-hidden bg-gray-800">
              {photoURL ? (
                <Image
                  src={photoURL}
                  alt="Profile"
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  No Image
                </div>
              )}
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <input
                  type="file"
                  ref={profileImageInputRef}
                  onChange={(e) => handleFileChange(e, 'profile')}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => profileImageInputRef.current?.click()}
                  className="btn-primary mb-2"
                >
                  Upload Profile Image
                </button>
                <p className="text-sm text-gray-400">
                  Recommended: Square image, at least 400x400 pixels. Max size: 5MB
                </p>
              </div>
              <div>
                <label htmlFor="photoURL" className="block text-sm font-medium mb-1">
                  Or enter profile image URL
                </label>
                <input
                  type="url"
                  id="photoURL"
                  value={photoURL}
                  onChange={(e) => setPhotoURL(e.target.value)}
                  placeholder="Enter profile image URL"
                  className="bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Podcast Image */}
        <div>
          <label className="block text-sm font-medium mb-4">Podcast Cover Image</label>
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="relative w-32 h-32 rounded-lg overflow-hidden bg-gray-800">
              {podcastImageURL ? (
                <Image
                  src={podcastImageURL}
                  alt="Podcast Cover"
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  No Image
                </div>
              )}
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <input
                  type="file"
                  ref={podcastImageInputRef}
                  onChange={(e) => handleFileChange(e, 'podcast')}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => podcastImageInputRef.current?.click()}
                  className="btn-primary mb-2"
                >
                  Upload Podcast Cover
                </button>
                <p className="text-sm text-gray-400">
                  Recommended: Square image, at least 1400x1400 pixels. Max size: 5MB
                </p>
              </div>
              <div>
                <label htmlFor="podcastImageURL" className="block text-sm font-medium mb-1">
                  Or enter podcast cover URL
                </label>
                <input
                  type="url"
                  id="podcastImageURL"
                  value={podcastImageURL}
                  onChange={(e) => setPodcastImageURL(e.target.value)}
                  placeholder="Enter podcast cover URL"
                  className="bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
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