import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Edit3, Search, ExternalLink, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { ArtworkCard } from "@/components/home/ArtworkCard";
import { Post } from "@shared/schema";
import { ProfileLayout } from "@/components/layout/ProfileLayout";
import { Badge } from "@/components/ui/badge";

interface RecentEdit {
  post: Post;
  editedAt: string;
}

export default function EdicoesRecentesPage() {
  const { user } = useAuth();

  // Buscar edições recentes do usuário
  const { data: recentEdits = [], isLoading } = useQuery<RecentEdit[]>({
    queryKey: ['/api/user/recent-edits'],
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutos em cache
  });

  if (isLoading) {
    return (
      <ProfileLayout>
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center">
                <Edit3 className="w-6 h-6 text-purple-500" />
              </div>
              Edições recentes
            </h1>
            <p className="text-muted-foreground mt-2">
              Histórico das suas últimas edições no Canva
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
      <div className="max-w-7xl">
        <div className="mb-6">
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight flex items-center gap-2 lg:gap-3">
            <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-purple-50 flex items-center justify-center">
              <Edit3 className="w-4 h-4 lg:w-6 lg:h-6 text-purple-500" />
            </div>
            Edições recentes
          </h1>
          <p className="text-muted-foreground mt-2 text-sm lg:text-base">
            Histórico das suas últimas edições no Canva
          </p>
        </div>

        {recentEdits.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 lg:py-16 text-center">
            <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-full bg-purple-50 flex items-center justify-center mb-4 lg:mb-6">
              <Edit3 className="w-8 h-8 lg:w-10 lg:h-10 text-purple-300" />
            </div>
            <h2 className="text-xl lg:text-2xl font-semibold text-gray-800 mb-2">
              Nenhuma edição ainda
            </h2>
            <p className="text-gray-600 mb-6 lg:mb-8 max-w-md text-sm lg:text-base">
              Quando você clicar em "Editar no Canva" em uma arte, ela aparecerá aqui no seu histórico.
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
              <p className="text-sm text-gray-600">
                {recentEdits.length} {recentEdits.length === 1 ? 'edição recente' : 'edições recentes'}
              </p>
              <Badge variant="secondary" className="gap-1">
                <Clock className="w-3 h-3" />
                Ordenado por data
              </Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-6">
              {recentEdits.map((edit) => (
                <div key={`${edit.post.id}-${edit.editedAt}`} className="relative group">
                  {/* Card da arte */}
                  <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200 hover:border-purple-300 transition-all duration-300">
                    <img
                      src={edit.post.imageUrl}
                      alt={edit.post.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = `data:image/svg+xml;base64,${btoa(`
                          <svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
                            <rect width="400" height="400" fill="#f3f4f6"/>
                            <text x="200" y="200" text-anchor="middle" dy=".3em" font-family="Arial" font-size="16" fill="#9ca3af">
                              ${edit.post.title}
                            </text>
                          </svg>
                        `)}`;
                      }}
                    />
                    
                    {/* Overlay com botão de editar */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <Button
                        size="sm"
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                        onClick={() => {
                          // Abrir Canva para editar
                          window.open('https://canva.com', '_blank');
                        }}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Editar no Canva
                      </Button>
                    </div>
                  </div>

                  {/* Informações da arte */}
                  <div className="mt-3 space-y-1">
                    <h3 className="font-medium text-sm text-gray-900 line-clamp-2 leading-tight">
                      {edit.post.title}
                    </h3>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span className="bg-gray-100 px-2 py-1 rounded-full">
                        {edit.post.formato || 'Arte'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(edit.editedAt).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    
                    <p className="text-xs text-gray-400 flex items-center gap-1">
                      <Edit3 className="w-3 h-3" />
                      Última edição em {new Date(edit.editedAt).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
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