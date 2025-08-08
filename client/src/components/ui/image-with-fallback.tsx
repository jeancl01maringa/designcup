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
  const [imageKey, setImageKey] = useState(Date.now());

  // Handler para erro de carregamento
  const handleError = () => {
    // Se for um arquivo de vídeo, não tenta carregar como imagem
    if (src && (src.includes('.webm') || src.includes('.mp4') || src.includes('/videos/'))) {
      setHasError(true);
      return;
    }
    
    // Tenta ajustar a URL para corrigir problemas comuns apenas para imagens
    if (!hasError && src) {
      console.log(`Imagem falhou ao carregar: ${src}`);
      
      // Se estiver usando Supabase Storage, tenta diferentes URLs
      if (src.includes('supabase.co') && src.includes('storage/v1')) {
        // Verificar se a URL inclui algum token (alguns clientes adicionam)
        const hasToken = src.includes('token=');
        
        if (!hasToken) {
          // Tenta novamente com o parâmetro de download=public
          const newSrc = `${src}${src.includes('?') ? '&' : '?'}download=public`;
          console.log(`Tentando URL alternativa: ${newSrc}`);
          
          // Usar uma chave única para forçar o React a tentar carregar novamente
          setImageKey(Date.now());
          // Atualizar src para a nova URL
          // Para evitar loop infinito, marcamos que já tentamos corrigir
          setHasError(true);
          return;
        }
      }
      
      // Se chegou aqui, não conseguiu recuperar, exibe o fallback
      setHasError(true);
    }
  };

  // Renderizar fallback quando há erro ou quando src é inválido
  const renderFallback = () => (
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
  );

  // Se já temos um erro conhecido, mostrar o fallback
  if (hasError) {
    return renderFallback();
  }

  // Se não há src, mostrar o fallback
  if (!src) {
    return renderFallback();
  }

  // Se for um arquivo de vídeo, mostrar fallback imediatamente sem tentar carregar como imagem
  if (src.includes('.webm') || src.includes('.mp4') || src.includes('/videos/')) {
    return renderFallback();
  }
  
  // Remover aspas extras se existirem (comum em dados JSON)
  let imageUrl = src.replace(/^["'](.*)["']$/, '$1');
  
  // Verificar se é uma URL válida (só consideramos URLs http/https como válidas)
  const isValidUrl = imageUrl.startsWith('http');
  
  // Tentar validar como URL se não for uma HTTP URL
  if (!isValidUrl) {
    try {
      // Isso lançará erro se não for uma URL válida
      new URL(imageUrl);
    } catch (error) {
      console.warn(`URL de imagem inválida: ${src.substring(0, 50)}...`, error);
      return renderFallback();
    }
  }
  
  // Se chegamos aqui, a URL parece ser válida
  return (
    <img
      key={imageKey}
      src={imageUrl}
      alt={alt}
      className={className}
      onError={handleError}
      loading="lazy"
    />
  );
}