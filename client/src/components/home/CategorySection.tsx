import React, { useState } from 'react';
import { ChevronRight, ArrowRight, ArrowLeft, FolderIcon } from 'lucide-react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';

interface CategoryItem {
  id: string;
  title: string;
  image: string;
}

interface Category {
  id: string;
  name: string;
  color: string;
  bgColor: string;
  items: CategoryItem[];
}

// Dados das categorias com as imagens fornecidas
const categories: Category[] = [
  {
    id: 'tratamentos-faciais',
    name: 'Tratamentos Faciais',
    color: 'bg-[#AA5E2F]',
    bgColor: 'bg-[#FFF4E9]',
    items: [
      {
        id: 'tratamento-1',
        title: 'Segredos de uma Pele Radiante',
        image: '/attached_assets/atualização estética 09.jpg',
      },
      {
        id: 'tratamento-2',
        title: '5 mitos sobre o uso de protetor solar',
        image: '/attached_assets/atualização estética 01.png',
      },
      {
        id: 'tratamento-3',
        title: 'Pele sem manchas',
        image: '/attached_assets/Captura de tela 2025-04-03 233106.png',
      },
      {
        id: 'tratamento-4',
        title: 'Preenchimento labial sem exageros',
        image: '/attached_assets/Captura de tela 2025-04-03 233140.png',
      }
    ]
  },
  {
    id: 'procedimentos',
    name: 'Procedimentos',
    color: 'bg-[#AA5E2F]',
    bgColor: 'bg-[#FFF4E9]',
    items: [
      {
        id: 'procedimento-1',
        title: 'Seu primeiro Botox?',
        image: '/attached_assets/atualização estética 04 (1).png',
      },
      {
        id: 'procedimento-2',
        title: 'Beleza atemporal é um investimento',
        image: '/attached_assets/Captura de tela 2025-04-03 232355.png',
      },
      {
        id: 'procedimento-3',
        title: 'Lábios dos sonhos sem fazer cirurgia',
        image: '/attached_assets/atualização estética 05 (1).png',
      },
      {
        id: 'procedimento-4',
        title: 'Transforme sua pele, preserve sua essência',
        image: '/attached_assets/Captura de tela 2025-04-03 23320922.png',
      }
    ]
  },
  {
    id: 'estética-corporal',
    name: 'Estética Corporal',
    color: 'bg-[#AA5E2F]',
    bgColor: 'bg-[#FFF4E9]',
    items: [
      {
        id: 'corporal-1',
        title: 'Drenagem linfática',
        image: '/attached_assets/atualização estética 06 (1).png',
      },
      {
        id: 'corporal-2',
        title: 'Pele firme e viçosa',
        image: '/attached_assets/atualização estética 10.jpg',
      },
      {
        id: 'corporal-3',
        title: 'Relaxamento e rejuvenescimento',
        image: '/attached_assets/Captura de tela 2025-04-03 231324.png',
      },
      {
        id: 'corporal-4',
        title: 'Segredos de uma Pele Radiante',
        image: '/attached_assets/9005ba19-a309-43d3-a40d-80557466a094.png',
      }
    ]
  }
];

export default function CategorySection() {
  const [activeCategory, setActiveCategory] = useState(0);
  
  const handlePrevious = () => {
    setActiveCategory(prev => (prev === 0 ? categories.length - 1 : prev - 1));
  };
  
  const handleNext = () => {
    setActiveCategory(prev => (prev === categories.length - 1 ? 0 : prev + 1));
  };
  
  const currentCategory = categories[activeCategory];
  
  return (
    <section className="py-8 bg-white">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="text-[#AA5E2F]">
              <FolderIcon className="h-5 w-5" />
            </div>
            <h2 className="text-base font-semibold text-[#1D1D1D]">Categorias em Destaque</h2>
          </div>
          
          <Link href="/categorias">
            <Button variant="ghost" className="text-[#AA5E2F] flex items-center gap-1 text-sm h-8 px-3 hover:bg-[#FFF4E9]">
              Ver todas as Categorias
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
        
        <p className="text-[#4B4B4B] text-sm mb-4">Encontre recursos ideais para sua clínica de estética.</p>
        
        <div className="relative my-4">
          {/* Category Group Container */}
          <div className="relative rounded-xl overflow-hidden shadow-sm hover-card">
            {/* 2x2 Grid Layout */}
            <div className="grid grid-cols-2 gap-1">
              {currentCategory.items.map((item, index) => (
                <div key={item.id} className="overflow-hidden aspect-square">
                  <img 
                    src={item.image} 
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                  />
                </div>
              ))}
            </div>
            
            {/* Category Label */}
            <div className={`absolute bottom-4 left-4 ${currentCategory.color} text-white rounded-full px-4 py-1 shadow-md`}>
              <span className="text-sm font-medium">{currentCategory.name}</span>
            </div>
          </div>
          
          {/* Navigation Arrows */}
          <button 
            className="absolute left-0 top-1/2 -translate-y-1/2 -ml-4 bg-white rounded-full w-8 h-8 flex items-center justify-center shadow-md z-10 hover:bg-[#FFF4E9] transition-colors"
            onClick={handlePrevious}
            aria-label="Categoria anterior"
          >
            <ArrowLeft className="h-4 w-4 text-[#AA5E2F]" />
          </button>
          
          <button 
            className="absolute right-0 top-1/2 -translate-y-1/2 -mr-4 bg-white rounded-full w-8 h-8 flex items-center justify-center shadow-md z-10 hover:bg-[#FFF4E9] transition-colors"
            onClick={handleNext}
            aria-label="Próxima categoria"
          >
            <ArrowRight className="h-4 w-4 text-[#AA5E2F]" />
          </button>
        </div>
        
        {/* Category Selection Dots */}
        <div className="flex justify-center mt-4 gap-2">
          {categories.map((category, index) => (
            <button 
              key={category.id}
              className={`w-2 h-2 rounded-full transition-colors ${index === activeCategory ? 'bg-[#AA5E2F]' : 'bg-gray-300'}`}
              onClick={() => setActiveCategory(index)}
              aria-label={`Selecionar categoria ${category.name}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}