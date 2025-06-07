import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import Header from "@/components/layout/Header";

interface Category {
  id: number;
  name: string;
  description: string;
  slug: string;
  is_highlighted: boolean;
  isActive: boolean;
  postCount: number;
  latestPost: any;
  createdAt: string;
}

export default function Categories() {
  const [searchTerm, setSearchTerm] = useState("");
  
  const { data: categories = [], isLoading, error } = useQuery<Category[]>({
    queryKey: ['/api/categories/with-stats'],
  });

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  console.log("Categorias carregadas:", categories);
  console.log("Erro ao buscar categorias:", error);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#faf8f5]">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d2691e] mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando categorias...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      <Header />
      
      {/* Header Section - Matching home page styling */}
      <section className="pt-8 pb-6">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h1 
              className="text-4xl md:text-5xl font-bold mb-4 font-['Inter']" 
              style={{ color: '#1c1c1c' }}
            >
              Categorias
            </h1>
            <p 
              className="text-lg md:text-xl max-w-3xl mx-auto leading-relaxed font-['Inter']"
              style={{ color: '#666' }}
            >
              Encontre artes organizadas por categoria para facilitar sua navegação e personalização.
            </p>
          </div>
        </div>
      </section>

      {/* Search Section - Copying exact styling from home */}
      <section className="pb-6">
        <div className="container mx-auto px-4">
          <div className="max-w-xl mx-auto">
            <div className="flex">
              <div className="relative flex-grow">
                <Input
                  type="text"
                  className="w-full px-4 py-3 h-[48px] text-base border border-gray-300 rounded-l-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Buscar por categoria..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="relative">
                <button
                  type="button"
                  className="flex justify-center items-center text-sm px-6 py-3 h-[48px] border border-l-0 border-gray-300 bg-white hover:bg-gray-50 rounded-r-md"
                >
                  <Search className="h-4 w-4 text-black" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="container mx-auto px-4 pb-8">
        {/* Categories Count */}
        <div className="text-center mb-6">
          <p className="text-[#666] font-['Inter']">
            {filteredCategories.length} {filteredCategories.length === 1 ? 'categoria encontrada' : 'categorias encontradas'}
          </p>
        </div>

        {/* Categories Grid - Matching home card styling */}
        {filteredCategories.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCategories.map((category) => (
              <div 
                key={category.id}
                className="bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-all duration-200 p-6 cursor-pointer hover:shadow-md group"
              >
                <h3 
                  className="text-xl font-semibold mb-2 font-['Inter'] group-hover:text-[#d2691e] transition-colors"
                  style={{ color: '#1c1c1c' }}
                >
                  {category.name}
                </h3>
                <p 
                  className="text-sm mb-4 font-['Inter'] line-clamp-2"
                  style={{ color: '#666' }}
                >
                  {category.description || "Categoria de artes para estética"}
                </p>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[#d2691e] font-medium font-['Inter']">
                    {category.postCount} {category.postCount === 1 ? 'arte' : 'artes'}
                  </span>
                  <span className="text-[#666] group-hover:text-[#d2691e] transition-colors font-['Inter']">
                    Ver artes →
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Search className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-[#1c1c1c] mb-2 font-['Inter']">
              Nenhuma categoria encontrada
            </h3>
            <p className="text-[#666] font-['Inter']">
              Tente usar termos diferentes na sua busca.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}