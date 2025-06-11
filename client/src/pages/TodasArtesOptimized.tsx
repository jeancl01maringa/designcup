import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Post } from "@shared/schema";
import { ArtworkCard } from "@/components/home/ArtworkCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Star, ImageIcon, Crown, ChevronLeft, ChevronRight } from "lucide-react";

const ITEMS_PER_PAGE = 30;

// Hook otimizado para colunas responsivas
function useResponsiveColumns() {
  const [columns, setColumns] = useState(() => {
    if (typeof window !== 'undefined') {
      const width = window.innerWidth;
      if (width < 640) return 2;
      else if (width < 768) return 2;
      else if (width < 1024) return 3;
      else if (width < 1280) return 4;
      else return 5;
    }
    return 4;
  });

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const updateColumns = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const width = window.innerWidth;
        let newColumns = 4;
        if (width < 640) newColumns = 2;
        else if (width < 768) newColumns = 2;
        else if (width < 1024) newColumns = 3;
        else if (width < 1280) newColumns = 4;
        else newColumns = 5;
        
        setColumns(prev => prev !== newColumns ? newColumns : prev);
      }, 150);
    };

    window.addEventListener('resize', updateColumns);
    return () => {
      window.removeEventListener('resize', updateColumns);
      clearTimeout(timeoutId);
    };
  }, []);

  return columns;
}

// Distribuir posts em colunas
function distributePostsInColumns(posts: Post[], columns: number): Post[][] {
  const columnArrays: Post[][] = Array.from({ length: columns }, () => []);
  
  posts.forEach((post, index) => {
    const columnIndex = index % columns;
    columnArrays[columnIndex].push(post);
  });
  
  return columnArrays;
}

