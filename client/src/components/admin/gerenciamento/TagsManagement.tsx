import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  Edit, 
  MoreHorizontal, 
  Plus, 
  Search, 
  Trash, 
  Tag as TagIcon, 
  Check,
  X
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { type Tag } from "@shared/schema";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
} from "@/components/ui/dropdown-menu";
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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertTagSchema } from "@shared/schema";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

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

interface TagsManagementProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TagsManagement({ open, onOpenChange }: TagsManagementProps) {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState<Tag | null>(null);
  
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
  const handleToggleActive = (tag: Tag) => {
    toggleTagStatusMutation.mutate(tag.id);
  };
  
  // Função para abrir o modal de edição
  const handleEditClick = (tag: Tag) => {
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
  const handleDeleteClick = (tag: Tag) => {
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
  const filteredTags = tags.filter((tag: Tag) => {
    return (
      tag.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tag.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tag.description && tag.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md md:max-w-xl overflow-y-auto">
        <SheetHeader className="pb-4">
          <div className="flex items-center">
            <TagIcon className="mr-2 h-5 w-5" />
            <SheetTitle>Gerenciar Tags</SheetTitle>
          </div>
          <SheetDescription>
            Gerencie as tags utilizadas para melhorar o SEO das postagens.
          </SheetDescription>
        </SheetHeader>
        
        <div className="space-y-4 py-4">
          <div className="flex justify-between items-center">
            <div className="relative flex-1 mr-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <Input
                placeholder="Pesquisar tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Tag
            </Button>
          </div>
          
          {isLoading ? (
            <div className="text-center py-8">Carregando tags...</div>
          ) : filteredTags.length === 0 ? (
            <div className="text-center py-8">
              {searchTerm ? "Nenhuma tag encontrada com este termo de pesquisa." : "Nenhuma tag cadastrada."}
            </div>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Uso</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTags.map((tag: Tag) => (
                    <TableRow key={tag.id}>
                      <TableCell>
                        <div className="font-medium">{tag.name}</div>
                        <div className="text-xs text-muted-foreground">{tag.slug}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <button
                            className={`relative inline-flex h-4 w-8 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              tag.isActive ? 'bg-green-500' : 'bg-gray-200'
                            }`}
                            onClick={() => handleToggleActive(tag)}
                          >
                            <span
                              className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-card shadow ring-0 transition duration-200 ease-in-out ${
                                tag.isActive ? 'translate-x-4' : 'translate-x-0'
                              }`}
                            />
                          </button>
                          <span className="ml-2 text-xs">
                            {tag.isActive ? 'Ativo' : 'Inativo'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{tag.count || 0}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditClick(tag)}
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteClick(tag)}
                            className="text-destructive"
                            title="Excluir"
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
        
        {/* Dialog para criar nova tag */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Nova Tag</DialogTitle>
              <DialogDescription>
                Crie uma nova tag para categorizar e melhorar o SEO dos posts.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...createForm}>
              <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
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
                          {...field} 
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
                  >
                    {createTagMutation.isPending ? "Salvando..." : "Salvar"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
        
        {/* Dialog para editar tag */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Editar Tag</DialogTitle>
              <DialogDescription>
                Atualize as informações da tag.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
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
                          {...field} 
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
      </SheetContent>
    </Sheet>
  );
}