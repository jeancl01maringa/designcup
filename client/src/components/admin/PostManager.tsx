import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Category, Post } from "@shared/schema";
import { PostStatus, FilterOptions } from "@/lib/admin/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Plus,
  Search,
  Filter,
  Calendar,
  MoreVertical,
  CheckCircle,
  XCircle,
  FileEdit,
  ArrowUpDown,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
// Usando o caminho completo para o componente
import { PostFilters } from "@/components/admin/PostFilters";

export function PostManager() {
  const { toast } = useToast();
  const [filters, setFilters] = useState<FilterOptions>({
    searchTerm: "",
    status: undefined,
    categoryId: undefined,
    page: 1,
    pageSize: 10,
  });
  const [selectedPosts, setSelectedPosts] = useState<number[]>([]);
  
  // Buscar posts com filtros
  const {
    data: posts,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['/api/admin/posts', filters],
    queryFn: () => {
      // Construir query string com filtros
      const params = new URLSearchParams();
      if (filters.searchTerm) params.append('search', filters.searchTerm);
      if (filters.status) params.append('status', filters.status);
      if (filters.categoryId) params.append('categoryId', filters.categoryId.toString());
      if (filters.month) params.append('month', filters.month.toString());
      if (filters.year) params.append('year', filters.year.toString());
      
      return getQueryFn({ on401: "throw" })({
        queryKey: [`/api/admin/posts?${params.toString()}`],
        meta: {}
      });
    },
  });
  
  // Buscar categorias para filtros
  const { data: categories } = useQuery({
    queryKey: ['/api/admin/categories'],
    queryFn: getQueryFn({ on401: "throw" }),
  });
  
  // Função para alternar seleção de um post
  const togglePostSelection = (postId: number) => {
    if (selectedPosts.includes(postId)) {
      setSelectedPosts(selectedPosts.filter(id => id !== postId));
    } else {
      setSelectedPosts([...selectedPosts, postId]);
    }
  };
  
  // Função para alternar seleção de todos os posts
  const toggleSelectAll = () => {
    if (selectedPosts.length === posts.length) {
      setSelectedPosts([]);
    } else {
      setSelectedPosts(posts.map((post: Post) => post.id));
    }
  };
  
  // Atualizar filtros
  const handleFilterChange = (newFilters: Partial<FilterOptions>) => {
    // Reset para página 1 ao alterar filtros
    setFilters({ ...filters, ...newFilters, page: 1 });
  };
  
  // Limpar todos os filtros
  const clearFilters = () => {
    setFilters({
      searchTerm: "",
      status: undefined,
      categoryId: undefined,
      page: 1,
      pageSize: 10,
    });
  };
  
  // Renderizar status com cores diferentes
  const renderStatus = (status: PostStatus) => {
    switch (status) {
      case 'aprovado':
        return <Badge variant="success">Aprovado</Badge>;
      case 'rascunho':
        return <Badge variant="outline">Rascunho</Badge>;
      case 'rejeitado':
        return <Badge variant="destructive">Rejeitado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };
  
  // Encontrar nome da categoria pelo ID
  const getCategoryName = (categoryId: number) => {
    if (!categories) return "-";
    const category = categories.find((cat: Category) => cat.id === categoryId);
    return category ? category.name : "-";
  };

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-destructive">Erro ao carregar posts. Tente novamente mais tarde.</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Gerenciar Posts</h2>
        <Button className="gap-1">
          <Plus className="h-4 w-4" />
          Novo Post
        </Button>
      </div>
      
      {/* Filtros */}
      <PostFilters 
        filters={filters} 
        onFilterChange={handleFilterChange}
        onClearFilters={clearFilters}
        categories={categories || []}
      />
      
      {/* Ações em lote */}
      {selectedPosts.length > 0 && (
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <p className="text-sm font-medium">
                {selectedPosts.length} {selectedPosts.length === 1 ? "post selecionado" : "posts selecionados"}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setSelectedPosts([])}>
                  Cancelar
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm">Ações</Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      <span>Aprovar</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <FileEdit className="mr-2 h-4 w-4" />
                      <span>Marcar como rascunho</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <XCircle className="mr-2 h-4 w-4" />
                      <span>Rejeitar</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive">
                      <span>Excluir</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary/70" />
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox 
                    id="select-all" 
                    checked={posts?.length > 0 && selectedPosts.length === posts.length}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead>Código</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!posts || posts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                    Nenhum post encontrado. {filters.searchTerm && "Tente utilizar outros filtros."}
                  </TableCell>
                </TableRow>
              ) : (
                posts.map((post: Post) => (
                  <TableRow key={post.id}>
                    <TableCell>
                      <Checkbox 
                        id={`select-post-${post.id}`}
                        checked={selectedPosts.includes(post.id)}
                        onCheckedChange={() => togglePostSelection(post.id)}
                      />
                    </TableCell>
                    <TableCell className="font-medium truncate max-w-xs">
                      {post.title}
                    </TableCell>
                    <TableCell>
                      {getCategoryName(post.categoryId)}
                    </TableCell>
                    <TableCell>
                      {renderStatus(post.status as PostStatus)}
                    </TableCell>
                    <TableCell>
                      {formatDate(post.createdAt)}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {post.uniqueCode}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">Abrir menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <span>Editar</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <span>Visualizar</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            <span>Aprovar</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <FileEdit className="mr-2 h-4 w-4" />
                            <span>Rascunho</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <XCircle className="mr-2 h-4 w-4" />
                            <span>Rejeitar</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive">
                            <span>Excluir</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
      
      {/* Paginação será adicionada aqui */}
      <div className="flex justify-between items-center mt-4">
        <div className="text-sm text-muted-foreground">
          {posts?.length > 0 && (
            <span>
              Mostrando {(filters.page - 1) * filters.pageSize + 1} a {Math.min(filters.page * filters.pageSize, posts.length)} de {posts.length} posts
            </span>
          )}
        </div>
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="sm"
            disabled={filters.page <= 1}
            onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!posts || posts.length < filters.pageSize}
            onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
          >
            Próxima
          </Button>
        </div>
      </div>
    </>
  );
}