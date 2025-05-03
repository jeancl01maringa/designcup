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
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/lib/supabase";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function ArtDetailPage() {
  const [location, setLocation] = useLocation();
  const params = useParams<{ slug: string }>();
  const { slug } = params;
  
  // Extrair o ID numérico do slug (por exemplo, "10-xxxxx" => 10)
  const postId = slug ? parseInt(slug.split('-')[0] || '0', 10) : 0;
  
  console.log('Slug recebido:', slug);
  console.log('ID extraído:', postId);
  
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  
  // Buscar os dados da arte
  const { data: post, isLoading, error } = useQuery({
    queryKey: ['/api/admin/posts', postId],
    queryFn: async () => {
      if (!postId) throw new Error('ID inválido');
      
      // Usar nossa API em vez do Supabase diretamente
      const response = await fetch(`/api/admin/posts/${postId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Arte não encontrada');
        }
        throw new Error('Erro ao buscar arte');
      }
      
      const data = await response.json();
      console.log("Dados do post recebidos:", data);
      
      return data;
    },
    retry: 1,
    enabled: !!postId
  });
  
  // Buscar outros formatos da mesma arte - seria ideal ter um endpoint específico 
  // mas por agora vamos simplificar e desativar essa funcionalidade
  const { data: relatedFormats, isLoading: isLoadingRelated } = useQuery({
    queryKey: ['/api/admin/posts/related', post?.groupId],
    queryFn: async () => {
      // Com a implementação atual, desativamos busca por formatos relacionados
      // Quando implementarmos o endpoint group_id, reativamos essa funcionalidade
      return [];
    },
    enabled: false // !!post?.groupId
  });
  
  // Formatar objetos para exibição
  const formatLabel = (format: string) => {
    const formatMap: Record<string, string> = {
      'feed': 'FEED',
      'stories': 'STORIES',
      'post': 'POST',
      'reels': 'REELS',
      'carousel': 'CARROSSEL'
    };
    
    return formatMap[format.toLowerCase()] || format.toUpperCase();
  };
  
  // Determinar se é premium (verificar todos os possíveis campos)
  const isPremium = post?.licenseType === 'premium' || post?.is_pro || post?.isPro;
  
  // Handlers para ações
  const handleFavorite = () => setIsFavorite(!isFavorite);
  const handleSave = () => setIsSaved(!isSaved);
  const handleFollow = () => setIsFollowing(!isFollowing);
  const handleShare = () => {
    // Implementar compartilhamento
    navigator.share?.({
      title: post?.title || 'Arte para Estética',
      text: post?.description || 'Confira esta arte para seus conteúdos de estética',
      url: window.location.href
    }).catch(err => console.error('Erro ao compartilhar:', err));
  };
  
  const handleEditCanva = () => {
    // Implementar link para o Canva
    // A URL canva deve vir dos dados do post em: post.formatData
    // Format data é armazenado como string JSON, então precisamos fazer o parse
    
    try {
      let formatData;
      if (post?.format_data) {
        formatData = JSON.parse(post.format_data);
      }
      
      const canvaUrl = formatData?.canvaUrl || 'https://www.canva.com/design/new';
      window.open(canvaUrl, '_blank');
    } catch (err) {
      console.error('Erro ao abrir link do Canva:', err);
      window.open('https://www.canva.com/design/new', '_blank');
    }
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
            {formatLabel(post.formats?.[0] || 'FEED')}
          </span>
          
          {/* Selo premium */}
          {isPremium && (
            <div className="absolute top-4 right-4 bg-amber-400 text-white rounded-full p-2 z-10">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2l2.4 7.4H22l-6 4.6 2.3 7-6.3-4.1L5.7 21l2.3-7-6-4.6h7.6z" />
              </svg>
            </div>
          )}
          
          {/* Imagem principal */}
          <div className="overflow-hidden rounded-lg shadow-md">
            <img 
              src={post.imageUrl || post.image_url} 
              alt={post.title} 
              className="w-full h-auto object-cover"
            />
          </div>
        </div>
        
        {/* Coluna da direita - Informações */}
        <div className="space-y-5 border border-gray-100 rounded-lg p-4 bg-white shadow-sm">
          {/* Título e selo premium */}
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold">{post.title}</h1>
            {isPremium && (
              <Badge className="bg-amber-400 text-white border-0 flex items-center gap-1 h-6 py-0 px-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2l2.4 7.4H22l-6 4.6 2.3 7-6.3-4.1L5.7 21l2.3-7-6-4.6h7.6z" />
                </svg>
                <span className="text-xs">Premium</span>
              </Badge>
            )}
          </div>
          
          {/* Checklist de vantagens */}
          <div>
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-green-50 flex items-center justify-center">
                  <Check size={10} className="text-green-500" />
                </div>
                <span className="text-gray-700 text-sm">Editável no Canva gratuito</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-green-50 flex items-center justify-center">
                  <Check size={10} className="text-green-500" />
                </div>
                <span className="text-gray-700 text-sm">Para projetos comerciais e pessoais</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-green-50 flex items-center justify-center">
                  <Check size={10} className="text-green-500" />
                </div>
                <span className="text-gray-700 text-sm">Não precisa atribuir o autor</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-green-50 flex items-center justify-center">
                  <Check size={10} className="text-green-500" />
                </div>
                <span className="text-gray-700 text-sm">Qualidade profissional</span>
              </li>
            </ul>
          </div>
          
          {/* Especificações do arquivo */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-700">Especificações do Arquivo</h3>
            <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 border border-gray-300 rounded-full bg-white"></div>
                <div className="flex flex-col">
                  <span className="text-gray-500 text-xs">Formato:</span>
                  <span className="text-sm">{formatLabel(post.formats?.[0] || 'FEED')}</span>
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
                  <Download size={13} className="text-gray-400" />
                </div>
                <div className="flex flex-col">
                  <span className="text-gray-500 text-xs">Downloads:</span>
                  <span className="text-sm">{post.downloads || 0}</span>
                </div>
              </div>
            </div>
            <div className="flex justify-center mt-2">
              <button className="text-xs text-gray-500 flex items-center gap-1">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="16"></line>
                  <line x1="8" y1="12" x2="16" y2="12"></line>
                </svg>
                Ver mais detalhes
              </button>
            </div>
          </div>
          
          {/* Formatos disponíveis */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-700">Formatos disponíveis</h3>
            <div className="border border-gray-200 rounded-md p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="text-xs font-medium">FEED</div>
                  <div className="text-[10px] text-gray-500">1080×1080px • Quadrado</div>
                </div>
                <div className="text-xs text-blue-600">3 opções</div>
              </div>
            </div>
          </div>
          
          {/* Botão principal de ação */}
          <Button 
            onClick={handleEditCanva} 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 h-auto flex items-center justify-center gap-2 rounded-md"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            <span className="font-medium text-sm">EDITAR NO CANVA</span>
          </Button>
          
          {/* Linha de ações */}
          <div className="flex items-center justify-center gap-8 pt-5">
            <button 
              onClick={handleFavorite}
              className="flex flex-col items-center gap-1"
            >
              <Heart size={20} className={isFavorite ? "fill-red-500 text-red-500" : "text-gray-700"} />
              <span className="text-xs text-gray-500">Favoritar</span>
            </button>
            
            <button 
              onClick={handleSave}
              className="flex flex-col items-center gap-1"
            >
              <Bookmark size={20} className={isSaved ? "fill-blue-500 text-blue-500" : "text-gray-700"} />
              <span className="text-xs text-gray-500">Salvar</span>
            </button>
            
            <button 
              onClick={handleShare}
              className="flex flex-col items-center gap-1"
            >
              <Share2 size={20} className="text-gray-700" />
              <span className="text-xs text-gray-500">Compartilhar</span>
            </button>
          </div>
          
          {/* Informações do criador */}
          <div className="flex items-center justify-between border-t pt-4 mt-2">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src="/assets/designer-avatar.png" />
                <AvatarFallback className="bg-gray-100 text-gray-500">DE</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">Design para Estética</p>
                <p className="text-sm text-gray-500">100+ artes postadas</p>
              </div>
            </div>
            <Button
              variant={isFollowing ? "outline" : "default"}
              size="sm"
              onClick={handleFollow}
              className={isFollowing 
                ? "border-gray-300 hover:bg-gray-100" 
                : "bg-black hover:bg-black/90 text-white"
              }
            >
              {isFollowing ? "Seguindo" : "Seguir"}
            </Button>
          </div>
        </div>
      </div>
      
      {/* Seção de outros formatos */}
      {relatedFormats && relatedFormats.length > 0 && (
        <div className="mt-12">
          <h2 className="text-xl font-bold mb-4">Outros formatos</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {relatedFormats.map((format) => (
              <div key={format.id} className="relative rounded-lg overflow-hidden shadow-sm">
                <a 
                  href={`/artes/${format.unique_code || format.id}`}
                  className="block"
                >
                  <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-0.5 rounded text-xs font-medium">
                    {formatLabel(format.formats?.[0] || 'FEED')}
                  </div>
                  
                  {/* Selo premium nos relacionados */}
                  {(format.license_type === 'premium' || format.is_pro) && (
                    <div className="absolute top-2 right-2 bg-amber-400 text-white rounded-full p-1">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2l2.4 7.4H22l-6 4.6 2.3 7-6.3-4.1L5.7 21l2.3-7-6-4.6h7.6z" />
                      </svg>
                    </div>
                  )}
                  
                  <img 
                    src={format.image_url} 
                    alt={format.title} 
                    className="w-full h-auto object-cover"
                  />
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}