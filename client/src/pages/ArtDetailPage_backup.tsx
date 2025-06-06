import React, { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { 
  Heart, 
  Share2, 
  Download, 
  Eye, 
  User, 
  ChevronRight, 
  ArrowLeft,
  ExternalLink,
  UserPlus,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import Header from "@/components/layout/Header";
import { ArtworkCard } from "@/components/home/ArtworkCard";
import { toast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { supabase } from "@/lib/supabase";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";

export default function ArtDetailPage() {
  const [location, setLocation] = useLocation();
  const params = useParams<{ slug?: string; id?: string }>();
  const { slug, id } = params;
  const { user, isLoading: isLoadingAuth } = useAuth();
  
  // Determinar o ID do post baseado na rota
  let postId: number;
  if (id) {
    // Rota /preview/:id - usar ID diretamente
    postId = parseInt(id, 10);
  } else if (slug) {
    // Rota /artes/:slug - extrair ID do slug (por exemplo, "10-xxxxx" => 10)
    postId = parseInt(slug.split('-')[0] || '0', 10);
  } else {
    postId = 0;
  }

  const { data: post, isLoading, error } = useQuery({
    queryKey: [`/api/posts/${postId}`],
    enabled: !!postId,
  });

  const { data: relatedPosts } = useQuery({
    queryKey: [`/api/posts/${postId}/related`],
    enabled: !!postId,
  });

  const { data: relatedArtworks } = useQuery({
    queryKey: [`/api/posts/${postId}/category-related`],
    enabled: !!postId && !!post?.categoryId,
  });

  const { data: postAuthor } = useQuery({
    queryKey: [`/api/users/${post?.userId}`],
    enabled: !!post?.userId,
  });

  const { data: followStatus } = useQuery({
    queryKey: [`/api/users/${post?.userId}/follow-status`],
    enabled: !!user && !!post?.userId && user.id !== post?.userId,
  });

  const [isFollowing, setIsFollowing] = useState(false);
  const queryClient = useQueryClient();

  const followMutation = useMutation({
    mutationFn: async () => {
      if (!post?.userId) throw new Error('User ID not found');
      const response = await apiRequest('POST', `/api/users/${post.userId}/follow`);
      return response.json();
    },
    onSuccess: () => {
      setIsFollowing(true);
      queryClient.invalidateQueries({ queryKey: [`/api/users/${post?.userId}/follow-status`] });
      toast({
        title: "Sucesso",
        description: "Você agora está seguindo este usuário",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível seguir o usuário",
        variant: "destructive",
      });
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: async () => {
      if (!post?.userId) throw new Error('User ID not found');
      const response = await apiRequest('DELETE', `/api/users/${post.userId}/follow`);
      return response.json();
    },
    onSuccess: () => {
      setIsFollowing(false);
      queryClient.invalidateQueries({ queryKey: [`/api/users/${post?.userId}/follow-status`] });
      toast({
        title: "Sucesso",
        description: "Você deixou de seguir este usuário",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível deixar de seguir o usuário",
        variant: "destructive",
      });
    },
  });

  // Sincronizar estado local com dados do servidor
  React.useEffect(() => {
    if (followStatus) {
      setIsFollowing(followStatus.following);
    }
  }, [followStatus]);
  
  // Construir lista de posts do grupo
  const allGroupPosts = React.useMemo(() => {
    if (!post) return [];
    
    const allPosts = relatedPosts || [];
    return allPosts
      .filter((item: any, index: number, self: any[]) => 
        index === self.findIndex((p: any) => p.id === item.id)
      )
      .sort((a: any, b: any) => {
        const formatOrder = ['feed', 'stories', 'cartaz', 'story', 'reels'];
        const aIndex = formatOrder.indexOf(a.formato?.toLowerCase() || '');
        const bIndex = formatOrder.indexOf(b.formato?.toLowerCase() || '');
        return (aIndex !== -1 ? aIndex : 999) - (bIndex !== -1 ? bIndex : 999);
      });
  }, [post, relatedPosts]);

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
            return formatData.options.map((opt: any) => opt.formato || opt.format || opt.type).filter(Boolean);
          }
        }
      } catch (error) {
        console.warn('Erro ao parsear formato_data:', error);
      }
    }
    
    // Fallback: retornar formato padrão
    return ['FEED'];
  }, [post]);

  const favoritePostMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', `/api/posts/${postId}/favorite`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/posts/${postId}`] });
      toast({
        title: "Post favoritado!",
        description: "O post foi adicionado aos seus favoritos.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível favoritar o post",
        variant: "destructive",
      });
    },
  });

  const unfavoritePostMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('DELETE', `/api/posts/${postId}/favorite`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/posts/${postId}`] });
      toast({
        title: "Post removido dos favoritos",
        description: "O post foi removido dos seus favoritos.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível remover o post dos favoritos",
        variant: "destructive",
      });
    },
  });

  const handleDownload = async () => {
    try {
      // Verificar se usuário está logado
      if (!user) {
        toast({
          title: "Login necessário",
          description: "Você precisa estar logado para baixar arquivos",
          variant: "destructive",
        });
        return;
      }

      // Verificar se é premium e usuário não é premium
      if (post?.isPro && user?.tipo !== 'premium') {
        toast({
          title: "Conteúdo Premium",
          description: "Este é um conteúdo premium. Faça upgrade da sua conta para acessar.",
          variant: "destructive",
        });
        return;
      }

      // URL de download direto do Supabase
      const downloadUrl = post?.canvaUrl || post?.canva_url;
      
      if (!downloadUrl) {
        toast({
          title: "Arquivo não disponível",
          description: "O arquivo de download não está disponível para este post",
          variant: "destructive",
        });
        return;
      }

      // Verificar se é uma URL do Canva
      if (downloadUrl.includes('canva.com')) {
        // Abrir Canva em nova aba
        window.open(downloadUrl, '_blank');
        toast({
          title: "Redirecionando para o Canva",
          description: "Você será redirecionado para editar o template no Canva",
        });
      } else {
        // Download direto
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `${post?.title || 'arquivo'}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast({
          title: "Download iniciado",
          description: "O arquivo está sendo baixado",
        });
      }
    } catch (error) {
      console.error('Erro no download:', error);
      toast({
        title: "Erro no download",
        description: "Ocorreu um erro ao tentar baixar o arquivo",
        variant: "destructive",
      });
    }
  };

  // Funções auxiliares
  const formatLabel = (format: string) => {
    const formatMap: Record<string, string> = {
      'FEED': 'Feed Instagram',
      'STORIES': 'Stories Instagram',
      'STORY': 'Stories Instagram',
      'CARTAZ': 'Cartaz/Pôster',
      'REELS': 'Reels Instagram'
    };
    return formatMap[format?.toUpperCase()] || format;
  };

  const getFormatDimensions = (format: string) => {
    const dimensionsMap: Record<string, string> = {
      'FEED': '1080x1080px',
      'STORIES': '1080x1920px',
      'STORY': '1080x1920px',
      'CARTAZ': '2480x3508px',
      'REELS': '1080x1920px'
    };
    return dimensionsMap[format?.toUpperCase()] || 'Dimensões variadas';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="aspect-square bg-gray-200 rounded-lg"></div>
              <div className="space-y-4">
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-20 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Arte não encontrada</h1>
            <p className="text-gray-600 mb-6">A arte que você está procurando não existe ou foi removida.</p>
            <Link href="/">
              <Button>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar ao início
              </Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
          <Link href="/" className="hover:text-blue-600 transition-colors">
            Início
          </Link>
          <ChevronRight size={16} />
          <Link href={`/categoria/${post.categoryId}`} className="hover:text-blue-600 transition-colors">
            {post.categoryName || 'Categoria'}
          </Link>
          <ChevronRight size={16} />
          <span className="text-gray-900 font-medium">
            {post.title}
          </span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Imagem principal */}
          <div className="space-y-4">
            <div className="relative group">
              <div className="aspect-square rounded-lg overflow-hidden bg-white shadow-md border border-gray-100">
                <img 
                  src={post.imageUrl || post.image_url} 
                  alt={post.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                
                {/* Selo Premium */}
                {post.isPro && (
                  <div className="absolute top-4 right-4">
                    <div className="bg-amber-50 border border-amber-200 rounded-full px-3 py-1 flex items-center gap-1.5">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-amber-600">
                        <path d="M12 2L15.09 8.26L22 9L17 14L18.18 21L12 17.77L5.82 21L7 14L2 9L8.91 8.26L12 2Z" fill="currentColor"/>
                      </svg>
                      <span className="text-xs font-medium text-amber-700">Premium</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Miniaturas de formatos alternativos */}
            {allGroupPosts.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {allGroupPosts.slice(0, 4).map((groupPost: any, index: number) => (
                  <button
                    key={`thumb-${groupPost.id}-${index}`}
                    onClick={() => {
                      const cleanTitle = groupPost.title
                        .toLowerCase()
                        .normalize('NFD')
                        .replace(/[\u0300-\u036f]/g, '')
                        .replace(/[^\w\s-]/g, '')
                        .replace(/\s+/g, '-')
                        .replace(/-+/g, '-')
                        .replace(/^-+|-+$/g, '');
                      
                      const slug = `${groupPost.id}-${cleanTitle}`;
                      setLocation(`/artes/${slug}`);
                    }}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all hover:scale-105 ${
                      groupPost.id === postId 
                        ? 'border-blue-500 ring-2 ring-blue-200' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <img 
                      src={groupPost.imageUrl || groupPost.image_url} 
                      alt={groupPost.title}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
                {allGroupPosts.length > 4 && (
                  <div className="flex-shrink-0 w-16 h-16 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-xs">
                    +{allGroupPosts.length - 4}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Informações do post */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-3">{post.title}</h1>
              {post.description && (
                <p className="text-gray-600 leading-relaxed">{post.description}</p>
              )}
            </div>

            {/* Informações do autor */}
            {postAuthor && (
              <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-100">
                <div className="flex items-center gap-3">
                  <Link href={`/perfil/${postAuthor.id}`}>
                    <Avatar className="w-12 h-12 cursor-pointer hover:opacity-80 transition-opacity">
                      <AvatarImage src={postAuthor.profileImage} alt={postAuthor.username} />
                      <AvatarFallback>{postAuthor.username.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </Link>
                  <div>
                    <Link href={`/perfil/${postAuthor.id}`}>
                      <h3 className="font-medium text-gray-900 hover:text-blue-600 transition-colors cursor-pointer">
                        {postAuthor.username}
                      </h3>
                    </Link>
                    <p className="text-sm text-gray-500">Designer</p>
                  </div>
                </div>
                
                {user && user.id !== postAuthor.id && (
                  <Button
                    variant={isFollowing ? "secondary" : "default"}
                    size="sm"
                    onClick={() => {
                      if (isFollowing) {
                        unfollowMutation.mutate();
                      } else {
                        followMutation.mutate();
                      }
                    }}
                    disabled={followMutation.isPending || unfollowMutation.isPending}
                    className="flex items-center gap-2"
                  >
                    {isFollowing ? (
                      <>
                        <Check size={16} />
                        Seguindo
                      </>
                    ) : (
                      <>
                        <UserPlus size={16} />
                        Seguir
                      </>
                    )}
                  </Button>
                )}
              </div>
            )}

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag: string, index: number) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    #{tag}
                  </Badge>
                ))}
              </div>
            )}

            {/* Ações */}
            <div className="flex items-center gap-3">
              <Button
                variant="outline" 
                size="sm"
                onClick={() => {
                  if (!user) {
                    toast({
                      title: "Login necessário",
                      description: "Você precisa estar logado para favoritar",
                      variant: "destructive",
                    });
                    return;
                  }
                  
                  if (post.isFavorited) {
                    unfavoritePostMutation.mutate();
                  } else {
                    favoritePostMutation.mutate();
                  }
                }}
                className="flex items-center gap-2"
              >
                <Heart 
                  size={16} 
                  className={post.isFavorited ? "fill-red-500 text-red-500" : ""} 
                />
                {post.isFavorited ? 'Favoritado' : 'Favoritar'}
              </Button>
              
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Share2 size={16} />
                Compartilhar
              </Button>
            </div>

            <Separator />

            {/* Detalhes técnicos */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Detalhes</h3>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Como usar este template</h3>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Baixe o arquivo e abra no Canva</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Personalize cores, textos e imagens</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Baixe em alta qualidade e publique</span>
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
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7,10 12,15 17,10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                  <span>Faça login para baixar</span>
                </Button>
              ) : post?.isPro && user?.tipo !== 'premium' ? (
                // Botão para upgrade quando é premium e usuário não é premium
                <Link href="/planos">
                  <Button className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white py-3 h-auto flex items-center justify-center gap-2 rounded-md transition-all">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2L15.09 8.26L22 9L17 14L18.18 21L12 17.77L5.82 21L7 14L2 9L8.91 8.26L12 2Z"/>
                    </svg>
                    <span>Upgrade para Premium</span>
                  </Button>
                </Link>
              ) : (
                // Botão de download normal
                <Button 
                  onClick={handleDownload}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 h-auto flex items-center justify-center gap-2 rounded-md transition-colors"
                >
                  <Download size={16} />
                  <span>Baixar Template</span>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Artes relacionadas */}
        {relatedArtworks && relatedArtworks.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Artes relacionadas</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {relatedArtworks.slice(0, 10).map((item: any) => (
                <ArtworkCard
                  key={`related-${item.id}`}
                  id={item.id}
                  title={item.title}
                  imageUrl={item.imageUrl || item.image_url}
                  isPremium={item.isPro || false}
                  categoryName={item.categoryName}
                  uniqueCode={item.uniqueCode || item.unique_code}
                  formato={item.formato}
                  licenseType={item.licenseType || item.license_type}
                  description={item.description}
                  tags={item.tags}
                  userId={item.userId}
                  createdAt={item.createdAt}
                  canvaUrl={item.canvaUrl || item.canva_url}
                />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}