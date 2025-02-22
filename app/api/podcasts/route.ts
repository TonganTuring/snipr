import { NextResponse } from 'next/server';
import Parser from 'rss-parser';

const parser = new Parser();

// For now, we'll hardcode some RSS feed URLs. Later this should come from user's settings/database
const SAMPLE_RSS_FEEDS = [
  'https://anchor.fm/s/d9cddbb8/podcast/rss',
];

export async function GET() {
  try {
    const podcastPromises = SAMPLE_RSS_FEEDS.map(async (feedUrl) => {
      try {
        console.log('Fetching feed:', feedUrl);
        
        // First fetch the RSS feed content
        const response = await fetch(feedUrl, {
          headers: {
            'Accept': 'application/rss+xml, application/xml, text/xml, */*'
          }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch feed: ${response.statusText}`);
        }
        
        const feedText = await response.text();
        // Then parse the feed content
        const feed = await parser.parseString(feedText);
        
        return {
          title: feed.title || 'Untitled Podcast',
          description: feed.description || '',
          category: feed.categories?.[0] || 'Uncategorized', 
          image: feed.image?.url || '/placeholder.jpg',
          frequency: 'Updated regularly',
          items: feed.items?.slice(0, 5).map(item => ({
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
        };
      } catch (error) {
        console.error(`Error parsing feed ${feedUrl}:`, error);
        return null;
      }
    });

    const podcasts = (await Promise.all(podcastPromises)).filter(Boolean);
    console.log('Podcasts:', podcasts);

    return NextResponse.json({ podcasts });
  } catch (error: unknown) {
    console.error('Error fetching podcasts:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      { error: 'Failed to fetch podcasts', details: errorMessage },
      { status: 500 }
    );
  }
} 