import { User, Star, Users } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="bg-[#FFF4E9] py-12 md:py-16">
      <div className="container mx-auto px-4 flex flex-col items-center text-center">
        {/* Main Heading */}
        <h1 className="text-3xl md:text-4xl font-bold text-[#1D1D1D] leading-tight mb-6">
          A Melhor plataforma de<br />
          <span className="text-[#AA5E2F]">Artes para Estética do Brasil</span>
        </h1>
        
        {/* Description */}
        <p className="text-[#4B4B4B] text-lg mb-8 max-w-2xl">
          Artes 100% editáveis para sua clínica de estética, criadas para facilitar<br /> 
          sua rotina com <span className="text-[#1D1D1D] font-medium">qualidade profissional</span>.
        </p>
        
        {/* Badges */}
        <div className="flex flex-wrap justify-center gap-6 mb-6">
          <div className="bg-white/70 backdrop-blur-sm rounded-full py-2 px-4 flex items-center shadow-sm hover-card">
            <Users className="h-5 w-5 text-[#AA5E2F] mr-2" />
            <span className="text-sm font-medium text-[#1D1D1D]">+3 mil membros</span>
          </div>
          <div className="bg-white/70 backdrop-blur-sm rounded-full py-2 px-4 flex items-center shadow-sm hover-card">
            <div className="flex mr-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} className="h-4 w-4 text-yellow-500 fill-yellow-500" />
              ))}
            </div>
            <span className="text-sm font-medium text-[#1D1D1D]">Avaliado 5 estrelas</span>
          </div>
        </div>
        
        {/* Search Bar */}
        <div className="w-full max-w-lg mt-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Busque por artes, categorias, temas..."
              className="w-full py-3 px-5 pr-12 rounded-full border border-[#FAF3EC] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#AA5E2F]/30 focus:border-[#AA5E2F] transition-all"
            />
            <button className="absolute right-3 top-1/2 -translate-y-1/2 text-[#AA5E2F]">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
