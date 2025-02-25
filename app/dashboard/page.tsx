'use client';

import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const [url, setUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { user } = useAuth();

  const handleSubmitArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url || !user) return;

    try {
      setIsProcessing(true);
      
      // Get the auth token
      const token = await user.getIdToken();

      const response = await fetch('/api/process-article', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          url,
          userId: user.uid,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to process article');
      }

      // Clear the input and show success message
      setUrl('');
      alert('Article submitted successfully! You can now navigate away - your podcast will be ready soon.');
    } catch (error) {
      console.error('Error processing article:', error);
      alert('Failed to process article. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold mb-8">Add New Content</h1>
      
      {/* Article URL Input */}
      <form onSubmit={handleSubmitArticle} className="mb-8">
        <label htmlFor="article-url" className="block text-sm font-medium mb-2">
          Convert Article to Podcast
        </label>
        <div className="flex gap-2">
          <input
            type="url"
            id="article-url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1 bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Paste article URL here"
            required
          />
          <button 
            type="submit"
            disabled={isProcessing}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? 'Processing...' : 'Convert to Podcast'}
          </button>
        </div>
        <p className="mt-2 text-sm text-gray-400">
          Paste any article URL to convert it into a podcast episode
        </p>
      </form>

      {/* YouTube/RSS Input */}
      <div className="mb-6">
        <label htmlFor="url" className="block text-sm font-medium mb-2">
          Paste URL (YouTube or RSS feed)
        </label>
        <div className="flex gap-2">
          <input
            type="url"
            id="url"
            className="flex-1 bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://"
          />
          <button className="btn-primary">
            Add
          </button>
        </div>
      </div>

      {/* File Upload */}
      <div>
        <label htmlFor="file" className="block text-sm font-medium mb-2">
          Upload EPUB
        </label>
        <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center">
          <input
            type="file"
            id="file"
            accept=".epub"
            className="hidden"
          />
          <label
            htmlFor="file"
            className="cursor-pointer inline-flex flex-col items-center gap-2"
          >
            <span className="text-sm text-gray-400">
              Drag and drop your EPUB file here, or click to browse
            </span>
            <button className="btn-primary">
              Choose File
            </button>
          </label>
        </div>
      </div>
    </div>
  );
} 