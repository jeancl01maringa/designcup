import { useQuery } from "@tanstack/react-query";
import { Artwork } from "@shared/schema";
import { ProBadge } from "@/components/ui/pro-badge";

export default function ArtworkGrid() {
  const { data: artworks, isLoading, error } = useQuery({
    queryKey: ['/api/artworks'],
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-gray-200 rounded-lg animate-pulse h-96"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <div className="text-red-500">Erro ao carregar as artes. Por favor, tente novamente mais tarde.</div>
      </div>
    );
  }

  return (
    <section className="py-8 md:py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {artworks?.map((artwork: Artwork) => (
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
    aspectRatio = "aspect-[1080/1350]"; // for portrait (1080x1350)
  } else if (artwork.format === "stories") {
    aspectRatio = "aspect-[1080/1920]"; // for stories (1080x1920)
  }
  
  return (
    <div className="relative rounded-lg overflow-hidden shadow-md hover:shadow-lg transition duration-300">
      {artwork.isPro && (
        <div className="absolute top-3 left-3 z-10">
          <ProBadge />
        </div>
      )}
      <img 
        src={artwork.imageUrl} 
        alt={artwork.title} 
        className={`w-full h-auto object-cover ${aspectRatio}`}
      />
    </div>
  );
}
