import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Heart, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArtworkCard } from "@/components/home/ArtworkCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Post } from "@shared/schema";

export default function CurtidasPage() {
  const { user } = useAuth();

  // Buscar artes curtidas pelo usuário
  const { data: likedPosts = [], isLoading } = useQuery<Post[]>({
    queryKey: ['/api/user/liked-posts'],
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutos em cache
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
              <Heart className="w-6 h-6 text-red-500" />
            </div>
            Curtidas
          </h1>
          <p className="text-muted-foreground mt-2">
            Suas artes favoritas que você curtiu
          </p>
        </div>

        {/* Loading skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-square w-full rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
            <Heart className="w-6 h-6 text-red-500" />
          </div>
          Curtidas
        </h1>
        <p className="text-muted-foreground mt-2">
          Suas artes favoritas que você curtiu
        </p>
      </div>

      {likedPosts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mb-6">
            <Heart className="w-10 h-10 text-red-300" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">
            Nenhuma arte curtida
          </h2>
          <p className="text-gray-600 mb-8 max-w-md">
            Você ainda não curtiu nenhuma arte. Explore nossa galeria e curta as artes que mais gostar!
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
            <p className="text-sm text-gray-600">
              {likedPosts.length} {likedPosts.length === 1 ? 'arte curtida' : 'artes curtidas'}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {likedPosts.map((post) => (
              <ArtworkCard key={post.id} post={post} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}