import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Post } from "@shared/schema";
import { ArtworkCard } from "@/components/home/ArtworkCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Star, ImageIcon, Crown, ChevronLeft, ChevronRight, Search, Filter, X } from "lucide-react";
import { Input } from "@/components/ui/input";

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

// Distribuir posts em colunas para layout masonry
function distributePostsInColumns(posts: Post[], columns: number): Post[][] {
  const columnArrays: Post[][] = Array.from({ length: columns }, () => []);
  
  posts.forEach((post, index) => {
    const columnIndex = index % columns;
    columnArrays[columnIndex].push(post);
  });
  
  return columnArrays;
}

export default function TodasArtes() {
  const [location, setLocation] = useLocation();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedFormat, setSelectedFormat] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [sortOrder, setSortOrder] = useState("recent");
  const [searchTerm, setSearchTerm] = useState("");
  const [showMobileFilters, setShowMobileFilters] = useState(false);

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
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos (gcTime substitui cacheTime no React Query v5)
    refetchOnWindowFocus: false,
  });

  const {
    data: categories = [],
    isLoading: loadingCategories,
  } = useQuery<any[]>({
    queryKey: ["/api/categories/with-posts"],
    staleTime: 10 * 60 * 1000, // 10 minutos - categorias mudam menos
    gcTime: 20 * 60 * 1000, // 20 minutos
    refetchOnWindowFocus: false,
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

    // Filtro de pesquisa por título
    if (searchTerm.trim()) {
      allPosts = allPosts.filter(post => 
        post.title.toLowerCase().includes(searchTerm.toLowerCase().trim())
      );
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
  }, [posts, selectedCategory, selectedFormat, selectedType, sortOrder, currentPage, columns, searchTerm]);

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
      <div className="min-h-screen bg-muted">
        <div className="container-global py-8">
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
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Erro ao carregar as artes
          </h3>
          <p className="text-muted-foreground">
            Tente recarregar a página.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted">
      <div className="container-global py-8">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-xl md:text-3xl font-bold text-foreground mb-1 md:mb-2">
            Todos os Designs
          </h1>
          <p className="text-muted-foreground text-sm md:text-lg">
            Explore nossa coleção completa de templates profissionais para impulsionar seu negócio.
          </p>
        </div>

        {/* Filtros Desktop */}
        <div className="hidden md:block bg-card rounded-lg shadow-sm border p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Campo de Pesquisa */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Pesquisar por título
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Ex: Teste 17, Botox..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filtro de Categoria */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
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
              <label className="block text-sm font-medium text-muted-foreground mb-2">
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
              <label className="block text-sm font-medium text-muted-foreground mb-2">
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
              <label className="block text-sm font-medium text-muted-foreground mb-2">
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

        {/* Filtros Mobile */}
        <div className="md:hidden bg-card rounded-lg shadow-sm border p-4 mb-8">
          {/* Pesquisa e Botão Filtros */}
          <div className="flex gap-3 mb-4">
            {/* Campo de Pesquisa */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Pesquisar por título
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Ex: Teste 17, Botox..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            {/* Botão Filtros */}
            <div className="flex flex-col justify-end">
              <Button
                variant="outline"
                size="default"
                onClick={() => setShowMobileFilters(!showMobileFilters)}
                className="h-10 px-4 flex items-center gap-2 bg-[#191c2c] hover:bg-[#14182a] text-white border-[#191c2c]"
              >
                <Filter className="h-4 w-4" />
                <span className="text-sm font-medium">Filtros</span>
              </Button>
            </div>
          </div>

          {/* Filtros Expandidos */}
          {showMobileFilters && (
            <div className="border-t pt-4 space-y-4">
              {/* Filtro de Categoria */}
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
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
                <label className="block text-sm font-medium text-muted-foreground mb-2">
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
                <label className="block text-sm font-medium text-muted-foreground mb-2">
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
                <label className="block text-sm font-medium text-muted-foreground mb-2">
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

              {/* Botão Fechar Filtros */}
              <div className="pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowMobileFilters(false)}
                  className="w-full flex items-center justify-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Fechar Filtros
                </Button>
              </div>
            </div>
          )}
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
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Nenhum resultado encontrado
            </h3>
            <p className="text-muted-foreground">
              Tente ajustar os filtros para encontrar mais designs.
            </p>
          </div>
        )}

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center space-x-4 mt-16">
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
              <span className="text-sm text-muted-foreground">
                Página {currentPage} de {totalPages}
              </span>
            </div>

            <Button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="flex items-center bg-[#191c2c] hover:bg-[#14182a] text-white"
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