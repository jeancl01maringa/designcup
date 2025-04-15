import React, { useState } from "react";
import { Link } from "wouter";
import { Heart, Bookmark, Share } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ProBadge } from "@/components/ui/pro-badge";
import { SocialShare } from "@/components/sharing/SocialShare";
import type { Artwork } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ArtworkCardProps {
  artwork: Artwork;
}

export function ArtworkCard({ artwork }: ArtworkCardProps) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const { toast } = useToast();

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLiked(!liked);
    
    // Exemplo de feedback visual, a implementação real usaria a API
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
    
    // Exemplo de feedback visual, a implementação real usaria a API
    toast({
      title: saved ? "Removido dos salvos" : "Salvo na sua coleção",
      description: saved ? "O item foi removido da sua coleção" : "O item foi salvo na sua coleção",
      duration: 2000,
    });
  };

  const aspectRatio = {
    'square': 'aspect-square',
    'portrait': 'aspect-[4/5]',
    'stories': 'aspect-[9/16]',
  }[artwork.format] || 'aspect-square';

  return (
    <div className="relative rounded-lg overflow-hidden group">
      <Link href={`/artwork/${artwork.id}`} className="block cursor-pointer">
        <div className={`relative ${aspectRatio}`}>
          <img 
            src={artwork.imageUrl} 
            alt={artwork.title} 
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          
          {/* Pro badge */}
          {artwork.isPro && (
            <div className="absolute top-2 left-2 z-10">
              <ProBadge />
            </div>
          )}
          
          {/* Título e descrição */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
            <h3 className="text-white text-lg font-semibold">{artwork.title}</h3>
            {artwork.description && (
              <p className="text-white/80 text-sm mt-1 line-clamp-1">{artwork.description}</p>
            )}
          </div>
          
          {/* Botões de ação */}
          <div className="absolute bottom-3 right-3 flex space-x-2">
            <button 
              className={`p-2 rounded-full shadow-md transition-colors ${liked ? 'bg-red-500 text-white' : 'bg-white/90 text-gray-700 hover:bg-white'}`}
              onClick={handleLike}
              aria-label={liked ? "Remover dos favoritos" : "Adicionar aos favoritos"}
            >
              <Heart className="h-5 w-5" />
            </button>
            
            <button 
              className={`p-2 rounded-full shadow-md transition-colors ${saved ? 'bg-primary text-white' : 'bg-white/90 text-gray-700 hover:bg-white'}`}
              onClick={handleSave}
              aria-label={saved ? "Remover dos salvos" : "Salvar item"}
            >
              <Bookmark className="h-5 w-5" />
            </button>
          </div>
        </div>
      </Link>
    </div>
  );
}