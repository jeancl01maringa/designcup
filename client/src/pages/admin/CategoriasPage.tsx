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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  AlertCircle,
  RefreshCcw,
  LayoutDashboard,
  Save,
  Globe
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
  slug: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

type CategoryFormValues = z.infer<typeof categoryFormSchema>;

// Função para gerar slug a partir do nome
const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^\w\s-]/g, '') // Remove caracteres especiais
    .replace(/\s+/g, '-') // Substitui espaços por hífens
    .replace(/--+/g, '-') // Remove hífens duplicados
    .trim();
};

export default function CategoriasPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [hasUnpublishedChanges, setHasUnpublishedChanges] = useState(false);

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

  // Buscar estatísticas das categorias (incluindo contagem de posts)
  const { data: categoryStats = [], isLoading, refetch } = useQuery<(Category & { postCount: number })[]>({
    queryKey: ['/api/admin/category-stats'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/admin/category-stats');
        return await response.json();
      } catch (error) {
        console.error("Erro ao buscar estatísticas das categorias:", error);
        return [];
      }
    },
    refetchOnWindowFocus: false
  });

  // Buscar última publicação
  const { data: publishedConfig, refetch: refetchPublished } = useQuery({
    queryKey: ['/api/site-config/featured-categories'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/site-config/featured-categories');
        return await response.json();
      } catch (error) {
        return { data: [], updatedAt: null };
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
      queryClient.invalidateQueries({ queryKey: ['/api/admin/category-stats'] });
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
      queryClient.invalidateQueries({ queryKey: ['/api/admin/category-stats'] });
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
      queryClient.invalidateQueries({ queryKey: ['/api/admin/category-stats'] });
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

  // Mutation para atualizar configurações da home
  const updateHomeMutation = useMutation({
    mutationFn: async (data: { id: number; homeVisible: boolean; homeOrder: number }) => {
      const response = await apiRequest("PATCH", `/api/admin/categories/${data.id}/home`, data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/category-stats'] });
      setHasUnpublishedChanges(true);
      toast({
        title: "Alteração salva temporariamente",
        description: "Lembre-se de publicar para que as alterações apareçam na Home.",
      });
    },
  });

  // Mutation para publicar na home
  const publishMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/categories/publish-featured");
      return await response.json();
    },
    onSuccess: (data) => {
      setHasUnpublishedChanges(false);
      refetchPublished();
      toast({
        title: "Publicado com sucesso!",
        description: `${data.count} categorias foram atualizadas na Home.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao publicar",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    },
  });

  // Filtrar categorias pelo termo de busca
  const filteredCategories = searchTerm
    ? categoryStats.filter((cat: Category & { postCount: number }) =>
      cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (cat.description && cat.description.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    : categoryStats;

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

  const handleToggleHomeVisible = (category: Category & { homeVisible?: boolean, homeOrder?: number }) => {
    updateHomeMutation.mutate({
      id: category.id,
      homeVisible: !category.homeVisible,
      homeOrder: category.homeOrder || 99
    });
  };

  const handleOrderChange = (category: Category & { homeVisible?: boolean }, newOrder: string) => {
    const orderNum = parseInt(newOrder);
    if (!isNaN(orderNum)) {
      updateHomeMutation.mutate({
        id: category.id,
        homeVisible: !!category.homeVisible,
        homeOrder: orderNum
      });
    }
  };

  // Enviar formulário de criação
  const onCreateSubmit = (values: CategoryFormValues) => {
    // Gera o slug automaticamente a partir do nome
    const dataWithSlug = {
      ...values,
      slug: generateSlug(values.name),
    };
    createMutation.mutate(dataWithSlug);
  };

  // Enviar formulário de edição
  const onEditSubmit = (values: CategoryFormValues) => {
    if (selectedCategory) {
      // Gera o slug automaticamente a partir do nome
      const dataWithSlug = {
        ...values,
        slug: generateSlug(values.name),
        id: selectedCategory.id,
      };
      updateMutation.mutate(dataWithSlug);
    }
  };

  // Confirmar exclusão
  const confirmDelete = () => {
    if (selectedCategory) {
      deleteMutation.mutate(selectedCategory.id);
    }
  };

  // A contagem de posts agora vem diretamente da API categoryStats

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
                className="bg-blue-600 hover:bg-blue-700"
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
                      className="bg-blue-600 hover:bg-blue-700"
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

      <Tabs defaultValue="todas" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="todas">Todas as Categorias</TabsTrigger>
          <TabsTrigger value="destaques" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Em Destaque (Home)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="todas">
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
                  filteredCategories.map((category: Category & { postCount: number }) => (
                    <TableRow key={category.id}>
                      <TableCell className="font-medium">{category.name}</TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {category.postCount}
                      </TableCell>
                      <TableCell className="text-center">
                        {category.isActive ? (
                          <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Ativo
                          </div>
                        ) : (
                          <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
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
                            className="text-blue-600 border-blue-200 hover:bg-blue-50"
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
        </TabsContent>

        <TabsContent value="destaques">
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="font-medium text-blue-900 flex items-center gap-2">
                  <LayoutDashboard className="h-5 w-5" />
                  Gerenciar Categorias da Home
                </h3>
                <p className="text-sm text-blue-700 mt-1">
                  Escolha quais categorias aparecem na página inicial e em qual ordem.
                  {publishedConfig?.updatedAt && (
                    <span className="block mt-1 font-medium">
                      Última publicação: {new Date(publishedConfig.updatedAt).toLocaleString('pt-BR')}
                    </span>
                  )}
                </p>
              </div>
              <Button
                className={`${hasUnpublishedChanges ? 'bg-amber-500 hover:bg-amber-600 animate-pulse' : 'bg-blue-600 hover:bg-blue-700'}`}
                onClick={() => publishMutation.mutate()}
                disabled={publishMutation.isPending || (!hasUnpublishedChanges && publishedConfig?.data?.length > 0)}
              >
                <Save className="h-4 w-4 mr-2" />
                {publishMutation.isPending ? "Publicando..." : "Publicar Alterações"}
              </Button>
            </div>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="text-center w-[120px]">Visível na Home</TableHead>
                  <TableHead className="w-[120px]">Ordem</TableHead>
                  <TableHead className="text-right">Posts</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      Carregando configurações...
                    </TableCell>
                  </TableRow>
                ) : filteredCategories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      Nenhuma categoria encontrada.
                    </TableCell>
                  </TableRow>
                ) : (
                  // Order by homeOrder for this view specifically, but keep original array intact to avoid flickers
                  [...filteredCategories]
                    .sort((a, b) => {
                      // Put visible ones first
                      if (a.homeVisible && !b.homeVisible) return -1;
                      if (!a.homeVisible && b.homeVisible) return 1;
                      // Then by order
                      const orderA = a.homeOrder ?? 99;
                      const orderB = b.homeOrder ?? 99;
                      if (orderA !== orderB) return orderA - orderB;
                      // Then by names
                      return a.name.localeCompare(b.name);
                    })
                    .map((category: Category & { postCount: number, homeVisible?: boolean, homeOrder?: number }) => (
                      <TableRow key={`home-${category.id}`} className={category.homeVisible ? 'bg-blue-50/30' : ''}>
                        <TableCell className="font-medium">
                          {category.name}
                          {!category.isActive && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-red-100 text-red-800">
                              Inativa
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Switch
                            checked={!!category.homeVisible}
                            onCheckedChange={() => handleToggleHomeVisible(category)}
                            disabled={!category.isActive}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            className="w-20 text-center h-8"
                            min="1"
                            max="99"
                            defaultValue={category.homeOrder || 99}
                            disabled={!category.homeVisible || !category.isActive}
                            onBlur={(e) => {
                              if (e.target.value !== String(category.homeOrder)) {
                                handleOrderChange(category, e.target.value);
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleOrderChange(category, e.currentTarget.value);
                                e.currentTarget.blur();
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground text-sm">
                          {category.postCount} posts
                        </TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

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
                    className="bg-blue-600 hover:bg-blue-700"
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