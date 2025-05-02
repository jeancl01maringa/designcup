import React, { useRef, useState } from 'react';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';

interface CategoryItem {
  id: string;
  title: string;
  image: string;
}

interface Category {
  id: string;
  name: string;
  items: CategoryItem[];
}

// Dados das categorias com as imagens fornecidas
const categories: Category[] = [
  {
    id: 'botox',
    name: 'Botox?',
    items: [
      {
        id: 'botox-1',
        title: 'Botox?',
        image: '/attached_assets/Captura de tela 2025-04-03 233140.png',
      },
      {
        id: 'botox-2',
        title: 'sem fazer cirurgia',
        image: '/attached_assets/atualização estética 05 (1).png',
      },
      {
        id: 'botox-3',
        title: 'Botox?',
        image: '/attached_assets/Captura de tela 2025-04-03 233106.png',
      },
      {
        id: 'botox-4',
        title: 'sem fazer cirurgia',
        image: '/attached_assets/Captura de tela 2025-04-03 232355.png',
      }
    ]
  },
  {
    id: 'procedimentos',
    name: 'Estética Facial',
    items: [
      {
        id: 'procedimento-1',
        title: 'Botox?',
        image: '/attached_assets/Captura de tela 2025-04-03 233140.png',
      },
      {
        id: 'procedimento-2',
        title: 'sem fazer cirurgia',
        image: '/attached_assets/atualização estética 05 (1).png',
      },
      {
        id: 'procedimento-3',
        title: 'Tratamento facial',
        image: '/attached_assets/atualização estética 09.jpg',
      },
      {
        id: 'procedimento-4',
        title: 'Qualidade da pele',
        image: '/attached_assets/Captura de tela 2025-04-03 23320922.png',
      }
    ]
  },
  {
    id: 'depilacao',
    name: 'Depilação',
    items: [
      {
        id: 'depilacao-1',
        title: 'Depilação a laser',
        image: '/attached_assets/atualização estética 01.png',
      },
      {
        id: 'depilacao-2',
        title: 'Tratamentos especiais',
        image: '/attached_assets/atualização estética 06 (1).png',
      },
      {
        id: 'depilacao-3',
        title: 'Sem dor',
        image: '/attached_assets/atualização estética 10.jpg',
      },
      {
        id: 'depilacao-4',
        title: 'Resultados garantidos',
        image: '/attached_assets/9005ba19-a309-43d3-a40d-80557466a094.png',
      }
    ]
  },
  {
    id: 'massagem',
    name: 'Massagem',
    items: [
      {
        id: 'massagem-1',
        title: 'Relaxante',
        image: '/attached_assets/Captura de tela 2025-04-03 231324.png',
      },
      {
        id: 'massagem-2',
        title: 'Modeladora',
        image: '/attached_assets/atualização estética 10.jpg',
      },
      {
        id: 'massagem-3',
        title: 'Anti-stress',
        image: '/attached_assets/atualização estética 06 (1).png',
      },
      {
        id: 'massagem-4',
        title: 'Terapêutica',
        image: '/attached_assets/atualização estética 01.png',
      }
    ]
  }
];

export default function CategorySection() {
  const [activeSlide, setActiveSlide] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  
  const totalSlides = categories.length;
  
  const handlePrevious = () => {
    setActiveSlide((prev) => (prev === 0 ? totalSlides - 1 : prev - 1));
  };
  
  const handleNext = () => {
    setActiveSlide((prev) => (prev === totalSlides - 1 ? 0 : prev + 1));
  };
  
  return (
    <section className="py-8 bg-white border-b border-gray-100">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-4">
          <h3 className="text-[#1d1d1f] font-bold text-base font-inter mb-1 flex items-center">
            <span className="mr-1.5">🗂️</span>
            Escolha sua categoria
          </h3>
          <p className="text-[#5c3a2d] text-sm font-light">
            Encontre recursos ideais para sua clínica de estética.
          </p>
        </div>
        
        {/* Carousel */}
        <div className="relative mx-auto max-w-[800px]">
          <div 
            ref={carouselRef}
            className="overflow-hidden"
          >
            <div 
              className="flex transition-transform duration-300 ease-in-out"
              style={{ transform: `translateX(-${activeSlide * 100}%)` }}
            >
              {categories.map((category, index) => (
                <div 
                  key={category.id} 
                  className="w-full flex-shrink-0"
                >
                  <div className="bg-white rounded-md overflow-hidden shadow-sm border border-gray-100">
                    <div className="grid grid-cols-2 gap-[2px]">
                      {category.items.map((item, itemIndex) => (
                        <Link key={item.id} href={`/categorias/${category.id}/${item.id}`}>
                          <div className="relative aspect-square">
                            <img 
                              src={item.image} 
                              alt={item.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </Link>
                      ))}
                    </div>
                    <div className="absolute bottom-3 left-3">
                      <span className="text-xs text-white font-medium drop-shadow-md">{category.name}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Navigation Arrows */}
          <button 
            className="absolute left-0 top-1/2 -translate-y-1/2 -ml-3 md:-ml-5 bg-white rounded-full w-6 h-6 flex items-center justify-center shadow-sm z-10 hover:bg-[#fff6ef] transition-colors"
            onClick={handlePrevious}
            aria-label="Categoria anterior"
          >
            <ArrowLeft className="h-3.5 w-3.5 text-[#c9732b]" />
          </button>
          
          <button 
            className="absolute right-0 top-1/2 -translate-y-1/2 -mr-3 md:-mr-5 bg-white rounded-full w-6 h-6 flex items-center justify-center shadow-sm z-10 hover:bg-[#fff6ef] transition-colors"
            onClick={handleNext}
            aria-label="Próxima categoria"
          >
            <ArrowRight className="h-3.5 w-3.5 text-[#c9732b]" />
          </button>
          
          {/* Dots navigation */}
          <div className="flex justify-center mt-3 gap-1">
            {categories.map((_, index) => (
              <button 
                key={index}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  index === activeSlide ? 'bg-[#c9732b]' : 'bg-gray-200'
                }`}
                onClick={() => setActiveSlide(index)}
                aria-label={`Ir para slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}