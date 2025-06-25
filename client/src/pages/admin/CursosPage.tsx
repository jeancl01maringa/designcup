import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { AdminLayout } from "@/components/admin/layout/AdminLayout";
import { PageHeader } from "@/components/admin/layout/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Search, Edit, Trash2, Users, BookOpen, Play, FileText, ExternalLink, MoreHorizontal, Eye, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Course } from "@shared/schema";

interface CourseWithStats extends Course {
  moduleCount: number;
  lessonCount: number;
  enrollmentCount: number;
}

export default function CursosPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<CourseWithStats | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    shortDescription: "",
    coverImage: "",
    isActive: true,
  });

  // Buscar cursos
  const { data: courses = [], isLoading } = useQuery<CourseWithStats[]>({
    queryKey: ["/api/admin/courses"],
  });

  // Filtrar cursos por termo de busca
  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Mutation para criar curso
  const createCourseMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiRequest("POST", "/api/admin/courses", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/courses"] });
      setIsCreateDialogOpen(false);
      resetForm();
      toast({
        title: "Curso criado!",
        description: "O curso foi criado com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar curso",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation para atualizar curso
  const updateCourseMutation = useMutation({
    mutationFn: async (data: typeof formData & { id: number }) => {
      const res = await apiRequest("PUT", `/api/admin/courses/${data.id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/courses"] });
      setIsEditDialogOpen(false);
      resetForm();
      toast({
        title: "Curso atualizado!",
        description: "O curso foi atualizado com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar curso",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation para excluir curso
  const deleteCourseMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/courses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/courses"] });
      setIsDeleteDialogOpen(false);
      setSelectedCourse(null);
      toast({
        title: "Curso excluído!",
        description: "O curso foi excluído com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir curso",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      shortDescription: "",
      coverImage: "",
      isActive: true,
    });
  };

  const openEditDialog = (course: CourseWithStats) => {
    setSelectedCourse(course);
    setFormData({
      title: course.title,
      description: course.description || "",
      shortDescription: course.shortDescription || "",
      coverImage: course.coverImage || "",
      isActive: course.isActive,
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (course: CourseWithStats) => {
    setSelectedCourse(course);
    setIsDeleteDialogOpen(true);
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
  };

  return (
    <AdminLayout>
      <Helmet>
        <title>Cursos - Admin</title>
      </Helmet>

      <PageHeader 
        title="Gerenciar Cursos" 
        subtitle="Crie e gerencie cursos da plataforma" 
      />

      {/* Barra de ações */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar cursos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Curso
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Criar Novo Curso</DialogTitle>
              <DialogDescription>
                Preencha as informações básicas do curso
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Título do Curso</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex: Kit de Mídias para Estética"
                />
              </div>
              <div>
                <Label htmlFor="shortDescription">Descrição Curta</Label>
                <Input
                  id="shortDescription"
                  value={formData.shortDescription}
                  onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                  placeholder="Descrição que aparece nos cards"
                />
              </div>
              <div>
                <Label htmlFor="description">Descrição Completa</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrição detalhada do curso"
                  rows={4}
                />
              </div>
              <div>
                <Label htmlFor="coverImage">URL da Capa</Label>
                <Input
                  id="coverImage"
                  value={formData.coverImage}
                  onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                  placeholder="https://exemplo.com/capa.jpg"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
                <Label htmlFor="isActive">Curso ativo</Label>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreateDialogOpen(false);
                  resetForm();
                }}
              >
                Cancelar
              </Button>
              <Button 
                onClick={() => createCourseMutation.mutate(formData)}
                disabled={createCourseMutation.isPending || !formData.title}
              >
                {createCourseMutation.isPending ? "Criando..." : "Criar Curso"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabela de cursos */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Cursos</CardTitle>
          <CardDescription>
            Gerencie todos os cursos da plataforma
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 rounded animate-pulse"></div>
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Curso</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Módulos</TableHead>
                  <TableHead>Aulas</TableHead>
                  <TableHead>Inscritos</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCourses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      Nenhum curso encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCourses.map((course) => (
                    <TableRow key={course.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{course.title}</div>
                          {course.shortDescription && (
                            <div className="text-sm text-muted-foreground">
                              {course.shortDescription}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(course.isActive)}>
                          {course.isActive ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <BookOpen className="h-4 w-4 text-muted-foreground" />
                          {course.moduleCount}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Play className="h-4 w-4 text-muted-foreground" />
                          {course.lessonCount}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          {course.enrollmentCount}
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(new Date(course.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Abrir menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditDialog(course)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <BookOpen className="h-4 w-4 mr-2" />
                              Gerenciar Módulos
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Users className="h-4 w-4 mr-2" />
                              Ver Inscritos
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => openDeleteDialog(course)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog de edição */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Curso</DialogTitle>
            <DialogDescription>
              Atualize as informações do curso
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-title">Título do Curso</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-shortDescription">Descrição Curta</Label>
              <Input
                id="edit-shortDescription"
                value={formData.shortDescription}
                onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Descrição Completa</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
              />
            </div>
            <div>
              <Label htmlFor="edit-coverImage">URL da Capa</Label>
              <Input
                id="edit-coverImage"
                value={formData.coverImage}
                onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
              <Label htmlFor="edit-isActive">Curso ativo</Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                resetForm();
              }}
            >
              Cancelar
            </Button>
            <Button 
              onClick={() => selectedCourse && updateCourseMutation.mutate({ ...formData, id: selectedCourse.id })}
              disabled={updateCourseMutation.isPending || !formData.title}
            >
              {updateCourseMutation.isPending ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir curso</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o curso "{selectedCourse?.title}"? 
              Esta ação não pode ser desfeita e todos os módulos e aulas serão removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => selectedCourse && deleteCourseMutation.mutate(selectedCourse.id)}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {deleteCourseMutation.isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}