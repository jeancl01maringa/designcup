import React, { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Post } from "@shared/schema";
import { ArtworkCard } from "./ArtworkCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Star, ImageIcon, Crown, ArrowRight } from "lucide-react";

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
      if (width < 640) setColumns(2);      // mobile - 2 columns
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

export default function ArtworkGrid({ category, searchTerm }: ArtworkGridProps) {
  const {
    data: posts,
    isLoading,
    error,
  } = useQuery<Post[]>({
    queryKey: ["/api/posts/visible"],
  });

  const columns = useResponsiveColumns();

  // Filtrar posts e organizar em colunas usando useMemo
  const { filteredPosts, columnArrays } = useMemo(() => {
    const allPosts = posts || [];
    
    let filtered = allPosts.filter(post => 
      post.status === 'aprovado' && 
      post.isVisible !== false
    );

    if (category && category !== "todos") {
      filtered = filtered.filter((post) => {
        if (!post.categoryId) return false;
        const categoryMap: { [key: number]: string } = {
          2: "depilacao",
          3: "facial", 
          4: "botox",
          5: "sala-de-beleza",
          6: "corporal",
          7: "massagem",
          8: "pele"
        };
        return categoryMap[post.categoryId] === category;
      });
    }

    if (searchTerm) {
      filtered = filtered.filter((post) =>
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (post.description && post.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Organizar posts em colunas para layout masonry
    const columnArrays: Post[][] = Array.from({ length: columns }, () => []);
    filtered.forEach((post, index) => {
      const columnIndex = index % columns;
      columnArrays[columnIndex].push(post);
    });

    return { filteredPosts: filtered, columnArrays };
  }, [posts, category, searchTerm, columns]);

  if (isLoading) {
    return (
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
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

  console.log(`Post #${posts[0]?.id}: "${posts[0]?.title}" - isPremium:`, posts[0]?.isPro);

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
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
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

      {/* Botão Ver todas as artes */}
      {filteredPosts.length > 0 && (
        <div className="flex justify-center mt-8">
          <a 
            href="/todas-artes"
            className="inline-flex items-center px-6 py-3 bg-[#191c2c] hover:bg-[#14182a] text-white font-medium rounded-lg transition-colors duration-200"
          >
            Ver todas as artes
            <ArrowRight className="w-4 h-4 ml-2" />
          </a>
        </div>
      )}
    </div>
  );
}