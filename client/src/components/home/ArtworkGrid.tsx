import React, { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Post } from "@shared/schema";
import { ArtworkCard } from "./ArtworkCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Star, ImageIcon, Crown } from "lucide-react";

interface ArtworkGridProps {
  category?: string;
  searchTerm?: string;
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

// Hook para organizar posts em colunas para layout masonry
function useMasonryLayout(posts: Post[], columns: number) {
  return React.useMemo(() => {
    const columnArrays: Post[][] = Array.from({ length: columns }, () => []);
    
    posts.forEach((post, index) => {
      const columnIndex = index % columns;
      columnArrays[columnIndex].push(post);
    });
    
    return columnArrays;
  }, [posts, columns]);
}

export default function ArtworkGrid({ category, searchTerm }: ArtworkGridProps) {
  const {
    data: posts,
    isLoading,
    error,
  } = useQuery<Post[]>({
    queryKey: ["/api/posts/visible"],
  });

  const columns = useResponsiveColumns();

  if (isLoading) {
    return (
      <div className={`grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5`}>
        {Array.from({ length: columns }).map((_, colIndex) => (
          <div key={colIndex} className="space-y-4">
            {Array.from({ length: 3 }).map((_, itemIndex) => (
              <div key={itemIndex} className="space-y-3">
                <Skeleton className={`w-full rounded-lg ${itemIndex % 3 === 0 ? 'h-80' : itemIndex % 3 === 1 ? 'h-64' : 'h-72'}`} />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <ImageIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Erro ao carregar posts
        </h3>
        <p className="text-gray-600">
          Tente recarregar a página ou entre em contato com o suporte.
        </p>
      </div>
    );
  }

  if (!posts || posts.length === 0) {
    return (
      <div className="text-center py-12">
        <ImageIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Nenhum post encontrado
        </h3>
        <p className="text-gray-600">
          Não há posts disponíveis no momento.
        </p>
      </div>
    );
  }

  // Filtrar posts por categoria e termo de busca
  let filteredPosts = posts.filter(post => 
    post.status === 'aprovado' && 
    post.isVisible !== false
  );

  if (category && category !== "todos") {
    filteredPosts = filteredPosts.filter((post) => {
      if (!post.categoryId) return false;
      // Converter categoryId para string de categoria para comparação
      const categoryMap: { [key: number]: string } = {
        1: "facial",
        2: "corporal", 
        3: "procedimentos",
        4: "marketing",
        5: "outros"
      };
      return categoryMap[post.categoryId] === category;
    });
  }

  if (searchTerm) {
    filteredPosts = filteredPosts.filter((post) =>
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (post.description && post.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }

  console.log(`Post #${posts[0]?.id}: "${posts[0]?.title}" - isPremium:`, posts[0]?.isPro);

  // Organizar posts em colunas para layout masonry
  const columnArrays = useMasonryLayout(filteredPosts || [], columns);

  return (
    <div className="space-y-6">
      {/* Estatísticas dos posts */}
      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-blue-50 text-blue-700">
            {filteredPosts.length} posts encontrados
          </Badge>
          <Badge variant="secondary" className="bg-yellow-50 text-yellow-700">
            <Crown className="w-3 h-3 mr-1" />
            {filteredPosts.filter(p => p.isPro === true || p.licenseType === 'premium').length} premium
          </Badge>
          <Badge variant="secondary" className="bg-green-50 text-green-700">
            {filteredPosts.filter(p => p.isPro !== true && p.licenseType !== 'premium').length} gratuitos
          </Badge>
        </div>
      </div>

      {/* Grid masonry Pinterest-style */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {columnArrays.map((columnPosts, columnIndex) => (
          <div key={columnIndex} className="space-y-4">
            {columnPosts.map((post) => (
              <ArtworkCard
                key={post.id}
                artwork={{
                  id: post.id,
                  title: post.title,
                  description: post.description || "",
                  imageUrl: post.imageUrl || "/placeholder.jpg",
                  category: post.categoryId?.toString() || "outros",
                  createdAt: new Date(post.createdAt),
                  isPro: post.isPro === true || post.licenseType === 'premium',
                  format: post.formato || "1:1"
                }}
              />
            ))}
          </div>
        ))}
      </div>

      {filteredPosts.length === 0 && (
        <div className="text-center py-12">
          <ImageIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Nenhum resultado encontrado
          </h3>
          <p className="text-gray-600">
            Tente ajustar os filtros ou termo de busca.
          </p>
        </div>
      )}
    </div>
  );
}