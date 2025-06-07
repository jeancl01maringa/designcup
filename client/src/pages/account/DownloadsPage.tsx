import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Download, Search, ExternalLink, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DownloadedArt {
  id: number;
  title: string;
  imageUrl: string;
  formato: string;
  isPro: boolean;
  downloadedAt: Date;
  canvaUrl?: string;
}

export default function DownloadsPage() {
  const { user } = useAuth();

  // Buscar histórico de downloads do usuário
  const { data: downloadedArts = [], isLoading } = useQuery<DownloadedArt[]>({
    queryKey: ['/api/user/downloads'],
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutos em cache
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
              <Download className="w-6 h-6 text-green-500" />
            </div>
            Downloads
          </h1>
          <p className="text-muted-foreground mt-2">
            Histórico de artes que você baixou
          </p>
        </div>

        {/* Loading skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="aspect-square w-full" />
              <div className="p-4 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-8 w-full" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
            <Download className="w-6 h-6 text-green-500" />
          </div>
          Downloads
        </h1>
        <p className="text-muted-foreground mt-2">
          Histórico de artes que você baixou
        </p>
      </div>

      {downloadedArts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mb-6">
            <Download className="w-10 h-10 text-green-300" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">
            Nenhum download realizado
          </h2>
          <p className="text-gray-600 mb-8 max-w-md">
            Você ainda não fez download de nenhuma arte. Explore nossa galeria e baixe as artes que mais gostar!
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
              {downloadedArts.length} {downloadedArts.length === 1 ? 'download realizado' : 'downloads realizados'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {downloadedArts.map((art) => (
              <Card key={`${art.id}-${art.downloadedAt}`} className="overflow-hidden hover:shadow-lg transition-shadow duration-200">
                {/* Imagem da arte */}
                <div className="aspect-square relative overflow-hidden">
                  <img
                    src={art.imageUrl}
                    alt={art.title}
                    className="w-full h-full object-cover transition-transform duration-200 hover:scale-105"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMDAgNzBWMTMwTTcwIDEwMEgxMzAiIHN0cm9rZT0iIzlDQTNBRiIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz4KPHN2Zz4K';
                    }}
                  />
                  
                  {/* Badge premium */}
                  {art.isPro && (
                    <div className="absolute top-2 right-2">
                      <Badge className="bg-black text-white text-xs">
                        Premium
                      </Badge>
                    </div>
                  )}
                </div>

                <CardContent className="p-4">
                  {/* Título */}
                  <h3 className="font-medium text-gray-800 text-sm mb-2 line-clamp-2">
                    {art.title}
                  </h3>

                  {/* Formato e data */}
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDistanceToNow(art.downloadedAt, { 
                        addSuffix: true, 
                        locale: ptBR 
                      })}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {art.formato}
                    </Badge>
                  </div>

                  {/* Botão Editar no Canva */}
                  {art.canvaUrl && (
                    <a 
                      href={art.canvaUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <Button variant="outline" size="sm" className="w-full">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Editar no Canva
                      </Button>
                    </a>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}