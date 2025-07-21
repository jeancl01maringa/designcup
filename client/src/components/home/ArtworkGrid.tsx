import React, { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Post } from "@shared/schema";
import { ArtworkCard } from "./ArtworkCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, ImageIcon, ArrowRight } from "lucide-react";

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
          5: "salao-de-beleza",
          6: "corporal",
          7: "massagem",
          10: "hof",
          11: "labial",
          12: "laser", 
          13: "sobrancelhas"
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

    // Evitar duplicatas: manter apenas um post por group_id
    const uniquePosts: Post[] = [];
    const seenGroupIds = new Set<string>();
    
    // Ordenar por data (mais recentes primeiro) antes de processar
    const sortedPosts = [...filtered].sort((a, b) => 
      new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime()
    );
    
    for (const post of sortedPosts) {
      const groupId = (post as any).group_id || `single_${post.id}`;
      if (!seenGroupIds.has(groupId)) {
        seenGroupIds.add(groupId);
        uniquePosts.push(post);
      }
    }
    
    // Manter ordem cronológica das mais recentes para mais antigas
    // Embaralhar apenas dentro de grupos de posts da mesma data para misturar categorias
    const groupedByDate = new Map<string, Post[]>();
    
    uniquePosts.forEach(post => {
      const dateKey = new Date(post.createdAt || '').toDateString();
      if (!groupedByDate.has(dateKey)) {
        groupedByDate.set(dateKey, []);
      }
      groupedByDate.get(dateKey)!.push(post);
    });
    
    // Embaralhar posts dentro de cada data e depois juntar mantendo ordem cronológica
    const shuffledPosts: Post[] = [];
    const sortedDates = Array.from(groupedByDate.keys()).sort((a, b) => 
      new Date(b).getTime() - new Date(a).getTime()
    );
    
    sortedDates.forEach(dateKey => {
      const postsOfDate = groupedByDate.get(dateKey) || [];
      const shuffledPostsOfDate = [...postsOfDate].sort(() => Math.random() - 0.5);
      shuffledPosts.push(...shuffledPostsOfDate);
    });

    // Definir quantidade de posts baseado no número de colunas
    let postsToShow: Post[] = [];
    
    if (columns === 2) {
      // Mobile: força exatamente 12 posts (6 por coluna) para garantir equilíbrio
      postsToShow = shuffledPosts.slice(0, 12);
    } else if (columns === 3) {
      // Tablet: exatamente 15 posts (5 por coluna)
      postsToShow = shuffledPosts.slice(0, 15);
    } else if (columns === 4) {
      // Desktop pequeno: exatamente 16 posts (4 por coluna)
      postsToShow = shuffledPosts.slice(0, 16);
    } else {
      // Desktop grande: exatamente 20 posts (4 por coluna)
      postsToShow = shuffledPosts.slice(0, 20);
    }
    
    // Distribuir posts garantindo equilíbrio absoluto
    const columnArrays: Post[][] = Array.from({ length: columns }, () => []);
    
    // Distribuir post por post, coluna por coluna
    for (let i = 0; i < postsToShow.length; i++) {
      const columnIndex = i % columns;
      columnArrays[columnIndex].push(postsToShow[i]);
    }
    
    // Debug final - confirmar distribuição
    if (columns === 2) {
      console.log(`FINAL CHECK: Total=${postsToShow.length}, Col1=${columnArrays[0].length}, Col2=${columnArrays[1].length}`);
    }

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
        <div className="flex justify-center mt-16">
          <a 
            href="/todas-artes"
            className="inline-flex items-center px-6 py-3 bg-[#191c2c] hover:bg-[#14182a] text-white font-medium rounded-full transition-colors duration-200"
          >
            Ver todas as artes
            <ArrowRight className="w-4 h-4 ml-2" />
          </a>
        </div>
      )}
    </div>
  );
}