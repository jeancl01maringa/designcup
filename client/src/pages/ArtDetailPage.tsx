import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation, Link } from "wouter";
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
  ChevronRight,
  Crown,
  Image
} from "lucide-react";
import { ArtworkCard } from "@/components/home/ArtworkCard";
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
import { supabase } from "@/lib/supabase";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";

export default function ArtDetailPage() {
  const [location, setLocation] = useLocation();
  const params = useParams<{ slug?: string; id?: string }>();
  const { slug, id } = params;
  const { user, isLoading: isLoadingAuth } = useAuth();
  const queryClient = useQueryClient();
  
  // Determinar o ID do post baseado na rota
  let postId: number;
  if (id) {
    // Rota /preview/:id - usar ID diretamente
    postId = parseInt(id, 10);
  } else if (slug) {
    // Verificar se o slug começa com um número (formato "10-xxxxx")
    const slugParts = slug.split('-');
    const firstPart = slugParts[0];
    const potentialId = parseInt(firstPart, 10);
    
    if (!isNaN(potentialId) && potentialId > 0) {
      // Slug formato padrão com ID no início
      postId = potentialId;
    } else {
      // Slug é um uniqueCode - buscar pelo uniqueCode
      postId = 0; // Usaremos uma lógica diferente para buscar por uniqueCode
    }
  } else {
    postId = 0;
  }
  
  console.log('Parâmetros recebidos:', { slug, id });
  console.log('ID do post determinado:', postId);
  
  // Estado para controlar a exibição do tooltip no botão
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);
  
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  
  // Garantir que a página sempre inicie no topo
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [postId]); // Rola para o topo quando o postId muda
  
  // Verifica se o usuário é premium baseado no tipo/plano
  const isUserPremium = user?.tipo === 'premium' || 
                     (user?.plano_id !== undefined && user?.plano_id !== null && 
                      typeof user?.plano_id === 'number' && user?.plano_id !== 1);
  
  // Buscar os dados da arte usando a API admin existente (mais confiável)
  const { data: post, isLoading, error } = useQuery({
    queryKey: ['/api/admin/posts', postId, slug],
    queryFn: async () => {
      if (postId && postId > 0) {
        // Buscar por ID
        const response = await fetch(`/api/admin/posts/${postId}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Arte não encontrada');
          }
          throw new Error('Erro ao buscar arte');
        }
        
        return response.json();
      } else if (slug) {
        // Buscar por uniqueCode - buscar em todos os posts
        const response = await fetch('/api/admin/posts');
        
        if (!response.ok) {
          throw new Error('Erro ao buscar artes');
        }
        
        const posts = await response.json();
        const post = posts.find((p: any) => p.uniqueCode === slug);
        
        if (!post) {
          throw new Error('Arte não encontrada');
        }
        
        return post;
      } else {
        throw new Error('Parâmetros inválidos');
      }
    },
    retry: 1,
    enabled: !!(postId || slug),
    staleTime: 2 * 60 * 1000, // 2 minutos em cache
    gcTime: 5 * 60 * 1000, // 5 minutos no cache
    refetchOnWindowFocus: false,
    refetchOnMount: false
  });

  // Buscar posts relacionados do mesmo grupo (variações de formato)
  const { data: relatedPosts = [] } = useQuery({
    queryKey: ['/api/admin/posts/related', post?.groupId],
    queryFn: async () => {
      if (!post?.groupId) return [];
      
      const response = await fetch(`/api/admin/posts/related/${post.groupId}`);
      
      if (!response.ok) {
        console.warn('Erro ao buscar posts relacionados:', response.status);
        return [];
      }
      
      const posts = await response.json();
      // Retornar todos os posts do grupo (incluindo o atual)
      return posts;
    },
    enabled: !!post?.groupId,
    staleTime: 5 * 60 * 1000, // 5 minutos em cache
    refetchOnWindowFocus: false
  });

  // Buscar dados do autor do post
  const { data: author } = useQuery({
    queryKey: ['/api/admin/users', post?.user_id || post?.userId],
    queryFn: async () => {
      const userId = post?.user_id || post?.userId;
      console.log('[AUTHOR FETCH] userId from post:', userId);
      console.log('[AUTHOR FETCH] post data:', post);
      if (!userId) return null;
      
      const response = await fetch(`/api/admin/users/${userId}`);
      if (!response.ok) return null;
      
      const authorData = await response.json();
      console.log('[AUTHOR FETCH] author data received:', authorData);
      return authorData;
    },
    enabled: !!(post?.user_id || post?.userId),
    staleTime: 10 * 60 * 1000, // 10 minutos em cache
  });

  // Buscar quantidade de posts do autor
  const { data: authorStats } = useQuery({
    queryKey: ['/api/admin/users', post?.user_id || post?.userId, 'stats'],
    queryFn: async () => {
      const userId = post?.user_id || post?.userId;
      if (!userId) return { postsCount: 0 };
      
      const response = await fetch(`/api/admin/posts?userId=${userId}`);
      if (!response.ok) return { postsCount: 0 };
      
      const posts = await response.json();
      return { postsCount: posts.length };
    },
    enabled: !!(post?.user_id || post?.userId),
    staleTime: 5 * 60 * 1000,
  });

  // Buscar status de seguir do autor
  const { data: followStatus, refetch: refetchFollowStatus } = useQuery({
    queryKey: ['/api/users', post?.user_id || post?.userId, 'follow-status'],
    queryFn: async () => {
      const userId = post?.user_id || post?.userId;
      if (!userId || !user) return { following: false };
      
      const response = await fetch(`/api/users/${userId}/follow-status`);
      if (!response.ok) return { following: false };
      
      return response.json();
    },
    enabled: !!(post?.user_id || post?.userId) && !!user,
    staleTime: 30 * 1000, // 30 segundos
  });

  // Sincronizar estado local com dados do servidor
  React.useEffect(() => {
    if (followStatus) {
      setIsFollowing(followStatus.following);
    }
  }, [followStatus]);
  
  // Pré-carregar e cachear dados de todos os formatos do grupo
  const allGroupPosts = React.useMemo(() => {
    if (!post) return [];
    
    const allPosts = relatedPosts || [];
    const uniquePosts = allPosts
      .filter((item: any, index: number, self: any[]) => 
        index === self.findIndex((p: any) => p.id === item.id)
      )
      .sort((a: any, b: any) => {
        const formatOrder = ['feed', 'stories', 'cartaz', 'story', 'reels'];
        const aIndex = formatOrder.indexOf(a.formato?.toLowerCase() || '');
        const bIndex = formatOrder.indexOf(b.formato?.toLowerCase() || '');
        return (aIndex !== -1 ? aIndex : 999) - (bIndex !== -1 ? bIndex : 999);
      });
    
    // Atualizar cache local com todos os formatos
    const newCache: Record<string, any> = {};
    uniquePosts.forEach((formatPost: any) => {
      const formatKey = formatPost.formato?.toLowerCase() || 'feed';
      newCache[formatKey] = {
        id: formatPost.id,
        imageUrl: formatPost.imageUrl || formatPost.image_url,
        canvaUrl: formatPost.canvaUrl || formatPost.canva_url,
        title: formatPost.title,
        formato: formatPost.formato,
        uniqueCode: formatPost.uniqueCode || formatPost.unique_code
      };
    });
    
    return uniquePosts;
  }, [post, relatedPosts, postId]);

  // Extrair formatos do post a partir dos dados gravados no banco (fallback para compatibilidade)
  const availableFormats = React.useMemo(() => {
    // Verificar primeiro formato diretamente no post
    if (post?.formato) {
      return [post.formato];
    }
    
    // Verificar array de formatos
    if (post?.formats && Array.isArray(post.formats) && post.formats.length > 0) {
      return post.formats;
    }
    
    // Tentar extrair formatos do formato_data ou format_data (formato JSON)
    if (post?.formato_data || post?.format_data) {
      try {
        const formatDataString = post?.formato_data || post?.format_data || '{}';
        if (typeof formatDataString === 'string') {
          const formatData = JSON.parse(formatDataString);
          
          // Se temos formatos definidos diretamente no formato_data
          if (formatData.formats && Array.isArray(formatData.formats)) {
            return formatData.formats;
          }
          
          // Verificar se temos opções de formatos
          if (formatData.options && Array.isArray(formatData.options)) {
            return formatData.options.map((opt: { format?: string }) => opt.format || 'FEED');
          }
          
          // Se temos apenas um formato
          if (formatData.format) {
            return [formatData.format];
          }
          
          // Se temos o formato como propriedade direta
          if (formatData.formato) {
            return [formatData.formato];
          }
        }
      } catch (err) {
        console.error('Erro ao processar formato_data:', err);
      }
    }
    
    // Valor padrão se nada for encontrado
    return ['FEED'];
  }, [post]);
  
  // Interface para formatos relacionados
  interface RelatedFormat {
    id: number;
    title: string;
    imageUrl?: string;
    image_url?: string;
    uniqueCode?: string;
    unique_code?: string;
    formato?: string;
    format?: string;
    formats?: string[];
    licenseType?: string;
    license_type?: string;
    isPro?: boolean;
    is_pro?: boolean;
    userId?: number;
    createdAt?: string;
    categoryName?: string;
  }
  
  // Buscar artes relacionadas baseado em categoria e similaridade de título
  const { data: relatedArtworks, isLoading: isLoadingRelated } = useQuery<RelatedFormat[]>({
    queryKey: ['/api/posts', postId, 'related'],
    queryFn: async () => {
      if (!postId) return [];
      
      const response = await fetch(`/api/posts/${postId}/related?limit=8`);
      if (!response.ok) {
        console.warn('Falha ao buscar artes relacionadas:', response.status);
        return [];
      }
      
      return response.json();
    },
    enabled: !!postId,
    staleTime: 5 * 60 * 1000, // 5 minutos em cache
    retry: false
  });
  
  // Formatar objetos para exibição
  const formatLabel = (format: string | null | undefined) => {
    if (!format) return 'FEED'; // Valor padrão se não houver formato

    const formatMap: Record<string, string> = {
      'feed': 'FEED',
      'stories': 'STORIES',
      'post': 'POST',
      'reels': 'REELS',
      'carousel': 'CARROSSEL'
    };
    
    return formatMap[format.toLowerCase()] || format.toUpperCase();
  };
  
  // Obter dimensões do formato
  const getFormatDimensions = (format: string | null | undefined): string => {
    if (!format) return '1080×1080px • Quadrado'; // Valor padrão se não houver formato
    
    const dimensionsMap: Record<string, string> = {
      'feed': '1080×1080px • Quadrado',
      'stories': '1080×1920px • Vertical',
      'reels': '1080×1920px • Vertical',
      'carousel': '1080×1080px • Quadrado',
      'post': '1080×1350px • Retrato'
    };
    
    return dimensionsMap[format.toLowerCase()] || '1080×1080px';
  };
  
  // Determinar se é premium (verificar todos os possíveis campos)
  const isPremium = post?.licenseType === 'premium' || post?.is_pro || post?.isPro;
  
  // Handlers para ações
  const handleFavorite = () => setIsFavorite(!isFavorite);
  const handleSave = () => setIsSaved(!isSaved);
  
  const handleFollow = async () => {
    if (!user || !author || followLoading) return;
    
    // Não permitir seguir a si mesmo
    if (user.id === author.id) return;
    
    setFollowLoading(true);
    
    try {
      if (isFollowing) {
        // Deixar de seguir
        const response = await fetch(`/api/users/${author.id}/follow`, {
          method: 'DELETE',
        });
        
        if (response.ok) {
          setIsFollowing(false);
          refetchFollowStatus();
        }
      } else {
        // Seguir
        const response = await fetch(`/api/users/${author.id}/follow`, {
          method: 'POST',
        });
        
        if (response.ok) {
          setIsFollowing(true);
          refetchFollowStatus();
        }
      }
    } catch (error) {
      console.error('Erro ao atualizar status de seguir:', error);
    } finally {
      setFollowLoading(false);
    }
  };
  const handleShare = () => {
    // Implementar compartilhamento
    navigator.share?.({
      title: post?.title || 'Arte para Estética',
      text: post?.description || 'Confira esta arte para seus conteúdos de estética',
      url: window.location.href
    }).catch(err => console.error('Erro ao compartilhar:', err));
  };
  
  // Extrair o Link do Canva dos dados do post
  const getCanvaUrl = (): string => {
    try {
      console.log("Verificando URL do Canva no post:", post);
      console.log("Dados do formatData:", post?.formatData || post?.format_data);
      
      // 1. Verificar se temos URL do Canva diretamente no post
      if (post?.canvaUrl) {
        console.log("Usando canvaUrl diretamente do post:", post.canvaUrl);
        return post.canvaUrl;
      }
      
      // 2. Verificar se tem o campo no snake_case
      if (post?.canva_url) {
        console.log("Usando canva_url do post:", post.canva_url);
        return post.canva_url;
      }
      
      // 3. Verificar dados de formato tanto no camelCase quanto snake_case
      const formatDataString = post?.formatData || post?.format_data;
      
      if (formatDataString) {
        console.log("FormatData encontrado:", formatDataString);
        
        try {
          // Se já é um objeto, usar diretamente
          const formatData = typeof formatDataString === 'string' 
            ? JSON.parse(formatDataString) 
            : formatDataString;
          
          console.log("FormatData parseado:", formatData);
          
          // Se é um array de formatos (estrutura normal)
          if (Array.isArray(formatData) && formatData.length > 0) {
            console.log("Procurando em array de formatos, total:", formatData.length);
            
            // Pegar o primeiro formato (geralmente o principal)
            const firstFormat = formatData[0];
            console.log("Primeiro formato:", firstFormat);
            
            // Verificar se tem links no formato
            if (firstFormat && Array.isArray(firstFormat.links) && firstFormat.links.length > 0) {
              console.log("Links encontrados:", firstFormat.links);
              
              // Procurar por um link do Canva
              const canvaLink = firstFormat.links.find(
                (link: any) => link.provider?.toLowerCase() === 'canva'
              );
              
              if (canvaLink && canvaLink.url) {
                console.log("URL do Canva encontrada:", canvaLink.url);
                return canvaLink.url;
              }
            }
            
            // Se não encontrou links, verificar se tem canvaUrl direto no formato
            if (firstFormat && firstFormat.canvaUrl) {
              console.log("CanvaUrl direto no formato:", firstFormat.canvaUrl);
              return firstFormat.canvaUrl;
            }
          }
          
          // Se não é array, verificar se é objeto com canvaUrl direto
          if (formatData && typeof formatData === 'object' && !Array.isArray(formatData)) {
            if (formatData.canvaUrl) {
              console.log("CanvaUrl direto no formatData:", formatData.canvaUrl);
              return formatData.canvaUrl;
            }
          }
          
        } catch (parseErr) {
          console.error("Erro ao analisar dados de formato:", parseErr);
        }
      }
      
      // Log quando nenhuma URL é encontrada
      console.warn("Nenhuma URL do Canva encontrada, usando valor padrão");
      
      // Valor padrão se não encontrar nada
      return 'https://www.canva.com/design/new';
    } catch (err) {
      console.error('Erro ao extrair URL do Canva:', err);
      return 'https://www.canva.com/design/new';
    }
  };
  
  // Determinar se o usuário pode editar esta arte
  const canEditArt = (): boolean => {
    // Se não está logado, não pode editar
    if (!user) return false;
    
    // Se a arte é gratuita, qualquer usuário logado pode editar
    if (!isPremium) return true;
    
    // Se a arte é premium, apenas usuários premium podem editar
    return isUserPremium === true;
  };
  
  const handleEditCanva = () => {
    // Se não pode editar, não faz nada (o botão já deve estar desabilitado ou ser apenas visual)
    if (!canEditArt()) return;
    
    // Obter a URL do Canva e abrir em nova janela
    const canvaUrl = getCanvaUrl();
    window.open(canvaUrl, '_blank');
  };
  
  // Skeletons para loading
  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Button 
          variant="ghost" 
          className="mb-6"
          onClick={() => setLocation('/')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Skeleton className="w-full h-[500px] rounded-lg" />
          <div className="space-y-4">
            <Skeleton className="h-10 w-3/4" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-24" />
            </div>
            <div className="space-y-2 mt-4">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-2/3" />
            </div>
            <Skeleton className="h-12 w-full mt-4" />
            <div className="flex gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="h-10 w-10 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Mensagem de erro
  if (error || !post) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Button 
          variant="ghost" 
          className="mb-6"
          onClick={() => setLocation('/')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        
        <div className="text-center p-12 bg-white rounded-lg shadow-sm">
          <h2 className="text-2xl font-bold text-red-500 mb-4">Arte não encontrada</h2>
          <p className="text-gray-600 mb-4">
            Não foi possível encontrar a arte solicitada. Ela pode ter sido removida ou o link está incorreto.
          </p>
          <Button onClick={() => setLocation('/')}>
            Voltar para a galeria
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8 px-4">
      <Button 
        variant="ghost" 
        className="mb-6"
        onClick={() => setLocation('/')}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar
      </Button>
      
      {/* Layout principal em duas colunas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Coluna da esquerda - Imagem da arte */}
        <div className="relative">
          {/* Label do formato */}
          <span className="absolute top-4 left-4 bg-black/70 text-white px-3 py-1 rounded-md text-sm font-medium z-10">
            {formatLabel(availableFormats[0])}
          </span>
          
          {/* Selo premium */}
          {isPremium && (
            <div className="absolute top-4 right-4 z-10 bg-[#fef3c8] rounded-full p-2 flex items-center justify-center">
              <Crown size={16} className="text-[#e7b36a]" fill="currentColor" />
            </div>
          )}
          
          {/* Imagem principal otimizada com cache */}
          <div className="overflow-hidden rounded-lg shadow-md">
            <img 
              src={post.imageUrl || "/placeholder.jpg"}
              alt={post.title}
              className="w-full h-auto object-cover"
              loading="lazy"
              onError={(e) => {
                console.error('Erro ao carregar imagem:', post.imageUrl);
                const target = e.target as HTMLImageElement;
                target.src = "/placeholder.jpg";
              }}
            />
          </div>
        </div>
        
        {/* Coluna da direita - Informações */}
        <div className="space-y-5 border border-gray-100 rounded-lg p-4 bg-white shadow-sm">
          {/* Título e selo premium */}
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-gray-900">
                {post.title}
              </h1>
              {isPremium && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium" style={{backgroundColor: '#fef3c7', color: '#a76e40'}}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11.5 2L8 8l-5-1 2 7h14l2-7-5 1z"/>
                    <circle cx="12" cy="6" r="1"/>
                  </svg>
                  Premium
                </div>
              )}
            </div>
          </div>
          
          {/* Checklist de vantagens */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <ul className="space-y-3">
              <li className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-green-200 flex items-center justify-center">
                  <Check size={12} className="text-green-600" />
                </div>
                <span className="text-gray-700 text-sm">Editável no Canva gratuito</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-green-200 flex items-center justify-center">
                  <Check size={12} className="text-green-600" />
                </div>
                <span className="text-gray-700 text-sm">Para projetos comerciais e pessoais</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-green-200 flex items-center justify-center">
                  <Check size={12} className="text-green-600" />
                </div>
                <span className="text-gray-700 text-sm">Não precisa atribuir o autor</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-green-200 flex items-center justify-center">
                  <Check size={12} className="text-green-600" />
                </div>
                <span className="text-gray-700 text-sm">Qualidade profissional</span>
              </li>
            </ul>
          </div>
          
          {/* Especificações do arquivo */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Especificações do Arquivo</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 border border-gray-300 rounded-full bg-white"></div>
                <div className="flex flex-col">
                  <span className="text-gray-500 text-xs">Formato:</span>
                  <span className="text-sm">{formatLabel(availableFormats[0])}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 border border-gray-300 rounded-full bg-white"></div>
                <div className="flex flex-col">
                  <span className="text-gray-500 text-xs">Tipo:</span>
                  <span className="text-sm">Canva</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 flex items-center justify-center">
                  <Eye size={13} className="text-gray-400" />
                </div>
                <div className="flex flex-col">
                  <span className="text-gray-500 text-xs">Visualizações:</span>
                  <span className="text-sm">{post.views || 3}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 flex items-center justify-center">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                    <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                  </svg>
                </div>
                <div className="flex flex-col">
                  <span className="text-gray-500 text-xs">Número de identificação:</span>
                  <span className="text-sm">#{post.id}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Formatos disponíveis - Layout consistente */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-700">Formatos disponíveis</h3>
              {allGroupPosts.length > 1 && (
                <span className="text-xs text-blue-600 font-medium">{allGroupPosts.length} opções</span>
              )}
            </div>
            
            <div className="space-y-2">
              {/* Post atual sempre visível */}
              <div className="border border-gray-200 rounded-lg p-3 bg-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded overflow-hidden border border-gray-100 flex-shrink-0">
                      <img 
                        src={post.imageUrl || post.image_url} 
                        alt={post.title} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                        {formatLabel(post?.formato || 'FEED')}
                        {post?.isPro && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                            Premium
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">{getFormatDimensions(post?.formato || 'FEED')}</div>
                    </div>
                  </div>
                  {allGroupPosts.length > 1 && (
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-blue-600">Atual</span>
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    </div>
                  )}
                </div>
              </div>

              {/* Outras variações de formato */}
              {allGroupPosts
                .filter((groupPost: any) => groupPost.id !== Number(postId))
                .map((groupPost: any, index: number) => (
                <div 
                  key={`format-option-${groupPost.id}-${index}`}
                  className="border border-gray-200 rounded-lg p-3 bg-white cursor-pointer hover:border-blue-300 hover:shadow-sm transition-all"
                  onClick={() => {
                    // Gerar slug limpo e consistente
                    const cleanTitle = groupPost.title
                      .toLowerCase()
                      .normalize('NFD')
                      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
                      .replace(/[^\w\s-]/g, '') // Remove caracteres especiais
                      .replace(/\s+/g, '-') // Substitui espaços por hífens
                      .replace(/-+/g, '-') // Remove hífens múltiplos
                      .replace(/^-+|-+$/g, ''); // Remove hífens do início e fim
                    
                    const slug = `${groupPost.id}-${cleanTitle}`;
                    
                    // Navegação otimizada sem recarregamento
                    setLocation(`/artes/${slug}`);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded overflow-hidden border border-gray-100 flex-shrink-0">
                        <img 
                          src={groupPost.imageUrl || groupPost.image_url} 
                          alt={groupPost.title} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                          {formatLabel(groupPost.formato || 'FEED')}
                          {groupPost.isPro && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                              Premium
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">{getFormatDimensions(groupPost.formato || 'FEED')}</div>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-gray-400" />
                  </div>
                </div>
              ))}

              {/* Mensagem quando há apenas um formato */}
              {allGroupPosts.length === 1 && (
                <div className="text-center py-2">
                  <p className="text-xs text-gray-500">Este design possui apenas um formato disponível</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Botão principal de ação */}
          {!user ? (
            // Botão desabilitado para usuários não logados
            <Button 
              className="w-full bg-gray-400 text-white py-3 h-auto flex items-center justify-center gap-2 rounded-md cursor-not-allowed"
              disabled={true}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              <span className="font-medium text-sm">FAÇA LOGIN PARA EDITAR</span>
            </Button>
          ) : isPremium && !isUserPremium ? (
            // Arte premium para usuários gratuitos - botão amarelo que redireciona para planos
            <Button 
              onClick={() => setLocation('/planos')}
              className="w-full bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white py-3 h-auto flex items-center justify-center gap-2 rounded-md transition-all group"
            >
              <Crown size={16} className="text-white" />
              <span className="font-medium text-sm group-hover:hidden">EDITAR NO CANVA</span>
              <span className="font-medium text-sm hidden group-hover:block">ASSINE O PREMIUM</span>
            </Button>
          ) : (
            // Botão normal para usuários com permissão (premium ou arte gratuita)
            <Button 
              onClick={handleEditCanva} 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 h-auto flex items-center justify-center gap-2 rounded-md"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1-2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              <span className="font-medium text-sm">EDITAR NO CANVA</span>
            </Button>
          )}
          
          {/* Linha de ações */}
          <div className="flex items-center justify-center gap-3 pt-5">
            <Button 
              onClick={handleFavorite}
              variant="outline"
              size="sm"
              className="border-gray-300 text-gray-700 flex items-center gap-1.5"
            >
              <Heart size={16} className={isFavorite ? "fill-red-500 text-red-500" : ""} />
              <span>Favoritar</span>
            </Button>
            
            <Button 
              onClick={handleSave}
              variant="outline"
              size="sm"
              className="border-gray-300 text-gray-700 flex items-center gap-1.5"
            >
              <Bookmark size={16} className={isSaved ? "fill-blue-500 text-blue-500" : ""} />
              <span>Salvar</span>
            </Button>
            
            <Button 
              onClick={handleShare}
              variant="outline"
              size="sm"
              className="border-gray-300 text-gray-700 flex items-center gap-1.5"
            >
              <Share2 size={16} />
              <span>Compartilhar</span>
            </Button>
          </div>
          
          {/* Informações do criador */}
          <div className="flex items-center justify-between border-t pt-4 mt-2">
            <div 
              className="flex items-center gap-3 cursor-pointer hover:opacity-75 transition-opacity"
              onClick={() => author?.id && setLocation(`/autor/${author.id}`)}
            >
              <Avatar className="h-10 w-10">
                {author?.profileImage ? (
                  <AvatarImage 
                    src={author.profileImage} 
                    alt={author.username}
                    className="object-cover w-full h-full rounded-full"
                  />
                ) : (
                  <AvatarFallback className="bg-gray-100 text-gray-500">
                    {author?.username ? author.username.charAt(0).toUpperCase() : 'DE'}
                  </AvatarFallback>
                )}
              </Avatar>
              <div>
                <p className="font-medium hover:text-blue-600 transition-colors">
                  {author?.username || 'Design para Estética'}
                </p>
                <p className="text-sm text-gray-500">
                  {authorStats?.postsCount ? `${authorStats.postsCount} artes postadas` : '100+ artes postadas'}
                </p>
              </div>
            </div>
            {/* Só mostrar botão de seguir se não for o próprio usuário */}
            {user && author && user.id !== author.id && (
              <Button
                size="sm"
                onClick={handleFollow}
                disabled={followLoading}
                className={isFollowing 
                  ? "bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300" 
                  : "bg-black hover:bg-gray-800 text-white border-0"
                }
              >
                {followLoading ? "..." : (isFollowing ? "Seguindo" : "Seguir")}
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {/* Seção de artes relacionadas */}
      {relatedArtworks && relatedArtworks.length > 0 && (
        <div className="mt-12">
          <h2 className="text-xl font-bold mb-6">Artes relacionadas</h2>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {relatedArtworks.map((item: RelatedFormat) => (
              <ArtworkCard
                key={item.id}
                artwork={{
                  id: item.id,
                  title: item.title,
                  description: "",
                  imageUrl: item.imageUrl || "/placeholder.jpg",
                  category: "outros",
                  createdAt: new Date(item.createdAt || Date.now()),
                  isPro: item.licenseType === 'premium' || item.isPro,
                  format: item.formato || "1:1"
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}