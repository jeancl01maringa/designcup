import { useState, useEffect, useRef } from "react";
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
  image: string;
  isPremium: boolean;
  createdAt: string;
}

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
  const [searchQuery, setSearchQuery] = useState("");
  const [showFormatDropdown, setShowFormatDropdown] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState("Formatos");
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowFormatDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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
    category.name.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => a.name.localeCompare(b.name));

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Erro ao carregar categorias</h2>
          <p className="text-gray-600">Tente novamente mais tarde</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section - Exactly matching Home Page */}
      <section className="bg-gradient-to-b from-[#FFF4E9] to-[#FFFCF9] py-8 md:py-12">
        <div className="container-global flex flex-col items-center text-center">
          
          {/* Main Heading - Same fonts and styling as home */}
          <h1 className="text-xl md:text-3xl lg:text-4xl font-bold text-[#1D1D1D] leading-tight mb-4 md:mb-6 font-montserrat">
            Categorias
          </h1>
          
          {/* Description - Same styling as home */}
          <p className="text-[#4B4B4B] text-sm md:text-base mb-4 md:mb-6 max-w-2xl font-sans font-light">
            Encontre artes organizadas por categoria para facilitar sua navegação e personalização.
          </p>
          
          <div className="w-full max-w-[700px] mx-auto">
            <div className="flex items-center bg-white border border-gray-200 rounded-[10px] shadow-[0_1px_5px_rgba(0,0,0,0.05)] pl-[15px] pr-[6px] mx-4">
              <input
                type="text"
                placeholder="Busque por artes, categorias, temas..."
                className="flex-1 border-none p-3 text-sm text-[#333] outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              
              <div className="w-px h-6 bg-[#e0e0e0] mx-2.5"></div>
              
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  className="bg-none border-none text-sm text-[#333] cursor-pointer mr-2.5"
                  onClick={() => setShowFormatDropdown(!showFormatDropdown)}
                >
                  {selectedFormat} ▾
                </button>
                
                {showFormatDropdown && (
                  <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-lg z-[9999] shadow-lg">
                    <div className="py-2">
                      {formats.map(format => (
                        <button
                          key={format.id}
                          type="button"
                          className={`w-full text-left px-4 py-3 text-sm transition-colors duration-150 hover:bg-gray-50
                            ${format.name === selectedFormat 
                              ? 'bg-blue-50 text-blue-700 font-medium' 
                              : 'text-gray-700'}`}
                          onClick={() => selectFormat(format.name)}
                        >
                          <span>{format.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <button
                type="button"
                className="bg-[#151922] text-white border-none py-2.5 px-3.5 rounded-lg cursor-pointer"
              >
                <Search className="h-4 w-4" />
              </button>
            </div>
          </div>
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
                      
                      {/* Overlay com informações da categoria */}
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-center text-white p-4">
                          <h3 className="font-semibold text-lg mb-1">{category.name}</h3>
                          <p className="text-sm opacity-90">{category.postCount} {category.postCount === 1 ? 'arte' : 'artes'}</p>
                        </div>
                      </div>
                    </div>
                  </Link>

                  {/* Informações abaixo da imagem */}
                  <div className="mt-4 text-center">
                    <h3 className="font-semibold text-gray-900 mb-1">{category.name}</h3>
                    <p className="text-sm text-gray-600">{category.postCount} {category.postCount === 1 ? 'arte' : 'artes'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}