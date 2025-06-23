import React, { useState } from 'react';

interface ImageWithFallbackProps {
  src: string;
  alt: string;
  className?: string;
  fallbackClassName?: string;
}

/**
 * Componente de imagem com fallback automático
 * Se a imagem não carregar, exibe um ícone SVG como fallback
 */
export function ImageWithFallback({
  src,
  alt,
  className = "",
  fallbackClassName = "h-6 w-6 opacity-30"
}: ImageWithFallbackProps) {
  const [hasError, setHasError] = useState(false);

  // Handler para erro de carregamento simplificado
  const handleError = () => {
    if (!hasError) {
      setHasError(true);
    }
  };

  // Renderizar fallback quando há erro ou quando src é inválido
  const renderFallback = () => (
    <div className={`flex items-center justify-center bg-gray-100 ${className}`}>
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="24" 
        height="24" 
        viewBox="0 0 24 24"
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={fallbackClassName}
      >
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
    </div>
  );

  // Se já temos um erro conhecido ou não há src, mostrar o fallback
  if (hasError || !src || src.trim() === '') {
    return renderFallback();
  }
  
  // Limpar e validar URL
  let imageUrl = src.trim().replace(/^["'](.*)["']$/, '$1');
  
  // Verificar se é uma URL válida
  if (!imageUrl.startsWith('http') && !imageUrl.startsWith('/')) {
    return renderFallback();
  }
  
  // Renderizar imagem
  return (
    <img
      src={imageUrl}
      alt={alt}
      className={className}
      onError={handleError}
      loading="lazy"
    />
  );
}