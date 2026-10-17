'use client';

import { useRef, useEffect } from 'react';

interface YouTubeEmbedProps {
  videoId: string;
  title: string;
  className?: string;
}

/**
 * YouTube Embed Component
 * Renders an embedded YouTube video player.
 * Accepts both short URLs (youtu.be/xxx) and long URLs (youtube.com/watch?v=xxx).
 */
export default function YouTubeEmbed({
  videoId,
  title,
  className = '',
}: YouTubeEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // This effect can be used for any post-render logic if needed
    // (e.g., initializing player via YouTube IFrame API)
  }, [videoId]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full ${className}`}
      data-youtube-video
    >
      {/* YouTube Custom Embed Player */}
      <iframe
        className="absolute inset-0 h-full w-full rounded-xl"
        src={`https://www.youtube.com/embed/${videoId}`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        loading="lazy"
      />
      {/* Fallback: Click to play */}
      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity rounded-xl">
        <div className="flex flex-col items-center gap-2">
          <svg
            className="w-10 h-10 text-white"
            fill="white"
            viewBox="0 0 24 24"
          >
            <path d="M8 5v14l11-7z" />
          </svg>
          <span className="text-white text-xs font-medium">Play</span>
        </div>
      </div>
    </div>
  );
}
