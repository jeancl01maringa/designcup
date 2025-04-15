import { User, Star } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="pt-6 pb-4">
      <div className="container mx-auto px-4 flex flex-col items-center text-center">
        {/* Badges */}
        <div className="flex w-full justify-center gap-4 mb-6">
          <div className="bg-gray-100 rounded-full py-2 px-4 flex items-center">
            <User className="h-5 w-5 text-[#936037] mr-2" />
            <span className="text-sm font-medium">+3 mil membros</span>
          </div>
          <div className="bg-gray-100 rounded-full py-2 px-4 flex items-center">
            <Star className="h-5 w-5 text-yellow-400 fill-yellow-400 mr-2" />
            <span className="text-sm font-medium">Avaliado 5 estrelas</span>
          </div>
        </div>

        {/* Main Heading */}
        <h1 className="text-3xl md:text-4xl font-bold text-black leading-tight mb-4">
          A Melhor plataforma <br />de Artes para <br />
          <span className="text-[#936037]">Estética do Brasil</span>
        </h1>
        
        {/* Divider line */}
        <div className="w-full max-w-lg h-px bg-gray-200 my-4"></div>
        
        {/* Description */}
        <p className="text-base text-gray-700 mb-6 max-w-2xl">
          <span className="font-semibold text-gray-800">Artes 100% editáveis</span> para sua <span className="font-semibold text-gray-800">clínica de estética</span>, criadas para facilitar sua rotina com <span className="font-semibold text-gray-800">qualidade profissional</span>.
        </p>
      </div>
    </section>
  );
}
