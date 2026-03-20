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
import { Plus, FileType, Pencil, Trash2, Download, FileEdit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

// Tipo para formatos de arquivo
interface FileFormat {
  id: number;
  name: string;
  type: 'Editável' | 'Download';
  icon: string;
  is_active: boolean;
  created_at: string;
}

// Tipo para criar/editar formato
interface FileFormatInput {
  name: string;
  type: 'Editável' | 'Download';
  icon: string;
  is_active: boolean;
}

export default function FileFormatsPage() {
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [currentFormat, setCurrentFormat] = useState<FileFormat | null>(null);
  const [formData, setFormData] = useState<FileFormatInput>({
    name: '',
    type: 'Editável',
    icon: 'canva',
    is_active: true
  });

  // Buscar formatos de arquivo
  const { data: fileFormats, isLoading } = useQuery<FileFormat[]>({
    queryKey: ['/api/admin/file-formats'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/file-formats');
      return response.json();
    }
  });

  // Mutation para criar formato
  const createMutation = useMutation({
    mutationFn: async (data: FileFormatInput) => {
      const response = await apiRequest('POST', '/api/admin/file-formats', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/file-formats'] });
      setIsCreateOpen(false);
      resetForm();
      toast({
        title: 'Formato criado',
        description: 'O formato de arquivo foi criado com sucesso.',
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
    mutationFn: async ({ id, data }: { id: number, data: FileFormatInput }) => {
      const response = await apiRequest('PATCH', `/api/admin/file-formats/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/file-formats'] });
      setIsEditOpen(false);
      resetForm();
      toast({
        title: 'Formato atualizado',
        description: 'O formato de arquivo foi atualizado com sucesso.',
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
      const response = await apiRequest('DELETE', `/api/admin/file-formats/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/file-formats'] });
      setIsDeleteOpen(false);
      setCurrentFormat(null);
      toast({
        title: 'Formato excluído',
        description: 'O formato de arquivo foi excluído com sucesso.',
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
      const response = await apiRequest('PATCH', `/api/admin/file-formats/${id}`, { is_active });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/file-formats'] });
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

  const handleToggleStatus = (format: FileFormat) => {
    toggleStatusMutation.mutate({
      id: format.id,
      is_active: !format.is_active
    });
  };

  const handleEditClick = (format: FileFormat) => {
    setCurrentFormat(format);
    setFormData({
      name: format.name,
      type: format.type as 'Editável' | 'Download',
      icon: format.icon,
      is_active: format.is_active
    });
    setIsEditOpen(true);
  };

  const handleDeleteClick = (format: FileFormat) => {
    setCurrentFormat(format);
    setIsDeleteOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'Editável',
      icon: 'canva',
      is_active: true
    });
    setCurrentFormat(null);
  };

  const renderTypeIcon = (type: string) => {
    if (type === 'Editável') {
      return <FileEdit size={16} className="mr-1 text-blue-500" />;
    }
    return <Download size={16} className="mr-1 text-green-500" />;
  };

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <PageHeader 
            title="Formatos de Arquivo" 
            description="Gerencie os formatos de arquivo disponíveis para os usuários" 
          />
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" /> Novo Formato de Arquivo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Formato de Arquivo</DialogTitle>
                <DialogDescription>
                  Preencha os campos abaixo para adicionar um novo formato de arquivo.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Formato</Label>
                  <Input 
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Canva, PSD, etc."
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Tipo</Label>
                  <Select 
                    value={formData.type} 
                    onValueChange={(value) => setFormData({ ...formData, type: value as 'Editável' | 'Download' })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Editável">Editável</SelectItem>
                      <SelectItem value="Download">Download</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="icon">Ícone</Label>
                  <Input 
                    id="icon"
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    placeholder="Nome do ícone"
                  />
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
                <TableHead>Ícone</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
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
              ) : fileFormats && fileFormats.length > 0 ? (
                fileFormats.map((format) => (
                  <TableRow key={format.id}>
                    <TableCell>
                      <div className="flex justify-center items-center w-8 h-8 rounded-full bg-muted">
                        <FileType size={16} />
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{format.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        {renderTypeIcon(format.type)}
                        <span>{format.type}</span>
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
                    Nenhum formato de arquivo encontrado
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
            <DialogTitle>Editar Formato de Arquivo</DialogTitle>
            <DialogDescription>
              Atualize as informações do formato de arquivo.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nome do Formato</Label>
              <Input 
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Canva, PSD, etc."
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-type">Tipo</Label>
              <Select 
                value={formData.type} 
                onValueChange={(value) => setFormData({ ...formData, type: value as 'Editável' | 'Download' })}
              >
                <SelectTrigger id="edit-type">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Editável">Editável</SelectItem>
                  <SelectItem value="Download">Download</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-icon">Ícone</Label>
              <Input 
                id="edit-icon"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                placeholder="Nome do ícone"
              />
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