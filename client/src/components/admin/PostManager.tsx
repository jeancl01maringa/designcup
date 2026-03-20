import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Category, Post } from "@shared/schema";
import { PostForm } from "./PostForm";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ImageWithFallback } from "@/components/ui/image-with-fallback";
import MediaDisplay from "@/components/MediaDisplay";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ChevronDown,
  ChevronUp,
  Edit,
  Filter,
  Eye,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
  X,
  Loader2,
  ImageIcon
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ImageRestoreManager } from "./ImageRestoreManager";

export function PostManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Estado para modais
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isBatchDeleteModalOpen, setIsBatchDeleteModalOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isImageRestoreOpen, setIsImageRestoreOpen] = useState(false);
  
  // Estado para filtros
  const [filters, setFilters] = useState({
    searchTerm: "",
    categoryId: undefined as number | undefined,
    status: undefined as string | undefined,
    month: undefined as number | undefined,
    year: new Date().getFullYear(),
  });
  
  // Estado para seleção em massa
  const [selectedPosts, setSelectedPosts] = useState<number[]>([]);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  
  // Query para buscar posts com filtros
  const {
    data: posts = [],
    isLoading: isLoadingPosts,
    refetch: refetchPosts,
  } = useQuery<Post[]>({
    queryKey: ['/api/admin/posts', filters],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      
      if (filters.searchTerm) {
        queryParams.append('searchTerm', filters.searchTerm);
      }
      
      if (filters.categoryId) {
        queryParams.append('categoryId', filters.categoryId.toString());
      }
      
      if (filters.status) {
        queryParams.append('status', filters.status);
      }
      
      if (filters.month && filters.year) {
        queryParams.append('month', filters.month.toString());
        queryParams.append('year', filters.year.toString());
      }
      
      const endpoint = `/api/admin/posts${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await apiRequest('GET', endpoint);
      return await response.json();
    },
    staleTime: 3 * 1000, // 3 segundos em cache 
    gcTime: 15 * 1000, // 15 segundos no cache
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchInterval: 5 * 1000 // Atualiza a cada 5 segundos automaticamente
  });
  
  // Query para buscar categorias (necessárias para o formulário e filtros)
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['/api/admin/categories'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/categories');
      return await response.json();
    }
  });
  
  // Mutation para criar post
  const createPostMutation = useMutation({
    mutationFn: async (postData: any) => {
      const response = await apiRequest('POST', '/api/admin/posts', postData);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Post criado com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/posts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Falha ao criar o post.",
        variant: "destructive",
      });
    }
  });
  
  // Mutation para atualizar post
  const updatePostMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: any }) => {
      const response = await apiRequest('PUT', `/api/admin/posts/${id}`, data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Post atualizado com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/posts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Falha ao atualizar o post.",
        variant: "destructive",
      });
    }
  });
  
  // Mutation para excluir post
  const deletePostMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/admin/posts/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Post excluído com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/posts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      setSelectedPosts([]);
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Falha ao excluir o post.",
        variant: "destructive",
      });
    }
  });
  
  // Mutation para atualizar status em massa
  const updateStatusMutation = useMutation({
    mutationFn: async ({ ids, status }: { ids: number[], status: string }) => {
      await apiRequest('PUT', '/api/admin/posts/status/batch', { ids, status });
    },
    onSuccess: (_, variables) => {
      toast({
        title: "Sucesso",
        description: `Status atualizado para ${variables.status} em ${variables.ids.length} posts.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/posts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      setSelectedPosts([]);
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Falha ao atualizar o status dos posts.",
        variant: "destructive",
      });
    }
  });
  
  // Mutation para excluir posts em lote
  const batchDeleteMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      await apiRequest('DELETE', '/api/admin/posts/batch', { ids });
    },
    onSuccess: (_, ids) => {
      toast({
        title: "Sucesso",
        description: `${ids.length} post${ids.length > 1 ? 's' : ''} excluído${ids.length > 1 ? 's' : ''} com sucesso.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/posts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      setSelectedPosts([]);
      setIsBatchDeleteModalOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Falha ao excluir os posts.",
        variant: "destructive",
      });
    }
  });
  
  // Handler para criar/editar post
  const handleSubmit = async (data: any) => {
    if (selectedPost) {
      await updatePostMutation.mutateAsync({
        id: selectedPost.id,
        data
      });
    } else {
      await createPostMutation.mutateAsync(data);
    }
  };
  
  // Handler para excluir post individual
  const confirmDelete = () => {
    if (selectedPost) {
      deletePostMutation.mutate(selectedPost.id);
      setIsDeleteModalOpen(false);
      setSelectedPost(null);
    }
  };

  // Handler para excluir posts em lote
  const confirmBatchDelete = () => {
    if (selectedPosts.length > 0) {
      batchDeleteMutation.mutate(selectedPosts);
    }
  };
  
  // Handler para seleção/desseleção de todos os posts
  const toggleSelectAll = () => {
    if (selectedPosts.length === posts.length) {
      setSelectedPosts([]);
    } else {
      setSelectedPosts(posts.map(post => post.id));
    }
  };
  
  // Handler para aplicar filtros
  const applyFilters = () => {
    refetchPosts();
  };
  
  // Handler para limpar filtros
  const clearFilters = () => {
    setFilters({
      searchTerm: "",
      categoryId: undefined,
      status: undefined,
      month: undefined,
      year: new Date().getFullYear(),
    });
    refetchPosts();
  };
  
  // Função auxiliar para renderizar o status com badge colorida
  const renderStatus = (status: string) => {
    switch (status) {
      case 'aprovado':
        return <Badge variant="success">Aprovado</Badge>;
      case 'rascunho':
        return <Badge variant="outline">Rascunho</Badge>;
      case 'rejeitado':
        return <Badge variant="destructive">Rejeitado</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };
  
  // Função para obter o nome da categoria pelo ID
  const getCategoryName = (categoryId: number | null) => {
    if (!categoryId) return "Sem categoria";
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : "Desconhecida";
  };
  
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle>Gerenciador de Posts</CardTitle>
            <CardDescription>
              Crie, edite e gerencie os posts do blog
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              variant={isFilterOpen ? "default" : "outline"}
              size="sm"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtros
              {isFilterOpen ? <ChevronUp className="h-4 w-4 ml-2" /> : <ChevronDown className="h-4 w-4 ml-2" />}
            </Button>
            <Button onClick={() => setIsImageRestoreOpen(true)} variant="outline" size="sm">
              <ImageIcon className="h-4 w-4 mr-2" />
              Gerenciar Imagens
            </Button>
            <Button onClick={() => {
              setSelectedPost(null);
              setIsCreateModalOpen(true);
            }} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Novo Post
            </Button>
          </div>
        </div>
      </CardHeader>
      
      {/* Seção de Filtros */}
      {isFilterOpen && (
        <div className="px-6 pb-4">
          <Card className="p-4 border border-border">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Pesquisa */}
              <div>
                <Label htmlFor="search">Buscar</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Título, descrição..."
                    className="pl-8"
                    value={filters.searchTerm}
                    onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
                  />
                </div>
              </div>
              
              {/* Categoria */}
              <div>
                <Label htmlFor="category">Categoria</Label>
                <Select
                  value={filters.categoryId?.toString() || ""}
                  onValueChange={(value) => setFilters({ 
                    ...filters, 
                    categoryId: value ? parseInt(value) : undefined 
                  })}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Todas as categorias" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas as categorias</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Status */}
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={filters.status || ""}
                  onValueChange={(value) => setFilters({ 
                    ...filters, 
                    status: value || undefined 
                  })}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Todos os status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos os status</SelectItem>
                    <SelectItem value="aprovado">Aprovado</SelectItem>
                    <SelectItem value="rascunho">Rascunho</SelectItem>
                    <SelectItem value="rejeitado">Rejeitado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Mês/Ano */}
              <div>
                <Label htmlFor="month">Mês/Ano</Label>
                <div className="flex gap-2">
                  <Select
                    value={filters.month?.toString() || ""}
                    onValueChange={(value) => setFilters({
                      ...filters,
                      month: value ? parseInt(value) : undefined
                    })}
                  >
                    <SelectTrigger id="month" className="w-full">
                      <SelectValue placeholder="Mês" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos</SelectItem>
                      <SelectItem value="1">Janeiro</SelectItem>
                      <SelectItem value="2">Fevereiro</SelectItem>
                      <SelectItem value="3">Março</SelectItem>
                      <SelectItem value="4">Abril</SelectItem>
                      <SelectItem value="5">Maio</SelectItem>
                      <SelectItem value="6">Junho</SelectItem>
                      <SelectItem value="7">Julho</SelectItem>
                      <SelectItem value="8">Agosto</SelectItem>
                      <SelectItem value="9">Setembro</SelectItem>
                      <SelectItem value="10">Outubro</SelectItem>
                      <SelectItem value="11">Novembro</SelectItem>
                      <SelectItem value="12">Dezembro</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select
                    value={filters.year?.toString()}
                    onValueChange={(value) => setFilters({
                      ...filters,
                      year: parseInt(value)
                    })}
                  >
                    <SelectTrigger id="year" className="w-24">
                      <SelectValue placeholder="Ano" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({length: 3}, (_, i) => new Date().getFullYear() - i).map(year => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-2" />
                Limpar
              </Button>
              <Button size="sm" onClick={applyFilters}>
                Aplicar Filtros
              </Button>
            </div>
          </Card>
        </div>
      )}
      
      {/* Barra de ações em massa */}
      {selectedPosts.length > 0 && (
        <div className="px-6 pb-4">
          <div className="p-3 bg-muted rounded-md flex items-center justify-between">
            <span className="text-sm font-medium">
              {selectedPosts.length} post{selectedPosts.length > 1 ? 's' : ''} selecionado{selectedPosts.length > 1 ? 's' : ''}
            </span>
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    Alterar status
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem 
                    onClick={() => updateStatusMutation.mutate({ ids: selectedPosts, status: 'aprovado' })}
                  >
                    Aprovar
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => updateStatusMutation.mutate({ ids: selectedPosts, status: 'rascunho' })}
                  >
                    Definir como rascunho
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => updateStatusMutation.mutate({ ids: selectedPosts, status: 'rejeitado' })}
                  >
                    Rejeitar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={() => setIsBatchDeleteModalOpen(true)}
              >
                Excluir selecionados
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setSelectedPosts([])}
              >
                Cancelar seleção
              </Button>
            </div>
          </div>
        </div>
      )}
      
      <CardContent>
        {isLoadingPosts ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-border" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>Nenhum post encontrado.</p>
            <p className="text-sm mt-1">Crie um novo post ou ajuste os filtros de busca.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]">
                    <Checkbox 
                      checked={selectedPosts.length === posts.length && posts.length > 0} 
                      onCheckedChange={toggleSelectAll}
                      aria-label="Selecionar todos os posts"
                    />
                  </TableHead>
                  <TableHead className="w-[50px]">ID</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data de Criação</TableHead>
                  <TableHead className="w-[80px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {posts.map((post) => (
                  <TableRow key={post.id}>
                    <TableCell>
                      <Checkbox 
                        checked={selectedPosts.includes(post.id)} 
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedPosts([...selectedPosts, post.id]);
                          } else {
                            setSelectedPosts(selectedPosts.filter(id => id !== post.id));
                          }
                        }}
                        aria-label={`Selecionar post ${post.title}`}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{post.id}</TableCell>
                    <TableCell>
                      <div className="font-medium truncate max-w-[200px]">
                        {post.title}
                      </div>
                      <div className="flex items-center mt-1">
                        <div className="h-9 w-9 rounded bg-muted flex items-center justify-center mr-2 overflow-hidden" style={{ aspectRatio: '1/1' }}>
                          {post.imageUrl ? (
                            <MediaDisplay 
                              src={post.imageUrl}
                              autoPlay={true}
                              loop={true}
                              muted={true}
                              controls={false}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 opacity-30">
                              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                              <circle cx="8.5" cy="8.5" r="1.5" />
                              <polyline points="21 15 16 10 5 21" />
                            </svg>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground truncate">
                          {post.uniqueCode}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getCategoryName(post.categoryId)}
                    </TableCell>
                    <TableCell>
                      {renderStatus(post.status)}
                    </TableCell>
                    <TableCell>
                      {format(new Date(post.createdAt), "dd/MM/yyyy", {locale: ptBR})}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => window.open(`/preview/${post.id}`, '_blank')}
                        >
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={async () => {
                            // Se o post tem groupId, buscar todos os posts do grupo para edição em lote
                            if (post.groupId) {
                              try {
                                const response = await apiRequest('GET', `/api/admin/posts/related/${post.groupId}`);
                                const relatedPosts = await response.json();
                                
                                console.log("Carregando grupo para edição:", post.groupId, "com", relatedPosts.length, "posts");
                                
                                if (relatedPosts && relatedPosts.length > 0) {
                                  // Se há posts no grupo, carregar o post principal com dados do grupo
                                  const mainPost = relatedPosts.find((p: Post) => p.id === post.id) || relatedPosts[0];
                                  const groupFormats = relatedPosts.map((p: Post) => ({
                                    formato: p.formato,
                                    imageUrl: p.imageUrl,
                                    canvaUrl: p.canvaUrl || '',
                                    links: p.canvaUrl ? [{
                                      id: crypto.randomUUID().substring(0, 8),
                                      provider: 'canva',
                                      url: p.canvaUrl
                                    }] : []
                                  }));
                                  
                                  // Log para debug
                                  console.log("EDIT MODE: Carregando dados da postagem", mainPost.id);
                                  console.log("EDIT MODE: Formato extraído do campo formato:", mainPost.formato);
                                  if (mainPost.imageUrl) {
                                    console.log("EDIT MODE: Imagem carregada para formato:", mainPost.formato, mainPost.imageUrl);
                                  }
                                  
                                  // Criar post combinado para edição em lote
                                  const combinedPost = {
                                    ...mainPost,
                                    formatos: groupFormats,
                                    formats: relatedPosts.map((p: Post) => p.formato).filter(Boolean)
                                  };
                                  
                                  console.log("EDIT MODE: Definindo form data:", {
                                    title: combinedPost.title,
                                    categoryId: combinedPost.categoryId,
                                    status: combinedPost.status,
                                    description: combinedPost.description,
                                    licenseType: combinedPost.licenseType,
                                    formats: combinedPost.formats,
                                    formatFiles: {
                                      Feed: {
                                        imageFile: null,
                                        imagePreview: groupFormats.find((f: any) => f.formato === 'Feed')?.imageUrl || null,
                                        links: groupFormats.find((f: any) => f.formato === 'Feed')?.links || []
                                      },
                                      Stories: {
                                        imageFile: null,
                                        imagePreview: groupFormats.find((f: any) => f.formato === 'Stories')?.imageUrl || null,
                                        links: groupFormats.find((f: any) => f.formato === 'Stories')?.links || []
                                      },
                                      Cartaz: {
                                        imageFile: null,
                                        imagePreview: groupFormats.find((f: any) => f.formato === 'Cartaz')?.imageUrl || null,
                                        links: groupFormats.find((f: any) => f.formato === 'Cartaz')?.links || []
                                      },
                                      Banner: {
                                        imageFile: null,
                                        imagePreview: groupFormats.find((f: any) => f.formato === 'Banner')?.imageUrl || null,
                                        links: groupFormats.find((f: any) => f.formato === 'Banner')?.links || []
                                      }
                                    },
                                    uniqueCode: combinedPost.uniqueCode,
                                    groupId: combinedPost.groupId,
                                    isVisible: combinedPost.isVisible
                                  });
                                  
                                  const activeFormat = combinedPost.formato || combinedPost.formats?.[0];
                                  if (activeFormat) {
                                    console.log("EDIT MODE: Aba ativa definida para:", activeFormat);
                                  }
                                  
                                  setSelectedPost(combinedPost);
                                } else {
                                  setSelectedPost(post);
                                }
                              } catch (error) {
                                console.error('Erro ao buscar posts relacionados:', error);
                                setSelectedPost(post);
                              }
                            } else {
                              setSelectedPost(post);
                            }
                            setIsEditModalOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4 text-muted-foreground" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => {
                            setSelectedPost(post);
                            setIsDeleteModalOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
      
      {/* Modal de criar/editar post */}
      <PostForm
        open={isCreateModalOpen || isEditModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateModalOpen(false);
            setIsEditModalOpen(false);
            setSelectedPost(null);
          }
        }}
        initialData={selectedPost || undefined}
        isEdit={!!selectedPost}
        categories={categories}
        onSubmit={handleSubmit}
      />
      
      {/* Diálogo de confirmação de exclusão individual */}
      <AlertDialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <AlertDialogContent className="bg-card rounded-md shadow-md border-0 p-0 overflow-hidden max-w-md">
          <div className="p-6">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl font-semibold">Excluir postagem</AlertDialogTitle>
              <AlertDialogDescription className="pt-2 text-muted-foreground">
                Você tem certeza que deseja excluir esta postagem? Essa ação não poderá ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
          </div>
          
          <div className="flex border-t border-border">
            <AlertDialogCancel 
              onClick={() => {
                setIsDeleteModalOpen(false);
                setSelectedPost(null);
              }}
              className="flex-1 m-0 rounded-none bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground border-r"
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="flex-1 m-0 rounded-none bg-card text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              {deletePostMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                "Confirmar Exclusão"
              )}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Diálogo de confirmação de exclusão em lote */}
      <AlertDialog open={isBatchDeleteModalOpen} onOpenChange={setIsBatchDeleteModalOpen}>
        <AlertDialogContent className="bg-card rounded-md shadow-md border-0 p-0 overflow-hidden max-w-md">
          <div className="p-6">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl font-semibold">Excluir postagens selecionadas</AlertDialogTitle>
              <AlertDialogDescription className="pt-2 text-muted-foreground">
                Você tem certeza que deseja excluir <strong>{selectedPosts.length}</strong> postagens? 
                Essa ação não poderá ser desfeita e todos os arquivos associados serão removidos permanentemente.
              </AlertDialogDescription>
            </AlertDialogHeader>
          </div>
          
          <div className="flex border-t border-border">
            <AlertDialogCancel 
              onClick={() => setIsBatchDeleteModalOpen(false)}
              className="flex-1 m-0 rounded-none bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground border-r"
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmBatchDelete}
              className="flex-1 m-0 rounded-none bg-card text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              {batchDeleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo {selectedPosts.length} postagens...
                </>
              ) : (
                "Confirmar Exclusão"
              )}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de Gerenciamento de Imagens */}
      <ImageRestoreManager 
        open={isImageRestoreOpen} 
        onOpenChange={setIsImageRestoreOpen} 
      />
    </Card>
  );
}