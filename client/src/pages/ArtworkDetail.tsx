import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { ArrowLeft, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { SocialShare } from "@/components/sharing/SocialShare";
import { ProBadge } from "@/components/ui/pro-badge";
import type { Artwork } from "@shared/schema";

export default function ArtworkDetail() {
  const [_, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const artworkId = parseInt(params.id, 10);

  const { data: artwork, isLoading, error } = useQuery<Artwork>({
    queryKey: ['/api/artworks', artworkId],
    queryFn: () => fetch(`/api/artworks/${artworkId}`).then((res) => {
      if (!res.ok) throw new Error('Artwork não encontrado');
      return res.json();
    }),
  });

  if (isLoading) {
    return (
      <div className="container py-10">
        <Button 
          variant="ghost" 
          className="mb-6"
          onClick={() => setLocation('/')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Skeleton className="w-full aspect-square md:aspect-auto md:h-[500px] rounded-md" />
          <div className="space-y-4">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-24 w-full" />
            <div className="flex gap-2">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-32" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !artwork) {
    return (
      <div className="container py-10">
        <Button 
          variant="ghost" 
          className="mb-6"
          onClick={() => setLocation('/')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        
        <Card>
          <CardContent className="py-8">
            <div className="text-center space-y-4">
              <h1 className="text-2xl font-bold text-red-500">Erro</h1>
              <p className="text-muted-foreground">
                Não foi possível carregar este artwork. Por favor, tente novamente mais tarde.
              </p>
              <Button onClick={() => setLocation('/')}>
                Voltar para a galeria
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatLabel = {
    'square': '1080x1080 - Quadrado',
    'portrait': '1080x1350 - Retrato',
    'stories': '1080x1920 - Stories'
  }[artwork.format] || artwork.format;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = artwork.imageUrl;
    link.download = `${artwork.title.replace(/\s+/g, '-').toLowerCase()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="container py-10">
      <Button 
        variant="ghost" 
        className="mb-6"
        onClick={() => setLocation('/')}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar
      </Button>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="relative">
          <img 
            src={artwork.imageUrl} 
            alt={artwork.title} 
            className="w-full rounded-md shadow-md object-cover"
          />
          {artwork.isPro && (
            <div className="absolute top-4 right-4">
              <ProBadge />
            </div>
          )}
        </div>
        
        <div className="space-y-4">
          <h1 className="text-2xl font-bold">{artwork.title}</h1>
          
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{formatLabel}</Badge>
            {artwork.category && (
              <Badge variant="secondary">{artwork.category}</Badge>
            )}
          </div>
          
          {artwork.description && (
            <p className="text-muted-foreground mt-4">{artwork.description}</p>
          )}
          
          <div className="pt-4 flex flex-wrap gap-3">
            <Button onClick={handleDownload} className="gap-2">
              <Download className="h-4 w-4" />
              <span>Download</span>
            </Button>
            
            <SocialShare artwork={artwork} />
          </div>
        </div>
      </div>
    </div>
  );
}