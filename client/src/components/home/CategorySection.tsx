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
  },
  {
    id: 'limpeza-pele',
    name: 'Limpeza de Pele',
    items: [
      {
        id: 'limpeza-1',
        title: 'Procedimento',
        image: '/attached_assets/Captura de tela 2025-04-03 233106.png',
      },
      {
        id: 'limpeza-2',
        title: 'Antes e Depois',
        image: '/attached_assets/atualização estética 09.jpg',
      },
      {
        id: 'limpeza-3',
        title: 'Técnicas',
        image: '/attached_assets/Captura de tela 2025-04-03 232355.png',
      },
      {
        id: 'limpeza-4',
        title: 'Resultados',
        image: '/attached_assets/Story Instagram Estética Dicas de Skincare Elegante Rosa.png',
      }
    ]
  },
  {
    id: 'corporal',
    name: 'Estética Corporal',
    items: [
      {
        id: 'corporal-1',
        title: 'Tratamentos',
        image: '/attached_assets/atualização estética 04 (1).png',
      },
      {
        id: 'corporal-2',
        title: 'Criolipólise',
        image: '/attached_assets/atualização estética 06 (1).png',
      },
      {
        id: 'corporal-3',
        title: 'Procedimentos',
        image: '/attached_assets/atualização estética 01.png',
      },
      {
        id: 'corporal-4',
        title: 'Modeladora',
        image: '/attached_assets/9005ba19-a309-43d3-a40d-80557466a094.png',
      }
    ]
  }
];

export default function CategorySection() {
  const [visibleCategories, setVisibleCategories] = useState(1);
  const [startIndex, setStartIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [pageDots, setPageDots] = useState<number[]>([]);
  const [activeDot, setActiveDot] = useState(0);
  
  // Determina quantas categorias mostrar com base no tamanho da tela
  useEffect(() => {
    const handleResize = () => {
      // Priorizando mostrar 5 categorias em telas maiores conforme requisitado
      if (window.innerWidth >= 1536) { // 2xl
        setVisibleCategories(5);
      } else if (window.innerWidth >= 1280) { // xl
        setVisibleCategories(5);
      } else if (window.innerWidth >= 1024) { // lg
        setVisibleCategories(4);
      } else if (window.innerWidth >= 768) { // md
        setVisibleCategories(3);
      } else if (window.innerWidth >= 640) { // sm
        setVisibleCategories(2);
      } else {
        setVisibleCategories(1);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Atualiza os indicadores de página quando o número de categorias visíveis muda
  useEffect(() => {
    const totalPages = Math.ceil(categories.length / visibleCategories);
    setPageDots(Array.from({ length: totalPages }, (_, i) => i));
  }, [visibleCategories]);
  
  // Atualiza o indicador de página ativa quando o índice inicial muda
  useEffect(() => {
    setActiveDot(Math.floor(startIndex / visibleCategories));
  }, [startIndex, visibleCategories]);
  
  const handlePrevious = () => {
    setStartIndex((prev) => Math.max(prev - visibleCategories, 0));
  };
  
  const handleNext = () => {
    setStartIndex((prev) => {
      const nextIndex = prev + visibleCategories;
      return nextIndex < categories.length ? nextIndex : prev;
    });
  };
  
  const handlePageClick = (pageIndex: number) => {
    setStartIndex(pageIndex * visibleCategories);
  };
  
  // Calcula quais categorias estão visíveis
  const visibleCategoriesArray = categories.slice(startIndex, startIndex + visibleCategories);
  const canScrollLeft = startIndex > 0;
  const canScrollRight = startIndex + visibleCategories < categories.length;
  
  return (
    <section className="py-8 bg-white border-b border-gray-100">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <h3 className="text-[#1d1d1f] font-semibold text-xl font-inter mb-1 flex items-center">
            <span className="mr-2">📁</span>
            Escolha sua categoria
          </h3>
          <p className="text-[#5c3a2d] text-sm font-light">
            Encontre recursos ideais para sua clínica de estética
          </p>
        </div>
        
        {/* Categories Container */}
        <div className="relative pb-8" ref={containerRef}>
          {/* Navigation Arrows - Posicionadas fora do container para maior destaque */}
          <button 
            className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full h-10 w-10 shadow-md flex items-center justify-center transition-all ${
              !canScrollLeft 
                ? 'opacity-50 cursor-not-allowed' 
                : 'hover:bg-gray-50 hover:shadow-lg'
            }`}
            onClick={handlePrevious}
            disabled={!canScrollLeft}
            aria-label="Categorias anteriores"
          >
            <ArrowLeft className="h-5 w-5 text-[#1f4ed8]" />
          </button>
          
          <div className="overflow-hidden px-12">
            <div 
              className="grid transition-all duration-500 ease-in-out gap-4"
              style={{
                gridTemplateColumns: `repeat(${visibleCategories}, minmax(0, 1fr))`,
                transform: `translateX(-${startIndex * (100 / visibleCategories)}%)`
              }}
            >
              {categories.map((category) => (
                <div key={category.id} className="w-full">
                  <Link href={`/categorias/${category.id}`} className="block group cursor-pointer">
                    {/* Imagens em grid 2x2 */}
                    <div className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 transform group-hover:scale-[1.02] aspect-square">
                      <div className="grid grid-cols-2 gap-0.5 h-full">
                        {category.items.slice(0, 4).map((item, index) => (
                          <div key={item.id} className="relative overflow-hidden">
                            <img 
                              src={item.image} 
                              alt={item.title}
                              className="w-full h-full object-cover group-hover:brightness-105 transition-all duration-300"
                              loading="lazy"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Nome da categoria abaixo da imagem */}
                    <h4 className="mt-3 text-center font-semibold text-[#1d1d1f] group-hover:text-[#1f4ed8] transition-colors duration-200">
                      {category.name}
                    </h4>
                  </Link>
                </div>
              ))}
            </div>
          </div>
          
          <button 
            className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full h-10 w-10 shadow-md flex items-center justify-center transition-all ${
              !canScrollRight 
                ? 'opacity-50 cursor-not-allowed' 
                : 'hover:bg-gray-50 hover:shadow-lg'
            }`}
            onClick={handleNext}
            disabled={!canScrollRight}
            aria-label="Próximas categorias"
          >
            <ArrowRight className="h-5 w-5 text-[#1f4ed8]" />
          </button>
          
          {/* Navigation Dots */}
          {pageDots.length > 1 && (
            <div className="flex justify-center mt-6 gap-1.5">
              {pageDots.map((pageIndex) => (
                <button 
                  key={pageIndex}
                  className={`w-2 h-2 rounded-full transition-all ${
                    pageIndex === activeDot 
                      ? 'bg-[#1f4ed8] w-4' 
                      : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                  onClick={() => handlePageClick(pageIndex)}
                  aria-label={`Ir para grupo ${pageIndex + 1}`}
                  aria-current={pageIndex === activeDot ? 'true' : 'false'}
                />
              ))}
            </div>
          )}
        </div>
        
        {/* Link para visualizar todas as categorias */}
        <div className="text-center mt-4">
          <Link href="/categorias" className="text-[#1f4ed8] text-sm hover:underline font-medium">
            Ver todas as categorias
          </Link>
        </div>
      </div>
    </section>
  );
}