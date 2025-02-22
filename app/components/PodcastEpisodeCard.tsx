import { PodcastItem } from '@/app/types/podcast';
import { Play, Clock, Headphones } from 'lucide-react';
import Image from 'next/image';

interface PodcastEpisodeCardProps {
  episode: PodcastItem;
}

export function PodcastEpisodeCard({ episode }: PodcastEpisodeCardProps) {
  const formatDuration = (duration: string) => {
    // If duration is in HH:MM:SS format, return as is
    if (duration.includes(':')) return duration;
    
    // If duration is in seconds, convert to HH:MM:SS
    const seconds = parseInt(duration);
    if (isNaN(seconds)) return '00:00';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 hover:bg-gray-700/50 transition-all duration-200 border border-gray-700/50">
      <div className="flex gap-6">
        <div className="relative flex-shrink-0 w-24 h-24 md:w-32 md:h-32 rounded-lg overflow-hidden bg-gray-700/50">
          {episode.itunes?.image ? (
            <Image
              src={episode.itunes.image}
              alt={episode.title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <Headphones className="w-8 h-8" />
            </div>
          )}
        </div>
        <div className="flex flex-col gap-3 flex-1">
          <h3 className="font-semibold text-xl text-white">{episode.title}</h3>
          
          <div className="flex items-center gap-4 text-sm text-gray-400">
            {episode.pubDate && (
              <span>
                {new Date(episode.pubDate).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </span>
            )}
            {episode.duration && (
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{formatDuration(episode.duration)}</span>
              </div>
            )}
          </div>

          {episode.description && (
            <p className="text-gray-300 text-sm line-clamp-2">
              {episode.description}
            </p>
          )}

          <div className="flex items-center gap-4 mt-2">
            {episode.audioUrl && (
              <a
                href={episode.audioUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary inline-flex items-center gap-2"
              >
                <Play className="w-4 h-4" />
                <span>Play Episode</span>
              </a>
            )}
            {episode.link && (
              <a
                href={episode.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 text-sm"
              >
                View Details
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 