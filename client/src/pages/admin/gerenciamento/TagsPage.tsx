import React, { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { z } from "zod";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AdminLayout } from "@/components/admin/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tag, InsertTag } from "@shared/schema";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Switch } from "@/components/ui/switch";
import { Tag as TagIcon, Plus, Edit, Trash, Search, Check } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(2, {
    message: "O nome da tag deve ter pelo menos 2 caracteres."
  }),
  slug: z.string().min(2, {
    message: "O slug deve ter pelo menos 2 caracteres."
  }).regex(/^[a-z0-9-]+$/, {
    message: "O slug deve conter apenas letras minúsculas, números e hífens."
  }),
  description: z.string().optional(),
  isActive: z.boolean().default(true)
});

export default function TagsPage() {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState<Tag | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      isActive: true
    }
  });
  
  const { data: tags, isLoading } = useQuery<Tag[]>({
    queryKey: ["/api/admin/tags"],
    refetchOnWindowFocus: false
  });
  
  const createMutation = useMutation({
    mutationFn: async (data: InsertTag) => {
      const response = await fetch("/api/admin/tags", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Falha ao criar tag");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Tag criada com sucesso",
        description: "A tag foi adicionada à base de dados",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tags"] });
      setIsCreateDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar tag",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: Partial<InsertTag> }) => {
      const response = await fetch(`/api/admin/tags/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Falha ao atualizar tag");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Tag atualizada com sucesso",
        description: "As alterações foram salvas",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tags"] });
      setIsEditDialogOpen(false);
      setSelectedTag(null);
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar tag",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/admin/tags/${id}`, {
        method: "DELETE"
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Falha ao excluir tag");
      }
      
      return true;
    },
    onSuccess: () => {
      toast({
        title: "Tag excluída com sucesso",
        description: "A tag foi removida da base de dados",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tags"] });
      setIsDeleteDialogOpen(false);
      setSelectedTag(null);
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir tag",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number, isActive: boolean }) => {
      const response = await fetch(`/api/admin/tags/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ isActive })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Falha ao alterar status da tag");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Status alterado",
        description: "O status da tag foi atualizado com sucesso",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tags"] });
    },
    onError: (error) => {
      toast({
        title: "Erro ao alterar status",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  const onCreateSubmit = (data: z.infer<typeof formSchema>) => {
    createMutation.mutate(data);
  };
  
  const onEditSubmit = (data: z.infer<typeof formSchema>) => {
    if (selectedTag) {
      updateMutation.mutate({
        id: selectedTag.id,
        data
      });
    }
  };
  
  const handleToggleActive = (tag: Tag) => {
    toggleActiveMutation.mutate({
      id: tag.id,
      isActive: !tag.isActive
    });
  };
  
  const handleDeleteConfirm = () => {
    if (selectedTag) {
      deleteMutation.mutate(selectedTag.id);
    }
  };
  
  const handleEditClick = (tag: Tag) => {
    setSelectedTag(tag);
    form.reset({
      name: tag.name,
      slug: tag.slug,
      description: tag.description || "",
      isActive: tag.isActive
    });
    setIsEditDialogOpen(true);
  };
  
  const handleDeleteClick = (tag: Tag) => {
    setSelectedTag(tag);
    setIsDeleteDialogOpen(true);
  };
  
  const handleCreateClick = () => {
    form.reset({
      name: "",
      slug: "",
      description: "",
      isActive: true
    });
    setIsCreateDialogOpen(true);
  };
  
  // Gerar slug automático a partir do nome
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "name") {
        const nameValue = value.name as string;
        if (nameValue) {
          const slug = nameValue
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^\w\s-]/g, "")
            .replace(/\s+/g, "-");
          
          form.setValue("slug", slug, { shouldValidate: true });
        }
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form]);
  
  const filteredTags = tags ? tags.filter(tag => 
    tag.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tag.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tag.slug.toLowerCase().includes(searchQuery.toLowerCase())
  ) : [];
  
  return (
    <>
      <Helmet>
        <title>Gerenciamento de Tags | Design para Estética</title>
      </Helmet>
      
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Gerenciamento de Tags</h1>
              <p className="text-muted-foreground mt-2">
                Gerencie as tags para melhorar o SEO e a organização do conteúdo
              </p>
            </div>
            <div>
              <Button onClick={handleCreateClick}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Tag
              </Button>
            </div>
          </div>
          
          <Separator />
          
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar tags..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array(6).fill(0).map((_, index) => (
                <Card key={index} className="animate-pulse">
                  <CardHeader className="pb-3">
                    <div className="h-5 bg-muted rounded w-1/2"></div>
                    <div className="h-4 bg-muted rounded w-1/3 mt-1"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <div className="h-9 bg-muted rounded w-20"></div>
                    <div className="h-9 bg-muted rounded w-20"></div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <>
              {filteredTags.length === 0 ? (
                <div className="text-center py-10">
                  <TagIcon className="h-12 w-12 text-muted-foreground mx-auto" />
                  <h3 className="mt-4 text-lg font-semibold">Nenhuma tag encontrada</h3>
                  <p className="mt-1 text-muted-foreground">
                    {searchQuery ? "Tente ajustar sua busca." : "Comece adicionando uma nova tag."}
                  </p>
                  {searchQuery && (
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => setSearchQuery("")}
                    >
                      Limpar busca
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredTags.map((tag) => (
                    <Card key={tag.id} className={!tag.isActive ? "opacity-70" : ""}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-xl font-semibold truncate">
                            {tag.name}
                          </CardTitle>
                          <Badge variant={tag.isActive ? "default" : "outline"}>
                            {tag.isActive ? "Ativo" : "Inativo"}
                          </Badge>
                        </div>
                        <CardDescription className="mt-1">
                          <code className="bg-muted rounded-sm px-1 py-0.5 text-xs font-mono">
                            {tag.slug}
                          </code>
                          {tag.count > 0 && (
                            <span className="ml-2 text-xs">
                              {tag.count} {tag.count === 1 ? "uso" : "usos"}
                            </span>
                          )}
                        </CardDescription>
                      </CardHeader>
                      
                      <CardContent>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {tag.description || "Sem descrição"}
                        </p>
                      </CardContent>
                      
                      <CardFooter>
                        <div className="flex space-x-2 w-full justify-between">
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditClick(tag)}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Editar
                            </Button>
                            
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteClick(tag)}
                            >
                              <Trash className="h-4 w-4 mr-1" />
                              Excluir
                            </Button>
                          </div>
                          
                          <Switch
                            checked={tag.isActive}
                            onCheckedChange={() => handleToggleActive(tag)}
                          />
                        </div>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
          
          {/* Dialog para criar nova tag */}
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Nova Tag</DialogTitle>
                <DialogDescription>
                  As tags são usadas para categorizar e facilitar a busca do seu conteúdo.
                  Boas tags aumentam a visibilidade no Google.
                </DialogDescription>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onCreateSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome da Tag</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Tratamentos Estéticos" {...field} />
                        </FormControl>
                        <FormDescription>
                          Use termos que os usuários buscariam no Google
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
                          <Input placeholder="Ex: tratamentos-esteticos" {...field} />
                        </FormControl>
                        <FormDescription>
                          URL amigável para a tag (gerado automaticamente)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição (opcional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Descreva brevemente a finalidade desta tag"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Breve descrição para ajudar na organização
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Ativo</FormLabel>
                          <FormDescription>
                            Desative para ocultar temporariamente esta tag
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
                    <Button type="submit" disabled={createMutation.isPending}>
                      {createMutation.isPending ? "Criando..." : "Criar Tag"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
          
          {/* Dialog para editar tag */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Editar Tag</DialogTitle>
                <DialogDescription>
                  Atualize as informações da tag selecionada.
                </DialogDescription>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onEditSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome da Tag</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
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
                          <Input {...field} />
                        </FormControl>
                        <FormDescription>
                          Parte da URL que identifica esta tag
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição (opcional)</FormLabel>
                        <FormControl>
                          <Textarea {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Ativo</FormLabel>
                          <FormDescription>
                            Desative para ocultar temporariamente esta tag
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
                    <Button type="submit" disabled={updateMutation.isPending}>
                      {updateMutation.isPending ? "Salvando..." : "Salvar Alterações"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
          
          {/* AlertDialog para confirmar exclusão */}
          <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação não pode ser desfeita. A tag <strong>{selectedTag?.name}</strong> será permanentemente removida da base de dados.
                  {selectedTag?.count && selectedTag.count > 0 && (
                    <p className="mt-2 text-red-600 font-medium">
                      Atenção: Esta tag está sendo usada em {selectedTag.count} {selectedTag.count === 1 ? "postagem" : "postagens"}.
                    </p>
                  )}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteConfirm}
                  disabled={deleteMutation.isPending}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {deleteMutation.isPending ? "Excluindo..." : "Excluir Tag"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          
        </div>
      </AdminLayout>
    </>
  );
}