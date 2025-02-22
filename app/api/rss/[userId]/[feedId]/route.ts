import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/app/firebase/config';
import { doc, getDoc } from 'firebase/firestore';

interface PodcastItem {
  title: string;
  description: string;
  audioUrl: string;
  length: number;
  guid: string;
  pubDate: string;
  duration: string;
}

export async function GET(
  request: NextRequest,
): Promise<NextResponse> {
  try {
    // Extract params from the URL
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const userId = pathParts[pathParts.length - 2];
    const feedId = pathParts[pathParts.length - 1];
    
    console.log('RSS feed requested for user:', userId, 'with feedId:', feedId);
    
    console.log('Fetching user document...');
    const userDoc = await getDoc(doc(db, 'users', userId));

    if (!userDoc.exists()) {
      console.log('User document not found');
      return new NextResponse('User not found', { status: 404 });
    }

    const userData = userDoc.data();
    console.log('User data:', JSON.stringify(userData, null, 2));
    
    // Validate feed ID
    if (!userData || userData.feedId !== feedId) {
      console.log('Invalid feed ID. Expected:', userData?.feedId, 'Got:', feedId);
      return new NextResponse('Invalid feed ID', { status: 403 });
    }

      console.log('User data retrieved:', {
        displayName: userData.displayName,
        email: userData.email,
      });

    // Generate RSS feed XML
    const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" 
     xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd"
     xmlns:content="http://purl.org/rss/1.0/modules/content/"
     xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${userData.displayName}'s Snipr Feed</title>
    <description><![CDATA[Welcome to ${userData.displayName}'s personal audio feed! This is where you'll find all of ${userData.displayName}'s converted content from articles, books, and videos - transformed into audio for easy listening.]]></description>
    <link>${request.url}</link>
    <language>en-us</language>
    <copyright>© ${new Date().getFullYear()} ${userData.displayName}</copyright>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${request.url}" rel="self" type="application/rss+xml" />
    <itunes:author>${userData.displayName}</itunes:author>
    <itunes:owner>
      <itunes:name>${userData.displayName}</itunes:name>
      <itunes:email>${userData.email}</itunes:email>
    </itunes:owner>
    <itunes:image href="${userData.photoURL || 'https://snipr.com/default-podcast-image.jpg'}"/>
    <itunes:summary><![CDATA[This is ${userData.displayName}'s personal Snipr feed, where text content is transformed into audio for convenient listening. Powered by Snipr's AI technology, this feed contains converted articles, books, and videos that ${userData.displayName} has chosen to listen to rather than read.]]></itunes:summary>
    <itunes:category text="Personal"/>
    <itunes:explicit>false</itunes:explicit>
    <generator>Snipr Audio Converter</generator>
    ${userData.podcastItems?.map((item: PodcastItem) => `
      <item>
        <title>${item.title}</title>
        <description><![CDATA[${item.description}]]></description>
        <itunes:summary><![CDATA[${item.description}]]></itunes:summary>
        <enclosure 
          url="${item.audioUrl}" 
          type="audio/mpeg" 
          length="${item.length || '0'}"
        />
        <guid isPermaLink="false">${item.guid}</guid>
        <pubDate>${new Date(item.pubDate).toUTCString()}</pubDate>
        <itunes:duration>${item.duration || '00:00'}</itunes:duration>
        <itunes:explicit>false</itunes:explicit>
      </item>
    `).join('') || ''}
  </channel>
</rss>`;

    console.log('RSS feed generated successfully');
    return new NextResponse(rssXml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('Error generating RSS feed:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 