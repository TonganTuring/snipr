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
    customNamespaces?: {
      [key: string]: string;
    };
    custom_elements?: Array<{
      [key: string]: Array<{
        _attr?: { [key: string]: string };
        _text?: string;
      }>;
    }>;
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
    custom_elements?: Array<{
      [key: string]: Array<{
        _attr?: { [key: string]: string };
        _text?: string;
      }>;
    }>;
  }

  class RSS {
    constructor(options: RSSOptions);
    item(options: RSSItemOptions): void;
    xml(): string;
  }

  export default RSS;
} 