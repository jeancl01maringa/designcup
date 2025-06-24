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
  EyeOff,
  CheckCircle, 
  Clock, 
  XCircle,
  RefreshCcw,
  Loader2,
  Crown
} from "lucide-react";
import { ImageWithFallback } from "@/components/ui/image-with-fallback";
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
  const [groupPosts, setGroupPosts] = useState<Post[]>([]);

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
  
  // Mutação para atualizar a visibilidade da postagem
  const toggleVisibilityMutation = useMutation({
    mutationFn: async ({ id, isVisible }: { id: number, isVisible: boolean }) => {
      const response = await apiRequest('PATCH', `/api/admin/posts/${id}`, { isVisible });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao atualizar visibilidade');
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/posts'] });
      toast({
        title: "Visibilidade atualizada",
        description: "A visibilidade da postagem foi atualizada com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar visibilidade",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Mutação para atualizar o tipo de licença da postagem (ANTIGO)
  const toggleLicenseTypeMutation = useMutation({
    mutationFn: async ({ id, licenseType }: { id: number, licenseType: 'premium' | 'free' }) => {
      const response = await apiRequest('PATCH', `/api/admin/posts/${id}`, { licenseType });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao atualizar tipo de licença');
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/posts'] });
      toast({
        title: "Tipo de licença atualizado",
        description: "O tipo de licença da postagem foi atualizado com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar tipo de licença",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Mutação especial para endpoint direto premium (NOVA - usa endpoint específico)
  const updatePremiumStatusMutation = useMutation({
    mutationFn: async ({ id, isPremium }: { id: number, isPremium: boolean }) => {
      console.log(`Atualizando status premium do post ${id} para ${isPremium}`);
      const response = await apiRequest('PATCH', `/api/admin/posts/${id}/premium`, { isPremium });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao atualizar status premium');
      }
      return await response.json();
    },
    onSuccess: (data) => {
      console.log("Status premium atualizado com sucesso:", data);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/posts'] });
      toast({
        title: "Status premium atualizado",
        description: "O status premium da postagem foi atualizado com sucesso.",
      });
    },
    onError: (error: Error) => {
      console.error("Erro na atualização premium:", error);
      toast({
        title: "Erro ao atualizar status premium",
        description: error.message,
        variant: "destructive",
      });
    },
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
  
  // Verificar a visibilidade com controle de fallback
  const isPostVisible = (post: Post) => {
    // Se o post tiver a propriedade isVisible definida, use-a
    if (typeof post.isVisible === 'boolean') {
      return post.isVisible;
    }
    // Caso contrário, considere como visível por padrão
    return true;
  };
  
  // Verificar se o post é premium
  const isPostPremium = (post: Post) => {
    // Verificar primeiro o campo licenseType (usado pelo front-end)
    if (typeof post.licenseType === 'string') {
      return post.licenseType === 'premium';
    }
    
    // Se não tiver licenseType, verificar o campo isPro (usado pelo back-end/banco de dados)
    if (typeof post.isPro === 'boolean') {
      return post.isPro;
    }
    
    // Caso contrário, considere como free por padrão
    return false;
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
  const handleEditPost = async (post: Post) => {
    // Se o post tem groupId, carregar todos os posts do grupo
    if (post.groupId) {
      try {
        // Buscar todos os posts do mesmo grupo
        const response = await apiRequest('GET', `/api/admin/posts?groupId=${post.groupId}`);
        if (response.ok) {
          const groupPosts = await response.json();
          console.log("Carregando grupo para edição:", post.groupId, "com", groupPosts.length, "posts");
          
          // Definir o post principal e os posts do grupo
          setEditingPost(post);
          setGroupPosts(groupPosts);
        } else {
          console.warn("Erro ao buscar posts do grupo, editando post individual");
          setEditingPost(post);
          setGroupPosts([]);
        }
      } catch (error) {
        console.error("Erro ao carregar posts do grupo:", error);
        setEditingPost(post);
        setGroupPosts([]);
      }
    } else {
      // Post individual
      setEditingPost(post);
      setGroupPosts([]);
    }
    
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
  
  // Mutação para excluir postagens em lote
  const batchDeleteMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      const response = await apiRequest('DELETE', '/api/admin/posts/batch', { ids });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao excluir postagens em lote');
      }
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Postagens excluídas",
        description: `${selectedPosts.length} postagens foram excluídas com sucesso.`
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
    }
  });

  // Confirmação de exclusão em lote
  const confirmDeleteBatch = async () => {
    try {
      await batchDeleteMutation.mutateAsync(selectedPosts);
      setIsDeleteBatchModalOpen(false);
    } catch (error) {
      console.error("Erro ao excluir postagens em lote:", error);
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
                className="text-blue-600 border-blue-200 hover:bg-blue-50"
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
          </Dialog>
          
          {/* Renderiza o formulário de postagem otimizado para mobile */}
          <MobileOptimizedPostForm 
            open={isFormOpen}
            onOpenChange={setIsFormOpen}
            initialData={editingPost || undefined}
            isEdit={!!editingPost}
            groupPosts={groupPosts}
            key={editingPost ? `edit-${editingPost.id}` : 'new-post'} // Forçar recriação do componente
          />
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
              <TableHead className="min-w-[200px]">Título</TableHead>
              <TableHead className="hidden md:table-cell">Categorias</TableHead>
              <TableHead className="hidden md:table-cell">Formato</TableHead>
              <TableHead className="hidden lg:table-cell">Tipo</TableHead>
              <TableHead className="w-20 text-center">Premium</TableHead>
              <TableHead className="w-20 text-center">Visível</TableHead>
              <TableHead className="w-24">Status</TableHead>
              <TableHead className="hidden md:table-cell">Data</TableHead>
              <TableHead className="w-16">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={11} className="h-48 text-center">
                  Carregando postagens...
                </TableCell>
              </TableRow>
            ) : posts?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="h-48 text-center">
                  Nenhuma postagem encontrada.
                </TableCell>
              </TableRow>
            ) : (
              posts?.map((post) => (
                <TableRow key={post.id} className="hover:bg-muted/30">
                  <TableCell className="py-3">
                    <Checkbox 
                      checked={selectedPosts.includes(post.id)}
                      onCheckedChange={(checked) => handleSelectPost(post.id, checked === true)}
                      aria-label={`Selecionar postagem ${post.title}`}
                    />
                  </TableCell>
                  <TableCell className="font-medium py-3">#{post.id}</TableCell>
                  <TableCell className="py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-14 w-14 rounded bg-muted flex items-center justify-center overflow-hidden shadow-sm" style={{ aspectRatio: '1/1' }}>
                        {post.imageUrl ? (
                          <ImageWithFallback 
                            src={post.imageUrl}
                            alt={post.title}
                            className="h-full w-full object-cover"
                            fallbackClassName="h-6 w-6 opacity-30"
                          />
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 opacity-30">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <polyline points="21 15 16 10 5 21" />
                          </svg>
                        )}
                      </div>
                      <div className="font-medium">{post.title}</div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell py-3">
                    {categories.find(c => c.id === post.categoryId)?.name || '-'}
                  </TableCell>
                  <TableCell className="hidden md:table-cell py-3">
                    <span className="text-sm text-muted-foreground">
                      {post.formato || 'Feed'}
                    </span>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell py-3">
                    <span className="text-sm text-muted-foreground">
                      Canva
                    </span>
                  </TableCell>
                  <TableCell className="py-3 text-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updatePremiumStatusMutation.mutate({ 
                        id: post.id, 
                        isPremium: !isPostPremium(post)
                      })}
                      title={isPostPremium(post) ? 'Conteúdo Premium (clique para tornar gratuito)' : 'Conteúdo Gratuito (clique para tornar premium)'}
                    >
                      {isPostPremium(post) ? (
                        <Crown className="h-4 w-4 text-amber-500 fill-amber-500" />
                      ) : (
                        <Crown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </TableCell>
                  <TableCell className="py-3 text-center">
                    <div 
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background cursor-pointer ${isPostVisible(post) ? 'bg-blue-500' : 'bg-gray-300'}`}
                      role="switch"
                      aria-checked={isPostVisible(post)}
                      data-state={isPostVisible(post) ? 'checked' : 'unchecked'}
                      onClick={() => toggleVisibilityMutation.mutate({ 
                        id: post.id, 
                        isVisible: !isPostVisible(post)
                      })}
                      title={isPostVisible(post) ? 'Visível no feed (clique para ocultar)' : 'Oculto no feed (clique para tornar visível)'}
                    >
                      <span 
                        className={`pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform ${isPostVisible(post) ? 'translate-x-6' : 'translate-x-1'}`} 
                        data-state={isPostVisible(post) ? 'checked' : 'unchecked'} 
                      />
                    </div>
                  </TableCell>
                  <TableCell className="py-3">
                    {getStatusBadge(post.status)}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground py-3">
                    {formatDate(post.createdAt)}
                  </TableCell>
                  <TableCell className="py-3">
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
      {/* Diálogo de confirmação de exclusão (individual) */}
      <AlertDialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <AlertDialogContent className="max-w-md p-6">
          <div className="flex justify-between items-start mb-1">
            <AlertDialogTitle className="text-xl font-semibold">Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogCancel 
              onClick={() => {
                setIsDeleteModalOpen(false);
                setPostToDelete(null);
              }}
              className="h-8 w-8 p-0 rounded-full"
            >
              ×
            </AlertDialogCancel>
          </div>
          
          {postToDelete && (
            <AlertDialogDescription className="mb-6">
              <p className="font-medium text-base text-gray-900 mb-2">
                Tem certeza que deseja excluir a postagem "{posts?.find(p => p.id === postToDelete)?.title}"?
              </p>
              <p className="text-sm text-gray-600">
                Esta ação não pode ser desfeita. Todos os dados associados serão permanentemente removidos.
              </p>
            </AlertDialogDescription>
          )}
          
          <div className="flex gap-3 justify-end">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsDeleteModalOpen(false);
                setPostToDelete(null);
              }}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive"
              onClick={confirmDelete}
            >
              {deletePostMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                "Excluir Postagem"
              )}
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Diálogo de confirmação de exclusão em lote */}
      <AlertDialog open={isDeleteBatchModalOpen} onOpenChange={setIsDeleteBatchModalOpen}>
        <AlertDialogContent className="max-w-md p-6">
          <div className="flex justify-between items-start mb-1">
            <AlertDialogTitle className="text-xl font-semibold">Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogCancel 
              onClick={() => setIsDeleteBatchModalOpen(false)}
              className="h-8 w-8 p-0 rounded-full"
            >
              ×
            </AlertDialogCancel>
          </div>
          
          <AlertDialogDescription className="mb-6">
            <p className="font-medium text-base text-gray-900 mb-2">
              Tem certeza que deseja excluir {selectedPosts.length} {selectedPosts.length === 1 ? 'postagem' : 'postagens'}?
            </p>
            <p className="text-sm text-gray-600">
              Esta ação não pode ser desfeita. Todos os dados associados serão permanentemente removidos.
            </p>
          </AlertDialogDescription>
          
          <div className="flex gap-3 justify-end">
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteBatchModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive"
              onClick={confirmDeleteBatch}
            >
              {batchDeleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                `Excluir ${selectedPosts.length} ${selectedPosts.length === 1 ? 'Postagem' : 'Postagens'}`
              )}
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}