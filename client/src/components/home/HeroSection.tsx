import { CheckCircle } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="py-12 md:py-20 bg-gradient-to-br from-blue-50 to-blue-100">
      <div className="container mx-auto px-4 flex flex-col items-center text-center">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-gray-900 leading-tight max-w-4xl">
          A melhor plataforma de Artes para Estética do Brasil.
        </h1>
        <p className="mt-6 text-lg md:text-xl text-gray-700 max-w-3xl">
          Artes 100% editáveis no seu Celular, Tablet ou Computador, de forma prática e rápida. 
          Você nunca mais precisará criar absolutamente nada do ZERO.
        </p>
        
        <div className="mt-10 grid grid-cols-2 gap-6 md:gap-12">
          <div className="flex flex-col items-center">
            <div className="flex items-center justify-center">
              <CheckCircle className="h-6 w-6 md:h-8 md:w-8 text-green-500" />
              <span className="ml-2 text-lg md:text-xl font-semibold text-gray-800">+3 mil membros</span>
            </div>
          </div>
          <div className="flex flex-col items-center">
            <div className="flex items-center justify-center">
              <div className="flex text-yellow-400">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="h-5 w-5 md:h-6 md:w-6" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                  </svg>
                ))}
              </div>
              <span className="ml-2 text-lg md:text-xl font-semibold text-gray-800">Avaliado 5 estrelas</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
