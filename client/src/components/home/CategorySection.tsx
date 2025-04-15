import React, { useState } from 'react';
import { ChevronRight, ArrowRight, ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';

interface CategoryItem {
  id: string;
  title: string;
  image: string;
  bgColor: string;
}

interface Category {
  id: string;
  name: string;
  items: CategoryItem[];
}

// Dados das categorias
const categories: Category[] = [
  {
    id: 'estetica-corporal',
    name: 'Estética Corporal',
    items: [
      {
        id: 'drenagem-linfatica-1',
        title: 'Drenagem\nlinfática',
        image: 'https://images.unsplash.com/photo-1615148758079-574a78a2f8ad?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&h=500&q=80',
        bgColor: 'bg-amber-100'
      },
      {
        id: 'drenagem-linfatica-2',
        title: 'sem fazer\ncirurgia?',
        image: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&h=500&q=80',
        bgColor: 'bg-amber-50'
      },
      {
        id: 'botox',
        title: 'Seu primeiro\nBotox?',
        image: 'https://images.unsplash.com/photo-1526045612212-70caf35c14df?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&h=500&q=80',
        bgColor: 'bg-rose-50'
      },
      {
        id: 'protetor-solar',
        title: '5 mitos\nsobre o\nuso do\nprotetor\nsolar',
        image: 'https://images.unsplash.com/photo-1522337660859-02fbefca4702?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&h=500&q=80',
        bgColor: 'bg-stone-100'
      }
    ]
  },
  {
    id: 'estetica-facial',
    name: 'Estética Facial',
    items: [
      {
        id: 'facial-1',
        title: 'Limpeza de\npele',
        image: 'https://images.unsplash.com/photo-1596704017454-7a8b113978b0?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&h=500&q=80',
        bgColor: 'bg-amber-50'
      },
      {
        id: 'facial-2',
        title: 'Hidratação\nprofunda',
        image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&h=500&q=80',
        bgColor: 'bg-amber-100'
      },
      {
        id: 'facial-3',
        title: 'Rejuvenescimento\nfacial',
        image: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&h=500&q=80',
        bgColor: 'bg-rose-50'
      },
      {
        id: 'facial-4',
        title: 'Máscaras\nfaciais',
        image: 'https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&h=500&q=80',
        bgColor: 'bg-stone-100'
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
    <section className="py-6">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <h2 className="text-base font-semibold">Escolha sua categoria</h2>
          </div>
          
          <Link href="/categorias">
            <Button variant="ghost" className="text-primary flex items-center gap-1 text-sm h-8 px-3">
              Ver todas as Categorias
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
        
        <p className="text-gray-600 text-sm mb-4">Encontre recursos ideais para sua clínica de estética.</p>
        
        <div className="relative">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {currentCategory.items.map((item) => (
              <CategoryCard key={item.id} item={item} />
            ))}
          </div>
          
          <button 
            className="absolute left-0 top-1/2 -translate-y-1/2 -ml-4 bg-white rounded-full w-8 h-8 flex items-center justify-center shadow-md z-10"
            onClick={handlePrevious}
            aria-label="Categoria anterior"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          
          <button 
            className="absolute right-0 top-1/2 -translate-y-1/2 -mr-4 bg-white rounded-full w-8 h-8 flex items-center justify-center shadow-md z-10"
            onClick={handleNext}
            aria-label="Próxima categoria"
          >
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
        
        <div className="flex justify-between mt-4 px-1">
          <div className="text-base font-semibold">{currentCategory.name}</div>
          {/* Espaço para outro texto, se necessário */}
        </div>
      </div>
    </section>
  );
}

interface CategoryCardProps {
  item: CategoryItem;
}

function CategoryCard({ item }: CategoryCardProps) {
  return (
    <Link href={`/categorias/${item.id}`} className={`block relative overflow-hidden rounded-lg aspect-square cursor-pointer ${item.bgColor}`}>
      <img 
        src={item.image} 
        alt={item.title}
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent">
        <div className="absolute bottom-0 left-0 p-3 w-full">
          <div className="text-white text-xl font-serif leading-tight whitespace-pre-line">
            {item.title}
          </div>
        </div>
      </div>
    </Link>
  );
}