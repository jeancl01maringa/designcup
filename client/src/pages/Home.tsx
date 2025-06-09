import HeroSection from "@/components/home/HeroSection";
import CategorySection from "@/components/home/CategorySection";
import ArtworkGrid from "@/components/home/ArtworkGrid";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <HeroSection />
      <CategorySection />
      
      {/* Feed Section with Title and Proper Margins */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          {/* Header seguindo o mesmo padrão da seção de categorias */}
          <div className="mb-6">
            <h3 className="text-black font-semibold text-lg font-inter mb-1 flex items-center">
              <span className="mr-2">🎨</span>
              Artes de alta qualidade para sua Clínica
            </h3>
            <p className="text-gray-600 text-sm font-light">
              Modelos premium, editáveis e prontos para usar
            </p>
            <div className="flex items-center mt-2">
              <div className="flex mt-1">
                <span className="inline-block h-1 w-6 rounded-full bg-black mr-1"></span>
                <span className="inline-block h-1 w-1 rounded-full bg-black/30 mr-1"></span>
                <span className="inline-block h-1 w-1 rounded-full bg-black/30"></span>
              </div>
            </div>
          </div>
          <ArtworkGrid />
        </div>
      </section>
    </div>
  );
}
