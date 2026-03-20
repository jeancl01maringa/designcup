import React, { useState, useRef, useEffect } from 'react';

interface MediaDisplayProps {
  src: string;
  alt?: string;
  className?: string;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  controls?: boolean;
  onError?: () => void;
}

const MediaDisplay: React.FC<MediaDisplayProps> = ({
  src,
  alt = "Media",
  className = "",
  autoPlay = true,
  loop = true,
  muted = true,
  controls = false,
  onError
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Detectar se é vídeo baseado na URL - corrigido para GIF
  const isVideo = React.useMemo(() => {
    if (!src) return false;
    
    // Extrair a parte da URL antes dos query parameters
    const urlWithoutParams = src.split('?')[0];
    
    // GIF deve ser tratado como imagem se estiver no bucket images
    // Apenas arquivos no bucket videos são tratados como vídeo
    if (urlWithoutParams.includes('.gif') && src.includes('/images/')) {
      return false; // GIF no bucket images = imagem
    }
    
    return urlWithoutParams.includes('.mp4') || 
           urlWithoutParams.includes('.webm') || 
           (urlWithoutParams.includes('.gif') && src.includes('/videos/')) ||
           src.includes('/videos/') || 
           src.includes('video');
  }, [src]);
  
  // Debug apenas para vídeos
  if (isVideo) {
    console.log('VIDEO MediaDisplay:', { src, isVideo, className, hasError, isLoading });
  }
  

  
  useEffect(() => {
    if (isVideo && videoRef.current && autoPlay) {
      const video = videoRef.current;
      
      const handleCanPlay = () => {
        video.play().catch(() => {
          // Falha silenciosa se autoplay não funcionar
        });
      };
      
      video.addEventListener('canplay', handleCanPlay);
      
      return () => {
        video.removeEventListener('canplay', handleCanPlay);
      };
    }
  }, [src, autoPlay, isVideo]);
  
  if (isVideo) {
    if (hasError) {
      return (
        <div className={`${className} bg-muted flex items-center justify-center`}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 opacity-30">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
        </div>
      );
    }
    
    return (
      <div className="relative">
        {isLoading && (
          <div className={`${className} bg-muted flex items-center justify-center absolute inset-0 z-10`}>
            <div className="w-4 h-4 border-2 border-border border-t-gray-600 rounded-full animate-spin"></div>
          </div>
        )}
        <video
          ref={videoRef}
          src={src}
          loop={loop}
          muted={muted}
          controls={controls}
          className={className}
          playsInline
          webkit-playsinline
          preload="auto"
          poster=""
          disablePictureInPicture

          style={{ 
            display: isLoading ? 'none' : 'block',
            objectFit: 'cover',
            maxWidth: '100%',
            height: 'auto',
            background: 'transparent'
          }}
          onLoadStart={() => setIsLoading(true)}
          onLoadedData={() => setIsLoading(false)}
          onCanPlay={() => setIsLoading(false)}
          onError={(e) => {
            console.error('Video error:', e, src);
            setHasError(true);
            setIsLoading(false);
            onError?.();
          }}
        />
      </div>
    );
  }
  
  if (hasError) {
    return (
      <div className={`${className} bg-muted flex items-center justify-center`}>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 opacity-30">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      crossOrigin="anonymous"
      onError={(e) => {
        console.error('Image error:', e, src);
        setHasError(true);
        onError?.();
      }}
    />
  );
};

export default MediaDisplay;