import React, { useState } from "react";
import { Link } from "wouter";
import { Heart, Bookmark, ExternalLink, Crown, ImageDown, Lock, Image as ImageIcon } from "lucide-react";
import type { Artwork } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
    console.log(`Imagem falhou ao carregar: ${imageSrc}`);
    
    // First, try the correct path in Supabase Storage: images/uploads/
    if (imageSrc.includes('supabase.co') && !imageSrc.includes('uploads/') && !imageError) {
      const filename = imageSrc.split('/').pop()?.split('?')[0];
      if (filename) {
        const baseUrl = imageSrc.split('/storage/v1/object/public/images/')[0];
        const correctUrl = `${baseUrl}/storage/v1/object/public/images/uploads/${filename}`;
        console.log(`Tentando caminho correto do storage: ${correctUrl}`);
        setImageSrc(correctUrl);
        return;
      }
    }
    
    // If it's a Supabase URL and we haven't tried alternatives yet
    if (imageSrc.includes('supabase.co') && !imageSrc.includes('?download=') && !imageError) {
      const altUrl = `${imageSrc}?download=public`;
      console.log(`Tentando URL alternativa: ${altUrl}`);
      setImageSrc(altUrl);
      return;
    }
    
    // If still failing, try to convert to a local path
    if (imageSrc.includes('supabase.co') && !imageError) {
      // Extract filename from Supabase URL
      const urlParts = imageSrc.split('/');
      const filename = urlParts[urlParts.length - 1]?.split('?')[0];
      if (filename) {
        const localUrl = `/uploads/posts/${filename}`;
        console.log(`Tentando caminho local: ${localUrl}`);
        setImageSrc(localUrl);
        return;
      }
    }
    
    // Final fallback - show placeholder
    if (!imageError) {
      console.log('Usando placeholder como fallback final');
      setImageError(true);
    }
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
      <Link href={`/artes/${artwork.id}-${encodeURIComponent(artwork.title.toLowerCase().replace(/\s+/g, '-'))}`} className="block">
        <div className="relative overflow-hidden w-full">
          {/* 
            Esta imagem mantém sua proporção original e natural sem qualquer transformação
            Não estamos forçando nenhum aspect-ratio via CSS
          */}
          {imageError ? (
            <div className="w-full aspect-square bg-gray-100 flex items-center justify-center">
              <ImageIcon className="w-12 h-12 text-gray-400" />
            </div>
          ) : (
            <img 
              src={imageSrc} 
              alt={artwork.title}
              className="w-full h-auto object-cover display-block"
              loading="lazy"
              onError={handleImageError}
            />
          )}
          
          {/* Pro badge - coroa premium SEMPRE visível no canto superior direito */}
          {artwork.isPro && (
            <div className="badge-premium absolute top-2 right-2 z-10 bg-black/70 text-[#FFC107] rounded-full w-5 h-5 lg:w-8 lg:h-8 flex items-center justify-center shadow-md relative">
              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="#FFC107" stroke="#FFC107" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-crown lg:w-4 lg:h-4">
                <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"></path>
              </svg>
            </div>
          )}
          
          {/* Hover actions - botões de curtir e salvar */}
          <div 
            className={`hover-actions absolute bottom-3 right-3 flex gap-2 transition-opacity duration-300 ease-in-out z-20
              ${hovered ? 'opacity-100' : 'opacity-0'}`}
          >
            <button 
              disabled={isLiking}
              className={cn(
                "p-2 rounded-full shadow-md transition-all duration-300 transform hover:scale-110",
                liked 
                  ? 'bg-red-500 text-white' 
                  : 'bg-white text-gray-600 hover:bg-red-50 hover:text-red-500',
                isLiking && "animate-bounce scale-110"
              )}
              onClick={handleLike}
              aria-label={liked ? "Remover dos favoritos" : "Adicionar aos favoritos"}
            >
              <Heart className="h-4 w-4 transition-all duration-300" fill={liked ? "currentColor" : "none"} />
            </button>
            
            <button 
              disabled={isSaving}
              className={cn(
                "p-2 rounded-full shadow-md transition-all duration-300 transform hover:scale-110",
                saved 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-white text-gray-600 hover:bg-blue-50 hover:text-blue-500',
                isSaving && "animate-bounce scale-110"
              )}
              onClick={handleSave}
              aria-label={saved ? "Remover dos salvos" : "Salvar item"}
            >
              <Bookmark className="h-4 w-4 transition-all duration-300" fill={saved ? "currentColor" : "none"} />
            </button>
          </div>
          
          {/* Botão de editar ao passar o mouse */}
          <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${hovered ? 'opacity-100' : 'opacity-0'}`}>
            <Button 
              className="bg-black/70 hover:bg-black/90 text-white rounded-full px-6 py-1 h-8 text-xs shadow-md z-10"
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
      </Link>
    </div>
  );
}