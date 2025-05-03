import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/layout/AdminLayout";
import { PageHeader } from "@/components/admin/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  CheckCircle, 
  AlertCircle,
  RefreshCcw
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Category } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

// Schema para validação do formulário
const categoryFormSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

type CategoryFormValues = z.infer<typeof categoryFormSchema>;

export default function CategoriasPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  // Form para criar/editar categoria
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: "",
      description: "",
      isActive: true,
    },
  });

  // Reset formulário quando abrir o modal
  React.useEffect(() => {
    if (isCreateDialogOpen) {
      form.reset({
        name: "",
        description: "",
        isActive: true,
      });
    } else if (isEditDialogOpen && selectedCategory) {
      form.reset({
        name: selectedCategory.name,
        description: selectedCategory.description || "",
        isActive: selectedCategory.isActive,
      });
    }
  }, [isCreateDialogOpen, isEditDialogOpen, selectedCategory, form]);

  // Buscar categorias
  const { data: categories = [], isLoading, refetch } = useQuery<Category[]>({
    queryKey: ['/api/admin/categories'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/admin/categories');
        return await response.json();
      } catch (error) {
        console.error("Erro ao buscar categorias:", error);
        // Consulta direta ao Supabase como fallback
        try {
          const { data, error } = await supabase
            .from('categories')
            .select('*')
            .order('name');
            
          if (error) throw error;
          
          // Transformar os dados do formato do Supabase para o formato esperado
          return data.map(cat => ({
            id: cat.id,
            name: cat.name,
            description: cat.description,
            slug: cat.slug,
            imageUrl: cat.image_url,
            isActive: cat.is_active !== false, // Se não existir, assume true
            createdAt: new Date(cat.created_at)
          }));
        } catch (supabaseError) {
          console.error("Erro ao buscar do Supabase:", supabaseError);
          return [];
        }
      }
    },
    refetchOnWindowFocus: false
  });

  // Mutation para criar categoria
  const createMutation = useMutation({
    mutationFn: async (values: CategoryFormValues) => {
      const response = await apiRequest("POST", "/api/admin/categories", values);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/categories'] });
      toast({
        title: "Categoria criada",
        description: "A categoria foi criada com sucesso.",
      });
      setIsCreateDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar categoria",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    },
  });

  // Mutation para editar categoria
  const updateMutation = useMutation({
    mutationFn: async (values: CategoryFormValues & { id: number }) => {
      const { id, ...data } = values;
      const response = await apiRequest("PUT", `/api/admin/categories/${id}`, data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/categories'] });
      toast({
        title: "Categoria atualizada",
        description: "A categoria foi atualizada com sucesso.",
      });
      setIsEditDialogOpen(false);
      setSelectedCategory(null);
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar categoria",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    },
  });

  // Mutation para excluir categoria
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/categories'] });
      toast({
        title: "Categoria excluída",
        description: "A categoria foi excluída com sucesso.",
      });
      setIsDeleteDialogOpen(false);
      setSelectedCategory(null);
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir categoria",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    },
  });

  // Mutation para alternar status (ativar/desativar)
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const response = await apiRequest("PATCH", `/api/admin/categories/${id}/status`, { isActive });
      return await response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/categories'] });
      toast({
        title: variables.isActive ? "Categoria ativada" : "Categoria desativada",
        description: `A categoria foi ${variables.isActive ? "ativada" : "desativada"} com sucesso.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar status",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    },
  });

  // Filtrar categorias pelo termo de busca
  const filteredCategories = searchTerm
    ? categories.filter(cat => 
        cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (cat.description && cat.description.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : categories;

  // Abrir modal de edição
  const handleEdit = (category: Category) => {
    setSelectedCategory(category);
    setIsEditDialogOpen(true);
  };

  // Abrir modal de exclusão
  const handleDelete = (category: Category) => {
    setSelectedCategory(category);
    setIsDeleteDialogOpen(true);
  };

  // Alternar status (ativar/desativar)
  const handleToggleStatus = (category: Category) => {
    toggleStatusMutation.mutate({
      id: category.id,
      isActive: !category.isActive
    });
  };

  // Enviar formulário de criação
  const onCreateSubmit = (values: CategoryFormValues) => {
    createMutation.mutate(values);
  };

  // Enviar formulário de edição
  const onEditSubmit = (values: CategoryFormValues) => {
    if (selectedCategory) {
      updateMutation.mutate({
        ...values,
        id: selectedCategory.id,
      });
    }
  };

  // Confirmar exclusão
  const confirmDelete = () => {
    if (selectedCategory) {
      deleteMutation.mutate(selectedCategory.id);
    }
  };

  // Contar posts por categoria (mock, na versão real viria da API)
  const getCategoryPostCount = (categoryId: number) => {
    // Aqui seria uma chamada à API para obter a contagem de posts
    // Por enquanto, apenas retornamos um número aleatório para simulação
    return Math.floor(Math.random() * 10);
  };

  return (
    <AdminLayout>
      <PageHeader
        title="Categorias"
        description="Gerencie as categorias de conteúdo do site"
      />
      
      {/* Barra de pesquisa e botão de nova categoria */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar categorias..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => refetch()}
            title="Atualizar"
          >
            <RefreshCcw className="h-4 w-4" />
          </Button>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="default"
                style={{ backgroundColor: "#1f4ed8" }}
                onClick={() => setIsCreateDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Nova Categoria
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova Categoria</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onCreateSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Estética Facial" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição</FormLabel>
                        <FormControl>
                          <Input placeholder="Descrição da categoria" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter className="gap-2 sm:gap-0">
                    <DialogClose asChild>
                      <Button type="button" variant="outline">Cancelar</Button>
                    </DialogClose>
                    <Button 
                      type="submit" 
                      style={{ backgroundColor: "#1f4ed8" }}
                      disabled={createMutation.isPending}
                    >
                      {createMutation.isPending ? "Salvando..." : "Salvar alterações"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      {/* Tabela de categorias */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead className="hidden sm:table-cell">Posts Vinculados</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  Carregando categorias...
                </TableCell>
              </TableRow>
            ) : filteredCategories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  Nenhuma categoria encontrada.
                </TableCell>
              </TableRow>
            ) : (
              filteredCategories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {getCategoryPostCount(category.id)}
                  </TableCell>
                  <TableCell className="text-center">
                    {category.isActive ? (
                      <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Ativo
                      </div>
                    ) : (
                      <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Inativo
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleEdit(category)}
                      title="Editar"
                      className="border-blue-200 text-blue-700 hover:bg-blue-50"
                    >
                      <Edit className="h-4 w-4" />
                      <span className="sr-only sm:not-sr-only sm:ml-2">Editar</span>
                    </Button>
                    
                    {category.isActive ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleStatus(category)}
                        title="Desativar"
                        className="text-amber-600 border-amber-200 hover:bg-amber-50"
                      >
                        <AlertCircle className="h-4 w-4" />
                        <span className="sr-only sm:not-sr-only sm:ml-2">Desativar</span>
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleStatus(category)}
                        title="Ativar"
                        className="text-green-600 border-green-200 hover:bg-green-50"
                      >
                        <CheckCircle className="h-4 w-4" />
                        <span className="sr-only sm:not-sr-only sm:ml-2">Ativar</span>
                      </Button>
                    )}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(category)}
                      title="Excluir"
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only sm:not-sr-only sm:ml-2">Excluir</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Modal de edição */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Categoria</DialogTitle>
          </DialogHeader>
          {selectedCategory && (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onEditSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter className="gap-2 sm:gap-0">
                  <DialogClose asChild>
                    <Button type="button" variant="outline">Cancelar</Button>
                  </DialogClose>
                  <Button 
                    type="submit" 
                    style={{ backgroundColor: "#1f4ed8" }}
                    disabled={updateMutation.isPending}
                  >
                    {updateMutation.isPending ? "Salvando..." : "Salvar alterações"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de confirmação de exclusão */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
          </DialogHeader>
          <div className="py-3">
            <p>Tem certeza que deseja excluir a categoria "{selectedCategory?.name}"?</p>
            <p className="text-sm text-muted-foreground mt-2">
              Esta ação não pode ser desfeita. Todos os posts vinculados a esta categoria ficarão sem categoria.
            </p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancelar</Button>
            </DialogClose>
            <Button 
              variant="destructive" 
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Excluindo..." : "Excluir Categoria"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}