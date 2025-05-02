import React, { useState } from 'react';
import { ChevronRight, ArrowRight, ArrowLeft, FolderIcon, Layers } from 'lucide-react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

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
  icon?: React.ReactNode;
  description: string;
  items: CategoryItem[];
}

// Dados das categorias com as imagens fornecidas
const categories: Category[] = [
  {
    id: 'tratamentos-faciais',
    name: 'Tratamentos Faciais',
    color: 'bg-[#AA5E2F]',
    bgColor: 'bg-[#FFF4E9]',
    icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 9a4 4 0 100-8 4 4 0 000 8z" fill="currentColor" />
      <path d="M16 9a4 4 0 100-8 4 4 0 000 8z" fill="currentColor" />
      <path d="M22 16.5a6 6 0 00-12 0" stroke="currentColor" strokeWidth="2" />
      <path d="M14 16.5a6 6 0 00-12 0" stroke="currentColor" strokeWidth="2" />
    </svg>,
    description: 'Conteúdo para cuidados com a pele e rejuvenescimento facial',
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
    icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M19 9l-7 7-7-7" stroke="currentColor" strokeWidth="2" />
    </svg>,
    description: 'Materiais de comunicação para procedimentos estéticos especializados',
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
    icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" stroke="currentColor" strokeWidth="2" />
      <path d="M12 16a4 4 0 100-8 4 4 0 000 8z" fill="currentColor" />
    </svg>,
    description: 'Artes voltadas para tratamentos corporais e modelagem',
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
    <section className="py-16 bg-[#FFF4E9]/50">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="bg-[#FAF3EC] border-none text-[#AA5E2F] px-3 py-1 rounded-md">
                <Layers className="h-4 w-4 mr-1" />
                Categorias
              </Badge>
            </div>
            <h2 className="text-2xl font-bold text-[#1D1D1D] mb-2 font-montserrat">Explore nossa biblioteca por categorias</h2>
            <p className="text-[#4B4B4B] text-base mb-4 md:mb-0 max-w-xl">
              Encontre recursos ideais para sua clínica de estética organizados por especialidade.
            </p>
          </div>
          
          <Link href="/categorias">
            <Button className="bg-[#AA5E2F] hover:bg-[#95512A] text-white rounded-md py-2 px-4">
              Ver todas as Categorias
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>
        
        {/* Category Tabs */}
        <div className="flex overflow-x-auto pb-2 mb-6 scrollbar-hide gap-2">
          {categories.map((category, index) => (
            <button
              key={category.id}
              className={`px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
                index === activeCategory 
                  ? 'bg-[#AA5E2F] text-white' 
                  : 'bg-white text-[#1D1D1D] hover:bg-[#FAF3EC]'
              }`}
              onClick={() => setActiveCategory(index)}
            >
              <div className="flex items-center gap-2">
                {category.icon && <span className={index === activeCategory ? 'text-white' : 'text-[#AA5E2F]'}>{category.icon}</span>}
                <span className="font-medium">{category.name}</span>
              </div>
            </button>
          ))}
        </div>
        
        <div className="relative my-6">
          {/* Category Info */}
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-[#1D1D1D] mb-1 font-montserrat">{currentCategory.name}</h3>
            <p className="text-[#4B4B4B]">{currentCategory.description}</p>
          </div>
          
          {/* Category Group Container */}
          <div className="relative rounded-xl overflow-hidden shadow-md hover-card bg-white p-1">
            {/* 2x2 Grid Layout */}
            <div className="grid grid-cols-2 gap-2">
              {currentCategory.items.map((item, index) => (
                <Link key={item.id} href={`/categorias/${currentCategory.id}/${item.id}`}>
                  <div className="relative group overflow-hidden rounded-lg aspect-square cursor-pointer">
                    <img 
                      src={item.image} 
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="absolute bottom-3 left-3 right-3">
                        <h4 className="text-white text-sm font-medium line-clamp-2">{item.title}</h4>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            
            {/* Category Label */}
            <div className={`absolute top-4 right-4 ${currentCategory.color} text-white rounded-full px-4 py-1 shadow-md`}>
              <span className="text-sm font-medium flex items-center gap-1">
                {currentCategory.icon}
                {currentCategory.name}
              </span>
            </div>
          </div>
          
          {/* Navigation Arrows */}
          <button 
            className="absolute left-0 top-1/2 -translate-y-1/2 -ml-5 bg-white rounded-full w-10 h-10 flex items-center justify-center shadow-md z-10 hover:bg-[#FFF4E9] transition-colors"
            onClick={handlePrevious}
            aria-label="Categoria anterior"
          >
            <ArrowLeft className="h-5 w-5 text-[#AA5E2F]" />
          </button>
          
          <button 
            className="absolute right-0 top-1/2 -translate-y-1/2 -mr-5 bg-white rounded-full w-10 h-10 flex items-center justify-center shadow-md z-10 hover:bg-[#FFF4E9] transition-colors"
            onClick={handleNext}
            aria-label="Próxima categoria"
          >
            <ArrowRight className="h-5 w-5 text-[#AA5E2F]" />
          </button>
        </div>
        
        {/* Category Selection Dots */}
        <div className="flex justify-center mt-6 gap-2">
          {categories.map((category, index) => (
            <button 
              key={category.id}
              className={`w-2.5 h-2.5 rounded-full transition-colors ${index === activeCategory ? 'bg-[#AA5E2F]' : 'bg-gray-300'}`}
              onClick={() => setActiveCategory(index)}
              aria-label={`Selecionar categoria ${category.name}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}