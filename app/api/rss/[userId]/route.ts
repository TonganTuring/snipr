import { NextResponse } from 'next/server';
import { db } from '../../../firebase/config';
import { collection, query, where, getDocs, DocumentData } from 'firebase/firestore';
import { createPodcastFeed } from '../../../utils/rss';

interface Episode extends DocumentData {
  id: string;
  title: string;
  summary: string;
  sourceUrl: string;
  createdAt: string;
  audioUrl: string;
  duration: number;
  status: 'processing' | 'completed' | 'failed';
}

export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;

    // Get user's episodes
    const episodesRef = collection(db, 'users', userId, 'episodes');
    const episodesQuery = query(
      episodesRef,
      where('status', '==', 'completed')
    );
    const episodesSnapshot = await getDocs(episodesQuery);

    // Create RSS feed
    const feed = createPodcastFeed(
      'My Personal Podcast',
      'Articles converted to audio for your listening pleasure',
      process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    );

    // Add episodes to feed
    episodesSnapshot.forEach((doc) => {
      const episode = doc.data() as Episode;
      const durationInMinutes = Math.round(episode.duration / 60);
      
      feed.item({
        title: episode.title,
        description: episode.summary,
        url: episode.sourceUrl,
        guid: episode.id,
        author: 'Article Reader',
        date: new Date(episode.createdAt),
        enclosure: {
          url: episode.audioUrl,
          type: 'audio/mpeg'
        },
        custom_elements: [
          { 'itunes:author': [{ _text: 'Article Reader' }] },
          { 'itunes:subtitle': [{ _text: episode.title }] },
          { 'itunes:summary': [{ _text: episode.summary }] },
          { 'itunes:duration': [{ _text: `${durationInMinutes}:00` }] }
        ]
      });
    });

    // Return RSS feed
    return new NextResponse(feed.xml(), {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=60'
      },
    });
  } catch (error) {
    console.error('Error generating RSS feed:', error);
    return NextResponse.json(
      { error: 'Failed to generate RSS feed' },
      { status: 500 }
    );
  }
} 