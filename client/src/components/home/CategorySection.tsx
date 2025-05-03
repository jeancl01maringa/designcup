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
  image_url: string;
  category_id: number;
  status: string;
  unique_code: string;
  created_at: string;
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
  
  // Buscar categorias do Supabase
  const { data: dbCategories = [], isLoading: isCategoriesLoading } = useQuery<DbCategory[]>({
    queryKey: ['/api/admin/categories'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .order('name');
        
        if (error) throw error;
        return data || [];
      } catch (err) {
        console.error('Erro ao buscar categorias:', err);
        return [];
      }
    }
  });
  
  // Buscar posts aprovados do Supabase
  const { data: dbPosts = [], isLoading: isPostsLoading } = useQuery<DbPost[]>({
    queryKey: ['/api/admin/posts/approved'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('posts')
          .select('*')
          .eq('status', 'aprovado')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
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
      .filter(post => post.category_id === category.id)
      .map(post => ({
        id: post.id,
        title: post.title,
        imageUrl: post.image_url
      }));
    
    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      posts: categoryPosts
    };
  }).filter(category => category.posts.length > 0); // Mostrar apenas categorias com posts
  
  // Calcular a largura máxima de rolagem quando os dados são carregados
  useEffect(() => {
    if (scrollRef.current && categoriesWithPosts.length > 0) {
      const containerWidth = containerRef.current?.clientWidth || 0;
      const scrollWidth = scrollRef.current.scrollWidth;
      setMaxScroll(Math.max(0, scrollWidth - containerWidth));
    }
  }, [categoriesWithPosts, scrollRef.current?.scrollWidth]);
  
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
            <h3 className="text-[#1d1d1f] font-semibold text-xl font-inter mb-1 flex items-center">
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
            <h3 className="text-[#1d1d1f] font-semibold text-xl font-inter mb-1 flex items-center">
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
  const canScrollLeft = scrollPosition > 0;
  const canScrollRight = scrollPosition < maxScroll;
  
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
        
        {/* Container com referência para controle de scroll */}
        <div className="relative" ref={containerRef}>
          {/* Botões de navegação */}
          {canScrollLeft && (
            <button 
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full h-10 w-10 shadow-md flex items-center justify-center transition-all hover:bg-gray-50 hover:shadow-lg"
              onClick={handleScrollLeft}
              aria-label="Categorias anteriores"
            >
              <ArrowLeft className="h-5 w-5 text-[#1f4ed8]" />
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
            <div className="flex space-x-4 w-max">
              {categoriesWithPosts.map((category) => (
                <div key={category.id} className="flex-none w-64">
                  <Link 
                    href={`/categorias/${category.slug || category.id}`} 
                    className="block group cursor-pointer"
                  >
                    {/* Grid 2x2 de imagens */}
                    <div className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 transform group-hover:scale-[1.02] aspect-square">
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
                    </div>
                    
                    {/* Nome da categoria */}
                    <h4 className="mt-3 text-center font-semibold text-[#1d1d1f] group-hover:text-[#1f4ed8] transition-colors duration-200">
                      {category.name}
                    </h4>
                  </Link>
                </div>
              ))}
            </div>
          </div>
          
          {canScrollRight && (
            <button 
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full h-10 w-10 shadow-md flex items-center justify-center transition-all hover:bg-gray-50 hover:shadow-lg"
              onClick={handleScrollRight}
              aria-label="Próximas categorias"
            >
              <ArrowRight className="h-5 w-5 text-[#1f4ed8]" />
            </button>
          )}
        </div>
        
        {/* Link para todas as categorias */}
        <div className="text-center mt-8">
          <Link href="/categorias" className="text-[#1f4ed8] text-sm hover:underline font-medium">
            Ver todas as categorias
          </Link>
        </div>
      </div>
    </section>
  );
}