import React from 'react';

interface MediaDisplayProps {
  src: string;
  alt?: string;
  className?: string;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  controls?: boolean;
}

const MediaDisplay: React.FC<MediaDisplayProps> = ({
  src,
  alt = "Media",
  className = "",
  autoPlay = true,
  loop = true,
  muted = true,
  controls = false
}) => {
  // Detectar se é vídeo baseado na URL
  const isVideo = src.includes('.mp4') || src.includes('/videos/') || src.includes('video');
  
  if (isVideo) {
    return (
      <video
        src={src}
        autoPlay={autoPlay}
        loop={loop}
        muted={muted}
        controls={controls}
        className={className}
        playsInline
        preload="metadata"
      />
    );
  }
  
  return (
    <img
      src={src}
      alt={alt}
      className={className}
    />
  );
};

export default MediaDisplay;