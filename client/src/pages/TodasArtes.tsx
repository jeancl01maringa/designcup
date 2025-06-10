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

const ITEMS_PER_PAGE = 30; // Aumentado para reduzir paginação

// Hook otimizado para calcular o número de colunas com debounce
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
      }, 150); // Debounce de 150ms
    };

    window.addEventListener('resize', updateColumns);
    return () => {
      window.removeEventListener('resize', updateColumns);
      clearTimeout(timeoutId);
    };
  }, []);

  return columns;
}

// Versão memoizada da distribuição de posts em colunas
const distributePostsInColumns = React.memo((posts: Post[], columns: number) => {
  const columnArrays: Post[][] = Array.from({ length: columns }, () => []);
  
  posts.forEach((post, index) => {
    const columnIndex = index % columns;
    columnArrays[columnIndex].push(post);
  });
  
  return columnArrays;
});

export default function TodasArtes() {
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
    data: posts,
    isLoading,
    error,
  } = useQuery<Post[]>({
    queryKey: ["/api/posts/visible"],
  });

  const {
    data: categories,
    isLoading: loadingCategories,
  } = useQuery<any[]>({
    queryKey: ["/api/categories/with-posts"],
  });

  const columns = useResponsiveColumns();

  // Extrair formatos únicos dos posts existentes
  const availableFormats = useMemo(() => {
    if (!posts) return [];
    const formats: string[] = [];
    posts.forEach(post => {
      if (post.formato && !formats.includes(post.formato)) {
        formats.push(post.formato);
      }
    });
    return formats.sort();
  }, [posts]);

  // Filtrar e paginar posts
  const { filteredPosts, totalPages, paginatedPosts, columnArrays } = useMemo(() => {
    let allPosts = posts || [];

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
      allPosts = [...allPosts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortOrder === "oldest") {
      allPosts = [...allPosts].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }

    // Calcular paginação
    const totalItems = allPosts.length;
    const totalPagesCalc = Math.ceil(totalItems / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedItems = allPosts.slice(startIndex, endIndex);

    // Distribuir em colunas para masonry
    const columnArraysResult = distributePostsInColumns(paginatedItems, columns);

    return {
      filteredPosts: allPosts,
      totalPages: totalPagesCalc,
      paginatedPosts: paginatedItems,
      columnArrays: columnArraysResult
    };
  }, [posts, selectedCategory, selectedFormat, selectedType, sortOrder, currentPage, columns]);

  // Atualizar URL quando a página muda
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    const newUrl = page === 1 ? '/todas-artes' : `/todas-artes?page=${page}`;
    setLocation(newUrl);
    window.scrollTo(0, 0);
  };

  // Resetar página quando filtros mudam
  useEffect(() => {
    setCurrentPage(1);
    setLocation('/todas-artes');
  }, [selectedCategory, selectedFormat, selectedType, sortOrder]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {Array.from({ length: 20 }).map((_, i) => (
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
                  <SelectValue placeholder="Todas categorias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas categorias</SelectItem>
                  {categories && Array.isArray(categories) && categories.map((category: any) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
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
                  <SelectValue placeholder="Todos formatos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos formatos</SelectItem>
                  {availableFormats.map((format: string) => (
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
                  <SelectValue placeholder="Todos tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos tipos</SelectItem>
                  <SelectItem value="free">Gratuitos</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
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
                  <SelectValue placeholder="Recentes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Mais recentes</SelectItem>
                  <SelectItem value="oldest">Mais antigos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="flex flex-wrap gap-3 mb-6">
          <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
            <Star className="h-3 w-3 mr-1" />
            {filteredPosts.length} designs encontrados
          </Badge>
          <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-200">
            <Crown className="h-3 w-3 mr-1" />
            {filteredPosts.filter(p => p.isPro === true || p.licenseType === 'premium').length} premium
          </Badge>
          <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
            <ImageIcon className="h-3 w-3 mr-1" />
            {filteredPosts.filter(p => p.isPro !== true && p.licenseType !== 'premium').length} gratuitos
          </Badge>
        </div>

        {/* Grid masonry Pinterest-style */}
        {paginatedPosts.length > 0 ? (
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {columnArrays.map((columnPosts, columnIndex) => (
              <div key={columnIndex} className="space-y-4">
                {columnPosts.map((post) => (
                  <ArtworkCard
                    key={post.id}
                    artwork={{
                      id: post.id,
                      title: post.title,
                      description: post.description || "",
                      imageUrl: post.imageUrl || "/placeholder.jpg",
                      category: post.categoryId?.toString() || "outros",
                      createdAt: new Date(post.createdAt),
                      isPro: post.isPro === true || post.licenseType === 'premium',
                      format: post.formato || "1:1"
                    }}
                  />
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <ImageIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Nenhum resultado encontrado
            </h3>
            <p className="text-gray-600">
              Tente ajustar os filtros para encontrar mais designs.
            </p>
          </div>
        )}

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center space-x-4 mt-12">
            <Button
              variant="outline"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="flex items-center"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Página anterior
            </Button>

            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                Página {currentPage} de {totalPages}
              </span>
            </div>

            <Button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="flex items-center bg-blue-600 hover:bg-blue-700 text-white"
            >
              Próxima página
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}