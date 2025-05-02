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

// Dados das categorias com formato de carrossel 2x2
const categories: Category[] = [
  {
    id: 'lavagem',
    name: 'Lavagem',
    color: 'bg-green-500',
    bgColor: 'bg-green-100',
    items: [
      {
        id: 'lavagem-1',
        title: 'Hidratação profunda',
        image: 'https://images.unsplash.com/photo-1545171709-49f212b5a6e5?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&h=500&q=80',
      },
      {
        id: 'lavagem-2',
        title: 'Limpeza facial',
        image: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&h=500&q=80',
      },
      {
        id: 'lavagem-3',
        title: 'Esfoliação',
        image: 'https://images.unsplash.com/photo-1526045612212-70caf35c14df?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&h=500&q=80',
      },
      {
        id: 'lavagem-4',
        title: 'Pele radiante',
        image: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&h=500&q=80',
      }
    ]
  },
  {
    id: 'mecanica',
    name: 'Mecânica',
    color: 'bg-red-500',
    bgColor: 'bg-red-100',
    items: [
      {
        id: 'mecanica-1',
        title: 'Massagem modeladora',
        image: 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&h=500&q=80',
      },
      {
        id: 'mecanica-2',
        title: 'Drenagem linfática',
        image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&h=500&q=80',
      },
      {
        id: 'mecanica-3',
        title: 'Rejuvenescimento facial',
        image: 'https://images.unsplash.com/photo-1596704017454-7a8b113978b0?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&h=500&q=80',
      },
      {
        id: 'mecanica-4',
        title: 'Firmeza e elasticidade',
        image: 'https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&h=500&q=80',
      }
    ]
  },
  {
    id: 'seminovos',
    name: 'Seminovos',
    color: 'bg-purple-500',
    bgColor: 'bg-purple-100',
    items: [
      {
        id: 'seminovos-1',
        title: 'Peelings químicos',
        image: 'https://images.unsplash.com/photo-1596727147705-61a532a659bd?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&h=500&q=80',
      },
      {
        id: 'seminovos-2',
        title: 'Rejuvenescimento',
        image: 'https://images.unsplash.com/photo-1591343395082-e120087004b4?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&h=500&q=80',
      },
      {
        id: 'seminovos-3',
        title: 'Máscaras faciais',
        image: 'https://images.unsplash.com/photo-1558507652-2d9626c4e67a?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&h=500&q=80',
      },
      {
        id: 'seminovos-4',
        title: 'Microagulhamento',
        image: 'https://images.unsplash.com/photo-1565693413579-8a23f559df49?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&h=500&q=80',
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