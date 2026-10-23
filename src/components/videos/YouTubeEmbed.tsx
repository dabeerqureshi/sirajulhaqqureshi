'use client';

import React from 'react';

interface YouTubeEmbedProps {
  videoId: string;
  title: string;
  className?: string;
}

/**
 * YouTube Embed Component
 * Renders a responsive, clean YouTube player with native playback controls.
 */
export default function YouTubeEmbed({
  videoId,
  title,
  className = '',
}: YouTubeEmbedProps) {
  return (
    <div className={`relative w-full overflow-hidden rounded-xl bg-stone-950 ${className}`}>
      <iframe
        className="absolute inset-0 h-full w-full border-0"
        src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        loading="lazy"
      />
    </div>
  );
}
