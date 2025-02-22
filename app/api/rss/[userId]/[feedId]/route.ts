import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/app/firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { PodcastItem } from '@/app/types/podcast';

// Helper function to escape XML special characters
function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
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
      return new NextResponse('User not found', { 
        status: 404,
        headers: {
          'Content-Type': 'text/plain',
        }
      });
    }

    const userData = userDoc.data();
    console.log('User data:', JSON.stringify(userData, null, 2));
    
    // Validate feed ID
    if (!userData || userData.feedId !== feedId) {
      console.log('Invalid feed ID. Expected:', userData?.feedId, 'Got:', feedId);
      return new NextResponse('Invalid feed ID', { 
        status: 403,
        headers: {
          'Content-Type': 'text/plain',
        }
      });
    }

    // Generate RSS feed XML
    const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" 
     xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd"
     xmlns:content="http://purl.org/rss/1.0/modules/content/"
     xmlns:googleplay="http://www.google.com/schemas/play-podcasts/1.0"
     xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title><![CDATA[${userData.displayName}'s Snipr Feed]]></title>
    <link>${escapeXml(userData.websiteUrl || request.url)}</link>
    <image>
      <url>${escapeXml(userData.podcastImageURL || 'https://snipr.com/default-podcast-image.jpg')}</url>
      <title><![CDATA[${userData.displayName}'s Snipr Feed]]></title>
      <link>${escapeXml(userData.websiteUrl || request.url)}</link>
    </image>
    <description><![CDATA[Welcome to ${userData.displayName}'s personal audio feed! This is where you'll find all of ${userData.displayName}'s converted content from articles, books, and videos - transformed into audio for easy listening.]]></description>
    <language>en-us</language>
    <copyright>© ${new Date().getFullYear()} ${escapeXml(userData.displayName)}</copyright>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${escapeXml(request.url)}" rel="self" type="application/rss+xml" />
    <itunes:author>${escapeXml(userData.displayName)}</itunes:author>
    <itunes:owner>
      <itunes:name>${escapeXml(userData.displayName)}</itunes:name>
      <itunes:email>${escapeXml(userData.email)}</itunes:email>
    </itunes:owner>
    <itunes:image href="${escapeXml(userData.podcastImageURL || 'https://snipr.com/default-podcast-image.jpg')}"/>
    <itunes:summary><![CDATA[This is ${userData.displayName}'s personal Snipr feed, where text content is transformed into audio for convenient listening. Powered by Snipr's AI technology, this feed contains converted articles, books, and videos that ${userData.displayName} has chosen to listen to rather than read.]]></itunes:summary>
    <itunes:category text="Technology">
      <itunes:category text="Content Creation"/>
    </itunes:category>
    <itunes:explicit>no</itunes:explicit>
    <itunes:type>episodic</itunes:type>
    <generator>Snipr Audio Converter</generator>
    ${userData.podcastItems?.map((item: PodcastItem) => `
      <item>
        <title><![CDATA[${item.title}]]></title>
        <description><![CDATA[${item.description}]]></description>
        <content:encoded><![CDATA[${item.description}]]></content:encoded>
        <itunes:summary><![CDATA[${item.description}]]></itunes:summary>
        <itunes:subtitle><![CDATA[${item.description.substring(0, 255)}]]></itunes:subtitle>
        <enclosure 
          url="${escapeXml(item.audioUrl)}" 
          type="audio/mpeg" 
          length="${item.length || '0'}"
        />
        <guid isPermaLink="false">${escapeXml(item.guid)}</guid>
        <pubDate>${new Date(item.pubDate).toUTCString()}</pubDate>
        <itunes:duration>${escapeXml(item.duration || '00:00')}</itunes:duration>
        <itunes:explicit>no</itunes:explicit>
        <itunes:episodeType>full</itunes:episodeType>
      </item>
    `).join('') || ''}
  </channel>
</rss>`;

    console.log('RSS feed generated successfully');
    
    // Return with proper XML headers
    return new NextResponse(rssXml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
        'X-Content-Type-Options': 'nosniff'
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
    return new NextResponse('Internal Server Error', { 
      status: 500,
      headers: {
        'Content-Type': 'text/plain',
      }
    });
  }
} 