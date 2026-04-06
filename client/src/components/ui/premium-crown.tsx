import { Crown } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface PremiumCrownProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  tooltipSide?: 'top' | 'bottom' | 'left' | 'right';
}

export function PremiumCrown({
  size = 'md',
  className,
  tooltipSide = 'left'
}: PremiumCrownProps) {
  const sizeClasses = {
    sm: 'w-5 h-5 lg:w-6 lg:h-6',
    md: 'w-6 h-6 lg:w-8 lg:h-8',
    lg: 'w-8 h-8 lg:w-10 lg:h-10'
  };

  const iconSizes = {
    sm: 'w-2.5 h-2.5 lg:w-3 lg:h-3',
    md: 'w-3 h-3 lg:w-4 lg:h-4',
    lg: 'w-4 h-4 lg:w-5 lg:h-5'
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn(
            'badge-premium absolute top-2 right-2 z-10 bg-gradient-to-br from-slate-800/15 to-slate-900/15 backdrop-blur-sm text-white rounded-full flex items-center justify-center shadow-lg border border-slate-600/10 transition-all duration-300 hover:scale-110 hover:shadow-xl cursor-pointer',
            sizeClasses[size],
            className
          )}>
            <Crown className={cn('text-amber-400 drop-shadow-sm', iconSizes[size])} fill="currentColor" />
          </div>
        </TooltipTrigger>
        <TooltipContent side={tooltipSide} className="max-w-48 text-center">
          <p className="text-sm font-medium">Esse é um modelo premium, exclusivo do Designcup</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}