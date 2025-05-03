import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Artwork } from "@shared/schema";
import { ArtworkCard } from "./ArtworkCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Star, ImageIcon, Crown } from "lucide-react";
import { supabase } from "@/lib/supabase";

// Interface simplificada para dados de mock
interface MockArtwork {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  category: string;
  createdAt: Date;
  isPro: boolean;
  format: string; // "1:1", "9:16", "16:9", "1080:1350"
}

// Mock de dados com as imagens enviadas e diferentes formatos
const mockArtworks: MockArtwork[] = [
  {
    id: 1,
    title: "Segredos de uma Pele Radiante",
    description: "Descubra os segredos para conseguir uma pele bonita e saudável.",
    imageUrl: "/attached_assets/9005ba19-a309-43d3-a40d-80557466a094.png",
    category: "facial",
    createdAt: new Date(),
    isPro: true,
    format: "1:1" // quadrado
  },
  {
    id: 2,
    title: "5 mitos sobre o uso de protetor solar",
    description: "Conheça os principais mitos sobre protetor solar e como usá-lo corretamente.",
    imageUrl: "/attached_assets/atualização estética 01.png",
    category: "facial",
    createdAt: new Date(),
    isPro: false,
    format: "9:16" // stories
  },
  {
    id: 3,
    title: "Seu primeiro Botox?",
    description: "Tudo o que você precisa saber antes do seu primeiro procedimento de Botox.",
    imageUrl: "/attached_assets/atualização estética 04 (1).png",
    category: "procedimentos",
    createdAt: new Date(),
    isPro: true,
    format: "9:16" // stories
  },
  {
    id: 4,
    title: "Lábios dos sonhos sem fazer cirurgia",
    description: "Confira como conseguir lábios perfeitos sem procedimentos cirúrgicos.",
    imageUrl: "/attached_assets/atualização estética 05 (1).png",
    category: "procedimentos",
    createdAt: new Date(),
    isPro: true,
    format: "1:1" // quadrado
  },
  {
    id: 5,
    title: "Drenagem linfática",
    description: "Os benefícios da drenagem linfática para uma silhueta perfeita.",
    imageUrl: "/attached_assets/atualização estética 06 (1).png",
    category: "corporal",
    createdAt: new Date(),
    isPro: false,
    format: "9:16" // stories
  },
  {
    id: 6,
    title: "Pele firme e Viçosa",
    description: "O segredo para uma pele iluminada e saudável está aqui.",
    imageUrl: "/attached_assets/atualização estética 10.jpg",
    category: "corporal",
    createdAt: new Date(),
    isPro: true,
    format: "1:1" // quadrado
  },
  {
    id: 7,
    title: "Pele sem manchas",
    description: "Clareadores e laser fazem a diferença.",
    imageUrl: "/attached_assets/Captura de tela 2025-04-03 233106.png",
    category: "facial",
    createdAt: new Date(),
    isPro: false,
    format: "16:9" // paisagem
  },
  {
    id: 8,
    title: "Preenchimento labial sem exageros",
    description: "Realce e dê volume com naturalidade.",
    imageUrl: "/attached_assets/Captura de tela 2025-04-03 233140.png",
    category: "procedimentos",
    createdAt: new Date(),
    isPro: true,
    format: "1080:1350" // retrato
  },
  {
    id: 9,
    title: "Relaxamento e rejuvenescimento em uma única sessão!",
    description: "Agende seu horário e sinta a diferença!",
    imageUrl: "/attached_assets/Captura de tela 2025-04-03 231324.png",
    category: "facial",
    createdAt: new Date(),
    isPro: true,
    format: "1:1" // quadrado
  },
  {
    id: 10,
    title: "Beleza atemporal é um investimento",
    description: "Protocolos de alta performance para uma pele jovem e saudável.",
    imageUrl: "/attached_assets/Captura de tela 2025-04-03 232355.png",
    category: "facial",
    createdAt: new Date(),
    isPro: true,
    format: "1:1" // quadrado
  }
];

