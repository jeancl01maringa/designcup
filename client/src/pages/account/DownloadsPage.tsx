import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Download, Search, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { ArtworkCard } from "@/components/home/ArtworkCard";
import { Post } from "@shared/schema";
import { ProfileLayout } from "@/components/layout/ProfileLayout";
import { Badge } from "@/components/ui/badge";

interface DownloadedPost extends Post {
  downloadedAt: string;
}

export default function DownloadsPage() {
  const { user } = useAuth();

  // Buscar artes baixadas pelo usuário
  const { data: downloadedPosts = [], isLoading } = useQuery<DownloadedPost[]>({
    queryKey: ['/api/user/downloaded-posts'],
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutos em cache
  });

  if (isLoading) {
    return (
      <ProfileLayout>
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
                <Download className="w-6 h-6 text-green-500" />
              </div>
              Downloads
            </h1>
            <p className="text-muted-foreground mt-2">
              Histórico de todas as artes que você baixou
            </p>
          </div>

          {/* Loading skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
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
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
              <Download className="w-6 h-6 text-green-500" />
            </div>
            Downloads
          </h1>
          <p className="text-muted-foreground mt-2">
            Histórico de todas as artes que você baixou
          </p>
        </div>

        {downloadedPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mb-6">
              <Download className="w-10 h-10 text-green-300" />
            </div>
            <h2 className="text-2xl font-semibold text-foreground mb-2">
              Nenhum download ainda
            </h2>
            <p className="text-muted-foreground mb-8 max-w-md">
              Quando você baixar uma arte, ela aparecerá aqui no seu histórico de downloads.
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
            <div className="mb-6 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {downloadedPosts.length} {downloadedPosts.length === 1 ? 'download' : 'downloads'}
              </p>
              <Badge variant="secondary" className="gap-1">
                <Calendar className="w-3 h-3" />
                Ordenado por data
              </Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {downloadedPosts.map((post) => (
                <div key={`${post.id}-${post.downloadedAt}`} className="relative">
                  <ArtworkCard artwork={{
                    id: post.id,
                    title: post.title,
                    description: post.description || "",
                    imageUrl: post.imageUrl,
                    format: post.formato || "",
                    isPro: post.isPro || false,
                    category: post.categoryId ? `${post.categoryId}` : null,
                    createdAt: post.createdAt
                  }} />
                  <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
                    <Download className="w-3 h-3" />
                    Baixado em {new Date(post.downloadedAt).toLocaleDateString('pt-BR')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </ProfileLayout>
  );
}