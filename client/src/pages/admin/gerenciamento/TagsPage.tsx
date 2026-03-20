import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { AdminLayout } from "@/components/admin/layout/AdminLayout";
import { PageHeader } from "@/components/admin/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Tag, Pencil, Trash2, Hash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { type Tag as TagType } from "@shared/schema";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertTagSchema } from "@shared/schema";
import { z } from "zod";

// Schema estendido para validação do formulário
const tagFormSchema = insertTagSchema.extend({
  name: z.string().min(2, {
    message: "O nome deve ter pelo menos 2 caracteres.",
  }),
  slug: z.string().min(2, {
    message: "O slug deve ter pelo menos 2 caracteres.",
  }),
});

type TagFormValues = z.infer<typeof tagFormSchema>;

export default function TagsPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState<TagType | null>(null);
  
  const queryClient = useQueryClient();
  
  // Query para buscar todas as tags
  const { data: tags = [], isLoading } = useQuery({
    queryKey: ['/api/admin/tags'],
    queryFn: async () => {
      const res = await fetch('/api/admin/tags');
      if (!res.ok) throw new Error('Falha ao carregar tags');
      return res.json();
    }
  });
  
  // Formulário para criar novas tags
  const createForm = useForm<TagFormValues>({
    resolver: zodResolver(tagFormSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      isActive: true
    }
  });
  
  // Formulário para editar tags
  const editForm = useForm<TagFormValues>({
    resolver: zodResolver(tagFormSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      isActive: true
    }
  });
  
  // Mutation para criar tag
  const createTagMutation = useMutation({
    mutationFn: async (values: TagFormValues) => {
      const res = await apiRequest("POST", "/api/admin/tags", values);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Falha ao criar tag');
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/tags'] });
      setIsCreateDialogOpen(false);
      createForm.reset();
      toast({
        title: "Tag criada",
        description: "A tag foi criada com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar tag",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Mutation para atualizar tag
  const updateTagMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: Partial<TagFormValues> }) => {
      const res = await apiRequest("PATCH", `/api/admin/tags/${id}`, data);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Falha ao atualizar tag');
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/tags'] });
      setIsEditDialogOpen(false);
      setSelectedTag(null);
      toast({
        title: "Tag atualizada",
        description: "A tag foi atualizada com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar tag",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Mutation para excluir tag
  const deleteTagMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/admin/tags/${id}`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Falha ao excluir tag');
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/tags'] });
      setIsDeleteDialogOpen(false);
      setSelectedTag(null);
      toast({
        title: "Tag excluída",
        description: "A tag foi excluída com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir tag",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Mutation para alternar o status de uma tag (ativo/inativo)
  const toggleTagStatusMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("PATCH", `/api/admin/tags/${id}/toggle`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Falha ao alternar status da tag');
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/tags'] });
      toast({
        title: "Status alterado",
        description: "O status da tag foi alterado com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao alternar status",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Função para criar uma tag
  const onCreateSubmit = (values: TagFormValues) => {
    createTagMutation.mutate(values);
  };
  
  // Função para editar uma tag
  const onEditSubmit = (values: TagFormValues) => {
    if (!selectedTag) return;
    updateTagMutation.mutate({ id: selectedTag.id, data: values });
  };
  
  // Função para excluir uma tag
  const onDeleteConfirm = () => {
    if (!selectedTag) return;
    deleteTagMutation.mutate(selectedTag.id);
  };
  
  // Função para alternar o status de uma tag (ativo/inativo)
  const handleToggleActive = (tag: TagType) => {
    toggleTagStatusMutation.mutate(tag.id);
  };
  
  // Função para abrir o modal de edição
  const handleEditClick = (tag: TagType) => {
    setSelectedTag(tag);
    editForm.reset({
      name: tag.name,
      slug: tag.slug,
      description: tag.description || "",
      isActive: tag.isActive
    });
    setIsEditDialogOpen(true);
  };
  
  // Função para abrir o modal de exclusão
  const handleDeleteClick = (tag: TagType) => {
    setSelectedTag(tag);
    setIsDeleteDialogOpen(true);
  };
  
  // Função para converter string para slug
  const generateSlug = (text: string) => {
    return text
      .toString()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]+/g, '')
      .replace(/--+/g, '-');
  };
  
  // Atualiza automaticamente o slug quando o nome é alterado no formulário de criação
  const watchCreateName = createForm.watch("name");
  if (watchCreateName && !createForm.getValues("slug")) {
    const slug = generateSlug(watchCreateName);
    createForm.setValue("slug", slug);
  }
  
  // Filtrar tags com base no termo de pesquisa
  const filteredTags = tags.filter((tag: TagType) => {
    return (
      tag.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tag.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tag.description && tag.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  return (
    <AdminLayout>
      <Helmet>
        <title>Gerenciar Tags - Painel Administrativo</title>
      </Helmet>
      
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <PageHeader 
            title="Gerenciar Tags" 
            description="Gerencie as tags utilizadas para melhorar o SEO das postagens" 
          />
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" /> Nova Tag
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Tag</DialogTitle>
                <DialogDescription>
                  Preencha os campos abaixo para adicionar uma nova tag.
                </DialogDescription>
              </DialogHeader>
              <Form {...createForm}>
                <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4 pt-4">
                  <FormField
                    control={createForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Digite o nome da tag" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={createForm.control}
                    name="slug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Slug</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="slug-da-tag" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={createForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field as any} 
                            placeholder="Descrição da tag (opcional)" 
                            className="resize-none"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={createForm.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel>Ativa</FormLabel>
                          <FormDescription>
                            Esta tag estará visível e utilizável no sistema.
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <DialogFooter>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsCreateDialogOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      type="submit"
                      disabled={createTagMutation.isPending}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {createTagMutation.isPending ? "Salvando..." : "Salvar"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Campo de busca */}
        <div className="relative w-full md:w-96 mb-4">
          <Input
            placeholder="Buscar tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Hash className="h-4 w-4 text-gray-400" />
          </div>
        </div>
      
        {/* Tabela de tags */}
        <div className="bg-card rounded-md shadow">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Uso</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6">
                    Carregando tags...
                  </TableCell>
                </TableRow>
              ) : filteredTags.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6">
                    {searchTerm ? "Nenhuma tag encontrada com este termo de pesquisa." : "Nenhuma tag cadastrada."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredTags.map((tag: TagType) => (
                  <TableRow key={tag.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex justify-center items-center w-8 h-8 rounded-full bg-muted">
                          <Tag size={16} />
                        </div>
                        <span className="font-medium">{tag.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">#{tag.slug}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${tag.isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
                        <span>{tag.isActive ? 'Ativo' : 'Desativado'}</span>
                        <Switch 
                          checked={tag.isActive}
                          onCheckedChange={() => handleToggleActive(tag)}
                          className="ml-2"
                        />
                      </div>
                    </TableCell>
                    <TableCell>{tag.count || 0} posts</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditClick(tag)}
                        className="mr-1"
                      >
                        <Pencil size={16} className="text-blue-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(tag)}
                      >
                        <Trash2 size={16} className="text-red-600" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Modal de edição */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Tag</DialogTitle>
            <DialogDescription>
              Atualize as informações da tag.
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4 pt-4">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Digite o nome da tag" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slug</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="slug-da-tag" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field as any} 
                        placeholder="Descrição da tag (opcional)" 
                        className="resize-none"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel>Ativa</FormLabel>
                      <FormDescription>
                        Esta tag estará visível e utilizável no sistema.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit"
                  disabled={updateTagMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {updateTagMutation.isPending ? "Salvando..." : "Salvar"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Alert dialog para confirmar exclusão */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a tag "{selectedTag?.name}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={onDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteTagMutation.isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}