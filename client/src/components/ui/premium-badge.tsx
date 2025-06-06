import React from "react";
import { Crown } from "lucide-react";

interface PremiumBadgeProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function PremiumBadge({ className = "", size = "md" }: PremiumBadgeProps) {
  const sizeStyles = {
    sm: "w-6 h-6",
    md: "w-8 h-8", 
    lg: "w-10 h-10"
  };

  const iconSizes = {
    sm: 12,
    md: 16,
    lg: 20
  };

  return (
    <div 
      className={`
        ${sizeStyles[size]} 
        rounded-full 
        flex items-center justify-center 
        relative
        ${className}
      `}
      style={{ backgroundColor: '#fef3c8' }}
    >
      <Crown 
        size={iconSizes[size]} 
        style={{ color: '#e7b36a' }}
        fill="#e7b36a"
        strokeWidth={1.5}
      />
    </div>
  );
}