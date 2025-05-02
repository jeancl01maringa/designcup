import React, { useRef, useState, useEffect } from 'react';
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
    id: 'estetica-facial',
    name: 'Estética Facial',
    items: [
      {
        id: 'facial-1',
        title: 'Pele Radiante',
        image: '/attached_assets/atualização estética 09.jpg',
      },
      {
        id: 'facial-2',
        title: 'Limpeza Facial',
        image: '/attached_assets/Captura de tela 2025-04-03 23320922.png',
      },
      {
        id: 'facial-3',
        title: 'Tratamento anti-idade',
        image: '/attached_assets/atualização estética 01.png',
      },
      {
        id: 'facial-4',
        title: 'Brilho Natural',
        image: '/attached_assets/Story Instagram Estética Dicas de Skincare Elegante Rosa.png',
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
  },
  {
    id: 'nutricao',
    name: 'Nutrição',
    items: [
      {
        id: 'nutricao-1',
        title: 'Dieta Personalizada',
        image: '/attached_assets/Design sem nome (1).png',
      },
      {
        id: 'nutricao-2',
        title: 'Suplementação',
        image: '/attached_assets/Design sem nome (2).png',
      },
      {
        id: 'nutricao-3',
        title: 'Bem-estar',
        image: '/attached_assets/Design sem nome (4).png',
      },
      {
        id: 'nutricao-4',
        title: 'Alimentação saudável',
        image: '/attached_assets/Design sem nome.png',
      }
    ]
  }
];

export default function CategorySection() {
  const [visibleCategories, setVisibleCategories] = useState(1);
  const [startIndex, setStartIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Determina quantas categorias mostrar com base no tamanho da tela
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1280) {
        setVisibleCategories(5); // xl: 5 categorias
      } else if (window.innerWidth >= 1024) {
        setVisibleCategories(4); // lg: 4 categorias
      } else if (window.innerWidth >= 768) {
        setVisibleCategories(3); // md: 3 categorias
      } else if (window.innerWidth >= 640) {
        setVisibleCategories(2); // sm: 2 categorias
      } else {
        setVisibleCategories(1); // Mobile: 1 categoria
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const handlePrevious = () => {
    setStartIndex((prev) => Math.max(prev - 1, 0));
  };
  
  const handleNext = () => {
    setStartIndex((prev) => Math.min(prev + 1, categories.length - visibleCategories));
  };
  
  const visibleCategoriesArray = categories.slice(startIndex, startIndex + visibleCategories);
  const canScrollLeft = startIndex > 0;
  const canScrollRight = startIndex + visibleCategories < categories.length;
  
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
        
        {/* Categories Container */}
        <div className="relative" ref={containerRef}>
          <div className="overflow-hidden">
            <div 
              className="flex gap-2 transition-transform duration-300"
              style={{
                transform: `translateX(0)`,
                display: "grid",
                gridTemplateColumns: `repeat(${visibleCategories}, minmax(0, 1fr))`,
                gap: "8px"
              }}
            >
              {visibleCategoriesArray.map((category) => (
                <div key={category.id} className="w-full">
                  <div className="bg-white rounded-md overflow-hidden shadow-sm border border-gray-100">
                    <div className="grid grid-cols-2 gap-[2px]">
                      {category.items.map((item) => (
                        <Link key={item.id} href={`/categorias/${category.id}/${item.id}`}>
                          <div className="relative aspect-square">
                            <img 
                              src={item.image} 
                              alt={item.title}
                              className="w-full h-full object-cover"
                              loading="lazy"
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
            className={`absolute left-0 top-1/2 -translate-y-1/2 -ml-3 md:-ml-5 bg-white rounded-full w-6 h-6 flex items-center justify-center shadow-sm z-10 hover:bg-[#fff6ef] transition-colors ${!canScrollLeft ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={handlePrevious}
            disabled={!canScrollLeft}
            aria-label="Categorias anteriores"
          >
            <ArrowLeft className="h-3.5 w-3.5 text-[#c9732b]" />
          </button>
          
          <button 
            className={`absolute right-0 top-1/2 -translate-y-1/2 -mr-3 md:-mr-5 bg-white rounded-full w-6 h-6 flex items-center justify-center shadow-sm z-10 hover:bg-[#fff6ef] transition-colors ${!canScrollRight ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={handleNext}
            disabled={!canScrollRight}
            aria-label="Próximas categorias"
          >
            <ArrowRight className="h-3.5 w-3.5 text-[#c9732b]" />
          </button>
          
          {/* Navigation Dots (mobile only) */}
          <div className="flex justify-center mt-3 gap-1 md:hidden">
            {Array.from({ length: Math.ceil(categories.length / visibleCategories) }).map((_, index) => {
              const isActive = index === Math.floor(startIndex / visibleCategories);
              return (
                <button 
                  key={index}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    isActive ? 'bg-[#c9732b]' : 'bg-gray-200'
                  }`}
                  onClick={() => setStartIndex(index * visibleCategories)}
                  aria-label={`Ir para grupo ${index + 1}`}
                />
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}