export default function TodasArtesOptimized() {
  const [location, setLocation] = useLocation();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedFormat, setSelectedFormat] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [sortOrder, setSortOrder] = useState("recent");

  // Extrair página da URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const page = parseInt(urlParams.get('page') || '1');
    setCurrentPage(page);
  }, [location]);

  const {
    data: posts = [],
    isLoading,
    error,
  } = useQuery<Post[]>({
    queryKey: ["/api/posts/visible"],
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const {
    data: categories = [],
    isLoading: loadingCategories,
  } = useQuery<any[]>({
    queryKey: ["/api/categories/with-posts"],
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const columns = useResponsiveColumns();

  // Extrair formatos únicos dos posts existentes
  const availableFormats = useMemo(() => {
    const formats: string[] = [];
    posts.forEach(post => {
      if (post.formato && !formats.includes(post.formato)) {
        formats.push(post.formato);
      }
    });
    return formats.sort();
  }, [posts]);

  // Filtrar e paginar posts com otimização
  const { filteredPosts, totalPages, paginatedPosts, columnArrays } = useMemo(() => {
    let allPosts = [...posts];

    // Aplicar filtros
    if (selectedCategory !== "all") {
      allPosts = allPosts.filter(post => post.categoryId?.toString() === selectedCategory);
    }

    if (selectedFormat !== "all") {
      allPosts = allPosts.filter(post => post.formato === selectedFormat);
    }

    if (selectedType !== "all") {
      if (selectedType === "premium") {
        allPosts = allPosts.filter(post => post.isPro === true || post.licenseType === 'premium');
      } else if (selectedType === "free") {
        allPosts = allPosts.filter(post => post.isPro !== true && post.licenseType !== 'premium');
      }
    }

    // Aplicar ordenação
    if (sortOrder === "recent") {
      allPosts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortOrder === "oldest") {
      allPosts.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }

    // Calcular paginação
    const totalItems = allPosts.length;
    const totalPagesCalc = Math.ceil(totalItems / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedItems = allPosts.slice(startIndex, endIndex);

    // Distribuir em colunas
    const columnArraysResult = distributePostsInColumns(paginatedItems, columns);

    return {
      filteredPosts: allPosts,
      totalPages: totalPagesCalc,
      paginatedPosts: paginatedItems,
      columnArrays: columnArraysResult
    };
  }, [posts, selectedCategory, selectedFormat, selectedType, sortOrder, currentPage, columns]);

  // Handlers otimizados
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    const newUrl = page === 1 ? '/todas-artes' : `/todas-artes?page=${page}`;
    setLocation(newUrl);
    window.scrollTo(0, 0);
  }, [setLocation]);

  // Resetar página quando filtros mudam
  useEffect(() => {
    setCurrentPage(1);
    setLocation('/todas-artes');
  }, [selectedCategory, selectedFormat, selectedType, sortOrder, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {Array.from({ length: 30 }).map((_, i) => (
              <Skeleton key={i} className="h-48 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Erro ao carregar as artes
          </h3>
          <p className="text-gray-600">
            Tente recarregar a página.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Todos os Designs
          </h1>
          <p className="text-gray-600 text-lg">
            Explore nossa coleção completa de templates profissionais para impulsionar seu negócio.
          </p>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Filtro de Categoria */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoria
              </label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as categorias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name} ({category.post_count || 0})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro de Formato */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Formato
              </label>
              <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os formatos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os formatos</SelectItem>
                  {availableFormats.map((format) => (
                    <SelectItem key={format} value={format}>
                      {format}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro de Tipo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo
              </label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="free">
                    <div className="flex items-center">
                      <Star className="h-4 w-4 mr-2 text-gray-400" />
                      Gratuito
                    </div>
                  </SelectItem>
                  <SelectItem value="premium">
                    <div className="flex items-center">
                      <Crown className="h-4 w-4 mr-2 text-yellow-500" />
                      Premium
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Ordenação */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ordenar por
              </label>
              <Select value={sortOrder} onValueChange={setSortOrder}>
                <SelectTrigger>
                  <SelectValue placeholder="Ordenação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Mais recentes</SelectItem>
                  <SelectItem value="oldest">Mais antigos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Informações dos resultados */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Badge variant="outline" className="px-3 py-1">
              {filteredPosts.length} resultados
            </Badge>
            {selectedCategory !== "all" && (
              <Badge variant="secondary">
                Categoria: {categories.find(c => c.id.toString() === selectedCategory)?.name}
              </Badge>
            )}
            {selectedFormat !== "all" && (
              <Badge variant="secondary">Formato: {selectedFormat}</Badge>
            )}
            {selectedType !== "all" && (
              <Badge variant="secondary">
                Tipo: {selectedType === "premium" ? "Premium" : "Gratuito"}
              </Badge>
            )}
          </div>
        </div>

        {/* Grid de Posts */}
        {paginatedPosts.length > 0 ? (
          <div className="flex gap-4">
            {columnArrays.map((columnPosts, columnIndex) => (
              <div key={columnIndex} className="flex-1 space-y-4">
                {columnPosts.map((post) => (
                  <ArtworkCard
                    key={`${post.id}-${post.formato}`}
                    artwork={{
                      id: post.id,
                      title: post.title,
                      description: post.description,
                      imageUrl: post.imageUrl,
                      createdAt: post.createdAt,
                      isPro: post.isPro,
                      format: post.formato || 'Feed',
                      category: post.categoryId ? `Categoria ${post.categoryId}` : null
                    }}
                  />
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhuma arte encontrada
            </h3>
            <p className="text-gray-600 mb-4">
              Tente ajustar os filtros para ver mais resultados.
            </p>
            <Button 
              onClick={() => {
                setSelectedCategory("all");
                setSelectedFormat("all");
                setSelectedType("all");
              }}
              variant="outline"
            >
              Limpar filtros
            </Button>
          </div>
        )}

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center space-x-2 mt-8">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>

            {/* Números das páginas */}
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }

              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(pageNum)}
                >
                  {pageNum}
                </Button>
              );
            })}

            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600 hover:border-blue-700 disabled:bg-gray-300 disabled:text-gray-500 disabled:border-gray-300"
            >
              Próxima
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}