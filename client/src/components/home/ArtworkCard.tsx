import React, { useState } from "react";
import { Link } from "wouter";
import { Heart, Bookmark, ExternalLink } from "lucide-react";
import type { Artwork } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

interface ArtworkCardProps {
  artwork: Artwork;
}

export function ArtworkCard({ artwork }: ArtworkCardProps) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [hovered, setHovered] = useState(false);
  const { toast } = useToast();

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLiked(!liked);
    
    toast({
      title: liked ? "Removido dos favoritos" : "Adicionado aos favoritos",
      description: liked ? "O item foi removido dos seus favoritos" : "O item foi adicionado aos seus favoritos",
      duration: 2000,
    });
  };

  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSaved(!saved);
    
    toast({
      title: saved ? "Removido dos salvos" : "Salvo na sua coleção",
      description: saved ? "O item foi removido da sua coleção" : "O item foi salvo na sua coleção",
      duration: 2000,
    });
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    toast({
      title: "Editar no Canva",
      description: "Redirecionando para o editor...",
      duration: 2000,
    });
  };

  return (
    <div 
      className="relative rounded-lg overflow-hidden hover-card cursor-pointer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Link href={`/artwork/${artwork.id}`} className="block">
        <div className="aspect-square relative">
          <img 
            src={artwork.imageUrl} 
            alt={artwork.title} 
            className="w-full h-full object-cover"
          />
          
          {/* Pro badge */}
          {artwork.isPro && (
            <div className="absolute top-2 left-2 z-10">
              <div className="bg-white/80 backdrop-blur-sm py-1 px-2 rounded-full text-xs font-medium text-[#AA5E2F] flex items-center">
                <svg className="w-3 h-3 mr-1 text-orange-500 fill-orange-500" viewBox="0 0 24 24">
                  <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                </svg>
                Premium
              </div>
            </div>
          )}
          
          {/* Hover overlay */}
          {hovered && (
            <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center p-4 transition-all duration-200 ease-in-out">
              <Button 
                className="bg-[#AA5E2F] hover:bg-[#95512A] text-white font-medium px-4 py-2 rounded-full mb-2 w-full max-w-[140px] flex items-center justify-center shadow-sm"
                onClick={handleEditClick}
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                Editar no Canva
              </Button>
              
              <div className="flex space-x-2 mt-2">
                <button 
                  className={`p-2 rounded-full shadow-md transition-colors ${liked ? 'bg-red-500 text-white' : 'bg-white text-[#1D1D1D]'}`}
                  onClick={handleLike}
                  aria-label={liked ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                >
                  <Heart className="h-4 w-4" fill={liked ? "currentColor" : "none"} />
                </button>
                
                <button 
                  className={`p-2 rounded-full shadow-md transition-colors ${saved ? 'bg-[#AA5E2F] text-white' : 'bg-white text-[#1D1D1D]'}`}
                  onClick={handleSave}
                  aria-label={saved ? "Remover dos salvos" : "Salvar item"}
                >
                  <Bookmark className="h-4 w-4" fill={saved ? "currentColor" : "none"} />
                </button>
              </div>
            </div>
          )}
        </div>
      </Link>
    </div>
  );
}