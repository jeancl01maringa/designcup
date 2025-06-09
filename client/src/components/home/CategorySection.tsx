import React, { useRef, useState, useEffect } from 'react';
import { ArrowRight, ArrowLeft, ImageOff } from 'lucide-react';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

// Tipos para as categorias do banco de dados
interface DbCategory {
  id: number;
  name: string;
  description: string | null;
  image_url: string | null;
  icon_url: string | null;
  slug: string | null;
  is_highlighted: boolean;
  created_at: string;
}

// Tipos para os posts do banco de dados
interface DbPost {
  id: number;
  title: string;
  description: string | null;
  imageUrl: string;
  categoryId: number;
  status: string;
  uniqueCode: string;
  createdAt: string;
}

// Interface para categoria com suas imagens de posts associadas
interface CategoryWithPosts {
  id: number;
  name: string;
  slug: string | null;
  description: string | null;
  posts: {
    id: number;
    title: string;
    imageUrl: string;
  }[];
}

export default function CategorySection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [maxScroll, setMaxScroll] = useState(0);
  
  // Buscar apenas categorias que têm posts
  const { data: dbCategories = [], isLoading: isCategoriesLoading } = useQuery<DbCategory[]>({
    queryKey: ['/api/categories/with-posts'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/categories/with-posts');
        if (!response.ok) throw new Error('Failed to fetch categories');
        const data = await response.json();
        return data || [];
      } catch (err) {
        console.error('Erro ao buscar categorias com posts:', err);
        return [];
      }
    }
  });
  
  // Buscar posts aprovados do PostgreSQL (dados reais)
  const { data: dbPosts = [], isLoading: isPostsLoading } = useQuery<DbPost[]>({
    queryKey: ['/api/posts/visible'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/posts/visible');
        if (!response.ok) throw new Error('Failed to fetch posts');
        const data = await response.json();
        return data || [];
      } catch (err) {
        console.error('Erro ao buscar posts:', err);
        return [];
      }
    }
  });
  
  // Constrói a estrutura de categorias com posts associados
  const categoriesWithPosts: CategoryWithPosts[] = dbCategories.map(category => {
    // Filtrar posts para esta categoria
    const categoryPosts = dbPosts
      .filter(post => post.categoryId === category.id)
      .map(post => ({
        id: post.id,
        title: post.title,
        imageUrl: post.imageUrl
      }));
    
    return {
      id: category.id,
      name: category.name,
      slug: category.slug || null,
      description: category.description,
      posts: categoryPosts
    };
  }).filter(category => category.posts.length > 0); // Mostrar apenas categorias com posts
  
  // Calcular a largura máxima de rolagem quando os dados são carregados
  useEffect(() => {
    const updateScrollDimensions = () => {
      if (scrollRef.current && containerRef.current && categoriesWithPosts.length > 0) {
        // Aguardar um frame para garantir que o DOM foi atualizado
        requestAnimationFrame(() => {
          const containerWidth = containerRef.current?.clientWidth || 0;
          const scrollWidth = scrollRef.current?.scrollWidth || 0;
          const newMaxScroll = Math.max(0, scrollWidth - containerWidth);
          setMaxScroll(newMaxScroll);
          
          // Log para debug
          console.log('Scroll dimensions:', { containerWidth, scrollWidth, newMaxScroll });
        });
      }
    };

    updateScrollDimensions();
    
    // Adicionar listener para resize da janela
    window.addEventListener('resize', updateScrollDimensions);
    return () => window.removeEventListener('resize', updateScrollDimensions);
  }, [categoriesWithPosts]);
  
  // Manipular o scroll para a esquerda
  const handleScrollLeft = () => {
    if (scrollRef.current) {
      const newPosition = Math.max(0, scrollPosition - 300);
      scrollRef.current.scrollTo({ left: newPosition, behavior: 'smooth' });
      setScrollPosition(newPosition);
    }
  };
  
  // Manipular o scroll para a direita
  const handleScrollRight = () => {
    if (scrollRef.current) {
      const newPosition = Math.min(maxScroll, scrollPosition + 300);
      scrollRef.current.scrollTo({ left: newPosition, behavior: 'smooth' });
      setScrollPosition(newPosition);
    }
  };
  
  // Lidar com evento de scroll manual
  const handleScroll = () => {
    if (scrollRef.current) {
      setScrollPosition(scrollRef.current.scrollLeft);
    }
  };
  
  // Adicionar ouvinte de scroll
  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (scrollElement) {
      scrollElement.addEventListener('scroll', handleScroll);
      return () => scrollElement.removeEventListener('scroll', handleScroll);
    }
  }, [scrollRef.current]);
  
  // Estado de carregamento ou sem dados
  if (isCategoriesLoading || isPostsLoading) {
    return (
      <section className="py-8 bg-white border-b border-gray-100">
        <div className="container mx-auto px-4">
          <div className="mb-6">
            <h3 className="text-[#1d1d1f] font-semibold text-lg font-inter mb-1 flex items-center">
              <span className="mr-2">📁</span>
              Escolha sua categoria
            </h3>
          </div>
          <div className="flex justify-center items-center h-32">
            <div className="animate-pulse flex space-x-4">
              <div className="h-20 w-48 bg-gray-200 rounded-lg"></div>
              <div className="h-20 w-48 bg-gray-200 rounded-lg"></div>
              <div className="h-20 w-48 bg-gray-200 rounded-lg"></div>
            </div>
          </div>
        </div>
      </section>
    );
  }
  
  // Se não houver categorias com posts
  if (categoriesWithPosts.length === 0) {
    return (
      <section className="py-8 bg-white border-b border-gray-100">
        <div className="container mx-auto px-4">
          <div className="mb-6">
            <h3 className="text-[#1d1d1f] font-semibold text-lg font-inter mb-1 flex items-center">
              <span className="mr-2">📁</span>
              Escolha sua categoria
            </h3>
          </div>
          <div className="flex flex-col items-center justify-center py-6">
            <ImageOff className="h-12 w-12 text-gray-400 mb-2" />
            <p className="text-gray-500">Nenhuma categoria disponível no momento</p>
          </div>
        </div>
      </section>
    );
  }

  // Verifica se pode rolar para esquerda ou direita
  // Forçar exibição das setas se houver mais de 3 categorias ou se maxScroll > 50
  const shouldShowArrows = categoriesWithPosts.length > 3 || maxScroll > 50;
  const canScrollLeft = shouldShowArrows && scrollPosition > 0;
  const canScrollRight = shouldShowArrows && (scrollPosition < maxScroll || maxScroll === 0);
  
  return (
    <section className="py-8 bg-white border-b border-gray-100">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <h3 className="text-black font-semibold text-lg font-inter mb-1 flex items-center">
            <span className="mr-2">📁</span>
            Escolha sua categoria
          </h3>
          <p className="text-gray-600 text-sm font-light">
            Encontre recursos ideais para sua clínica de estética
          </p>
          <div className="flex items-center mt-2">
            <div className="flex mt-1">
              <span className="inline-block h-1 w-6 rounded-full bg-black mr-1"></span>
              <span className="inline-block h-1 w-1 rounded-full bg-black/30 mr-1"></span>
              <span className="inline-block h-1 w-1 rounded-full bg-black/30"></span>
            </div>
          </div>
        </div>
        
        {/* Container com referência para controle de scroll */}
        <div className="relative" ref={containerRef}>
          {/* Botões de navegação - Esquerda */}
          {canScrollLeft && (
            <button 
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/40 backdrop-blur-md rounded-full h-10 w-10 shadow-md flex items-center justify-center transition-all duration-300 ease-in-out hover:bg-white/80 hover:backdrop-blur-lg hover:shadow-xl hover:scale-105 border border-white/30"
              onClick={handleScrollLeft}
              aria-label="Categorias anteriores"
            >
              <ArrowLeft className="h-5 w-5 text-black transition-transform duration-300 group-hover:scale-110" />
            </button>
          )}
          
          {/* Contêiner de rolagem horizontal */}
          <div 
            ref={scrollRef}
            className="overflow-x-auto scrollbar-hide px-4 pb-4"
            style={{ 
              scrollbarWidth: 'none',  // Firefox
              msOverflowStyle: 'none'  // IE/Edge
            }}
          >
            <div className="flex space-x-6 w-max">
              {categoriesWithPosts.map((category) => (
                <div key={category.id} className="flex-none w-80">
                  <Link 
                    href={`/categorias/${category.slug || category.id}`} 
                    className="block group cursor-pointer"
                  >
                    {/* Grid 2x2 de imagens com overlay */}
                    <div className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 transform group-hover:scale-[1.02] aspect-square relative">
                      <div className="grid grid-cols-2 grid-rows-2 gap-0.5 h-full">
                        {/* Mostrar até 4 imagens ou placeholders */}
                        {Array.from({ length: 4 }).map((_, index) => {
                          const post = category.posts[index];
                          return (
                            <div key={index} className="relative overflow-hidden">
                              {post ? (
                                <img 
                                  src={post.imageUrl} 
                                  alt={post.title}
                                  className="w-full h-full object-cover group-hover:brightness-105 transition-all duration-300"
                                  loading="lazy"
                                />
                              ) : (
                                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                                  <ImageOff className="h-6 w-6 text-gray-300" />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      
                      {/* Overlay com nome da categoria */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                        <span className="text-white text-sm font-medium">{category.posts.length} items</span>
                      </div>
                    </div>
                    
                    {/* Nome da categoria */}
                    <div className="mt-3">
                      <h4 className="font-medium text-[#1d1d1f] text-base group-hover:text-black transition-colors duration-200">
                        {category.name}
                      </h4>
                      {category.description && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                          {category.description}
                        </p>
                      )}
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>
          
          {canScrollRight && (
            <button 
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/40 backdrop-blur-md rounded-full h-10 w-10 shadow-md flex items-center justify-center transition-all duration-300 ease-in-out hover:bg-white/80 hover:backdrop-blur-lg hover:shadow-xl hover:scale-105 border border-white/30"
              onClick={handleScrollRight}
              aria-label="Próximas categorias"
            >
              <ArrowRight className="h-5 w-5 text-black transition-transform duration-300 group-hover:scale-110" />
            </button>
          )}
        </div>
        
        {/* Link para todas as categorias */}
        <div className="text-center mt-8">
          <Link href="/categorias" className="text-black text-sm hover:underline font-medium">
            Ver todas as categorias
          </Link>
        </div>
      </div>
    </section>
  );
}