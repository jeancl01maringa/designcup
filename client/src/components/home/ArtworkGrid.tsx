import { useQuery } from "@tanstack/react-query";
import { Artwork } from "@shared/schema";
import { ProBadge } from "@/components/ui/pro-badge";
import { Heart, Bookmark } from "lucide-react";

export default function ArtworkGrid() {
  const { data: artworks = [], isLoading, error } = useQuery<Artwork[]>({
    queryKey: ['/api/artworks'],
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-gray-100 rounded-lg animate-pulse h-[320px]"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-4 text-center">
        <div className="text-red-500">Erro ao carregar as artes. Por favor, tente novamente mais tarde.</div>
      </div>
    );
  }

  return (
    <section className="py-4">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
          {artworks.map((artwork: Artwork) => (
            <ArtworkItem key={artwork.id} artwork={artwork} />
          ))}
        </div>
      </div>
    </section>
  );
}

interface ArtworkItemProps {
  artwork: Artwork;
}

function ArtworkItem({ artwork }: ArtworkItemProps) {
  // Define aspect ratio based on format
  let aspectRatio = "aspect-square"; // default for square (1080x1080)
  
  if (artwork.format === "portrait") {
    aspectRatio = "aspect-[4/5]"; // for portrait (1080x1350)
  } else if (artwork.format === "stories") {
    aspectRatio = "aspect-[9/16]"; // for stories (1080x1920)
  }
  
  return (
    <div className="relative rounded-lg overflow-hidden bg-white">
      <div className="relative">
        {artwork.isPro && (
          <div className="absolute top-2 left-2 z-10">
            <ProBadge />
          </div>
        )}
        <img 
          src={artwork.imageUrl} 
          alt={artwork.title} 
          className={`w-full h-auto object-cover ${aspectRatio}`}
        />
        
        {/* Título em algumas imagens (nas que são de tipo específico) */}
        {artwork.format === "portrait" && (
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
            <h3 className="text-white text-lg font-semibold">{artwork.title}</h3>
            {artwork.description && (
              <p className="text-white/90 text-sm mt-1">Leia a legenda →</p>
            )}
          </div>
        )}
        
        {/* Ações (coração e salvar) */}
        <div className="absolute bottom-3 right-3 flex space-x-2">
          <button className="bg-white/90 p-1.5 rounded-full shadow-sm hover:bg-white">
            <Heart className="h-5 w-5 text-gray-700" />
          </button>
          <button className="bg-white/90 p-1.5 rounded-full shadow-sm hover:bg-white">
            <Bookmark className="h-5 w-5 text-gray-700" />
          </button>
        </div>
      </div>
    </div>
  );
}
