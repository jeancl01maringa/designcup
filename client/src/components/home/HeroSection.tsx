import { Star, Users, Search, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HeroSection() {
  return (
    <section className="bg-gradient-to-b from-[#FFF4E9] to-[#FFFCF9] py-8 md:py-12">
      <div className="container mx-auto px-4 flex flex-col items-center text-center">
        {/* Badges - Moved above the heading */}
        <div className="flex flex-wrap justify-center gap-6 mb-6">
          <div className="bg-white/60 backdrop-blur-sm rounded-full py-1.5 px-3 flex items-center shadow-sm">
            <Users className="h-4 w-4 text-[#AA5E2F] mr-1.5" />
            <span className="text-xs font-light text-[#1D1D1D]">+3 mil membros</span>
          </div>
          <div className="bg-white/60 backdrop-blur-sm rounded-full py-1.5 px-3 flex items-center shadow-sm">
            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 mr-1.5" />
            <span className="text-xs font-light text-[#1D1D1D]">Avaliado 5 estrelas</span>
          </div>
        </div>
        
        {/* Main Heading */}
        <h1 className="text-3xl md:text-4xl font-bold text-[#1D1D1D] leading-tight mb-6 font-montserrat">
          A Melhor plataforma de<br />
          <span className="text-[#AA5E2F]">Artes para Estética do Brasil</span>
        </h1>
        
        {/* Description */}
        <p className="text-[#4B4B4B] text-base mb-6 max-w-2xl font-sans font-light">
          Artes 100% editáveis para sua clínica de estética, criadas para facilitar<br /> 
          sua rotina com <span className="text-[#1D1D1D] font-normal">qualidade profissional</span>.
        </p>
        
        {/* Search Bar with Format Dropdown */}
        <div className="w-full max-w-xl mt-6">
          <div className="relative flex items-center">
            <input
              type="text"
              placeholder="Busque por artes, categorias, temas..."
              className="w-full py-3 px-5 pr-32 rounded-lg border border-[#FAF3EC] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#AA5E2F]/30 focus:border-[#AA5E2F] transition-all font-sans"
            />
            
            {/* Format Dropdown - Positioned to the right */}
            <div className="absolute right-12 top-1/2 -translate-y-1/2 border-l border-gray-200 pl-3">
              <div className="relative">
                <select className="text-xs font-normal appearance-none bg-transparent focus:outline-none focus:ring-0 pr-6 pl-1 cursor-pointer min-w-[90px] text-gray-600 font-sans">
                  <option value="all">Formatos</option>
                  <option value="feed">Feed</option>
                  <option value="poster">Cartaz</option>
                  <option value="stories">Stories</option>
                  <option value="images">Imagens</option>
                </select>
                <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 h-4 w-4 text-[#1f4ed8]" />
              </div>
            </div>
            
            <Button className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10 p-0 rounded-full bg-[#1f4ed8] hover:bg-[#1a44c2] shadow-sm">
              <Search className="h-4 w-4 text-white" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
