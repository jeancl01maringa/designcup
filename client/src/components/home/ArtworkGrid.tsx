import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Artwork } from "@shared/schema";
import { ArtworkCard } from "./ArtworkCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";

export default function ArtworkGrid() {
  const { data: artworks = [], isLoading, error } = useQuery<Artwork[]>({
    queryKey: ['/api/artworks'],
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-4">
        <div className="mb-6">
          <Skeleton className="h-8 w-72 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-lg overflow-hidden">
              <Skeleton className="w-full aspect-[4/5]" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="text-red-500 p-4 border border-red-200 rounded-lg bg-red-50">
          Erro ao carregar as artes. Por favor, tente novamente mais tarde.
        </div>
      </div>
    );
  }

  return (
    <section className="py-6">
      <div className="container mx-auto px-4">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="font-semibold text-lg">Artes editáveis para sua Clínica</h2>
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
              <Star className="h-3 w-3 fill-amber-500 text-amber-500 mr-1" />
              <span className="text-xs">Premium</span>
            </Badge>
          </div>
          <p className="text-sm text-gray-600">
            Explore artes exclusivas de altíssima qualidade premium para sua clínica.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {artworks.map((artwork: Artwork) => (
            <ArtworkCard key={artwork.id} artwork={artwork} />
          ))}
        </div>
        
        {/* Stories Section */}
        <div className="mb-6 mt-10">
          <div className="flex items-center gap-2 mb-2">
            <h2 className="font-semibold text-lg">Stories para Estética</h2>
            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
              <Star className="h-3 w-3 fill-orange-500 text-orange-500 mr-1" />
              <span className="text-xs">Novo</span>
            </Badge>
          </div>
          <p className="text-sm text-gray-600">
            Templates para Stories no formato 9:16 otimizados para Instagram.
          </p>
        </div>
      </div>
    </section>
  );
}
