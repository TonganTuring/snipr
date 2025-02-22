declare module 'rss' {
  interface RSSOptions {
    title: string;
    description: string;
    feed_url: string;
    site_url: string;
    image_url?: string;
    managingEditor?: string;
    webMaster?: string;
    copyright?: string;
    language?: string;
    categories?: string[];
    pubDate?: string;
    ttl?: number;
  }

  interface RSSItemOptions {
    title: string;
    description: string;
    url: string;
    guid: string;
    author: string;
    date: Date;
    enclosure?: {
      url: string;
      type: string;
    };
    custom_elements?: Array<Record<string, any>>;
  }

  class RSS {
    constructor(options: RSSOptions);
    item(options: RSSItemOptions): void;
    xml(): string;
  }

  export default RSS;
} 