import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, ImageOff, ChevronDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";

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

interface DbPost {
  id: number;
  title: string;
  imageUrl: string;
  isPremium: boolean;
}

interface CategoryWithPosts extends DbCategory {
  posts?: {
    id: number;
    title: string;
    imageUrl: string;
    isPremium: boolean;
  }[];
}

export default function Categories() {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [showFormatDropdown, setShowFormatDropdown] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState("Formatos");

  const formats = [
    { id: "all", name: "Formatos" },
    { id: "feed", name: "Feed" },
    { id: "square", name: "Cartaz" },
    { id: "stories", name: "Stories" },
    { id: "portrait", name: "Imagens" }
  ];

  const selectFormat = (format: string) => {
    setSelectedFormat(format);
    setShowFormatDropdown(false);
  };

  // Buscar categorias com estatísticas
  const { data: categories = [], isLoading, error } = useQuery<CategoryWithPosts[]>({
    queryKey: ['/api/categories/with-stats'],
    queryFn: async () => {
      const response = await fetch('/api/categories/with-stats');
      if (!response.ok) throw new Error('Error fetching categories');
      return response.json();
    },
  });

  // Filtrar categorias baseado na busca
  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => {
    if (sortBy === "name") return a.name.localeCompare(b.name);
    if (sortBy === "posts") return b.postCount - a.postCount;
    return 0;
  });

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-500">Erro ao carregar categorias: {error instanceof Error ? error.message : 'Erro desconhecido'}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <section className="pt-8 pb-6 bg-white border-b border-gray-100">
        <div className="container-global">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2 font-serif">
            Categorias
          </h1>
          <p className="text-[#4B4B4B] text-sm md:text-base mb-4 md:mb-6 max-w-2xl font-sans font-light">
            Encontre artes organizadas por categoria para facilitar sua navegação e personalização.
          </p>
          
          {/* Search Bar - Cópia exata da home */}
          <div className="max-w-xl mx-auto">
            <form className="flex flex-col">
              <div className="flex shadow-none">
                <div className="relative flex-grow">
                  <Input
                    type="text"
                    className="w-full px-4 py-3 h-[48px] text-base border border-gray-300 rounded-l-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Buscar artes por palavra-chave..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <div className="relative">
                  <button
                    type="button"
                    className="flex justify-between items-center text-sm px-5 py-3 h-[48px] border border-l-0 border-gray-300 bg-white hover:bg-gray-50 min-w-[120px]"
                    onClick={() => setShowFormatDropdown(!showFormatDropdown)}
                  >
                    <span className="text-gray-700 font-medium">{selectedFormat}</span>
                    <ChevronDown className="ml-3 h-4 w-4 text-gray-500" />
                  </button>
                  
                  {showFormatDropdown && (
                    <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-lg z-20">
                      <div className="py-2">
                        {formats.map(format => (
                          <button
                            key={format.id}
                            type="button"
                            className={`w-full text-left px-4 py-3 text-sm transition-colors duration-150 flex items-center gap-3
                              ${format.name === selectedFormat 
                                ? 'bg-blue-50 text-blue-700 font-medium border-l-2 border-blue-500' 
                                : 'text-gray-700 hover:bg-gray-50'}`}
                            onClick={() => selectFormat(format.name)}
                          >
                            <div className="w-5 h-5 flex items-center justify-center">
                              {format.id === 'feed' && (
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clipRule="evenodd" />
                                </svg>
                              )}
                              {format.id === 'square' && (
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                                </svg>
                              )}
                              {format.id === 'stories' && (
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                                </svg>
                              )}
                              {format.id === 'portrait' && (
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                                </svg>
                              )}
                              {format.id === 'all' && (
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>
                            <span>{format.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <Button 
                  type="submit" 
                  className="bg-black hover:bg-black/80 text-white h-[48px] rounded-r-md transition duration-300 flex-shrink-0"
                >
                  <Search className="h-5 w-5" />
                </Button>
              </div>
            </form>
            
            <div className="flex items-center mt-4">
              <div className="flex items-center text-black text-sm">
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                <span>Busque por artes por palavra-chave</span>
              </div>
            </div>
          </div>

          {/* Results count */}
          <p className="text-sm text-[#4B4B4B] mt-4 font-light">
            {filteredCategories.length} {filteredCategories.length === 1 ? 'categoria encontrada' : 'categorias encontradas'}
          </p>
        </div>
      </section>

      {/* Categories Grid Section */}
      <section className="py-8 bg-white border-b border-gray-100">
        <div className="container-global">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <ImageOff className="h-12 w-12 text-gray-400 mb-2" />
              <p className="text-gray-500 text-lg">Nenhuma categoria encontrada</p>
              <p className="text-gray-400 text-sm">Tente ajustar sua busca</p>
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
                          const post = category.posts && category.posts[index];
                          return (
                            <div key={index} className="relative overflow-hidden">
                              {post ? (
                                <img
                                  src={post.imageUrl}
                                  alt={`Exemplo ${index + 1} da categoria ${category.name}`}
                                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                  loading="lazy"
                                />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                                  <ImageOff className="h-6 w-6 text-gray-400" />
                                </div>
                              )}
                              {/* Overlay premium para posts premium */}
                              {post?.isPremium && (
                                <div className="absolute top-1 right-1">
                                  <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white text-[8px] px-1 py-0.5 rounded flex items-center gap-0.5">
                                    <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 20 20">
                                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                    PRO
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      
                      {/* Overlay de informações da categoria */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex flex-col justify-end p-4">
                        <h3 className="text-white font-bold text-lg mb-1 group-hover:text-yellow-300 transition-colors">
                          {category.name}
                        </h3>
                        <p className="text-white/80 text-sm">
                          {category.postCount} {category.postCount === 1 ? 'arte' : 'artes'}
                        </p>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}