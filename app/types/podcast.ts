export interface PodcastItem {
  title: string;
  description: string;
  audioUrl: string;
  length: number;
  guid: string;
  pubDate: string;
  duration: string;
  link?: string | null;
  enclosure?: {
    url: string;
    length: number;
    type: string;
  };
  itunes?: {
    duration?: string;
    summary?: string;
    explicit?: string;
    image?: string | null;
    author?: string | null;
  };
} 