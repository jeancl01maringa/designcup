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

      // Check target pages - support Portuguese "Todas as páginas"
      const targetPages = Array.isArray(popup.targetPages) ? popup.targetPages : [];
      if (targetPages.length > 0 && 
          !targetPages.includes('all') && 
          !targetPages.includes('Todas as páginas') &&
          !targetPages.some(page => currentPath.includes(page))) {
        return false;
      }

      // Check frequency
      const storageKey = `popup_${popup.id}`;
      const lastShown = localStorage.getItem(storageKey);
      
      switch (popup.frequency) {
        case 'once_per_session':
          if (sessionStorage.getItem(storageKey)) return false;
          break;
        case 'once_per_day':
          if (lastShown === todayKey) return false;
          break;
        case 'once_per_week':
          if (lastShown) {
            const lastShownDate = new Date(lastShown);
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            if (lastShownDate > weekAgo) return false;
          }
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
        switch (eligiblePopup.frequency) {
          case 'once_per_session':
            sessionStorage.setItem(storageKey, 'shown');
            break;
          case 'once_per_day':
            localStorage.setItem(storageKey, todayKey);
            break;
          case 'once_per_week':
            localStorage.setItem(storageKey, new Date().toISOString());
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