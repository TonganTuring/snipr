'use client';

import { useState, useEffect } from 'react';
import { PodcastItem } from '@/app/types/podcast';
import { PodcastEpisodeCard } from '@/app/components/PodcastEpisodeCard';
import { LoadingFeed } from './components/LoadingFeed';
import { useAuth } from '@/app/context/AuthContext';
import Parser from 'rss-parser';

interface PodcastFeed {
  title: string;
  description: string;
  category: string;
  image: string;
  frequency?: string;
  items?: PodcastItem[];
}

const parser = new Parser();

async function getPodcasts(rssFeedUrl: string | null): Promise<PodcastFeed[]> {
  if (!rssFeedUrl) {
    return [];
  }

  try {
    const response = await fetch(rssFeedUrl, { 
      cache: 'no-store',
      headers: {
        'Accept': 'application/rss+xml, application/xml, text/xml, */*'
      },
    });
  
    if (!response.ok) {
      throw new Error(`Failed to fetch podcasts: ${response.statusText}`);
    }

    const feedText = await response.text();
    const feed = await parser.parseString(feedText);
    
    return [{
      title: feed.title || 'My Personal Feed',
      description: feed.description || '',
      category: feed.categories?.[0] || 'Personal', 
      image: feed.image?.url || '/placeholder.jpg',
      frequency: 'Updated regularly',
      items: feed.items?.map(item => ({
        title: item.title || '',
        description: item.description || '',
        audioUrl: item.enclosure?.url || '',
        length: item.enclosure?.length || 0,
        guid: item.guid || '',
        pubDate: item.pubDate || '',
        duration: item.itunes?.duration || '',
        link: item.link,
        enclosure: {
          url: item.enclosure?.url || '',
          length: item.enclosure?.length || 0,
          type: item.enclosure?.type || ''
        },
        itunes: {
          duration: item.itunes?.duration,
          summary: item.itunes?.summary,
          explicit: item.itunes?.explicit,
          image: item.itunes?.image,
          author: item.itunes?.author
        }
      }))
    }];
  } catch (error) {
    console.error('Error fetching podcasts:', error);
    return [];
  }
}

function PodcastList() {
  const { rssFeedUrl } = useAuth();
  const [podcasts, setPodcasts] = useState<PodcastFeed[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchPodcasts() {
      const results = await getPodcasts(rssFeedUrl);
      setPodcasts(results);
      setIsLoading(false);
    }

    fetchPodcasts();
  }, [rssFeedUrl]);

  if (isLoading) {
    return <LoadingFeed />;
  }
  
  const episodes = podcasts
    .flatMap((podcast: PodcastFeed) => podcast.items || [])
    .sort((a: PodcastItem, b: PodcastItem) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

  if (episodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-gray-400 text-lg mb-4">
          No episodes found
        </p>
        <p className="text-gray-500 text-sm">
          Add content from the dashboard to start building your feed
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {episodes.map((episode: PodcastItem, index: number) => (
        <PodcastEpisodeCard 
          key={episode.guid || `${episode.title}-${index}`} 
          episode={episode} 
        />
      ))}
    </div>
  );
}

export default function MyPodcasts() {
  return (
    <div className="min-h-screen text-white p-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold">My Podcasts</h1>
        <p className="text-gray-400 mt-2">
          Listen to your personalized audio content
        </p>
      </header>
      
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Personal Feed</h2>
        <PodcastList />
      </section>
    </div>
  );
}