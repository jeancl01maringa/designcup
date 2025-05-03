import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/layout/AdminLayout";
import { PageHeader } from "@/components/admin/layout/PageHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { PostForm } from "@/components/admin/PostForm";
import { Post, Category } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  Eye,
  Pencil,
  Trash2,
  Search,
  Plus,
  Filter,
  ChevronDown,
  MoreHorizontal,
  Loader2,
  RefreshCw,
} from "lucide-react";

export default function PostagensPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Estado para modais
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  
  // Estado para seleção em massa
  const [selectedPosts, setSelectedPosts] = useState<number[]>([]);
  
  // Estado para filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [month, setMonth] = useState<string>("");
  const [year, setYear] = useState<string>(new Date().getFullYear().toString());
  
  // Query para buscar posts
  const {
    data: posts = [],
    isLoading: isLoadingPosts,
    refetch: refetchPosts,
  } = useQuery<Post[]>({
    queryKey: ['/api/admin/posts', { searchTerm, categoryId, month, year }],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      
      if (searchTerm) {
        queryParams.append('searchTerm', searchTerm);
      }
      
      if (categoryId) {
        queryParams.append('categoryId', categoryId);
      }
      
      if (month) {
        queryParams.append('month', month);
      }
      
      if (year) {
        queryParams.append('year', year);
      }
      
      const endpoint = `/api/admin/posts${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await apiRequest('GET', endpoint);
      return await response.json();
    }
  });
  
  // Query para buscar categorias
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
  
  // Handler para excluir post
  const confirmDelete = () => {
    if (selectedPost) {
      deletePostMutation.mutate(selectedPost.id);
      setIsDeleteModalOpen(false);
      setSelectedPost(null);
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
  
  // Função auxiliar para renderizar o status com badge colorida
  const renderStatus = (status: string) => {
    switch (status) {
      case 'aprovado':
        return <Badge variant="success" className="bg-green-100 text-green-800 hover:bg-green-100">Aprovado</Badge>;
      case 'rascunho':
        return <Badge variant="outline" className="bg-gray-100 text-gray-800 hover:bg-gray-100">Rascunho</Badge>;
      case 'rejeitado':
        return <Badge variant="destructive" className="bg-red-100 text-red-800 hover:bg-red-100">Rejeitado</Badge>;
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
  
  // Renderizar a página
  return (
    <AdminLayout>
      <PageHeader 
        title="Postagens" 
        actions={
          <Button onClick={() => {
            setSelectedPost(null);
            setIsCreateModalOpen(true);
          }} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Nova postagem
          </Button>
        }
      />
      
      {/* Barra de pesquisa e filtros */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou ID (#64017c)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Select value={month} onValueChange={setMonth}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Todos os meses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos os meses</SelectItem>
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
          
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Todos os anos" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({length: 3}, (_, i) => new Date().getFullYear() - i).map(y => (
                <SelectItem key={y} value={y.toString()}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger className="w-[180px]">
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
          
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => refetchPosts()}
            title="Atualizar"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Contador de posts */}
      <div className="text-sm text-muted-foreground mb-4">
        {posts.length} postagens encontradas {posts.length > 0 ? `(total: ${posts.length})` : ''}
      </div>
      
      {/* Barra de ações em massa */}
      {selectedPosts.length > 0 && (
        <div className="p-3 bg-muted rounded-md flex items-center justify-between mb-4">
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
              onClick={() => setSelectedPosts([])}
            >
              Cancelar seleção
            </Button>
          </div>
        </div>
      )}
      
      {/* Tabela de postagens */}
      {isLoadingPosts ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-border" />
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground bg-white border rounded-md shadow-sm">
          <p>Nenhuma postagem encontrada.</p>
          <p className="text-sm mt-1">Crie uma nova postagem ou ajuste os filtros de busca.</p>
        </div>
      ) : (
        <div className="bg-white rounded-md shadow-sm border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox 
                    checked={selectedPosts.length === posts.length && posts.length > 0}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Selecionar todos os posts"
                  />
                </TableHead>
                <TableHead className="w-14">Img</TableHead>
                <TableHead>Título</TableHead>
                <TableHead className="hidden md:table-cell">ID</TableHead>
                <TableHead className="hidden md:table-cell">Data</TableHead>
                <TableHead className="hidden md:table-cell">Categoria</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {posts.map((post) => (
                <TableRow key={post.id} className="hover:bg-background">
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
                  <TableCell>
                    {post.imageUrl ? (
                      <div 
                        className="h-10 w-10 rounded-md bg-cover bg-center bg-muted"
                        style={{ backgroundImage: `url(${post.imageUrl})` }}
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center text-xs text-muted-foreground">
                        Sem
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    {post.title}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    #{post.uniqueCode?.substring(0, 6)}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground whitespace-nowrap">
                    {post.createdAt ? format(new Date(post.createdAt), "dd MMM yyyy", { locale: ptBR }) : ''}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    {getCategoryName(post.categoryId)}
                  </TableCell>
                  <TableCell>
                    {renderStatus(post.status || 'rascunho')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => window.open(`/post/${post.id}`, '_blank')}
                        title="Visualizar"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => {
                          setSelectedPost(post);
                          setIsEditModalOpen(true);
                        }}
                        title="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => {
                          setSelectedPost(post);
                          setIsDeleteModalOpen(true);
                        }}
                        title="Excluir"
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
      
      {/* Modal de criar/editar post */}
      <PostForm
        isOpen={isCreateModalOpen || isEditModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setIsEditModalOpen(false);
          setSelectedPost(null);
        }}
        onSubmit={handleSubmit}
        post={selectedPost || undefined}
        categories={categories}
      />
      
      {/* Diálogo de confirmação de exclusão */}
      <AlertDialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O post será excluído permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setIsDeleteModalOpen(false);
              setSelectedPost(null);
            }}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              {deletePostMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                "Sim, excluir"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}