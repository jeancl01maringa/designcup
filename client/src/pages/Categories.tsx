import React, { useState } from 'react';
import { ImageOff, Search } from 'lucide-react';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Input } from "@/components/ui/input";

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
  postCount: number;
}

// Tipos para os posts do banco de dados
interface DbPost {
  id: number;
  title: string;
  image: string;
  isPremium: boolean;
  createdAt: string;
}

// Interface para categoria com suas imagens de posts associadas
interface CategoryWithPosts {
  id: number;
  name: string;
  slug: string | null;
  description: string | null;
  postCount: number;
  posts: {
    id: number;
    title: string;
    image: string;
    isPremium: boolean;
  }[];
}

export default function Categories() {
  const [searchTerm, setSearchTerm] = useState("");
  
  // Buscar categorias com contagem de posts
  const { data: dbCategories = [], isLoading: isCategoriesLoading } = useQuery<DbCategory[]>({
    queryKey: ['/api/categories/with-stats'],
  });
  
  // Buscar posts para cada categoria para preview
  const { data: categoryPosts = [], isLoading: isPostsLoading } = useQuery<CategoryWithPosts[]>({
    queryKey: ['/api/categories/with-preview-posts'],
    queryFn: async () => {
      const categoriesWithPosts: CategoryWithPosts[] = [];
      
      for (const category of dbCategories) {
        try {
          const response = await fetch(`/api/posts/category/${category.id}`);
          if (response.ok) {
            const posts: DbPost[] = await response.json();
            categoriesWithPosts.push({
              id: category.id,
              name: category.name,
              slug: category.slug,
              description: category.description,
              postCount: category.postCount,
              posts: posts.map(post => ({
                id: post.id,
                title: post.title,
                image: post.image,
                isPremium: post.isPremium
              }))
            });
          }
        } catch (error) {
          console.error(`Erro ao buscar posts da categoria ${category.name}:`, error);
        }
      }
      
      return categoriesWithPosts;
    },
    enabled: dbCategories.length > 0,
  });

  // Filtrar categorias baseado na busca
  const filteredCategories = categoryPosts.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (isCategoriesLoading || isPostsLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="pt-24 pb-8">
          <div className="container mx-auto px-4">
            <div className="text-center mb-8">
              <h1 className="text-4xl md:text-5xl font-bold mb-4 text-black">Categorias</h1>
              <div className="flex justify-center items-center h-32">
                <div className="animate-pulse grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  <div className="h-48 w-64 bg-gray-200 rounded-lg"></div>
                  <div className="h-48 w-64 bg-gray-200 rounded-lg"></div>
                  <div className="h-48 w-64 bg-gray-200 rounded-lg"></div>
                  <div className="h-48 w-64 bg-gray-200 rounded-lg"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="pt-24 pb-8">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-black">Categorias</h1>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Encontre artes organizadas por categoria para facilitar sua navegação e personalização.
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-md mx-auto mb-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Buscar por categoria..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 py-3 border-gray-300 focus:border-orange-500 focus:ring-orange-500 rounded-lg"
              />
            </div>
          </div>

          {/* Results Count */}
          <p className="text-center text-sm text-gray-600 mb-8">
            {filteredCategories.length} {filteredCategories.length === 1 ? 'categoria encontrada' : 'categorias encontradas'}
          </p>
        </div>

        {/* Categories Grid Section */}
        <section className="py-8 bg-white border-b border-gray-100">
          <div className="container mx-auto px-4">
            
            {filteredCategories.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <ImageOff className="h-12 w-12 text-gray-400 mb-2" />
                <p className="text-gray-500">Nenhuma categoria encontrada</p>
              </div>
            ) : (
              /* Grid responsivo de categorias */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredCategories.map((category) => (
                  <div key={category.id} className="w-full">
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
                                  <>
                                    <img 
                                      src={post.image} 
                                      alt={post.title}
                                      className="w-full h-full object-cover group-hover:brightness-105 transition-all duration-300"
                                      loading="lazy"
                                    />

                                  </>
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
                          <span className="text-white text-sm font-medium">{category.postCount} items</span>
                        </div>
                      </div>
                      
                      {/* Nome da categoria */}
                      <div className="mt-3 flex flex-col items-center">
                        <h4 className="font-semibold text-[#1d1d1f] group-hover:text-black transition-colors duration-200">
                          {category.name}
                        </h4>
                        {category.description && (
                          <p className="text-xs text-gray-500 mt-1 text-center line-clamp-1">
                            {category.description}
                          </p>
                        )}
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}