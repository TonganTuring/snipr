import RSS from 'rss';

export function createPodcastFeed(title: string, description: string, siteUrl: string) {
  return new RSS({
    title,
    description,
    feed_url: `${siteUrl}/api/rss`,
    site_url: siteUrl,
    image_url: `${siteUrl}/podcast-logo.png`,
    language: 'en',
    pubDate: new Date().toString(),
    ttl: 60,
    customNamespaces: {
      'itunes': 'http://www.itunes.com/dtds/podcast-1.0.dtd'
    },
    custom_elements: [
      {'itunes:category': [{ _attr: { text: 'Technology' } }]},
      {'itunes:category': [{ _attr: { text: 'News' } }]}
    ]
  });
} 