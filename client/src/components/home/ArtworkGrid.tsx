import React from "react";
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

export default function ArtworkGrid({ category, searchTerm }: ArtworkGridProps) {
  const {
    data: posts,
    isLoading,
    error,
  } = useQuery<Post[]>({
    queryKey: ["/api/posts/visible"],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="aspect-square w-full rounded-lg" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
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

      {/* Grid de posts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredPosts.map((post) => (
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