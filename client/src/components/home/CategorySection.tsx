import React, { useRef, useState, useEffect } from 'react';
import { ArrowRight, ArrowLeft, ImageOff, Eye, ChevronRight } from 'lucide-react';
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

  // Buscar configurações das categorias em destaque (site_config)
  const { data: featuredConfig, isLoading: isFeaturedLoading } = useQuery({
    queryKey: ['/api/site-config/featured-categories'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/site-config/featured-categories');
        if (!response.ok) return null;
        const data = await response.json();
        return data?.data || null; // Return the array stored in 'data'
      } catch (err) {
        console.error('Erro ao buscar categorias em destaque:', err);
        return null;
      }
    }
  });

  // Fallback: Buscar apenas categorias que têm posts dinamicamente
  const { data: dbCategories = [], isLoading: isCategoriesLoading } = useQuery<DbCategory[]>({
    queryKey: ['/api/categories/with-posts'],
    enabled: featuredConfig === null || featuredConfig.length === 0, // Apenas se não houver destaques publicados
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

  // Fallback: Buscar posts aprovados
  const { data: dbPosts = [], isLoading: isPostsLoading } = useQuery<DbPost[]>({
    queryKey: ['/api/posts/visible'],
    enabled: featuredConfig === null || featuredConfig.length === 0,
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

  // Constrói a estrutura de categorias
  let categoriesWithPosts: CategoryWithPosts[] = [];

  if (featuredConfig && featuredConfig.length > 0) {
    // Usar dados publicados no admin (já vêm filtrados, ordenados e com os posts corretos do Cartaz)
    categoriesWithPosts = featuredConfig;
  } else {
    // Fallback original dinâmico
    categoriesWithPosts = dbCategories.map(category => {
      const categoryPosts = dbPosts
        .filter(post =>
          post.categoryId === category.id &&
          (post as any).formato === 'Cartaz'
        )
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
    }).filter(category => category.posts.length > 0);
  }

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
      const containerWidth = containerRef.current?.clientWidth || 0;
      const scrollAmount = Math.min(300, containerWidth * 0.8);
      const newPosition = Math.max(0, scrollPosition - scrollAmount);
      scrollRef.current.scrollTo({ left: newPosition, behavior: 'smooth' });
      setScrollPosition(newPosition);
    }
  };

  // Manipular o scroll para a direita
  const handleScrollRight = () => {
    if (scrollRef.current) {
      const containerWidth = containerRef.current?.clientWidth || 0;
      const scrollAmount = Math.min(300, containerWidth * 0.8);
      const newPosition = Math.min(maxScroll, scrollPosition + scrollAmount);
      scrollRef.current.scrollTo({ left: newPosition, behavior: 'smooth' });
      setScrollPosition(newPosition);
    }
  };

  // Lidar com evento de scroll manual
  const handleScroll = () => {
    if (scrollRef.current) {
      const newPosition = scrollRef.current.scrollLeft;
      setScrollPosition(newPosition);
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
  if (isFeaturedLoading || (isCategoriesLoading && (featuredConfig === null || featuredConfig.length === 0))) {
    return (
      <section className="py-8 bg-background border-b border-border">
        <div className="container-global">
          <div className="mb-6">
            <h3 className="text-foreground font-semibold text-lg font-inter flex items-center">
              Categorias em destaque
            </h3>
          </div>
          <div className="flex justify-center items-center h-32">
            <div className="animate-pulse flex space-x-4">
              <div className="h-20 w-48 bg-muted rounded-lg"></div>
              <div className="h-20 w-48 bg-muted rounded-lg"></div>
              <div className="h-20 w-48 bg-muted rounded-lg"></div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Se não houver categorias com posts
  if (categoriesWithPosts.length === 0) {
    return (
      <section className="py-8 bg-background border-b border-border">
        <div className="container-global">
          <div className="mb-6">
            <h3 className="text-foreground font-semibold text-lg font-inter flex items-center">
              Categorias em destaque
            </h3>
          </div>
          <div className="flex flex-col items-center justify-center py-6">
            <ImageOff className="h-12 w-12 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">Nenhuma categoria disponível no momento</p>
          </div>
        </div>
      </section>
    );
  }

  // Verifica se pode rolar para esquerda ou direita
  const canScrollLeft = scrollPosition > 0;
  const canScrollRight = scrollPosition < maxScroll;

  return (
    <section className="py-8 bg-background border-b border-border">
      <div className="container-global">
        {/* Header */}
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="text-foreground font-semibold text-sm sm:text-base md:text-lg font-inter">
              Categorias em destaque
            </h3>
          </div>

          {/* Link Ver categorias minimalista */}
          <Link
            href="/categorias"
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
          >
            Ver categorias
            <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
          </Link>
        </div>

        {/* Container com referência para controle de scroll */}
        <div className="relative overflow-hidden" ref={containerRef}>
          {/* Botões de navegação - Esquerda */}
          {canScrollLeft && (
            <button
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-slate-900/60 backdrop-blur-sm rounded-full h-10 w-10 shadow-lg flex items-center justify-center transition-all duration-300 ease-in-out hover:bg-slate-900/80 hover:backdrop-blur-md hover:shadow-xl hover:scale-105 border border-slate-700/20"
              onClick={handleScrollLeft}
              aria-label="Categorias anteriores"
            >
              <ArrowLeft className="h-5 w-5 text-white transition-transform duration-300 group-hover:scale-110" />
            </button>
          )}

          {/* Contêiner de rolagem horizontal */}
          <div
            ref={scrollRef}
            className="overflow-x-auto overflow-y-hidden scrollbar-hide pb-4"
            style={{
              scrollbarWidth: 'none',  // Firefox
              msOverflowStyle: 'none',  // IE/Edge
              WebkitOverflowScrolling: 'touch', // Scroll suave no iOS
              overflowY: 'hidden' // Força overflow vertical como hidden
            }}
          >
            <div className="flex space-x-6 w-max px-4">
              {/* Renderizar categorias normalmente */}
              {categoriesWithPosts.map((category, index) => (
                <div key={category.id} className="flex-none w-80">
                  <div className="relative">
                    <Link
                      href={`/categorias/${category.slug || category.id}`}
                      className="block group cursor-pointer"
                    >
                      {/* Grid 2x2 de imagens com overlay */}
                      <div className="bg-card rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 transform group-hover:scale-[1.02] aspect-square relative">
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
                                  <div className="w-full h-full bg-muted flex items-center justify-center">
                                    <ImageOff className="h-6 w-6 text-muted-foreground" />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Overlay sutil permanente para contraste */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>

                        {/* Ícone de preview centralizado - aparece no hover */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <div className="w-8 h-8 bg-background rounded-full flex items-center justify-center shadow-lg">
                            <Eye className="w-4 h-4" style={{ color: '#F84930' }} />
                          </div>
                        </div>

                        {/* Overlay com nome da categoria no hover */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                          <span className="text-white text-sm font-medium">{category.posts.length.toString().padStart(2, '0')} Artes</span>
                        </div>
                      </div>
                    </Link>

                    {/* Retângulo branco centralizado com título da categoria - sempre visível - FORA do container com overflow */}
                    <div className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 z-30">
                      <div className="bg-card rounded-full px-8 py-3 shadow-lg shadow-black/10 min-w-[180px] flex items-center justify-center relative border border-border">
                        <span className="text-card-foreground text-sm font-bold text-center">
                          {category.name}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {canScrollRight && (
            <button
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-slate-900/60 backdrop-blur-sm rounded-full h-10 w-10 shadow-lg flex items-center justify-center transition-all duration-300 ease-in-out hover:bg-slate-900/80 hover:backdrop-blur-md hover:shadow-xl hover:scale-105 border border-slate-700/20"
              onClick={handleScrollRight}
              aria-label="Próximas categorias"
            >
              <ArrowRight className="h-5 w-5 text-white transition-transform duration-300 group-hover:scale-110" />
            </button>
          )}
        </div>


      </div>
    </section>
  );
}