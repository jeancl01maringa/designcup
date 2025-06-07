import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface PopupData {
  id: number;
  title: string;
  content: string;
  imageUrl?: string;
  buttonText?: string;
  buttonUrl?: string;
  backgroundColor: string;
  textColor: string;
  buttonColor: string;
  buttonTextColor: string;
  borderRadius: number;
  buttonWidth: 'auto' | 'full';
  animation: 'fade' | 'slide' | 'zoom' | 'bounce';
  position: 'center' | 'top' | 'bottom' | 'left' | 'right';
  size: 'small' | 'medium' | 'large';
  delaySeconds: number;
  targetPages: string[];
  targetUserTypes: string[];
  startDate: Date | null;
  endDate: Date | null;
  frequency: 'always' | 'once_per_session' | 'once_per_day' | 'once_per_week';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PopupDisplay: React.FC = () => {
  const [visiblePopup, setVisiblePopup] = useState<PopupData | null>(null);
  const [closedPopups, setClosedPopups] = useState<Set<number>>(new Set());

  const { data: popups = [] } = useQuery<PopupData[]>({
    queryKey: ['/api/popups/active'],
    queryFn: async () => {
      const response = await fetch('/api/popups/active');
      if (!response.ok) {
        return []; // Return empty array if request fails
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  useEffect(() => {
    if (!popups.length || visiblePopup) return;

    const currentPath = window.location.pathname;
    const todayKey = new Date().toDateString();

    // Find a popup that should be displayed
    const eligiblePopup = popups.find(popup => {
      // Check if popup is active
      if (!popup.isActive) return false;

      // Check date range
      const now = new Date();
      if (popup.startDate && new Date(popup.startDate) > now) return false;
      if (popup.endDate && new Date(popup.endDate) < now) return false;

      // Check if already closed by user in this session
      if (closedPopups.has(popup.id)) return false;

      // Check target pages - enhanced targeting with Portuguese support
      const targetPages = Array.isArray(popup.targetPages) ? popup.targetPages : [];
      if (targetPages.length > 0) {
        const shouldShow = targetPages.some(page => {
          // Support for "Todas as páginas" and "all"
          if (page === 'Todas as páginas' || page === 'all') return true;
          
          // Support for specific page names
          if (page === 'Página inicial' || page === 'home') return currentPath === '/';
          if (page === 'Categorias' || page === 'categories') return currentPath.includes('/categoria');
          if (page === 'Planos' || page === 'plans') return currentPath.includes('/planos');
          if (page === 'Tutoriais' || page === 'tutorials') return currentPath.includes('/tutoriais');
          if (page === 'Suporte' || page === 'support') return currentPath.includes('/suporte');
          if (page === 'Perfil' || page === 'profile') return currentPath.includes('/perfil');
          if (page === 'Arte' || page === 'art') return currentPath.includes('/arte/');
          
          // Fallback: check if path contains the page name
          return currentPath.toLowerCase().includes(page.toLowerCase());
        });
        
        if (!shouldShow) return false;
      }

      // Check frequency with improved logic
      const storageKey = `popup_${popup.id}`;
      const sessionKey = `popup_session_${popup.id}`;
      const lastShown = localStorage.getItem(storageKey);
      
      switch (popup.frequency) {
        case 'once_per_session':
          // Check if already shown in this browser session
          if (sessionStorage.getItem(sessionKey)) return false;
          break;
        case 'once_per_day':
          // Check if shown today
          if (lastShown) {
            const lastShownDate = new Date(lastShown);
            const today = new Date();
            const isSameDay = lastShownDate.getDate() === today.getDate() &&
                            lastShownDate.getMonth() === today.getMonth() &&
                            lastShownDate.getFullYear() === today.getFullYear();
            if (isSameDay) return false;
          }
          break;
        case 'once_per_week':
          // Check if shown in the last 7 days
          if (lastShown) {
            const lastShownDate = new Date(lastShown);
            const now = new Date();
            const daysDiff = (now.getTime() - lastShownDate.getTime()) / (1000 * 60 * 60 * 24);
            if (daysDiff < 7) return false;
          }
          break;
        case 'always':
          // No frequency restriction
          break;
      }

      return true;
    });

    if (eligiblePopup) {
      const delay = Math.max(eligiblePopup.delaySeconds || 0, 0) * 1000;
      
      const timer = setTimeout(() => {
        setVisiblePopup(eligiblePopup);
        
        // Mark as shown based on frequency
        const storageKey = `popup_${eligiblePopup.id}`;
        const sessionKey = `popup_session_${eligiblePopup.id}`;
        
        switch (eligiblePopup.frequency) {
          case 'once_per_session':
            sessionStorage.setItem(sessionKey, 'shown');
            break;
          case 'once_per_day':
            localStorage.setItem(storageKey, new Date().toISOString());
            break;
          case 'once_per_week':
            localStorage.setItem(storageKey, new Date().toISOString());
            break;
          case 'always':
            // No storage tracking needed for always
            break;
        }
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [popups, visiblePopup, closedPopups]);

  const closePopup = () => {
    if (visiblePopup) {
      setClosedPopups(prev => new Set(prev).add(visiblePopup.id));
      setVisiblePopup(null);
    }
  };

  const handleButtonClick = () => {
    if (visiblePopup?.buttonUrl) {
      window.open(visiblePopup.buttonUrl, '_blank');
    }
    closePopup();
  };

  if (!visiblePopup) return null;

  const getPositionClasses = () => {
    switch (visiblePopup.position) {
      case 'top':
        return 'items-start justify-center pt-8';
      case 'bottom':
        return 'items-end justify-center pb-8';
      case 'left':
        return 'items-center justify-start pl-8';
      case 'right':
        return 'items-center justify-end pr-8';
      default:
        return 'items-center justify-center';
    }
  };

  const getSizeClasses = () => {
    switch (visiblePopup.size) {
      case 'small':
        return 'max-w-sm';
      case 'large':
        return 'max-w-lg';
      default:
        return 'max-w-md';
    }
  };

  const getAnimationClasses = () => {
    switch (visiblePopup.animation) {
      case 'slide':
        return 'animate-in slide-in-from-top-4';
      case 'zoom':
        return 'animate-in zoom-in-95';
      case 'bounce':
        return 'animate-in zoom-in-95 duration-500';
      default:
        return 'animate-in fade-in';
    }
  };

  return (
    <div className={`fixed inset-0 z-50 flex ${getPositionClasses()}`}>
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={closePopup}
      />
      
      {/* Popup */}
      <div 
        className={`relative ${getSizeClasses()} w-full mx-4 ${getAnimationClasses()}`}
        style={{
          backgroundColor: visiblePopup.backgroundColor,
          color: visiblePopup.textColor,
          borderRadius: `${visiblePopup.borderRadius}px`,
        }}
      >
        {/* Close button */}
        <button
          onClick={closePopup}
          className="absolute top-3 right-3 p-1 hover:bg-black/10 rounded-full transition-colors"
          style={{ color: visiblePopup.textColor }}
        >
          <X size={20} />
        </button>

        {/* Image - Full width without padding */}
        {visiblePopup.imageUrl && (
          <div className="w-full">
            <img 
              src={visiblePopup.imageUrl} 
              alt={visiblePopup.title}
              className="w-full h-auto max-h-64 object-contain"
              style={{ 
                borderTopLeftRadius: `${visiblePopup.borderRadius}px`,
                borderTopRightRadius: `${visiblePopup.borderRadius}px`,
              }}
            />
          </div>
        )}

        {/* Text Content - With padding */}
        <div className="p-6">
          <h3 className="text-xl font-bold mb-3 text-center">
            {visiblePopup.title}
          </h3>

          <p className="text-center mb-4 leading-relaxed">
            {visiblePopup.content}
          </p>

          {visiblePopup.buttonText && (
            <button
              onClick={handleButtonClick}
              className={`font-medium py-3 px-6 rounded-lg transition-all hover:scale-105 ${
                visiblePopup.buttonWidth === 'full' ? 'w-full' : 'mx-auto block'
              }`}
              style={{
                backgroundColor: visiblePopup.buttonColor,
                color: visiblePopup.buttonTextColor,
                borderRadius: `${Math.min(visiblePopup.borderRadius, 8)}px`,
              }}
            >
              {visiblePopup.buttonText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PopupDisplay;