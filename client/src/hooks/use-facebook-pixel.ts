// Hook para integrar Facebook Pixel com componentes React
// Design para Estética - Plataforma de Artes

import { useEffect } from 'react';
import { useLocation } from 'wouter';
import FacebookPixelService from '../services/facebook-pixel';

// Hook para rastrear mudanças de página automaticamente
export function usePixelPageTracking() {
  const [location] = useLocation();

  useEffect(() => {
    // Aguarda um pequeno delay para garantir que o DOM está carregado
    const timer = setTimeout(() => {
      const pageName = location === '/' ? 'Home' : location.replace('/', '');
      FacebookPixelService.trackPageView(pageName);
    }, 100);

    return () => clearTimeout(timer);
  }, [location]);
}

// Hook para rastrear visualização de arte
export function usePixelArtView() {
  const trackArtView = (data: {
    postId: string;
    title: string;
    category: string;
    format: string;
    isPremium: boolean;
  }) => {
    FacebookPixelService.trackViewContent(data);
  };

  return { trackArtView };
}

// Hook para rastrear ações do usuário
export function usePixelUserActions() {
  const trackSearch = (query: string, category?: string) => {
    FacebookPixelService.trackSearch(query, category);
  };

  const trackLike = (data: {
    postId: string;
    title: string;
    category: string;
  }) => {
    FacebookPixelService.trackAddToCart({
      ...data,
      action: 'like'
    });
  };

  const trackSave = (data: {
    postId: string;
    title: string;
    category: string;
  }) => {
    FacebookPixelService.trackAddToCart({
      ...data,
      action: 'save'
    });
  };

  const trackPremiumClick = (planData: {
    planName: string;
    value: number;
    currency: string;
  }) => {
    FacebookPixelService.trackInitiateCheckout(planData);
  };

  const trackViewContent = (data: {
    postId: string;
    title: string;
    category: string;
    format: string;
    isPremium: boolean;
  }) => {
    FacebookPixelService.trackViewContent(data);
  };

  return {
    trackSearch,
    trackLike,
    trackSave,
    trackPremiumClick,
    trackViewContent
  };
}

// Hook para rastrear eventos de categoria
export function usePixelCategoryTracking() {
  const trackCategoryView = (categoryName: string, postCount: number) => {
    FacebookPixelService.trackCategoryView(categoryName, postCount);
  };

  return { trackCategoryView };
}

export default {
  usePixelPageTracking,
  usePixelArtView,
  usePixelUserActions,
  usePixelCategoryTracking
};