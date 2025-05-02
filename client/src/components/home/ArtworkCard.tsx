import React, { useState } from "react";
import { Link } from "wouter";
import { Heart, Bookmark, ExternalLink, Crown, ImageDown, Lock } from "lucide-react";
import type { Artwork } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ArtworkCardProps {
  artwork: Artwork;
}

export function ArtworkCard({ artwork }: ArtworkCardProps) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [hovered, setHovered] = useState(false);
  const { toast } = useToast();

  // Determine aspect ratio class based on format
  const getAspectRatioClass = (format: string) => {
    switch (format) {
      case "1:1": return "aspect-square"; // 1:1
      case "9:16": return "aspect-[9/16]"; // stories
      case "16:9": return "aspect-video"; // landscape
      case "1080:1350": return "aspect-[1080/1350]"; // portrait
      default: return "aspect-square";
    }
  };

  // Get category color based on category name
  const getCategoryColor = (category: string | null) => {
    if (!category) return "bg-[#AA5E2F] text-white";
    
    switch (category.toLowerCase()) {
      case "facial": return "bg-[#CB8E69] text-white";
      case "corporal": return "bg-[#A78166] text-white";
      case "procedimentos": return "bg-[#AA5E2F] text-white";
      default: return "bg-[#AA5E2F] text-white";
    }
  };
  
  // Format category name with proper capitalization
  const formatCategory = (category: string | null) => {
    if (!category) return "Geral";
    return category.charAt(0).toUpperCase() + category.slice(1);
  };

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
      title: saved ? "Removido da coleção" : "Salvo na sua coleção",
      description: saved ? "O item foi removido da sua coleção" : "O item foi salvo na sua coleção",
      duration: 2000,
    });
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    toast({
      title: artwork.isPro ? "Conteúdo Premium" : "Editar no Canva",
      description: artwork.isPro ? "Faça upgrade para acessar este conteúdo" : "Redirecionando para o editor...",
      duration: 2000,
    });
  };

  return (
    <div 
      className="relative rounded-xl overflow-hidden shadow-sm transition-all duration-300 hover:shadow-md hover:scale-[1.03] bg-white"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Link href={`/artwork/${artwork.id}`} className="block">
        <div className={cn("relative overflow-hidden", getAspectRatioClass(artwork.format))}>
          <img 
            src={artwork.imageUrl} 
            alt={artwork.title} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
          />
          
          {/* Category Label */}
          <div className="absolute top-3 left-3 z-10">
            <Badge className={cn("border-0 shadow-md px-2 py-1 font-medium", getCategoryColor(artwork.category))}>
              {formatCategory(artwork.category)}
            </Badge>
          </div>
          
          {/* Pro badge */}
          {artwork.isPro && (
            <div className="absolute top-3 right-3 z-10">
              <Badge className="bg-white/90 hover:bg-white text-[#AA5E2F] border-0 shadow-md font-medium px-2 py-1">
                <Crown className="h-3.5 w-3.5 mr-1 fill-[#AA5E2F] text-[#AA5E2F]" />
                <span className="text-xs">Premium</span>
              </Badge>
            </div>
          )}
          
          {/* Hover overlay */}
          {hovered && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent flex flex-col items-end justify-between p-4 transition-all duration-300 ease-in-out">
              {/* Action Buttons at Bottom */}
              <div className="mt-auto w-full flex justify-between items-center">
                <div className="flex space-x-2">
                  <button 
                    className={`p-2 rounded-full shadow-md transition-colors ${liked ? 'bg-[#AA5E2F] text-white' : 'bg-white text-[#1D1D1D] hover:bg-[#FFF4E9]'}`}
                    onClick={handleLike}
                    aria-label={liked ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                  >
                    <Heart className="h-4 w-4" fill={liked ? "currentColor" : "none"} />
                  </button>
                  
                  <button 
                    className={`p-2 rounded-full shadow-md transition-colors ${saved ? 'bg-[#AA5E2F] text-white' : 'bg-white text-[#1D1D1D] hover:bg-[#FFF4E9]'}`}
                    onClick={handleSave}
                    aria-label={saved ? "Remover dos salvos" : "Salvar item"}
                  >
                    <Bookmark className="h-4 w-4" fill={saved ? "currentColor" : "none"} />
                  </button>
                </div>
                
                <Button 
                  className="bg-[#AA5E2F] hover:bg-[#95512A] text-white rounded-full px-4 py-1 h-8 text-xs shadow-md"
                  onClick={handleEditClick}
                >
                  {artwork.isPro ? (
                    <>
                      <Lock className="h-3.5 w-3.5 mr-1.5" />
                      Desbloquear
                    </>
                  ) : (
                    <>
                      <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                      Editar
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
        
        {/* Info Section */}
        <div className="p-3">
          <h3 className="text-sm font-medium text-[#1D1D1D] line-clamp-1 mb-1">{artwork.title}</h3>
          <p className="text-xs text-[#4B4B4B] line-clamp-2">{artwork.description}</p>
        </div>
      </Link>
    </div>
  );
}