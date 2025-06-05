import HeroSection from "@/components/home/HeroSection";
import CategorySection from "@/components/home/CategorySection";
import ArtworkGrid from "@/components/home/ArtworkGrid";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <HeroSection />
      <CategorySection />
      
      {/* Feed Section with Title and Proper Margins */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Explore nossa galeria completa
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Descubra artes profissionais para estética, organizadas por categoria e prontas para personalização
            </p>
          </div>
          <ArtworkGrid />
        </div>
      </section>
    </div>
  );
}
