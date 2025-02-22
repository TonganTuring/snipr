import RSS from 'rss';
import { getFirestore } from 'firebase-admin/firestore';
import { adminApp } from '@/app/firebase/admin';

const db = getFirestore(adminApp);

interface Article {
  title: string;
  url: string;
  audioUrl: string;
  createdAt: FirebaseFirestore.Timestamp;
}

export async function generateUserRssFeed(userId: string): Promise<string> {
  const feed = new RSS({
    title: "Your Personal Article Podcast",
    description: "Audio versions of your saved articles",
    feed_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/rss/${userId}`,
    site_url: process.env.NEXT_PUBLIC_BASE_URL || '',
    image_url: `${process.env.NEXT_PUBLIC_BASE_URL}/podcast-logo.png`,
    managingEditor: 'noreply@example.com',
    webMaster: 'noreply@example.com',
    copyright: `${new Date().getFullYear()} Your Article Podcast`,
    language: 'en',
    pubDate: new Date().toString(),
    ttl: 60,
    custom_namespaces: {
      'itunes': 'http://www.itunes.com/dtds/podcast-1.0.dtd'
    },
    custom_elements: [
      {'itunes:category': [{ _attr: { text: 'Technology' } }]},
      {'itunes:category': [{ _attr: { text: 'News' } }]}
    ]
  });

  // Get user's articles from Firestore
  const articlesSnapshot = await db
    .collection('users')
    .doc(userId)
    .collection('articles')
    .orderBy('createdAt', 'desc')
    .limit(50)
    .get();

  articlesSnapshot.forEach((doc) => {
    const article = doc.data() as Article;
    
    feed.item({
      title: article.title,
      description: `Audio version of article: ${article.url}`,
      url: article.url,
      guid: doc.id,
      author: 'Article Text-to-Speech',
      date: article.createdAt.toDate(),
      enclosure: {
        url: article.audioUrl,
        type: 'audio/mpeg'
      },
      custom_elements: [
        {'itunes:author': 'Article Text-to-Speech'},
        {'itunes:duration': '00:30:00'}, // Estimated duration
        {'itunes:image': { _attr: { href: `${process.env.NEXT_PUBLIC_BASE_URL}/podcast-logo.png` } }}
      ]
    });
  });

  return feed.xml();
} 