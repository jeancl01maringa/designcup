import React, { useState } from "react";
import { Link } from "wouter";
import { Heart, Bookmark, ExternalLink, ImageDown, Lock, Image as ImageIcon } from "lucide-react";
import type { Artwork } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PremiumCrown } from "@/components/ui/premium-crown";
import { cn } from "@/lib/utils";
import { usePostActions } from "@/hooks/use-post-actions";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";

interface ArtworkCardProps {
  artwork: Artwork;
}

export function ArtworkCard({ artwork }: ArtworkCardProps) {
  const [hovered, setHovered] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageSrc, setImageSrc] = useState(artwork.imageUrl);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Usar o hook de ações de post com dados reais
  const { liked, saved, isLiking, isSaving, handleLike, handleSave } = usePostActions(artwork.id);

  // Mutation para rastrear edições recentes
  const addRecentEditMutation = useMutation({
    mutationFn: async (postId: number) => {
      const response = await apiRequest('POST', `/api/user/recent-edits/${postId}`);
      return response.json();
    },
    onSuccess: () => {
      // Invalidar cache das edições recentes
      queryClient.invalidateQueries({ queryKey: ['/api/user/recent-edits'] });
    },
    onError: (error) => {
      console.error('Erro ao adicionar edição recente:', error);
    }
  });

  const handleImageError = () => {
    if (imageError) return; // Evita loops infinitos
    
    // Tentar diferentes estratégias de recuperação
    if (imageSrc.includes('supabase.co')) {
      // Limpar parâmetros que podem causar problemas
      const cleanUrl = imageSrc.split('?')[0];
      if (cleanUrl !== imageSrc) {
        setImageSrc(cleanUrl);
        return;
      }
      
      // Tentar caminho local como fallback
      const filename = imageSrc.split('/').pop()?.split('?')[0];
      if (filename) {
        setImageSrc(`/uploads/posts/${filename}`);
        return;
      }
    }
    
    // Se chegou aqui, usar placeholder
    setImageError(true);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Se é premium e usuário não é premium, não rastrear nem abrir
    if (artwork.isPro) {
      toast({
        title: "Conteúdo Premium",
        description: "Faça upgrade para acessar este conteúdo",
        duration: 2000,
      });
      return;
    }
    
    // Rastrear a edição se o usuário estiver logado
    if (user) {
      addRecentEditMutation.mutate(artwork.id);
    }
    
    // Abrir no Canva (aqui você pode adicionar a lógica para obter a URL real do Canva)
    window.open('https://canva.com', '_blank');
    
    toast({
      title: "Editar no Canva",
      description: "Redirecionando para o editor...",
      duration: 2000,
    });
  };

  return (
    <div 
      className="image-card relative rounded-lg overflow-hidden transition-all duration-300 hover:shadow-md hover:scale-[1.02] w-full mb-3"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Link href={`/post/${artwork.id}`}>
        <div className="relative">
          {/* Image Container */}
          <div className="relative w-full" style={{ aspectRatio: artwork.format === "9:16" ? '9/16' : artwork.format === "16:9" ? '16/9' : '1/1' }}>
            {imageError ? (
              <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                <ImageIcon className="h-8 w-8 text-gray-400" />
              </div>
            ) : (
              <img
                src={imageSrc}
                alt={artwork.title}
                className="w-full h-full object-cover"
                onError={handleImageError}
                loading="lazy"
              />
            )}
            
            {/* Premium overlay */}
            {artwork.isPro && (
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                <div className="bg-white/90 backdrop-blur-sm rounded-full p-3">
                  <PremiumCrown className="h-6 w-6" />
                </div>
              </div>
            )}
          </div>

          {/* Hover overlay com botões de ação */}
          <div className={cn(
            "absolute inset-0 bg-black/50 opacity-0 transition-opacity duration-300 flex items-center justify-center gap-2",
            hovered && "opacity-100"
          )}>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleEditClick}
              className="bg-white/90 hover:bg-white text-black"
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              Editar
            </Button>
          </div>

          {/* Action buttons in corner */}
          <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleLike();
              }}
              disabled={isLiking}
              className={cn(
                "p-2 rounded-full transition-all duration-300 backdrop-blur-sm",
                liked 
                  ? "bg-red-500/90 text-white" 
                  : "bg-white/90 text-gray-700 hover:bg-white hover:text-red-500"
              )}
            >
              <Heart className="h-4 w-4 transition-all duration-300" fill={liked ? "currentColor" : "none"} />
            </button>
            
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleSave();
              }}
              disabled={isSaving}
              className={cn(
                "p-2 rounded-full transition-all duration-300 backdrop-blur-sm",
                saved 
                  ? "bg-blue-500/90 text-white" 
                  : "bg-white/90 text-gray-700 hover:bg-white hover:text-blue-500"
              )}
            >
              <Bookmark className="h-4 w-4 transition-all duration-300" fill={saved ? "currentColor" : "none"} />
            </button>
          </div>
        </div>
      </Link>
    </div>
  );
}