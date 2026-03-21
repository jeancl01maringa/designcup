import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Post } from "@shared/schema";
import { ArtworkCard } from "@/components/home/ArtworkCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Star, ImageIcon, Crown, ChevronLeft, ChevronRight, ArrowLeft, Search, Filter, X } from "lucide-react";

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
  const [searchTerm, setSearchTerm] = useState("");
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Extrair parâmetros da URL (página e filtros de pesquisa)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const page = parseInt(urlParams.get('page') || '1');
    const search = urlParams.get('search') || '';
    const format = urlParams.get('format') || '';

    setCurrentPage(page);

    // Aplicar filtros de pesquisa vindos da home
    if (search) {
      setSearchTerm(search);
    }

    if (format && format !== 'all') {
      // Mapear os formatos da home para os filtros da página
      const formatMap: Record<string, string> = {
        'feed': 'Feed',
        'poster': 'Cartaz',
        'stories': 'Stories',
        'images': 'Imagens'
      };
      setSelectedFormat(formatMap[format] || 'all');
    }

    // Scroll para o topo quando carregar com parâmetros de pesquisa
    if (search || format) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
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

    // Filtro de pesquisa por título
    if (searchTerm.trim()) {
      allPosts = allPosts.filter(post =>
        post.title.toLowerCase().includes(searchTerm.toLowerCase().trim())
      );
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
  }, [posts, selectedCategory, selectedFormat, selectedType, sortOrder, currentPage, columns, searchTerm]);

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
      <div className="min-h-screen bg-muted">
        <div className="container-global py-8">
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
          <div className="flex items-center gap-4 mb-2 md:mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.history.back()}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Button>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground mb-1 md:mb-2">
            {searchTerm ? `Resultados da busca para "${searchTerm}"` : "Todos os Designs"}
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">
            {searchTerm
              ? `Aproximadamente ${filteredPosts.length > 0 ? filteredPosts.length : '0'} resultados, se você não encontrou o que procura, tente outra palavra-chave.`
              : "Explore nossa coleção completa de templates profissionais."
            }
          </p>
        </div>

        {/* Filtros Desktop */}
        <div className="hidden md:block bg-card rounded-lg shadow-sm border p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
                  <SelectValue placeholder="Todas as categorias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  {categories.map((category) => (
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
              <label className="block text-sm font-medium text-muted-foreground mb-2">
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
              <label className="block text-sm font-medium text-muted-foreground mb-2">
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
                    <SelectValue placeholder="Todas as categorias" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as categorias</SelectItem>
                    {categories.map((category) => (
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
                <label className="block text-sm font-medium text-muted-foreground mb-2">
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
                <label className="block text-sm font-medium text-muted-foreground mb-2">
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
            <h3 className="text-lg font-medium text-foreground mb-2">
              Nenhuma arte encontrada
            </h3>
            <p className="text-muted-foreground mb-4">
              Tente ajustar os filtros para ver mais resultados.
            </p>
            <Button
              onClick={() => {
                setSelectedCategory("all");
                setSelectedFormat("all");
                setSelectedType("all");
                setSearchTerm("");
              }}
              variant="outline"
            >
              Limpar filtros
            </Button>
          </div>
        )}

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center space-x-2 mt-16">
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
                  className={currentPage === pageNum ? "bg-[#191c2c] hover:bg-[#14182a] text-white border-[#191c2c]" : ""}
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
              className="bg-[#191c2c] hover:bg-[#14182a] text-white hover:text-white border-[#191c2c] hover:border-[#14182a] disabled:bg-gray-300 disabled:text-muted-foreground disabled:border-border"
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