export default function ArtworkGrid() {
  // Buscar posts aprovados do Supabase para usar no feed
  const { data: posts = [], isLoading: isPostsLoading, error } = useQuery<any[]>({
    queryKey: ['/api/supabase/posts'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('posts')
          .select('*')
          .eq('status', 'aprovado')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        return data || [];
      } catch (err) {
        console.error('Erro ao buscar posts:', err);
        return [];
      }
    }
  });

  // Converter posts do Supabase para o formato esperado
  const artworks = posts.map(post => ({
    id: post.id,
    title: post.title,
    description: post.description || '',
    imageUrl: post.image_url,
    category: post.category_id ? post.category_id.toString() : null,
    createdAt: new Date(post.created_at),
    isPro: post.license_type === 'premium',
    format: post.format || "1:1"
  }));
  
  // Estado de carregamento usando o isPostsLoading
  const isLoading = isPostsLoading;

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-4">
        <div className="mb-6">
          <Skeleton className="h-8 w-72 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="mb-4 break-inside-avoid rounded-lg overflow-hidden">
              <Skeleton className={`w-full ${i % 2 === 0 ? 'aspect-square' : 'aspect-[9/16]'}`} />
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

  // Separe os artworks por formato
  const storiesArtworks = artworks.filter(art => art.format === "9:16");
  const otherArtworks = artworks.filter(art => art.format !== "9:16");

  return (
    <section className="py-8 bg-white">
      <div className="container mx-auto px-4">
        <div className="mb-6">
          <h3 className="text-black font-semibold text-xl font-inter mb-1 flex items-center">
            <span className="mr-2">🎨</span>
            Artes editáveis para sua Clínica
            <Badge variant="outline" className="ml-2 bg-[#FFF4E9] text-[#AA5E2F] border-[#FAF3EC]">
              <Crown className="h-3 w-3 fill-[#AA5E2F] text-[#AA5E2F] mr-1" />
              <span className="text-xs">Premium</span>
            </Badge>
          </h3>
          <p className="text-[#5c3a2d] text-sm font-light">
            Explore artes exclusivas de altíssima qualidade premium para sua clínica.
          </p>
          <div className="flex items-center mt-2">
            <div className="flex mt-1">
              <span className="inline-block h-1 w-6 rounded-full bg-black mr-1"></span>
              <span className="inline-block h-1 w-1 rounded-full bg-black/30 mr-1"></span>
              <span className="inline-block h-1 w-1 rounded-full bg-black/30"></span>
            </div>
          </div>
        </div>

        {/* Grid estilo Pinterest (Masonry) com imagens de proporções originais e menor espaçamento */}
        <div className="columns-1 xs:columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-3 mb-8 space-y-3">
          {otherArtworks.map((artwork: MockArtwork) => (
            <div key={artwork.id} className="break-inside-avoid">
              <ArtworkCard artwork={artwork as any} />
            </div>
          ))}
        </div>
        
        {/* Stories Section */}
        <div className="mb-6 mt-10">
          <h3 className="text-black font-semibold text-xl font-inter mb-1 flex items-center">
            <span className="mr-2">📱</span>
            Stories para Estética
            <Badge variant="outline" className="ml-2 bg-[#FFF4E9] text-[#AA5E2F] border-[#FAF3EC]">
              <Star className="h-3 w-3 fill-[#AA5E2F] text-[#AA5E2F] mr-1" />
              <span className="text-xs">Novo</span>
            </Badge>
          </h3>
          <p className="text-[#5c3a2d] text-sm font-light">
            Templates para Stories no formato 9:16 otimizados para Instagram.
          </p>
          <div className="flex items-center mt-2">
            <div className="flex mt-1">
              <span className="inline-block h-1 w-6 rounded-full bg-black mr-1"></span>
              <span className="inline-block h-1 w-1 rounded-full bg-black/30 mr-1"></span>
              <span className="inline-block h-1 w-1 rounded-full bg-black/30"></span>
            </div>
          </div>
        </div>

        {/* Grid para stories no estilo Pinterest com menor espaçamento */}
        <div className="columns-2 xs:columns-3 sm:columns-4 md:columns-5 lg:columns-6 gap-3 space-y-3">
          {storiesArtworks.map((artwork: MockArtwork) => (
            <div key={artwork.id} className="break-inside-avoid">
              <ArtworkCard artwork={artwork as any} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
