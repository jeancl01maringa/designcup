import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getQueryFn, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Category } from "@shared/schema";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Textarea } from "@/components/ui/textarea";

const categoryFormSchema = z.object({
  name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres").max(50),
  description: z.string().max(200, "A descrição deve ter no máximo 200 caracteres").optional(),
  imageUrl: z.string().url("URL inválida").optional().or(z.literal("")),
  slug: z.string().max(100).optional(),
  isActive: z.boolean().default(true).optional(),
});

type CategoryFormValues = z.infer<typeof categoryFormSchema>;

export function CategoryManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  // Buscar categorias
  const { data: categories, isLoading } = useQuery({
    queryKey: ['/api/admin/categories'],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // Form para criar/editar categoria
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: "",
      description: "",
      imageUrl: "",
      slug: "",
      isActive: true,
    },
  });

  // Reset formulário quando abrir o modal
  React.useEffect(() => {
    if (isCreateDialogOpen) {
      form.reset({
        name: "",
        description: "",
        imageUrl: "",
        slug: "",
        isActive: true,
      });
    } else if (isEditDialogOpen && selectedCategory) {
      form.reset({
        name: selectedCategory.name,
        description: selectedCategory.description || "",
        imageUrl: selectedCategory.imageUrl || "",
        slug: selectedCategory.slug || "",
        isActive: selectedCategory.isActive === undefined ? true : selectedCategory.isActive,
      });
    }
  }, [isCreateDialogOpen, isEditDialogOpen, selectedCategory, form]);

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

  // Mutation para alternar status da categoria
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const response = await apiRequest("PATCH", `/api/admin/categories/${id}/status`, {
        isActive: !isActive
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/categories'] });
      toast({
        title: "Status alterado",
        description: "O status da categoria foi atualizado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao alterar status",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    },
  });

  // Mutation para excluir categoria com suporte a posts relacionados
  const deleteMutation = useMutation<
    { success: boolean; postsUpdated: number; message?: string; details?: string }, 
    Error, 
    number
  >({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/admin/categories/${id}`);
      
      // Se for 204 (sucesso sem conteúdo), nenhum post foi afetado
      if (response.status === 204) {
        return { success: true, postsUpdated: 0 };
      }
      
      // Se for 200, temos informações adicionais sobre posts atualizados
      if (response.status === 200) {
        const data = await response.json();
        return data;
      }
      
      // Em caso de erro, tenta obter detalhes
      const errorData = await response.json().catch(() => ({ message: 'Erro ao excluir categoria' }));
      throw new Error(errorData.message || 'Erro ao excluir categoria');
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/categories'] });
      
      // Só mostrar notificação toast se não houver posts afetados
      // (caso contrário, mostramos no diálogo de confirmação)
      if (data.postsUpdated === 0) {
        toast({
          title: "Categoria excluída",
          description: "A categoria foi excluída com sucesso.",
        });
        
        // Fechar o diálogo após um pequeno delay para dar tempo de ver a mensagem
        setTimeout(() => {
          setIsDeleteDialogOpen(false);
          setSelectedCategory(null);
        }, 1500);
      }
    },
    onError: (error: any) => {
      console.error("Erro detalhado na exclusão:", error);
      
      const errorMessage = error.message || "Erro desconhecido";
      
      toast({
        title: "Erro ao excluir categoria",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

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

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Categorias</h2>
        <Button onClick={() => setIsCreateDialogOpen(true)} size="sm" className="gap-1">
          <Plus className="h-4 w-4" />
          Adicionar
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary/70" />
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                    Nenhuma categoria encontrada.
                  </TableCell>
                </TableRow>
              ) : (
                categories?.map((category: Category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell className="truncate max-w-md">
                      {category.description || "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={category.isActive}
                          onCheckedChange={() => 
                            toggleStatusMutation.mutate({ 
                              id: category.id, 
                              isActive: category.isActive 
                            })
                          }
                          disabled={toggleStatusMutation.isPending}
                        />
                        <span className={`text-sm ${category.isActive ? 'text-green-600' : 'text-gray-500'}`}>
                          {category.isActive ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(category)}
                      >
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Editar</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(category)}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Excluir</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Modal de criação */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Categoria</DialogTitle>
            <DialogDescription>
              Adicione uma nova categoria ao sistema.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onCreateSubmit)} className="space-y-4 pt-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome da categoria" {...field} />
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
                      <Textarea
                        placeholder="Descreva brevemente esta categoria"
                        className="resize-none"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL da Imagem</FormLabel>
                    <FormControl>
                      <Input placeholder="https://exemplo.com/imagem.png" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormDescription>
                      URL de uma imagem que representa esta categoria (opcional)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slug</FormLabel>
                    <FormControl>
                      <Input placeholder="nome-da-categoria" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormDescription>
                      Identificador único para URLs (deixe em branco para gerar automaticamente)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Categoria ativa
                      </FormLabel>
                      <FormDescription>
                        Desmarque para esconder esta categoria no site
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Criar
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Modal de edição */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Categoria</DialogTitle>
            <DialogDescription>
              Atualize as informações da categoria.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onEditSubmit)} className="space-y-4 pt-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome da categoria" {...field} />
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
                      <Textarea
                        placeholder="Descreva brevemente esta categoria"
                        className="resize-none"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL da Imagem</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="https://exemplo.com/imagem.png" 
                        {...field}
                        value={field.value || ""} 
                      />
                    </FormControl>
                    <FormDescription>
                      URL de uma imagem que representa esta categoria (opcional)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slug</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="nome-da-categoria" 
                        {...field}
                        value={field.value || ""} 
                      />
                    </FormControl>
                    <FormDescription>
                      Identificador único para URLs (deixe em branco para gerar automaticamente)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Categoria ativa
                      </FormLabel>
                      <FormDescription>
                        Desmarque para esconder esta categoria no site
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Confirmação de exclusão */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteMutation.isError
                ? "Erro ao excluir categoria"
                : (deleteMutation.data?.postsUpdated > 0
                  ? "Categoria excluída com sucesso"
                  : "Excluir Categoria"
                )
              }
            </AlertDialogTitle>
            
            <AlertDialogDescription className={deleteMutation.isError ? "text-destructive" : ""}>
              {deleteMutation.isError && deleteMutation.error?.message
                ? deleteMutation.error.message
                : (deleteMutation.data?.postsUpdated > 0
                  ? `A categoria "${selectedCategory?.name}" foi excluída e ${deleteMutation.data.postsUpdated} postagens foram atualizadas para ficar sem categoria.`
                  : `Tem certeza que deseja excluir a categoria "${selectedCategory?.name}"?
                     Esta ação não poderá ser desfeita. Se houver posts vinculados a esta categoria,
                     eles permanecerão no sistema mas ficarão marcados como "Sem Categoria".`
                )
              }
            </AlertDialogDescription>
            
            {/* Aviso sobre vinculação de posts */}
            {!deleteMutation.isError && !deleteMutation.data && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-700">
                  <strong>Nota:</strong> A exclusão não remove os posts vinculados a esta categoria.
                  Os posts permanecerão disponíveis no sistema, mas serão exibidos como "Sem Categoria".
                </p>
              </div>
            )}
            
            {/* Mensagem de sucesso quando há posts atualizados */}
            {!deleteMutation.isError && deleteMutation.data?.postsUpdated > 0 && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm text-green-700">
                  <strong>Sucesso:</strong> {deleteMutation.data.postsUpdated} posts foram atualizados 
                  e agora estão sem categoria. Você pode posteriormente atribuir esses posts a outras categorias.
                </p>
              </div>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter>
            {deleteMutation.data ? (
              // Se já foi excluído com sucesso, mostrar apenas botão de fechar
              <AlertDialogCancel>Fechar</AlertDialogCancel>
            ) : (
              // Se ainda estamos na confirmação ou há erro
              <>
                <AlertDialogCancel>
                  {deleteMutation.isError ? "Fechar" : "Cancelar"}
                </AlertDialogCancel>
                
                {/* Mostrar botão de excluir apenas se não houver erro */}
                {!deleteMutation.isError && (
                  <AlertDialogAction
                    onClick={confirmDelete}
                    className="bg-destructive hover:bg-destructive/90"
                    disabled={deleteMutation.isPending}
                  >
                    {deleteMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Excluir
                  </AlertDialogAction>
                )}
              </>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}