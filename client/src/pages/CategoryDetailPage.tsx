import { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArtworkCard } from "@/components/home/ArtworkCard";
import { Skeleton } from "@/components/ui/skeleton";

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

// Hook para calcular o número de colunas baseado na largura da tela
function useResponsiveColumns() {
  const [columns, setColumns] = useState(4);

  useEffect(() => {
    const updateColumns = () => {
      const width = window.innerWidth;
      if (width < 640) setColumns(1);      // mobile
      else if (width < 768) setColumns(2); // sm
      else if (width < 1024) setColumns(3); // md
      else if (width < 1280) setColumns(4); // lg
      else setColumns(5);                   // xl+
    };

    updateColumns();
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, []);

  return columns;
}

export default function CategoryDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [filter, setFilter] = useState("todos");

  // Buscar dados da categoria
  const {
    data: category,
    isLoading: categoryLoading,
    error: categoryError,
  } = useQuery<Category>({
    queryKey: [`/api/categories/${slug}`],
    enabled: !!slug,
  });

  // Buscar posts da categoria
  const {
    data: posts,
    isLoading: postsLoading,
    error: postsError,
  } = useQuery<Post[]>({
    queryKey: [`/api/posts/category/${category?.id}`, { detailed: true }],
    enabled: !!category?.id,
  });

  const columns = useResponsiveColumns();

  // Filtrar posts e organizar em colunas usando useMemo
  const { filteredPosts, columnArrays } = useMemo(() => {
    const allPosts = posts || [];
    
    // Aplicar filtros
    let filtered = allPosts;
    if (filter === "premium") {
      filtered = allPosts.filter(post => post.isPremium);
    } else if (filter === "gratis") {
      filtered = allPosts.filter(post => !post.isPremium);
    } else if (filter === "populares") {
      filtered = [...allPosts].sort((a, b) => (b.likes || 0) - (a.likes || 0));
    } else if (filter === "recentes") {
      filtered = [...allPosts].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }

    // Organizar em colunas para layout masonry
    const cols: Post[][] = Array.from({ length: columns }, () => []);
    
    filtered.forEach((post, index) => {
      const columnIndex = index % columns;
      cols[columnIndex].push(post);
    });

    return {
      filteredPosts: filtered,
      columnArrays: cols,
    };
  }, [posts, filter, columns]);

  if (categoryLoading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-2 mb-6">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-20" />
          </div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-32 mb-6" />
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-10 w-32" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-64 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (categoryError || !category) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Categoria não encontrada</h1>
            <p className="text-gray-600 mb-6">A categoria que você está procurando não existe.</p>
            <Link href="/categorias">
              <Button>Voltar para Categorias</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6 text-sm text-gray-600">
          <Link href="/categorias" className="hover:text-blue-600">
            Categorias
          </Link>
          <ChevronLeft className="h-4 w-4 rotate-180" />
          <span className="text-gray-900">{category.name}</span>
        </div>

        {/* Header da categoria */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{category.name}</h1>
          <p className="text-gray-600 mb-4">{category.description}</p>
          <Badge variant="outline" className="text-sm">
            {filteredPosts.length} {filteredPosts.length === 1 ? 'arte' : 'artes'}
          </Badge>
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <h2 className="text-xl font-semibold text-gray-900">Artes</h2>
          
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="premium">Premium</SelectItem>
              <SelectItem value="gratis">Grátis</SelectItem>
              <SelectItem value="populares">Populares</SelectItem>
              <SelectItem value="recentes">Recentes</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Grid de artworks - Masonry Layout igual ao home */}
        {postsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-64 w-full rounded-lg" />
            ))}
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Nenhuma arte encontrada
            </h3>
            <p className="text-gray-600 mb-6">
              Não há artes disponíveis nesta categoria no momento.
            </p>
            <Link href="/categorias">
              <Button variant="outline">Explorar outras categorias</Button>
            </Link>
          </div>
        ) : (
          <div className="flex gap-6">
            {columnArrays.map((column, columnIndex) => (
              <div key={columnIndex} className="flex-1 space-y-6">
                {column.map((post) => {
                  // Transform Post data to Artwork interface
                  const artwork = {
                    id: post.id,
                    title: post.title,
                    description: post.description,
                    imageUrl: post.imageUrl,
                    format: 'square', // Default format since posts don't have this field
                    isPro: post.isPremium,
                    category: category?.name || '',
                    createdAt: new Date(post.createdAt)
                  };
                  
                  return (
                    <ArtworkCard
                      key={post.id}
                      artwork={artwork}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}