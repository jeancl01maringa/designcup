import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/layout/AdminLayout";
import { PageHeader } from "@/components/admin/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
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
import { Separator } from "@/components/ui/separator";
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Eye, 
  CheckCircle, 
  Clock, 
  XCircle,
  RefreshCcw
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Post, Category } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { MobileOptimizedPostForm } from "@/components/admin/MobileOptimizedPostForm";

interface PostFilter {
  searchTerm?: string;
  categoryId?: number | null;
  status?: string;
  month?: number;
  year?: number;
}

export default function PostagensPage() {
  const { toast } = useToast();
  const [filters, setFilters] = useState<PostFilter>({});
  const [selectedPosts, setSelectedPosts] = useState<number[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<number | null>(null);
  const [isDeleteBatchModalOpen, setIsDeleteBatchModalOpen] = useState(false);

  // Buscar categorias (necessário para o formulário)
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['/api/admin/categories'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/admin/categories');
        return await response.json();
      } catch (error) {
        console.error("Erro ao buscar categorias:", error);
        return [];
      }
    }
  });

  // Buscar postagens com filtros
  const { data: posts, isLoading, refetch } = useQuery<Post[]>({
    queryKey: ['/api/admin/posts', filters],
    queryFn: async () => {
      try {
        // Construir os parâmetros de consulta a partir dos filtros
        const params = new URLSearchParams();
        if (filters.searchTerm) params.append('search', filters.searchTerm);
        if (filters.categoryId) params.append('categoryId', filters.categoryId.toString());
        if (filters.status) params.append('status', filters.status);
        if (filters.month) params.append('month', filters.month.toString());
        if (filters.year) params.append('year', filters.year.toString());
        
        // Fazer a requisição à API
        const queryString = params.toString() ? `?${params.toString()}` : '';
        const response = await apiRequest('GET', `/api/admin/posts${queryString}`);
        return await response.json();
      } catch (error) {
        console.error("Erro ao buscar postagens:", error);
        // Consulta direta ao Supabase como fallback
        try {
          const query = supabase
            .from('posts')
            .select('*');
            
          // Aplicar filtros, se disponíveis
          if (filters.status) {
            query.eq('status', filters.status);
          }
          
          if (filters.searchTerm) {
            query.ilike('title', `%${filters.searchTerm}%`);
          }
          
          if (filters.categoryId) {
            query.eq('category_id', filters.categoryId);
          }
          
          const { data, error } = await query.order('created_at', { ascending: false });
          
          if (error) throw error;
          
          // Transformar os dados do formato do Supabase para o formato esperado
          return data.map(post => ({
            id: post.id,
            title: post.title,
            description: post.description,
            imageUrl: post.image_url,
            status: post.status,
            categoryId: post.category_id,
            uniqueCode: post.unique_code,
            createdAt: new Date(post.created_at),
            publishedAt: post.published_at ? new Date(post.published_at) : null
          }));
        } catch (supabaseError) {
          console.error("Erro ao buscar do Supabase:", supabaseError);
          return [];
        }
      }
    },
    refetchOnWindowFocus: false
  });

  // Mutação para excluir postagem
  const deletePostMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/admin/posts/${id}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao excluir postagem');
      }
      return id;
    },
    onSuccess: () => {
      toast({
        title: "Postagem excluída",
        description: "A postagem foi excluída com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/posts'] });
      setSelectedPosts([]);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutação para atualizar o status de várias postagens
  const updateStatusMutation = useMutation({
    mutationFn: async ({ ids, status }: { ids: number[], status: 'aprovado' | 'rascunho' | 'rejeitado' }) => {
      const response = await apiRequest('PATCH', '/api/admin/posts/status', { ids, status });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao atualizar status');
      }
      return { ids, status };
    },
    onSuccess: () => {
      toast({
        title: "Status atualizado",
        description: "O status das postagens foi atualizado com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/posts'] });
      setSelectedPosts([]);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar status",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Formatar a data para exibição
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Status da postagem para exibição
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'aprovado':
        return (
          <div className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded-full text-xs">
            <CheckCircle className="h-3 w-3" />
            <span>Aprovado</span>
          </div>
        );
      case 'rascunho':
        return (
          <div className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-1 rounded-full text-xs">
            <Clock className="h-3 w-3" />
            <span>Rascunho</span>
          </div>
        );
      case 'rejeitado':
        return (
          <div className="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-1 rounded-full text-xs">
            <XCircle className="h-3 w-3" />
            <span>Rejeitado</span>
          </div>
        );
      default:
        return status;
    }
  };

  // Manipulador para seleção de todas as postagens
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedPosts(posts?.map(post => post.id) || []);
    } else {
      setSelectedPosts([]);
    }
  };

  // Manipulador para seleção individual de postagens
  const handleSelectPost = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedPosts(prev => [...prev, id]);
    } else {
      setSelectedPosts(prev => prev.filter(postId => postId !== id));
    }
  };

  // Verificar se todas as postagens estão selecionadas
  const allSelected = posts?.length ? selectedPosts.length === posts.length : false;

  // Manipulador para edição de postagem
  const handleEditPost = (post: Post) => {
    setEditingPost(post);
    setIsFormOpen(true);
  };

  // Manipulador para exclusão de postagem
  const handleDeletePost = (id: number) => {
    setPostToDelete(id);
    setIsDeleteModalOpen(true);
  };
  
  // Confirmação de exclusão
  const confirmDelete = () => {
    if (postToDelete) {
      deletePostMutation.mutate(postToDelete);
      setIsDeleteModalOpen(false);
      setPostToDelete(null);
    }
  };
  
  // Manipulador para exclusão em lote
  const handleDeleteBatch = () => {
    if (selectedPosts.length === 0) {
      toast({
        title: "Nenhuma postagem selecionada",
        description: "Selecione pelo menos uma postagem para excluir.",
        variant: "destructive",
      });
      return;
    }
    
    setIsDeleteBatchModalOpen(true);
  };
  
  // Confirmação de exclusão em lote
  const confirmDeleteBatch = async () => {
    try {
      // Excluir cada postagem selecionada
      for (const id of selectedPosts) {
        await deletePostMutation.mutateAsync(id);
      }
      
      toast({
        title: "Postagens excluídas",
        description: `${selectedPosts.length} postagens foram excluídas com sucesso.`
      });
      
      setSelectedPosts([]);
      setIsDeleteBatchModalOpen(false);
    } catch (error) {
      toast({
        title: "Erro ao excluir",
        description: "Ocorreu um erro ao excluir as postagens selecionadas.",
        variant: "destructive",
      });
    }
  };

  // Manipulador para atualização de status em lote
  const handleBatchStatusUpdate = (status: 'aprovado' | 'rascunho' | 'rejeitado') => {
    if (selectedPosts.length === 0) {
      toast({
        title: "Nenhuma postagem selecionada",
        description: "Selecione pelo menos uma postagem para atualizar o status.",
        variant: "destructive",
      });
      return;
    }

    updateStatusMutation.mutate({ ids: selectedPosts, status });
  };

  return (
    <AdminLayout>
      <PageHeader 
        title="Postagens" 
        description="Gerencie as postagens do site"
      />

      {/* Filtros e ações */}
      <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou ID..."
              className="pl-8"
              value={filters.searchTerm || ''}
              onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
            />
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="p-2">
                <p className="text-sm font-medium mb-2">Status</p>
                <Select
                  value={filters.status || ''}
                  onValueChange={(value) => setFilters({ ...filters, status: value || undefined })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos</SelectItem>
                    <SelectItem value="aprovado">Aprovado</SelectItem>
                    <SelectItem value="rascunho">Rascunho</SelectItem>
                    <SelectItem value="rejeitado">Rejeitado</SelectItem>
                  </SelectContent>
                </Select>

                <Separator className="my-2" />
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full mt-2"
                  onClick={() => setFilters({})}
                >
                  Limpar filtros
                </Button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => refetch()}
            title="Atualizar"
          >
            <RefreshCcw className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {selectedPosts.length > 0 && (
            <>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleBatchStatusUpdate('aprovado')}
                className="text-green-600 border-green-200 hover:bg-green-50"
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Aprovar
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleBatchStatusUpdate('rascunho')}
                className="text-amber-600 border-amber-200 hover:bg-amber-50"
              >
                <Clock className="h-4 w-4 mr-1" />
                Rascunho
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleBatchStatusUpdate('rejeitado')}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                <XCircle className="h-4 w-4 mr-1" />
                Rejeitar
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleDeleteBatch}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Excluir
              </Button>
              <Separator orientation="vertical" className="h-8" />
            </>
          )}
          
          <Dialog>
            <DialogTrigger asChild>
              <Button 
                onClick={() => {
                  setEditingPost(null);
                  setIsFormOpen(true);
                }}
                style={{ backgroundColor: "#1f4ed8" }}
              >
                <Plus className="h-4 w-4 mr-1" />
                Nova postagem
              </Button>
            </DialogTrigger>
            
            {/* Renderiza o formulário de postagem otimizado para mobile */}
            <MobileOptimizedPostForm 
              open={isFormOpen}
              onOpenChange={setIsFormOpen}
              initialData={editingPost || undefined}
              isEdit={!!editingPost}
            />
          </Dialog>
        </div>
      </div>

      {/* Tabela de postagens */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox 
                  checked={allSelected} 
                  onCheckedChange={handleSelectAll}
                  aria-label="Selecionar todas as postagens"
                />
              </TableHead>
              <TableHead className="w-14">ID</TableHead>
              <TableHead className="min-w-[250px]">Título</TableHead>
              <TableHead className="hidden md:table-cell">Categoria</TableHead>
              <TableHead className="w-24">Status</TableHead>
              <TableHead className="hidden md:table-cell">Data</TableHead>
              <TableHead className="w-16"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-48 text-center">
                  Carregando postagens...
                </TableCell>
              </TableRow>
            ) : posts?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-48 text-center">
                  Nenhuma postagem encontrada.
                </TableCell>
              </TableRow>
            ) : (
              posts?.map((post) => (
                <TableRow key={post.id}>
                  <TableCell>
                    <Checkbox 
                      checked={selectedPosts.includes(post.id)}
                      onCheckedChange={(checked) => handleSelectPost(post.id, checked === true)}
                      aria-label={`Selecionar postagem ${post.title}`}
                    />
                  </TableCell>
                  <TableCell className="font-medium">#{post.id}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded bg-muted flex items-center justify-center overflow-hidden" style={{ aspectRatio: '1/1' }}>
                        {post.imageUrl ? (
                          <img 
                            src={post.imageUrl}
                            alt={post.title}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              // Substituir por um ícone de imagem caso falhe o carregamento
                              e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLWltYWdlIj48cmVjdCB4PSIzIiB5PSIzIiB3aWR0aD0iMTgiIGhlaWdodD0iMTgiIHJ4PSIyIiByeT0iMiIvPjxjaXJjbGUgY3g9IjguNSIgY3k9IjguNSIgcj0iMS41Ii8+PHBvbHlsaW5lIHBvaW50cz0iMjEgMTUgMTYgMTAgNSAyMSIvPjwvc3ZnPg==';
                              e.currentTarget.className = 'h-6 w-6 opacity-30';
                            }}
                          />
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 opacity-30">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <polyline points="21 15 16 10 5 21" />
                          </svg>
                        )}
                      </div>
                      <div className="font-medium">{post.title}</div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {post.categoryId || '-'}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(post.status)}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    {formatDate(post.createdAt)}
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
                        onClick={() => handleEditPost(post)}
                      >
                        <Edit className="h-4 w-4 text-muted-foreground" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDeletePost(post.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Informação sobre seleção */}
      {selectedPosts.length > 0 && (
        <div className="flex items-center justify-between border rounded-lg p-4 mt-4 bg-muted/50">
          <div className="text-sm">
            {selectedPosts.length} {selectedPosts.length === 1 ? 'postagem selecionada' : 'postagens selecionadas'}
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setSelectedPosts([])}
          >
            Limpar seleção
          </Button>
        </div>
      )}
    </AdminLayout>
  );
}