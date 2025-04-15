import React from 'react';
import { ChevronRight, ArrowRight, ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';

interface Category {
  id: string;
  name: string;
  title: string;
  image: string;
  bgColor: string;
}

const categories: Category[] = [
  {
    id: 'drenagem-linfatica',
    name: 'Drenagem Linfática',
    title: 'Drenagem\nlinfática',
    image: 'https://images.unsplash.com/photo-1615148758079-574a78a2f8ad?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&h=500&q=80',
    bgColor: 'bg-amber-100'
  },
  {
    id: 'sem-cirurgia',
    name: 'Sem Cirurgia',
    title: 'sem fazer\ncirurgia?',
    image: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&h=500&q=80',
    bgColor: 'bg-amber-50'
  },
  {
    id: 'botox',
    name: 'Botox',
    title: 'Seu primeiro\nBotox?',
    image: 'https://images.unsplash.com/photo-1526045612212-70caf35c14df?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&h=500&q=80',
    bgColor: 'bg-rose-50'
  },
  {
    id: 'protetor-solar',
    name: 'Protetor Solar',
    title: '5 mitos\nsobre o\nuso do\nprotetor\nsolar',
    image: 'https://images.unsplash.com/photo-1522337660859-02fbefca4702?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&h=500&q=80',
    bgColor: 'bg-stone-100'
  }
];

export default function CategorySection() {
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {categories.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
          
          <button className="absolute left-0 top-1/2 -translate-y-1/2 -ml-4 bg-white rounded-full w-8 h-8 flex items-center justify-center shadow-md hidden md:flex">
            <ArrowLeft className="h-4 w-4" />
          </button>
          
          <button className="absolute right-0 top-1/2 -translate-y-1/2 -mr-4 bg-white rounded-full w-8 h-8 flex items-center justify-center shadow-md hidden md:flex">
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
        
        <div className="flex justify-between mt-4 px-1">
          <div className="text-base font-semibold">Estética Corporal</div>
          <div className="text-base font-semibold">Estética Facial</div>
        </div>
      </div>
    </section>
  );
}

interface CategoryCardProps {
  category: Category;
}

function CategoryCard({ category }: CategoryCardProps) {
  return (
    <Link href={`/categorias/${category.id}`} className={`block relative overflow-hidden rounded-lg aspect-square cursor-pointer ${category.bgColor}`}>
      <img 
        src={category.image} 
        alt={category.name}
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent">
        <div className="absolute bottom-0 left-0 p-3 w-full">
          <div className="text-white text-xl font-serif leading-tight whitespace-pre-line">
            {category.title}
          </div>
          <div className="text-xs text-white/80 mt-1 hidden">
            {category.name}
          </div>
        </div>
      </div>
    </Link>
  );
}