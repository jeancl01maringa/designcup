import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/use-auth';
import { Upload, Flag, Heart, Clock, TrendingUp, Filter, Camera, Bookmark, ExternalLink, Lock, ImageIcon } from 'lucide-react';
import { Loader2 } from 'lucide-react';

interface UserProfile {
  id: number;
  username: string;
  email: string;
  profileImage: string | null;
  telefone: string | null;
  tipo: 'free' | 'premium';
  createdAt: string;
  bio?: string;
}

interface UserStats {
  postsCount: number;
  downloads: number;
  views: number;
  followers: number;
}

interface Post {
  id: number;
  title: string;
  imageUrl: string;
  formato: string;
  isPro: boolean;
  uniqueCode: string;
  createdAt: string;
  views?: number;
}

// Componente de card de artwork idêntico ao feed principal
function ProfileArtworkCard({ post, onNavigate }: { post: Post; onNavigate: () => void }) {
  const [imageError, setImageError] = useState(false);
  const [imageSrc, setImageSrc] = useState(post.imageUrl);
  const [hovered, setHovered] = useState(false);

  const handleImageError = () => {
    if (imageSrc.includes('supabase.co') && !imageSrc.includes('uploads/') && !imageError) {
      const filename = imageSrc.split('/').pop()?.split('?')[0];
      if (filename) {
        const baseUrl = imageSrc.split('/storage/v1/object/public/images/')[0];
        const correctUrl = `${baseUrl}/storage/v1/object/public/images/uploads/${filename}`;
        setImageSrc(correctUrl);
        return;
      }
    }
    if (!imageError) {
      setImageError(true);
    }
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div
      className="image-card relative rounded-lg overflow-hidden transition-all duration-300 hover:shadow-md hover:scale-[1.02] w-full mb-3 cursor-pointer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onNavigate}
    >
      <div className="relative overflow-hidden w-full">
        {imageError ? (
          <div className="w-full aspect-square bg-gray-100 flex items-center justify-center">
            <ImageIcon className="w-12 h-12 text-gray-400" />
          </div>
        ) : (
          <img 
            src={imageSrc} 
            alt={post.title}
            className="w-full h-auto object-cover display-block"
            loading="lazy"
            onError={handleImageError}
          />
        )}
        
        {/* Pro badge - coroa premium SEMPRE visível no canto superior direito */}
        {post.isPro && (
          <div className="badge-premium absolute top-2 right-2 z-10 bg-black/70 text-[#FFC107] rounded-full w-8 h-8 flex items-center justify-center shadow-md relative">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="#FFC107" stroke="#FFC107" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-crown">
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
            className="p-2 rounded-full shadow-md transition-colors bg-white text-black hover:bg-white/90"
            onClick={handleLike}
            aria-label="Adicionar aos favoritos"
          >
            <Heart className="h-4 w-4" />
          </button>
          
          <button 
            className="p-2 rounded-full shadow-md transition-colors bg-white text-black hover:bg-white/90"
            onClick={handleSave}
            aria-label="Salvar item"
          >
            <Bookmark className="h-4 w-4" />
          </button>
        </div>
        
        {/* Botão de editar ao passar o mouse */}
        <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${hovered ? 'opacity-100' : 'opacity-0'}`}>
          <Button 
            className="bg-black/70 hover:bg-black/90 text-white rounded-full px-6 py-1 h-8 text-xs shadow-md z-10"
            onClick={handleEditClick}
          >
            {post.isPro ? (
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
    </div>
  );
}

export default function ProfilePage() {
  const { id } = useParams();
  const [location, navigate] = useLocation();
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState('todos');

  // Buscar dados do perfil
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['/api/admin/users', id],
    queryFn: async () => {
      if (!id) throw new Error('ID não fornecido');
      const response = await fetch(`/api/admin/users/${id}`);
      if (!response.ok) throw new Error('Usuário não encontrado');
      return response.json() as Promise<UserProfile>;
    },
    enabled: !!id
  });

  // Buscar estatísticas do usuário
  const { data: stats } = useQuery({
    queryKey: ['/api/users', id, 'stats'],
    queryFn: async () => {
      if (!id) return { postsCount: 0, downloads: 0, views: 0, followers: 0 };
      
      // Buscar posts do usuário
      const postsResponse = await fetch(`/api/admin/posts?userId=${id}`);
      const posts = postsResponse.ok ? await postsResponse.json() : [];
      
      // Buscar seguidores
      const followersResponse = await fetch(`/api/users/${id}/followers`);
      const followersData = followersResponse.ok ? await followersResponse.json() : { count: 0 };
      
      return {
        postsCount: posts.length,
        downloads: posts.reduce((acc: number, post: any) => acc + (post.downloads || 0), 0),
        views: posts.reduce((acc: number, post: any) => acc + (post.views || 0), 0),
        followers: followersData.count || 0
      };
    },
    enabled: !!id
  });

  // Buscar posts do usuário
  const { data: posts = [] } = useQuery({
    queryKey: ['/api/admin/posts', 'user', id],
    queryFn: async () => {
      if (!id) return [];
      const response = await fetch(`/api/admin/posts?userId=${id}`);
      if (!response.ok) return [];
      return response.json() as Promise<Post[]>;
    },
    enabled: !!id
  });

  // Buscar status de seguidor
  const { data: followStatus, refetch: refetchFollowStatus } = useQuery({
    queryKey: ['/api/users', id, 'follow-status'],
    queryFn: async () => {
      if (!id || !user) return { following: false };
      const response = await fetch(`/api/users/${id}/follow-status`);
      if (!response.ok) return { following: false };
      return response.json();
    },
    enabled: !!(id && user)
  });

  // Atualizar estado de seguir
  useEffect(() => {
    if (followStatus) {
      setIsFollowing(followStatus.following);
    }
  }, [followStatus]);

  // Função para seguir/desseguir
  const handleFollow = async () => {
    if (!user || !id) return;
    
    setFollowLoading(true);
    try {
      const response = await fetch(`/api/users/${id}/follow`, {
        method: 'POST'
      });
      
      if (response.ok) {
        const result = await response.json();
        setIsFollowing(result.following);
        refetchFollowStatus();
      }
    } catch (error) {
      console.error('Erro ao seguir/desseguir:', error);
    } finally {
      setFollowLoading(false);
    }
  };

  // Filtrar posts
  const filteredPosts = posts.filter(post => {
    switch (activeFilter) {
      case 'favoritas':
        return post.isPro; // Assumindo que favoritas são premium
      case 'recentes':
        return new Date(post.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Últimos 30 dias
      case 'em-alta':
        return (post.views || 0) > 100; // Posts com mais visualizações
      default:
        return true;
    }
  });

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold mb-4">Perfil não encontrado</h1>
        <Button onClick={() => navigate('/')}>Voltar ao início</Button>
      </div>
    );
  }

  const isOwnProfile = user?.id === profile.id;
  const joinDate = new Date(profile.createdAt).toLocaleDateString('pt-BR', { 
    year: 'numeric', 
    month: 'long' 
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Banner superior */}
      <div className="relative h-48 bg-gradient-to-r from-blue-400 via-purple-500 to-orange-400 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400/80 via-purple-500/80 to-orange-400/80">
          <svg className="absolute top-0 left-0 w-full h-full" viewBox="0 0 1000 400" preserveAspectRatio="none">
            <polygon points="0,0 1000,0 1000,300 0,400" fill="rgba(255,255,255,0.1)" />
            <polygon points="200,100 800,50 1000,200 0,350" fill="rgba(255,255,255,0.05)" />
          </svg>
        </div>
      </div>

      {/* Container principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-10">
        {/* Card do perfil */}
        <Card className="bg-white shadow-lg border-0 mb-8">
          <CardContent className="p-8">
            <div className="flex flex-col items-center text-center gap-6">
              {/* Avatar centralizado com proporção correta */}
              <div className="relative">
                <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
                  {profile.profileImage ? (
                    <AvatarImage 
                      src={profile.profileImage} 
                      alt={profile.username}
                      className="object-cover w-full h-full rounded-full"
                    />
                  ) : (
                    <AvatarFallback className="bg-blue-100 text-blue-600 text-2xl font-bold">
                      {profile.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  )}
                </Avatar>
                
                {/* Botão de upload apenas no próprio perfil */}
                {isOwnProfile && (
                  <button className="absolute bottom-0 right-0 bg-black text-white rounded-full p-2 shadow-lg hover:bg-gray-800 transition-colors">
                    <Camera className="h-4 w-4" />
                  </button>
                )}
              </div>
              
              {/* Informações básicas centralizadas */}
              <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-900">{profile.username}</h1>
                <p className="text-gray-600">Desde {joinDate}</p>
                <p className="text-gray-700 mt-2 max-w-md mx-auto">
                  {profile.bio || "Bem-vindo ao nosso perfil oficial! Aqui você encontra conteúdos criativos que agregam valor aos seus projetos."}
                </p>
              </div>

              {/* Botões de ação centralizados */}
              <div className="flex gap-3 justify-center">
                {isOwnProfile ? (
                  <Button variant="outline" size="sm">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload
                  </Button>
                ) : (
                  <>
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
                    <Button variant="outline" size="sm">
                      <Flag className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>

              {/* Estatísticas centralizadas */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{stats?.postsCount || 0}</div>
                  <div className="text-sm text-gray-600">Arquivos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{stats?.downloads || 0}</div>
                  <div className="text-sm text-gray-600">Downloads</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{stats?.views || 0}</div>
                  <div className="text-sm text-gray-600">Visualizações</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{stats?.followers || 0}</div>
                  <div className="text-sm text-gray-600">Seguidores</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Seção de artes */}
        <Card className="bg-white shadow-lg border-0">
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-blue-600">
                Artes do Designer ({filteredPosts.length})
              </h2>
              
              {/* Filtros */}
              <Tabs value={activeFilter} onValueChange={setActiveFilter} className="w-auto">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="todos">Todos</TabsTrigger>
                  <TabsTrigger value="favoritas">
                    <Heart className="h-4 w-4 mr-1" />
                    Favoritas
                  </TabsTrigger>
                  <TabsTrigger value="recentes">
                    <Clock className="h-4 w-4 mr-1" />
                    Recentes
                  </TabsTrigger>
                  <TabsTrigger value="em-alta">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    Em Alta
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Grid de artes seguindo exatamente o padrão do feed principal */}
            {filteredPosts.length > 0 ? (
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {Array.from({ length: 5 }).map((_, colIndex) => (
                  <div key={colIndex} className="space-y-4">
                    {filteredPosts
                      .filter((_, index) => index % 5 === colIndex)
                      .map((post) => (
                        <ProfileArtworkCard 
                          key={post.id} 
                          post={post} 
                          onNavigate={() => navigate(`/artes/${post.uniqueCode}`)}
                        />
                      ))}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="text-gray-400 mb-4">
                  <Filter className="h-16 w-16 mx-auto" />
                </div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">Nenhuma arte encontrada</h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  {activeFilter === 'todos' 
                    ? 'Este designer ainda não publicou nenhuma arte.' 
                    : 'Nenhuma arte encontrada para este filtro. Tente selecionar "Todos" para ver todas as artes.'
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}