import React, { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Post } from "@shared/schema";
import { ArtworkCard } from "./ArtworkCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, ImageIcon, ArrowRight } from "lucide-react";

interface ArtworkGridProps {
  category?: string;
  searchTerm?: string;
  sortOrder?: string;
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

// Função auxiliar para verificar se o post é formato Banner (landscape/horizontal)
function isBannerFormat(post: Post): boolean {
  const formato = (post as any).formato?.toLowerCase() || '';
  return formato === 'banner' || formato === 'horizontal' || formato === 'landscape' ||
    formato === 'youtube thumbnail' || formato === 'capa' || formato === 'capa facebook';
}

// Função para obter o row span baseado no formato
function getRowSpan(post: Post): number {
  const formato = (post as any).formato || '';
  if (isBannerFormat(post)) return 15; // Banner: landscape, shorter
  if (formato === 'Stories') return 38; // Stories: 9:16, very tall
  if (formato === 'Cartaz') return 28; // Cartaz: 4:5
  return 22; // Feed/default: 1:1 square
}

export default function ArtworkGrid({ category, searchTerm, sortOrder }: ArtworkGridProps) {
  const {
    data: posts,
    isLoading,
    error,
  } = useQuery<Post[]>({
    queryKey: ["/api/posts/visible"],
  });

  const { data: categories } = useQuery<any[]>({
    queryKey: ["/api/categories"],
  });

  const columns = useResponsiveColumns();

  // Filtrar posts e preparar lista flat
  const { filteredPosts, displayPosts } = useMemo(() => {
    const allPosts = posts || [];

    let filtered = allPosts.filter(post =>
      post.status === 'aprovado' &&
      post.isVisible !== false
    );

    if (category && category !== "todos") {
      filtered = filtered.filter((post) => {
        if (!post.categoryId) return false;
        if (categories) {
          const cat = categories.find((c: any) => c.id === post.categoryId);
          if (cat) {
            return cat.slug === category || String(cat.id) === String(category);
          }
        }
        return false;
      });
    }

    if (searchTerm) {
      filtered = filtered.filter((post) =>
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (post.description && post.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Evitar duplicatas: manter apenas um post por group_id, priorizando formato Cartaz
    const groupedPosts = new Map<string, Post[]>();

    for (const post of filtered) {
      const groupId = (post as any).group_id || `single_${post.id}`;
      if (!groupedPosts.has(groupId)) {
        groupedPosts.set(groupId, []);
      }
      groupedPosts.get(groupId)!.push(post);
    }

    const uniquePosts: Post[] = [];
    Array.from(groupedPosts.values()).forEach((groupPosts) => {
      const cartazPost = groupPosts.find((p: any) => p.formato === 'Cartaz');
      const storiesPost = groupPosts.find((p: any) => p.formato === 'Stories');

      if (cartazPost) {
        uniquePosts.push(cartazPost);
      } else if (storiesPost) {
        uniquePosts.push(storiesPost);
      } else {
        uniquePosts.push(groupPosts[0]);
      }
    });

    // Aplicar ordenação
    let shuffledPosts: Post[] = [];

    if (sortOrder === "Em alta") {
      const sortedByDate = [...uniquePosts].sort((a, b) =>
        new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime()
      );
      shuffledPosts = [...sortedByDate].sort(() => Math.random() - 0.5);
    } else {
      shuffledPosts = [...uniquePosts].sort(() => Math.random() - 0.5);
    }

    // Limitar quantidade de posts
    let maxPosts = 20;
    if (columns === 2) maxPosts = 12;
    else if (columns === 3) maxPosts = 15;
    else if (columns === 4) maxPosts = 16;

    const displayPosts = shuffledPosts.slice(0, maxPosts);

    return { filteredPosts: filtered, displayPosts };
  }, [posts, categories, category, searchTerm, columns, sortOrder]);

  if (isLoading || (category && category !== "todos" && !categories)) {
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
        <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Erro ao carregar posts
        </h3>
        <p className="text-muted-foreground">
          Tente recarregar a página ou entre em contato com o suporte.
        </p>
      </div>
    );
  }

  if (!posts || posts.length === 0) {
    return (
      <div className="text-center py-12">
        <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Nenhum post encontrado
        </h3>
        <p className="text-muted-foreground">
          Não há posts disponíveis no momento.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* CSS Grid Masonry com suporte a Banner spanning 2 colunas */}
      <div
        className="grid gap-4"
        style={{
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gridAutoRows: '10px',
        }}
      >
        {displayPosts.map((post) => {
          const banner = isBannerFormat(post);
          const rowSpan = getRowSpan(post);

          return (
            <div
              key={post.id}
              style={{
                gridRowEnd: `span ${rowSpan}`,
                ...(banner && columns >= 3 ? { gridColumn: 'span 2' } : {}),
              }}
            >
              <ArtworkCard
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
            </div>
          );
        })}
      </div>

      {filteredPosts.length === 0 && (
        <div className="text-center py-12">
          <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Nenhum resultado encontrado
          </h3>
          <p className="text-muted-foreground">
            Tente ajustar os filtros ou termo de busca.
          </p>
        </div>
      )}

      {/* Botão Ver todas as artes */}
      {filteredPosts.length > 0 && (
        <div className="flex justify-center mt-16">
          <a
            href="/todas-artes"
            className="inline-flex items-center px-6 py-3 bg-muted border border-transparent hover:border-primary text-muted-foreground hover:text-foreground font-medium rounded-lg transition-all duration-300"
          >
            Ver todas as artes
            <ArrowRight className="w-4 h-4 ml-2" />
          </a>
        </div>
      )}
    </div>
  );
}