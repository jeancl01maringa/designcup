import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { AdminLayout } from "@/components/admin/layout/AdminLayout";
import { PageHeader } from "@/components/admin/layout/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, ArrowLeft, Edit, Trash2, Play, BookOpen, MoreHorizontal, GripVertical } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface Module {
  id: number;
  courseId: number;
  title: string;
  description: string;
  orderIndex: number;
  lessonCount?: number;
}

interface Lesson {
  id: number;
  moduleId: number;
  title: string;
  description: string;
  content: string;
  type: 'video' | 'text' | 'quiz';
  duration?: number;
  orderIndex: number;
}

export default function ModulosPage() {
  const params = useParams();
  const courseId = parseInt(params.courseId || "0");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isCreateModuleDialogOpen, setIsCreateModuleDialogOpen] = useState(false);
  const [isEditModuleDialogOpen, setIsEditModuleDialogOpen] = useState(false);
  const [isDeleteModuleDialogOpen, setIsDeleteModuleDialogOpen] = useState(false);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [moduleFormData, setModuleFormData] = useState({
    title: "",
    description: "",
  });

  // Buscar curso
  const { data: course } = useQuery({
    queryKey: [`/api/admin/courses/${courseId}`],
  });

  // Buscar módulos
  const { data: modules = [], isLoading } = useQuery<Module[]>({
    queryKey: [`/api/admin/courses/${courseId}/modules`],
  });

  // Criar módulo
  const createModuleMutation = useMutation({
    mutationFn: async (data: { title: string; description: string }) => {
      const res = await apiRequest("POST", `/api/admin/courses/${courseId}/modules`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/courses/${courseId}/modules`] });
      setIsCreateModuleDialogOpen(false);
      resetModuleForm();
      toast({ title: "Módulo criado com sucesso!" });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar módulo",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Atualizar módulo
  const updateModuleMutation = useMutation({
    mutationFn: async (data: { id: number; title: string; description: string }) => {
      const res = await apiRequest("PUT", `/api/admin/modules/${data.id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/courses/${courseId}/modules`] });
      setIsEditModuleDialogOpen(false);
      resetModuleForm();
      toast({ title: "Módulo atualizado com sucesso!" });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar módulo",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Excluir módulo
  const deleteModuleMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/modules/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/courses/${courseId}/modules`] });
      setIsDeleteModuleDialogOpen(false);
      setSelectedModule(null);
      toast({ title: "Módulo excluído com sucesso!" });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir módulo",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetModuleForm = () => {
    setModuleFormData({
      title: "",
      description: "",
    });
  };

  const openCreateModuleDialog = () => {
    resetModuleForm();
    setIsCreateModuleDialogOpen(true);
  };

  const openEditModuleDialog = (module: Module) => {
    setSelectedModule(module);
    setModuleFormData({
      title: module.title,
      description: module.description,
    });
    setIsEditModuleDialogOpen(true);
  };

  const openDeleteModuleDialog = (module: Module) => {
    setSelectedModule(module);
    setIsDeleteModuleDialogOpen(true);
  };

  const handleCreateModule = () => {
    if (!moduleFormData.title.trim()) {
      toast({
        title: "Erro",
        description: "O título do módulo é obrigatório",
        variant: "destructive",
      });
      return;
    }
    createModuleMutation.mutate(moduleFormData);
  };

  const handleUpdateModule = () => {
    if (!selectedModule || !moduleFormData.title.trim()) {
      toast({
        title: "Erro",
        description: "O título do módulo é obrigatório",
        variant: "destructive",
      });
      return;
    }
    updateModuleMutation.mutate({
      id: selectedModule.id,
      ...moduleFormData,
    });
  };

  const handleDeleteModule = () => {
    if (selectedModule) {
      deleteModuleMutation.mutate(selectedModule.id);
    }
  };

  return (
    <AdminLayout>
      <Helmet>
        <title>Gerenciar Módulos - Admin</title>
      </Helmet>

      <div className="space-y-6">
        <PageHeader
          title={`Módulos do Curso: ${course?.title || 'Carregando...'}`}
          description="Gerencie os módulos e aulas do curso"
          action={
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => window.history.back()}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
              <Button onClick={openCreateModuleDialog} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Novo Módulo
              </Button>
            </div>
          }
        />

        <Card>
          <CardHeader>
            <CardTitle>Lista de Módulos</CardTitle>
            <CardDescription>
              Gerencie todos os módulos e aulas do curso
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Carregando módulos...</div>
            ) : modules.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum módulo encontrado</p>
                <p className="text-sm">Clique em "Novo Módulo" para começar</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Módulo</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Aulas</TableHead>
                    <TableHead>Ordem</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {modules.map((module) => (
                    <TableRow key={module.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <GripVertical className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{module.title}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate text-muted-foreground">
                          {module.description || 'Sem descrição'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Play className="h-4 w-4 text-muted-foreground" />
                          {module.lessonCount || 0}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">#{module.orderIndex}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Abrir menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditModuleDialog(module)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Play className="h-4 w-4 mr-2" />
                              Gerenciar Aulas
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => openDeleteModuleDialog(module)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog Criar Módulo */}
      <Dialog open={isCreateModuleDialogOpen} onOpenChange={setIsCreateModuleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Novo Módulo</DialogTitle>
            <DialogDescription>
              Adicione um novo módulo ao curso
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={moduleFormData.title}
                onChange={(e) => setModuleFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Ex: Introdução ao Design"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={moduleFormData.description}
                onChange={(e) => setModuleFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descreva o conteúdo do módulo..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateModuleDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateModule} disabled={createModuleMutation.isPending}>
              {createModuleMutation.isPending ? "Criando..." : "Criar Módulo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Editar Módulo */}
      <Dialog open={isEditModuleDialogOpen} onOpenChange={setIsEditModuleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Módulo</DialogTitle>
            <DialogDescription>
              Atualize as informações do módulo
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Título *</Label>
              <Input
                id="edit-title"
                value={moduleFormData.title}
                onChange={(e) => setModuleFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Ex: Introdução ao Design"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Descrição</Label>
              <Textarea
                id="edit-description"
                value={moduleFormData.description}
                onChange={(e) => setModuleFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descreva o conteúdo do módulo..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModuleDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateModule} disabled={updateModuleMutation.isPending}>
              {updateModuleMutation.isPending ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Confirmar Exclusão */}
      <AlertDialog open={isDeleteModuleDialogOpen} onOpenChange={setIsDeleteModuleDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o módulo "{selectedModule?.title}"?
              Esta ação não pode ser desfeita e todas as aulas do módulo também serão excluídas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteModule}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteModuleMutation.isPending}
            >
              {deleteModuleMutation.isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}