import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Bookmark, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { ArtworkCard } from "@/components/home/ArtworkCard";
import { Post } from "@shared/schema";
import { ProfileLayout } from "@/components/layout/ProfileLayout";

export default function SalvosPage() {
  const { user } = useAuth();

  // Buscar artes salvas pelo usuário
  const { data: savedPosts = [], isLoading } = useQuery<Post[]>({
    queryKey: ['/api/user/saved-posts'],
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutos em cache
  });

  if (isLoading) {
    return (
      <ProfileLayout>
        <div className="max-w-7xl">
          <div className="mb-6">
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight flex items-center gap-2 lg:gap-3">
              <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-amber-50 flex items-center justify-center">
                <Bookmark className="w-4 h-4 lg:w-6 lg:h-6 text-amber-500" />
              </div>
              Salvos
            </h1>
            <p className="text-muted-foreground mt-2 text-sm lg:text-base">
              Artes que você salvou para usar depois
            </p>
          </div>

          {/* Loading skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <Skeleton className="aspect-square w-full rounded-lg" />
                <Skeleton className="h-4 w-3/4 mt-2" />
                <Skeleton className="h-3 w-1/2 mt-1" />
              </div>
            ))}
          </div>
        </div>
      </ProfileLayout>
    );
  }

  return (
    <ProfileLayout>
      <div className="max-w-7xl">
        <div className="mb-6">
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight flex items-center gap-2 lg:gap-3">
            <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-amber-50 flex items-center justify-center">
              <Bookmark className="w-4 h-4 lg:w-6 lg:h-6 text-amber-500" />
            </div>
            Salvos
          </h1>
          <p className="text-muted-foreground mt-2 text-sm lg:text-base">
            Artes que você salvou para usar depois
          </p>
        </div>

        {savedPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 lg:py-16 text-center">
            <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-full bg-amber-50 flex items-center justify-center mb-4 lg:mb-6">
              <Bookmark className="w-8 h-8 lg:w-10 lg:h-10 text-amber-300" />
            </div>
            <h2 className="text-xl lg:text-2xl font-semibold text-foreground mb-2">
              Nenhuma arte salva ainda
            </h2>
            <p className="text-muted-foreground mb-6 lg:mb-8 max-w-md text-sm lg:text-base">
              Salve artes interessantes para acessar facilmente mais tarde e organizar seus projetos.
            </p>
            <Link href="/">
              <Button className="bg-[#1f4ed8] hover:bg-[#1d4ed8]/90 text-white">
                <Search className="w-4 h-4 mr-2" />
                Explorar artes
              </Button>
            </Link>
          </div>
        ) : (
          <div>
            <div className="mb-6">
              <p className="text-sm text-muted-foreground">
                {savedPosts.length} {savedPosts.length === 1 ? 'arte salva' : 'artes salvas'}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-6">
              {savedPosts.map((post) => (
                <ArtworkCard key={post.id} artwork={{
                  id: post.id,
                  title: post.title,
                  description: post.description || "",
                  imageUrl: post.imageUrl,
                  format: post.formato || "",
                  isPro: post.isPro || false,
                  category: post.categoryId ? `${post.categoryId}` : null,
                  createdAt: post.createdAt
                }} />
              ))}
            </div>
          </div>
        )}
      </div>
    </ProfileLayout>
  );
}