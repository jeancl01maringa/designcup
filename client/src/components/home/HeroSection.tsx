import { Star, Users, Search, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HeroSection() {
  return (
    <section className="bg-gradient-to-b from-[#FFF4E9] to-[#FFFCF9] py-8 md:py-12">
      <div className="container mx-auto px-4 flex flex-col items-center text-center">
        {/* Badges - Moved above the heading */}
        <div className="flex flex-wrap justify-center gap-6 mb-6">
          <div className="bg-white/70 backdrop-blur-sm rounded-full py-2 px-4 flex items-center shadow-sm border border-white/20">
            <Users className="h-4 w-4 text-primary mr-1.5" />
            <span className="text-xs font-medium text-[#1D1D1D]">+3 mil membros</span>
          </div>
          <div className="bg-white/70 backdrop-blur-sm rounded-full py-2 px-4 flex items-center shadow-sm border border-white/20">
            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 mr-1.5" />
            <span className="text-xs font-medium text-[#1D1D1D]">Avaliado 5 estrelas</span>
          </div>
        </div>
        
        {/* Main Heading */}
        <h1 className="text-3xl md:text-5xl font-bold text-[#1D1D1D] leading-tight mb-6 font-montserrat">
          A Melhor plataforma de<br />
          <span className="text-[#AA5E2F] bg-gradient-to-r from-[#AA5E2F] to-[#C8763A] bg-clip-text text-transparent">Artes para Estética do Brasil</span>
        </h1>
        
        {/* Description */}
        <p className="text-[#4B4B4B] text-lg md:text-xl mb-8 max-w-3xl font-sans font-light leading-relaxed">
          <span className="text-[#1D1D1D] font-semibold">Artes 100% editáveis</span> para sua <span className="text-[#1D1D1D] font-semibold">clínica de estética,</span> criadas para facilitar<br /> 
          sua rotina com <span className="text-[#1D1D1D] font-semibold">qualidade profissional.</span>
        </p>
        
        {/* Search Bar with Format Dropdown */}
        <div className="w-full max-w-2xl mt-8">
          <div className="relative flex items-center shadow-lg">
            <input
              type="text"
              placeholder="Busque por artes, categorias, temas..."
              className="w-full py-4 px-6 pr-40 rounded-xl border-2 border-white/50 bg-white/90 backdrop-blur-sm shadow-md focus:outline-none focus:ring-2 focus:ring-[#AA5E2F]/40 focus:border-[#AA5E2F] transition-all font-sans text-base placeholder:text-gray-400"
            />
            
            {/* Format Dropdown - Positioned to the right */}
            <div className="absolute right-16 top-1/2 -translate-y-1/2 border-l border-gray-200 pl-3">
              <div className="relative">
                <select className="text-sm font-normal appearance-none bg-transparent focus:outline-none focus:ring-0 pr-6 pl-1 cursor-pointer min-w-[90px] text-gray-600 font-sans">
                  <option value="all">Formatos</option>
                  <option value="feed">Feed</option>
                  <option value="poster">Cartaz</option>
                  <option value="stories">Stories</option>
                  <option value="images">Imagens</option>
                </select>
                <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600" />
              </div>
            </div>
            
            <Button className="absolute right-2 top-1/2 -translate-y-1/2 h-12 px-4 rounded-xl bg-black hover:bg-black/80 shadow-lg transition-all duration-200">
              <Search className="h-5 w-5 text-white" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
