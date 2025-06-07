import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Folder, TrendingUp, Calendar } from "lucide-react";
import { Link } from "wouter";

interface Category {
  id: number;
  name: string;
  description: string | null;
  slug: string | null;
  is_highlighted: boolean;
  postCount: number;
  latestPost?: string;
  isActive: boolean;
}

export default function Categories() {
  const [searchTerm, setSearchTerm] = useState("");

  // Buscar categorias do banco de dados
  const { data: categories = [], isLoading, error } = useQuery<Category[]>({
    queryKey: ["/api/categories/with-stats"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/categories/with-stats");
        if (!response.ok) throw new Error("Failed to fetch categories");
        const data = await response.json();
        return data || [];
      } catch (err) {
        console.error("Erro ao buscar categorias:", err);
        return [];
      }
    }
  });

  // Filtrar categorias por termo de busca
  const filteredCategories = useMemo(() => {
    if (!searchTerm.trim()) return categories;
    
    return categories.filter(category =>
      category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [categories, searchTerm]);

  // Categorias destacadas (com mais posts)
  const highlightedCategories = useMemo(() => {
    return [...categories]
      .filter(cat => cat.postCount > 0)
      .sort((a, b) => b.postCount - a.postCount)
      .slice(0, 3);
  }, [categories]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Erro ao carregar categorias</h1>
            <p className="text-gray-600">Tente recarregar a página ou entre em contato com o suporte.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-16">
        {/* Cabeçalho da página */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Categorias</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Encontre artes organizadas por categoria para facilitar sua navegação e personalização.
          </p>
        </div>

        {/* Campo de busca */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              type="text"
              placeholder="Buscar por categoria..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 py-3 text-lg border-gray-200 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Categorias em destaque */}
        {!searchTerm && highlightedCategories.length > 0 && (
          <section className="mb-16">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">Categorias Populares</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {highlightedCategories.map((category) => (
                <Link
                  key={category.id}
                  href={`/categorias/${category.slug || category.id}`}
                  className="block"
                >
                  <Card className="hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-blue-100 rounded-xl">
                          <Folder className="h-6 w-6 text-blue-600" />
                        </div>
                        <Badge variant="secondary" className="bg-white/80 text-blue-700">
                          Popular
                        </Badge>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{category.name}</h3>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {category.description || "Explore artes desta categoria"}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">
                          {category.postCount} {category.postCount === 1 ? 'arte' : 'artes'}
                        </span>
                        <span className="text-blue-600 font-medium text-sm">Ver artes →</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Grid principal de categorias */}
        <section>
          <div className="flex items-center gap-2 mb-6">
            <Folder className="h-5 w-5 text-gray-600" />
            <h2 className="text-2xl font-bold text-gray-900">
              {searchTerm ? `Resultados para "${searchTerm}"` : "Todas as Categorias"}
            </h2>
            {!searchTerm && (
              <Badge variant="outline" className="ml-2">
                {categories.length} {categories.length === 1 ? 'categoria' : 'categorias'}
              </Badge>
            )}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, index) => (
                <Card key={index} className="border-0 shadow-sm">
                  <CardContent className="p-6">
                    <Skeleton className="h-12 w-12 rounded-xl mb-4" />
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-full mb-4" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {searchTerm ? "Nenhuma categoria encontrada" : "Nenhuma categoria disponível"}
              </h3>
              <p className="text-gray-600">
                {searchTerm 
                  ? "Tente buscar por outros termos ou verifique a ortografia."
                  : "Não há categorias disponíveis no momento."
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredCategories.map((category) => (
                <Link
                  key={category.id}
                  href={`/categorias/${category.slug || category.id}`}
                  className="block"
                >
                  <Card className="hover:shadow-lg transition-all duration-300 border-0 shadow-sm hover:shadow-xl group">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-gray-100 rounded-xl group-hover:bg-blue-100 transition-colors">
                          <Folder className="h-6 w-6 text-gray-600 group-hover:text-blue-600 transition-colors" />
                        </div>
                        {category.is_highlighted && (
                          <Badge variant="default" className="bg-blue-600">
                            Destaque
                          </Badge>
                        )}
                      </div>
                      
                      <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                        {category.name}
                      </h3>
                      
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {category.description || "Explore artes desta categoria"}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">
                          {category.postCount} {category.postCount === 1 ? 'arte' : 'artes'}
                        </span>
                        <span className="text-blue-600 font-medium text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                          Ver artes →
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
