import { Star, Users, Search, ImageIcon, LayoutGrid, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function HeroSection() {
  return (
    <section className="bg-[#FFF4E9] py-12 md:py-16">
      <div className="container mx-auto px-4 flex flex-col items-center text-center">
        {/* Badges - Moved above the heading */}
        <div className="flex flex-wrap justify-center gap-6 mb-6">
          <div className="bg-white/70 backdrop-blur-sm rounded-full py-2 px-4 flex items-center shadow-sm hover-card">
            <Users className="h-5 w-5 text-[#AA5E2F] mr-2" />
            <span className="text-sm font-medium text-[#1D1D1D]">+3 mil membros</span>
          </div>
          <div className="bg-white/70 backdrop-blur-sm rounded-full py-2 px-4 flex items-center shadow-sm hover-card">
            <Star className="h-5 w-5 text-yellow-500 fill-yellow-500 mr-2" />
            <span className="text-sm font-medium text-[#1D1D1D]">Avaliado 5 estrelas</span>
          </div>
        </div>
        
        {/* Main Heading */}
        <h1 className="text-3xl md:text-4xl font-bold text-[#1D1D1D] leading-tight mb-6 font-montserrat">
          A Melhor plataforma de<br />
          <span className="text-[#AA5E2F]">Artes para Estética do Brasil</span>
        </h1>
        
        {/* Description */}
        <p className="text-[#4B4B4B] text-lg mb-8 max-w-2xl font-sans">
          Artes 100% editáveis para sua clínica de estética, criadas para facilitar<br /> 
          sua rotina com <span className="text-[#1D1D1D] font-medium">qualidade profissional</span>.
        </p>
        
        {/* Format Tabs and Search Bar */}
        <div className="w-full max-w-3xl mb-8">
          <div className="bg-white rounded-lg p-3 shadow-sm">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="relative flex-grow w-full">
                <input
                  type="text"
                  placeholder="Busque por artes, categorias, temas..."
                  className="w-full py-3 px-5 pr-12 rounded-lg border border-[#FAF3EC] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#AA5E2F]/30 focus:border-[#AA5E2F] transition-all"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Button className="h-9 w-9 p-0 rounded-full bg-[#1f4ed8] hover:bg-[#1a44c2]">
                    <Search className="h-4 w-4 text-white" />
                  </Button>
                </div>
              </div>
              
              <Tabs defaultValue="all" className="w-full md:w-auto">
                <TabsList className="grid grid-cols-4 w-full md:w-auto gap-1 bg-[#F9F9F9]">
                  <TabsTrigger value="all" className="flex items-center gap-2 text-xs">
                    <LayoutGrid className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Todos</span>
                  </TabsTrigger>
                  <TabsTrigger value="stories" className="flex items-center gap-2 text-xs">
                    <span className="inline-flex h-3.5 w-2.5 bg-[#FAF3EC] rounded-sm"></span>
                    <span className="hidden sm:inline">Stories</span>
                  </TabsTrigger>
                  <TabsTrigger value="square" className="flex items-center gap-2 text-xs">
                    <span className="inline-flex h-3.5 w-3.5 bg-[#FAF3EC] rounded-sm"></span>
                    <span className="hidden sm:inline">Quadrado</span>
                  </TabsTrigger>
                  <TabsTrigger value="custom" className="flex items-center gap-2 text-xs">
                    <Settings2 className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Personalizado</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
