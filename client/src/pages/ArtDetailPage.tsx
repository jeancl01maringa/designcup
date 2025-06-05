import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { 
  ArrowLeft, 
  Download, 
  Heart, 
  Bookmark, 
  Share2, 
  Check, 
  ChevronsDown,
  Eye,
  ExternalLink,
  ChevronDown,
  Crown,
  FileImage
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

export default function ArtDetailPage() {
  const { slug } = useParams();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Extrair ID do slug (formato: "id-titulo")
  let postId = 0;
  if (slug && typeof slug === 'string') {
    const match = slug.match(/^(\d+)-/);
    postId = match ? parseInt(match[1], 10) : 0;
  } else {
    postId = 0;
  }
  
  console.log('Parâmetros recebidos:', { slug });
  console.log('ID do post determinado:', postId);
  
  // Estados
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [activeFormat, setActiveFormat] = useState<string>('');
  const [availableFormats, setAvailableFormats] = useState<any[]>([]);
  
  // Verifica se o usuário é premium
  const isUserPremium = user?.tipo === 'premium' || 
                     (user?.plano_id !== undefined && user?.plano_id !== null && 
                      typeof user?.plano_id === 'number' && user?.plano_id !== 1);
  
  // Buscar dados do post
  const { data: post, isLoading, error } = useQuery({
    queryKey: ['/api/admin/posts', postId],
    queryFn: async () => {
      if (!postId) throw new Error('ID inválido');
      
      const response = await fetch(`/api/admin/posts/${postId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Arte não encontrada');
        }
        throw new Error('Erro ao buscar arte');
      }
      
      return response.json();
    },
    retry: 1,
    enabled: !!postId,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false
  });
  
  // Buscar posts relacionados (múltiplos formatos agrupados)
  const { data: relatedPosts } = useQuery({
    queryKey: ['/api/admin/posts/related', post?.groupId],
    queryFn: async () => {
      if (!post?.groupId) return [];
      
      const response = await fetch(`/api/admin/posts/related/${post.groupId}`);
      if (!response.ok) return [];
      
      return response.json();
    },
    enabled: !!post?.groupId,
    staleTime: 5 * 60 * 1000
  });

  // Atualizar formatos disponíveis quando o post carregar
  React.useEffect(() => {
    if (!post) return;

    let formats: any[] = [];
    
    // 1. Verificar se há posts agrupados (múltiplos formatos)
    if (relatedPosts && relatedPosts.length > 0) {
      formats = relatedPosts.map((p: any) => ({
        type: p.formato || 'Feed',
        imageUrl: p.imageUrl || p.image_url,
        id: p.id,
        title: p.title
      }));
    }
    // 2. Verificar format_data com múltiplos formatos
    else if (post.formatData || post.format_data) {
      try {
        const formatDataString = post.formatData || post.format_data;
        if (typeof formatDataString === 'string') {
          const formatData = JSON.parse(formatDataString);
          if (Array.isArray(formatData)) {
            formats = formatData;
          }
        }
      } catch (error) {
        console.warn('Erro ao parsear format_data:', error);
      }
    }
    // 3. Formato único
    else {
      formats = [{
        type: post.formato || 'Feed',
        imageUrl: post.imageUrl || post.image_url,
        id: post.id,
        title: post.title
      }];
    }
    
    setAvailableFormats(formats);
    
    // Definir formato ativo inicial
    if (formats.length > 0 && !activeFormat) {
      setActiveFormat(formats[0].type);
    }
  }, [post, relatedPosts, activeFormat]);

  // Função para obter a URL da imagem principal
  const getMainImageUrl = () => {
    // Se há formato ativo e múltiplos formatos, usar imagem do formato ativo
    if (activeFormat && availableFormats.length > 1) {
      const currentFormat = availableFormats.find(f => f.type === activeFormat);
      if (currentFormat?.imageUrl) {
        return currentFormat.imageUrl;
      }
    }
    
    // 1. Verificar se tem imageUrl direto
    if (post?.imageUrl) {
      return post.imageUrl;
    }
    if (post?.image_url) {
      return post.image_url;
    }
    
    // 2. Verificar nos dados de formato
    const formatDataString = post?.formatData || post?.format_data;
    if (formatDataString) {
      try {
        const formatData = typeof formatDataString === 'string' 
          ? JSON.parse(formatDataString) 
          : formatDataString;
        
        // Se é array, procurar pelo formato atual ou primeiro disponível
        if (Array.isArray(formatData) && formatData.length > 0) {
          // Procurar formato correspondente ao atual
          const currentFormat = formatData.find((f: any) => 
            f.type?.toLowerCase() === post.formato?.toLowerCase()
          );
          
          if (currentFormat?.imageUrl) {
            return currentFormat.imageUrl;
          }
          
          // Se não encontrou, usar o primeiro com imagem
          const firstWithImage = formatData.find((f: any) => f.imageUrl);
          if (firstWithImage?.imageUrl) {
            return firstWithImage.imageUrl;
          }
        }
      } catch (error) {
        console.warn('Erro ao parsear format_data:', error);
      }
    }
    
    return '';
  };

  const mainImageUrl = getMainImageUrl();

  // Handlers para ações
  const handleShare = () => {
    if (navigator.share && post) {
      navigator.share({
        title: post.title,
        url: window.location.href,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copiado!",
        description: "O link foi copiado para sua área de transferência.",
      });
    }
  };

  const handleToggleActions = () => {
    setIsFavorite(!isFavorite);
    setIsSaved(!isSaved);
    setIsFollowing(!isFollowing);
  };

  const handleCanvaEdit = () => {
    // Obter URL do Canva baseado no formato ativo
    let canvaUrl = '';
    
    if (activeFormat && availableFormats.length > 1) {
      const currentFormat = availableFormats.find(f => f.type === activeFormat);
      if (currentFormat?.links?.length > 0) {
        canvaUrl = currentFormat.links[0].url;
      }
    } else if (post?.canvaUrl) {
      canvaUrl = post.canvaUrl;
    }
    
    if (canvaUrl) {
      window.open(canvaUrl, '_blank');
    } else {
      toast({
        title: "Link não disponível",
        description: "Link de edição no Canva não encontrado.",
        variant: "destructive"
      });
    }
  };

  // Estados de carregamento e erro
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-orange-50 to-amber-50">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-6">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-6 w-32" />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <Skeleton className="h-[500px] w-full rounded-2xl" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-orange-50 to-amber-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Arte não encontrada</h1>
          <p className="text-gray-600 mb-4">
            {error?.message || 'Não foi possível carregar os detalhes desta arte.'}
          </p>
          <Button onClick={() => setLocation('/')} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao início
          </Button>
        </div>
      </div>
    );
  }

  const isPremiumContent = post.isPro || post.licenseType === 'premium';

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-orange-50 to-amber-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header com navegação */}
        <div className="flex items-center mb-8">
          <Button 
            variant="ghost" 
            onClick={() => setLocation('/')}
            className="mr-4 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          
          <Badge variant="secondary" className="mr-2">{post.formato || 'FEED'}</Badge>
          
          {isPremiumContent && (
            <Badge variant="default" className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
              <Crown className="h-3 w-3 mr-1" />
              ESTÉTICA PREMIUM
            </Badge>
          )}
        </div>

        {/* Conteúdo principal */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Coluna da imagem */}
          <div className="space-y-6">
            {/* Imagem principal otimizada */}
            <div className="overflow-hidden rounded-2xl shadow-2xl bg-white">
              {mainImageUrl ? (
                <img
                  src={mainImageUrl}
                  alt={post.title}
                  className="w-full h-auto object-cover"
                  style={{ maxHeight: '700px' }}
                  onError={(e) => {
                    console.error('Erro ao carregar imagem:', mainImageUrl);
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-full h-[500px] bg-gray-100 rounded-2xl flex items-center justify-center">
                  <div className="text-center">
                    <FileImage className="h-20 w-20 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">Erro ao carregar imagem</p>
                  </div>
                </div>
              )}
            </div>

            {/* Seção de formatos disponíveis - NOVA FUNCIONALIDADE */}
            {availableFormats.length > 1 && (
              <div className="bg-white rounded-xl p-6 shadow-lg border border-orange-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FileImage className="h-5 w-5 mr-2 text-orange-500" />
                  Formatos disponíveis
                </h3>
                <div className="space-y-3">
                  {availableFormats.map((format, index) => (
                    <div
                      key={index}
                      className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                        activeFormat === format.type 
                          ? 'border-blue-500 bg-blue-50 shadow-md' 
                          : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50'
                      }`}
                      onClick={() => setActiveFormat(format.type)}
                    >
                      <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-amber-100 rounded-lg flex items-center justify-center">
                        <FileImage className="h-6 w-6 text-orange-600" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-base text-gray-900">{format.type}</div>
                        <div className="text-sm text-gray-500">
                          {format.type === 'Feed' && '1080×1080px • Quadrado'}
                          {format.type === 'Cartaz' && '1080×1350px • Vertical'}
                          {format.type === 'Stories' && '1080×1920px • Stories'}
                        </div>
                      </div>
                      <div className="text-sm text-gray-400 font-medium">1 opção</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Coluna das informações */}
          <div className="space-y-8">
            {/* Título e principais características */}
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6 leading-tight">
                {post.title}
              </h1>
              
              {/* Lista de benefícios com ícones de check */}
              <div className="space-y-3 mb-8">
                <div className="flex items-center gap-3 text-green-600">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                    <Check className="h-3 w-3" />
                  </div>
                  <span className="text-sm font-medium">Editável no Canva gratuito</span>
                </div>
                <div className="flex items-center gap-3 text-green-600">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                    <Check className="h-3 w-3" />
                  </div>
                  <span className="text-sm font-medium">Para projetos comerciais e pessoais</span>
                </div>
                <div className="flex items-center gap-3 text-green-600">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                    <Check className="h-3 w-3" />
                  </div>
                  <span className="text-sm font-medium">Não precisa atribuir o autor</span>
                </div>
                <div className="flex items-center gap-3 text-green-600">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                    <Check className="h-3 w-3" />
                  </div>
                  <span className="text-sm font-medium">Qualidade profissional</span>
                </div>
              </div>
            </div>

            {/* Card de especificações */}
            <div className="bg-white rounded-xl p-6 shadow-lg border border-orange-100">
              <h3 className="font-semibold text-gray-900 mb-4">Especificações do Arquivo</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500 block">Formato:</span>
                  <span className="font-semibold text-gray-900">{post.formato || 'FEED'}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Tipo:</span>
                  <span className="font-semibold text-gray-900">Canva</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Visualizações:</span>
                  <span className="font-semibold text-gray-900 flex items-center">
                    <Eye className="h-4 w-4 mr-1" />
                    0
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block">Downloads:</span>
                  <span className="font-semibold text-gray-900 flex items-center">
                    <Download className="h-4 w-4 mr-1" />
                    0
                  </span>
                </div>
              </div>
              <div className="mt-4 text-xs text-gray-500">
                Ver mais detalhes
              </div>
            </div>

            {/* Botão principal de ação */}
            <Button 
              onClick={handleCanvaEdit}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-4 text-lg font-semibold shadow-lg"
              size="lg"
            >
              <ExternalLink className="h-5 w-5 mr-3" />
              EDITAR NO CANVA
            </Button>

            {/* Botões de ação secundários */}
            <div className="flex gap-3">
              <TooltipProvider>
                <Tooltip open={isTooltipOpen} onOpenChange={setIsTooltipOpen}>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleToggleActions}
                      onMouseEnter={() => setIsTooltipOpen(true)}
                      onMouseLeave={() => setIsTooltipOpen(false)}
                      className="flex-1 border-orange-200 hover:bg-orange-50"
                    >
                      <Heart className={`h-4 w-4 mr-2 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
                      Favoritar
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Adicionar aos favoritos</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <Button 
                variant="outline" 
                size="sm"
                onClick={handleToggleActions}
                className="flex-1 border-orange-200 hover:bg-orange-50"
              >
                <Bookmark className={`h-4 w-4 mr-2 ${isSaved ? 'fill-blue-500 text-blue-500' : ''}`} />
                Salvar
              </Button>

              <Button 
                variant="outline" 
                size="sm"
                onClick={handleShare}
                className="flex-1 border-orange-200 hover:bg-orange-50"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Compartilhar
              </Button>
            </div>

            {/* Card do criador */}
            <div className="bg-white rounded-xl p-6 shadow-lg border border-orange-100">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">DE</span>
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Design para Estética</div>
                  <div className="text-sm text-gray-500">100+ artes postadas</div>
                </div>
              </div>
              
              <Button 
                variant="secondary" 
                size="sm" 
                className="w-full bg-gradient-to-r from-orange-100 to-amber-100 hover:from-orange-200 hover:to-amber-200 text-orange-800"
                onClick={handleToggleActions}
              >
                {isFollowing ? 'Seguindo' : 'Seguir'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}