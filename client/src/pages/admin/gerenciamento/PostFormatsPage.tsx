import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/layout/AdminLayout";
import { PageHeader } from "@/components/admin/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, LayoutTemplate, Pencil, Trash2, Square, PanelTop, LayoutList } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";

// Tipo para formatos de post
interface PostFormat {
  id: number;
  name: string;
  size: string;
  orientation: string;
  is_active: boolean;
  created_at: string;
}

// Tipo para criar/editar formato
interface PostFormatInput {
  name: string;
  size: string;
  orientation: string;
  is_active: boolean;
}

export default function PostFormatsPage() {
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [currentFormat, setCurrentFormat] = useState<PostFormat | null>(null);
  const [formData, setFormData] = useState<PostFormatInput>({
    name: '',
    size: '',
    orientation: 'Quadrado',
    is_active: true
  });

  // Buscar formatos de post
  const { data: postFormats, isLoading } = useQuery<PostFormat[]>({
    queryKey: ['/api/admin/post-formats'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/post-formats');
      return response.json();
    }
  });

  // Mutation para criar formato
  const createMutation = useMutation({
    mutationFn: async (data: PostFormatInput) => {
      const response = await apiRequest('POST', '/api/admin/post-formats', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/post-formats'] });
      setIsCreateOpen(false);
      resetForm();
      toast({
        title: 'Formato criado',
        description: 'O formato de post foi criado com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao criar formato',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Mutation para atualizar formato
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: PostFormatInput }) => {
      const response = await apiRequest('PATCH', `/api/admin/post-formats/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/post-formats'] });
      setIsEditOpen(false);
      resetForm();
      toast({
        title: 'Formato atualizado',
        description: 'O formato de post foi atualizado com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao atualizar formato',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Mutation para excluir formato
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/admin/post-formats/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/post-formats'] });
      setIsDeleteOpen(false);
      setCurrentFormat(null);
      toast({
        title: 'Formato excluído',
        description: 'O formato de post foi excluído com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao excluir formato',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Mutation para atualizar status
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: number, is_active: boolean }) => {
      const response = await apiRequest('PATCH', `/api/admin/post-formats/${id}`, { is_active });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/post-formats'] });
      toast({
        title: 'Status atualizado',
        description: 'O status do formato foi atualizado com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao atualizar status',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditOpen && currentFormat) {
      updateMutation.mutate({ id: currentFormat.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleToggleStatus = (format: PostFormat) => {
    toggleStatusMutation.mutate({
      id: format.id,
      is_active: !format.is_active
    });
  };

  const handleEditClick = (format: PostFormat) => {
    setCurrentFormat(format);
    setFormData({
      name: format.name,
      size: format.size,
      orientation: format.orientation,
      is_active: format.is_active
    });
    setIsEditOpen(true);
  };

  const handleDeleteClick = (format: PostFormat) => {
    setCurrentFormat(format);
    setIsDeleteOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      size: '',
      orientation: 'Quadrado',
      is_active: true
    });
    setCurrentFormat(null);
  };

  const renderOrientationIcon = (orientation: string) => {
    switch (orientation) {
      case 'Quadrado':
        return <Square size={16} className="mr-1 text-blue-500" />;
      case 'Vertical':
        return <PanelTop size={16} className="mr-1 text-green-500" />;
      case 'Horizontal':
        return <LayoutList size={16} className="mr-1 text-purple-500" />;
      default:
        return <LayoutTemplate size={16} className="mr-1 text-muted-foreground" />;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <PageHeader 
            title="Formatos de Post" 
            description="Gerencie os formatos de post disponíveis para os usuários" 
          />
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" /> Novo Formato de Post
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Formato de Post</DialogTitle>
                <DialogDescription>
                  Preencha os campos abaixo para adicionar um novo formato de post.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Formato</Label>
                  <Input 
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Feed, Stories, etc."
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="size">Tamanho</Label>
                  <Input 
                    id="size"
                    value={formData.size}
                    onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                    placeholder="Ex: 1080x1080px"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="orientation">Orientação</Label>
                  <Select 
                    value={formData.orientation} 
                    onValueChange={(value) => setFormData({ ...formData, orientation: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a orientação" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Quadrado">Quadrado</SelectItem>
                      <SelectItem value="Vertical">Vertical</SelectItem>
                      <SelectItem value="Horizontal">Horizontal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch 
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active">Ativo</Label>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                    Salvar
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Tabela de formatos */}
        <div className="bg-card rounded-md shadow">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Formato</TableHead>
                <TableHead>Tamanho</TableHead>
                <TableHead>Orientação</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6">
                    Carregando formatos...
                  </TableCell>
                </TableRow>
              ) : postFormats && postFormats.length > 0 ? (
                postFormats.map((format) => (
                  <TableRow key={format.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex justify-center items-center w-8 h-8 rounded-full bg-muted">
                          <LayoutTemplate size={16} />
                        </div>
                        <span className="font-medium">{format.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{format.size}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        {renderOrientationIcon(format.orientation)}
                        <span>{format.orientation}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${format.is_active ? 'bg-green-500' : 'bg-gray-300'}`} />
                        <span>{format.is_active ? 'Ativo' : 'Desativado'}</span>
                        <Switch 
                          checked={format.is_active}
                          onCheckedChange={() => handleToggleStatus(format)}
                          className="ml-2"
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditClick(format)}
                        className="mr-1"
                      >
                        <Pencil size={16} className="text-blue-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(format)}
                      >
                        <Trash2 size={16} className="text-red-600" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6">
                    Nenhum formato de post encontrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Modal de edição */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Formato de Post</DialogTitle>
            <DialogDescription>
              Atualize as informações do formato de post.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nome do Formato</Label>
              <Input 
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Feed, Stories, etc."
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-size">Tamanho</Label>
              <Input 
                id="edit-size"
                value={formData.size}
                onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                placeholder="Ex: 1080x1080px"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-orientation">Orientação</Label>
              <Select 
                value={formData.orientation} 
                onValueChange={(value) => setFormData({ ...formData, orientation: value })}
              >
                <SelectTrigger id="edit-orientation">
                  <SelectValue placeholder="Selecione a orientação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Quadrado">Quadrado</SelectItem>
                  <SelectItem value="Vertical">Vertical</SelectItem>
                  <SelectItem value="Horizontal">Horizontal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Switch 
                id="edit-is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="edit-is_active">Ativo</Label>
            </div>

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setIsEditOpen(false);
                  resetForm();
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                Salvar Alterações
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmação de exclusão */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o formato "{currentFormat?.name}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCurrentFormat(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-red-600 hover:bg-red-700"
              onClick={() => currentFormat && deleteMutation.mutate(currentFormat.id)}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}