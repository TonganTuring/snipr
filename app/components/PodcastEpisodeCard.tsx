import { PodcastItem } from '@/app/types/podcast';
import { Play, Pause, Clock, Headphones, Share2, Download, ExternalLink, Volume2 } from 'lucide-react';
import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';

interface PodcastEpisodeCardProps {
  episode: PodcastItem;
}

export function PodcastEpisodeCard({ episode }: PodcastEpisodeCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

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

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: episode.title,
          text: episode.description,
          url: episode.link || window.location.href,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback to copying link to clipboard
      navigator.clipboard.writeText(episode.link || window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = episode.audioUrl;
    link.download = `${episode.title}.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

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

          {episode.audioUrl && (
            <>
              <audio
                ref={audioRef}
                src={episode.audioUrl}
                onTimeUpdate={handleTimeUpdate}
                onEnded={() => setIsPlaying(false)}
              />
              
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePlayPause}
                    className="p-2 rounded-full bg-blue-600 hover:bg-blue-700 transition-colors"
                  >
                    {isPlaying ? (
                      <Pause className="w-5 h-5" />
                    ) : (
                      <Play className="w-5 h-5" />
                    )}
                  </button>
                  
                  <div className="relative flex items-center gap-2 flex-1">
                    <div className="flex-1">
                      <input
                        type="range"
                        min={0}
                        max={duration || 0}
                        value={currentTime}
                        onChange={(e) => {
                          if (audioRef.current) {
                            audioRef.current.currentTime = Number(e.target.value);
                          }
                        }}
                        className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                    <span className="text-xs text-gray-400 min-w-[60px]">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                  </div>

                  <div className="relative">
                    <button
                      onClick={() => setShowVolumeSlider(!showVolumeSlider)}
                      className="p-2 rounded-full hover:bg-gray-700/50 transition-colors"
                    >
                      <Volume2 className="w-5 h-5" />
                    </button>
                    {showVolumeSlider && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-2 bg-gray-800 rounded-lg shadow-lg">
                        <input
                          type="range"
                          min={0}
                          max={1}
                          step={0.1}
                          value={volume}
                          onChange={handleVolumeChange}
                          className="w-24 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="flex items-center gap-4 mt-2">
            <button
              onClick={handleShare}
              className="text-gray-400 hover:text-white transition-colors flex items-center gap-1 text-sm"
            >
              <Share2 className="w-4 h-4" />
              Share
            </button>
            
            <button
              onClick={handleDownload}
              className="text-gray-400 hover:text-white transition-colors flex items-center gap-1 text-sm"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
            
            {episode.link && (
              <a
                href={episode.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors flex items-center gap-1 text-sm"
              >
                <ExternalLink className="w-4 h-4" />
                View Details
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 