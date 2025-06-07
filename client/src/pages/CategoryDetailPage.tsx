import { useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, Heart, Bookmark, Share2, Download, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface Category {
  id: number;
  name: string;
  description: string;
  slug: string;
}

interface Post {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  isPremium: boolean;
  categoryId: number;
  authorId: number;
  authorName: string;
  authorProfileImage: string;
  views: number;
  likes: number;
  saves: number;
  createdAt: string;
  uniqueCode: string;
}

export default function CategoryDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [filter, setFilter] = useState("todos");
  const [sortBy, setSortBy] = useState("recentes");
  const [formatFilter, setFormatFilter] = useState("todos");

  // Buscar dados da categoria
  const { data: category, isLoading: categoryLoading } = useQuery<Category>({
    queryKey: [`/api/categories/${slug}`],
    queryFn: async () => {
      const response = await fetch(`/api/categories/${slug}`);
      if (!response.ok) throw new Error('Categoria não encontrada');
      return response.json();
    }
  });

  // Buscar posts da categoria
  const { data: posts = [], isLoading: postsLoading } = useQuery<Post[]>({
    queryKey: [`/api/posts/category/${category?.id}`, filter, sortBy, formatFilter],
    queryFn: async () => {
      if (!category?.id) return [];
      const response = await fetch(`/api/posts/category/${category.id}`);
      if (!response.ok) throw new Error('Erro ao buscar posts');
      return response.json();
    },
    enabled: !!category?.id
  });

  // Filtrar posts baseado nos filtros selecionados
  const filteredPosts = posts.filter(post => {
    if (filter === "premium" && !post.isPremium) return false;
    if (filter === "gratis" && post.isPremium) return false;
    return true;
  }).sort((a, b) => {
    if (sortBy === "populares") return b.views - a.views;
    if (sortBy === "curtidas") return b.likes - a.likes;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  if (categoryLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="pt-24 pb-8">
          <div className="container mx-auto px-4">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-64 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-96 mb-8"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg p-4">
                    <div className="aspect-square bg-gray-200 rounded mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="pt-24 pb-8">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Categoria não encontrada</h1>
            <Link href="/categorias">
              <Button variant="outline">
                <ChevronLeft className="h-4 w-4 mr-2" />
                Voltar para Categorias
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="pt-24 pb-8">
        <div className="container mx-auto px-4">
          {/* Breadcrumb */}
          <div className="mb-6">
            <nav className="flex items-center space-x-2 text-sm text-gray-600">
              <Link href="/categorias" className="hover:text-gray-900 flex items-center">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Categorias
              </Link>
              <span>/</span>
              <span className="text-gray-900">{category.name}</span>
            </nav>
          </div>

          {/* Header da Categoria */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">{category.name}</h1>
            <p className="text-lg text-gray-600 mb-4">{category.description}</p>
            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="text-sm">
                {filteredPosts.length} {filteredPosts.length === 1 ? 'arte' : 'artes'}
              </Badge>
            </div>
          </div>

          {/* Filtros */}
          <div className="mb-8 bg-white rounded-lg p-6 shadow-sm">
            <div className="flex flex-wrap gap-4 items-center">
              {/* Filtro Principal */}
              <div className="flex space-x-2">
                <Button
                  variant={filter === "todos" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("todos")}
                >
                  Todos
                </Button>
                <Button
                  variant={filter === "premium" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("premium")}
                >
                  Premium
                </Button>
                <Button
                  variant={filter === "gratis" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("gratis")}
                >
                  Grátis
                </Button>
              </div>

              {/* Ordenação */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recentes">Recentes</SelectItem>
                  <SelectItem value="populares">Populares</SelectItem>
                  <SelectItem value="curtidas">Mais Curtidas</SelectItem>
                </SelectContent>
              </Select>

              {/* Filtro de Formato */}
              <Select value={formatFilter} onValueChange={setFormatFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Formato" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos Formatos</SelectItem>
                  <SelectItem value="feed">Feed</SelectItem>
                  <SelectItem value="stories">Stories</SelectItem>
                  <SelectItem value="cartaz">Cartaz</SelectItem>
                  <SelectItem value="panfleto">Panfleto</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Grid de Posts */}
          {postsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg overflow-hidden shadow-sm animate-pulse">
                  <div className="aspect-square bg-gray-200"></div>
                  <div className="p-4">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Eye className="h-16 w-16 mx-auto" />
              </div>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                Nenhuma arte encontrada
              </h3>
              <p className="text-gray-500">
                Tente ajustar os filtros ou explore outras categorias.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredPosts.map((post) => (
                <div key={post.id} className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 group">
                  <Link href={`/artes/${post.uniqueCode}`}>
                    <div className="relative aspect-square overflow-hidden">
                      <img
                        src={post.imageUrl}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      {/* Premium Badge - sem coroa */}
                      {post.isPremium && (
                        <div className="absolute top-2 right-2">
                          <Badge className="bg-yellow-400 text-black text-xs font-bold">
                            PREMIUM
                          </Badge>
                        </div>
                      )}
                      
                      {/* Overlay com ações */}
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <div className="flex space-x-2">
                          <Button size="sm" variant="secondary" className="h-8 w-8 p-0">
                            <Heart className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="secondary" className="h-8 w-8 p-0">
                            <Bookmark className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="secondary" className="h-8 w-8 p-0">
                            <Share2 className="h-4 w-4" />
                          </Button>
                          {post.isPremium && (
                            <Button size="sm" variant="secondary" className="h-8 w-8 p-0">
                              <Download className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>

                  {/* Informações do Post */}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                      {post.title}
                    </h3>
                    
                    {/* Autor */}
                    <div className="flex items-center space-x-2 mb-3">
                      <img
                        src={post.authorProfileImage || '/placeholder-avatar.jpg'}
                        alt={post.authorName}
                        className="w-6 h-6 rounded-full"
                      />
                      <span className="text-sm text-gray-600">{post.authorName}</span>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center space-x-3">
                        <span className="flex items-center">
                          <Eye className="h-4 w-4 mr-1" />
                          {post.views}
                        </span>
                        <span className="flex items-center">
                          <Heart className="h-4 w-4 mr-1" />
                          {post.likes}
                        </span>
                      </div>
                      <span>{new Date(post.createdAt).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}