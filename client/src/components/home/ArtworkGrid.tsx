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

// Verifica se o post é formato Banner (landscape/horizontal)
function isBannerFormat(post: Post): boolean {
  const formato = (post as any).formato?.toLowerCase() || '';
  return formato === 'banner' || formato === 'horizontal' || formato === 'landscape' ||
    formato === 'youtube thumbnail' || formato === 'capa' || formato === 'capa facebook';
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

  // Filtrar posts, separar banners, e organizar em colunas
  const { filteredPosts, columnArrays, bannerPosts } = useMemo(() => {
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

    // Evitar duplicatas: manter apenas um post por group_id
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
      if (cartazPost) uniquePosts.push(cartazPost);
      else if (storiesPost) uniquePosts.push(storiesPost);
      else uniquePosts.push(groupPosts[0]);
    });

    // Ordenação
    let shuffledPosts: Post[];
    if (sortOrder === "Em alta") {
      const sortedByDate = [...uniquePosts].sort((a, b) =>
        new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime()
      );
      shuffledPosts = [...sortedByDate].sort(() => Math.random() - 0.5);
    } else {
      shuffledPosts = [...uniquePosts].sort(() => Math.random() - 0.5);
    }

    // Separar banners dos posts normais
    const bannerPosts: Post[] = [];
    const regularPosts: Post[] = [];
    for (const post of shuffledPosts) {
      if (isBannerFormat(post)) {
        bannerPosts.push(post);
      } else {
        regularPosts.push(post);
      }
    }

    // Limitar quantidade de posts regulares
    let maxPosts = 20;
    if (columns === 2) maxPosts = 12;
    else if (columns === 3) maxPosts = 15;
    else if (columns === 4) maxPosts = 16;

    const postsToShow = regularPosts.slice(0, maxPosts);

    // Distribuir posts em colunas com balanceamento por altura
    const columnArrays: Post[][] = Array.from({ length: columns }, () => []);
    const columnHeights: number[] = new Array(columns).fill(0);

    for (const post of postsToShow) {
      let height = 1; // Default proportion (1:1)
      if (post.formato === 'Stories') height = 1.77;
      else if (post.formato === 'Cartaz') height = 1.25;

      let targetColumn = 0;
      let minHeight = columnHeights[0];
      for (let c = 1; c < columns; c++) {
        if (columnHeights[c] < minHeight) {
          minHeight = columnHeights[c];
          targetColumn = c;
        }
      }

      columnArrays[targetColumn].push(post);
      columnHeights[targetColumn] += height;
    }

    // Limitar banners a no máximo 3 para não sobrecarregar
    const limitedBanners = bannerPosts.slice(0, 3);

    return { filteredPosts: filtered, columnArrays, bannerPosts: limitedBanners };
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
        <h3 className="text-lg font-semibold text-foreground mb-2">Erro ao carregar posts</h3>
        <p className="text-muted-foreground">Tente recarregar a página ou entre em contato com o suporte.</p>
      </div>
    );
  }

  if (!posts || posts.length === 0) {
    return (
      <div className="text-center py-12">
        <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum post encontrado</h3>
        <p className="text-muted-foreground">Não há posts disponíveis no momento.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Banners em largura total (span across 2 colunas) */}
      {bannerPosts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {bannerPosts.map((post) => (
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
      )}

      {/* Grid masonry coluna-a-coluna (layout original com espaçamento correto) */}
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
          <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum resultado encontrado</h3>
          <p className="text-muted-foreground">Tente ajustar os filtros ou termo de busca.</p>
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