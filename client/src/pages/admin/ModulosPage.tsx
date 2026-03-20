import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { AdminLayout } from "@/components/admin/layout/AdminLayout";
import { PageHeader } from "@/components/admin/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, ArrowLeft, Edit, Trash2, MoreHorizontal, GripVertical, ChevronDown, ChevronRight, Upload, Search, Maximize2, Copy, FileText, Heart, MessageSquare, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface Module {
  id: number;
  courseId: number;
  title: string;
  description: string;
  orderIndex: number;
  lessonCount?: number;
  lessons?: Lesson[];
}

interface Course {
  id: number;
  title: string;
  description?: string;
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
  isPublished?: boolean;
}

export default function ModulosPage() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const courseId = parseInt(params.courseId || "0");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedAll, setSelectedAll] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set());
  const [editingTitle, setEditingTitle] = useState<string | null>(null);
  const [tempTitle, setTempTitle] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Buscar curso
  const { data: course } = useQuery<Course>({
    queryKey: [`/api/admin/courses/${courseId}`],
  });

  // Buscar módulos com aulas
  const { data: modules = [], isLoading } = useQuery<Module[]>({
    queryKey: [`/api/admin/courses/${courseId}/modules`],
    select: (data) => data.map(module => ({
      ...module,
      lessons: module.lessons || []
    }))
  });

  // Criar módulo
  const createModuleMutation = useMutation({
    mutationFn: async (data: { title: string }) => {
      const res = await apiRequest("POST", `/api/admin/courses/${courseId}/modules`, {
        title: data.title,
        description: "",
        orderIndex: (modules.length + 1)
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/courses/${courseId}/modules`] });
      toast({ title: "Módulo criado com sucesso!" });
    },
  });

  // Criar aula
  const createLessonMutation = useMutation({
    mutationFn: async (data: { moduleId: number; title: string }) => {
      const res = await apiRequest("POST", `/api/admin/modules/${data.moduleId}/lessons`, {
        title: data.title,
        description: "",
        content: "",
        type: "video"
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/courses/${courseId}/modules`] });
      toast({ title: "Aula criada com sucesso!" });
    },
  });

  // Atualizar título (módulo ou aula)
  const updateTitleMutation = useMutation({
    mutationFn: async (data: { type: 'module' | 'lesson'; id: number; title: string }) => {
      const endpoint = data.type === 'module' 
        ? `/api/admin/modules/${data.id}` 
        : `/api/admin/lessons/${data.id}`;
      const res = await apiRequest("PUT", endpoint, { title: data.title });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/courses/${courseId}/modules`] });
      setEditingTitle(null);
      toast({ title: "Título atualizado com sucesso!" });
    },
  });

  // Atualizar ordem dos módulos
  const updateModuleOrderMutation = useMutation({
    mutationFn: async (moduleIds: number[]) => {
      const res = await apiRequest("PUT", `/api/admin/courses/${courseId}/modules/reorder`, { moduleIds });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/courses/${courseId}/modules`] });
      toast({ title: "Ordem dos módulos atualizada!" });
    },
  });

  // Atualizar ordem das aulas
  const updateLessonOrderMutation = useMutation({
    mutationFn: async (data: { moduleId: number; lessonIds: number[] }) => {
      const res = await apiRequest("PUT", `/api/admin/modules/${data.moduleId}/lessons/reorder`, { lessonIds: data.lessonIds });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/courses/${courseId}/modules`] });
      toast({ title: "Ordem das aulas atualizada!" });
    },
  });

  // Excluir módulo
  const deleteModuleMutation = useMutation({
    mutationFn: async (moduleId: number) => {
      const res = await apiRequest("DELETE", `/api/admin/modules/${moduleId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/courses/${courseId}/modules`] });
      toast({ title: "Módulo excluído com sucesso!" });
    },
  });

  // Duplicar módulo
  const duplicateModuleMutation = useMutation({
    mutationFn: async (moduleId: number) => {
      const res = await apiRequest("POST", `/api/admin/modules/${moduleId}/duplicate`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/courses/${courseId}/modules`] });
      toast({ title: "Módulo duplicado com sucesso!" });
    },
  });

  // Excluir aula
  const deleteLessonMutation = useMutation({
    mutationFn: async (lessonId: number) => {
      const res = await apiRequest("DELETE", `/api/admin/lessons/${lessonId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/courses/${courseId}/modules`] });
      toast({ title: "Aula excluída com sucesso!" });
    },
  });

  // Duplicar aula
  const duplicateLessonMutation = useMutation({
    mutationFn: async (lessonId: number) => {
      const res = await apiRequest("POST", `/api/admin/lessons/${lessonId}/duplicate`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/courses/${courseId}/modules`] });
      toast({ title: "Aula duplicada com sucesso!" });
    },
  });

  // Mover aula para outro módulo
  const moveLessonMutation = useMutation({
    mutationFn: async (data: { lessonId: number; newModuleId: number; newPosition: number }) => {
      const res = await apiRequest("PUT", `/api/admin/lessons/${data.lessonId}/move`, {
        newModuleId: data.newModuleId,
        newPosition: data.newPosition
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/courses/${courseId}/modules`] });
      toast({ title: "Aula movida com sucesso!" });
    },
  });

  const toggleModule = (moduleId: number) => {
    setExpandedModules(prev => {
      const newSet = new Set(prev);
      if (newSet.has(moduleId)) {
        newSet.delete(moduleId);
      } else {
        newSet.add(moduleId);
      }
      return newSet;
    });
  };

  const handleTitleEdit = (type: 'module' | 'lesson', id: number, currentTitle: string) => {
    setEditingTitle(`${type}-${id}`);
    setTempTitle(currentTitle);
  };

  const handleTitleSave = (type: 'module' | 'lesson', id: number) => {
    if (tempTitle.trim()) {
      updateTitleMutation.mutate({ type, id, title: tempTitle.trim() });
    } else {
      setEditingTitle(null);
    }
  };

  const handleTitleCancel = () => {
    setEditingTitle(null);
    setTempTitle("");
  };

  const handleAddModule = () => {
    createModuleMutation.mutate({ 
      title: `Novo módulo ${modules.length + 1}` 
    });
  };

  const handleAddLesson = (moduleId: number) => {
    createLessonMutation.mutate({ 
      moduleId, 
      title: `Nova aula ${modules.find(m => m.id === moduleId)?.lessons?.length ? modules.find(m => m.id === moduleId)!.lessons!.length + 1 : 1}`
    });
  };

  const toggleItemSelection = (itemId: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedAll) {
      setSelectedItems(new Set());
    } else {
      const allItems = new Set<string>();
      modules.forEach(module => {
        allItems.add(`module-${module.id}`);
        module.lessons?.forEach(lesson => {
          allItems.add(`lesson-${lesson.id}`);
        });
      });
      setSelectedItems(allItems);
    }
    setSelectedAll(!selectedAll);
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;

    // Se está movendo módulos
    if (source.droppableId === "modules" && destination.droppableId === "modules") {
      const moduleIds = modules.map(m => m.id);
      const [reorderedId] = moduleIds.splice(source.index, 1);
      moduleIds.splice(destination.index, 0, reorderedId);
      updateModuleOrderMutation.mutate(moduleIds);
    }
    
    // Se está movendo aulas
    else if (source.droppableId.startsWith("lessons-") && destination.droppableId.startsWith("lessons-")) {
      const sourceModuleId = parseInt(source.droppableId.replace("lessons-", ""));
      const destModuleId = parseInt(destination.droppableId.replace("lessons-", ""));
      const lessonId = parseInt(draggableId.replace("lesson-", ""));
      
      // Se está movendo dentro do mesmo módulo
      if (sourceModuleId === destModuleId) {
        const module = modules.find(m => m.id === sourceModuleId);
        if (module?.lessons) {
          const lessonIds = module.lessons.map(l => l.id);
          const [reorderedId] = lessonIds.splice(source.index, 1);
          lessonIds.splice(destination.index, 0, reorderedId);
          updateLessonOrderMutation.mutate({ moduleId: sourceModuleId, lessonIds });
        }
      }
      // Se está movendo para outro módulo
      else {
        moveLessonMutation.mutate({
          lessonId,
          newModuleId: destModuleId,
          newPosition: destination.index + 1
        });
      }
    }
  };

  const handlePreviewCourse = () => {
    setLocation(`/cursos/${courseId}`);
  };

  return (
    <AdminLayout>
      <Helmet>
        <title>Gerenciar Módulos - Admin</title>
      </Helmet>

      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
          <button 
            onClick={() => setLocation('/admin/cursos')}
            className="hover:text-foreground transition-colors"
          >
            Produtos
          </button>
          <span>/</span>
          <button 
            onClick={() => setLocation(`/admin/cursos/${courseId}`)}
            className="text-primary font-medium hover:text-primary/80 transition-colors"
          >
{course?.title || 'Carregando...'}
          </button>
          <span>/</span>
          <span>Conteúdo</span>
        </div>

        {/* Course Info */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
            <FileText className="h-6 w-6 text-orange-600" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">{course?.title || 'Carregando...'}</h1>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>Curso Online</span>
              <span>ID: 2569032</span>
              <Badge variant="outline" className="text-green-600 border-green-200">Vendas ativas</Badge>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-6 border-b mb-6">
          <button className="pb-3 px-1 text-sm font-medium border-b-2 border-primary text-primary transition-colors">
            Conteúdo
          </button>
          <button 
            onClick={() => setLocation(`/admin/cursos/${courseId}/configuracoes`)}
            className="pb-3 px-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Configurações
          </button>
          <button 
            onClick={() => setLocation(`/admin/cursos/${courseId}/personalizacao`)}
            className="pb-3 px-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Personalização
          </button>
          <button 
            onClick={() => setLocation(`/admin/cursos/${courseId}/certificado`)}
            className="pb-3 px-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Certificado
          </button>
          <button 
            onClick={() => setLocation(`/admin/cursos/${courseId}/usuarios`)}
            className="pb-3 px-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Usuários
          </button>
          <button 
            onClick={() => setLocation(`/admin/cursos/${courseId}/turmas`)}
            className="pb-3 px-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Turmas
          </button>
          <button 
            onClick={() => setLocation(`/admin/cursos/${courseId}/comentarios`)}
            className="pb-3 px-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Comentários
          </button>
          <button 
            onClick={() => setLocation(`/admin/cursos/${courseId}/cadastro-gratuito`)}
            className="pb-3 px-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Cadastro gratuito
          </button>
        </div>

        {/* Vitrine */}
        <div className="mb-6">
          <span className="text-sm text-muted-foreground">Vitrine</span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-4">
            <Button variant="default" size="sm">Principal</Button>
            <Button variant="outline" size="sm">Adicional</Button>
            <Button variant="outline" size="sm">Trilhas</Button>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handlePreviewCourse}
              className="flex items-center gap-2"
            >
              <Eye className="h-4 w-4" />
              Visualizar
            </Button>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Enviar arquivos
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="default" size="sm" className="flex items-center gap-2">
                  Criar
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem 
                  onClick={() => modules.length > 0 ? createLessonMutation.mutate({ moduleId: modules[0]?.id || 1, title: "Nova aula" }) : toast({ title: "Crie um módulo primeiro!", variant: "destructive" })}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Aula
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleAddModule}>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Módulo
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Select All */}
        <div className="flex items-center gap-3 mb-4">
          <Checkbox 
            checked={selectedAll}
            onCheckedChange={toggleSelectAll}
          />
          <span className="text-sm">Selecionar todos</span>
          <Button variant="ghost" size="sm" className="ml-auto">
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Content List */}
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="modules" type="MODULE">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                {modules.map((module, moduleIndex) => (
                  <Draggable key={module.id} draggableId={`module-${module.id}`} index={moduleIndex}>
                    {(provided, snapshot) => (
                      <div 
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`border rounded-lg ${snapshot.isDragging ? 'shadow-lg' : ''}`}
                      >
                        {/* Module Header */}
                        <div className="flex items-center gap-3 p-4 hover:bg-muted">
                          <div {...provided.dragHandleProps}>
                            <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                          </div>
                          <Checkbox 
                            checked={selectedItems.has(`module-${module.id}`)}
                            onCheckedChange={() => toggleItemSelection(`module-${module.id}`)}
                          />
                          <button
                            onClick={() => toggleModule(module.id)}
                            className="flex items-center gap-2"
                          >
                            {expandedModules.has(module.id) ? 
                              <ChevronDown className="h-4 w-4" /> : 
                              <ChevronRight className="h-4 w-4" />
                            }
                          </button>
                          
                          <div className="flex-1">
                            {editingTitle === `module-${module.id}` ? (
                              <Input
                                value={tempTitle}
                                onChange={(e) => setTempTitle(e.target.value)}
                                onBlur={() => handleTitleSave('module', module.id)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleTitleSave('module', module.id);
                                  if (e.key === 'Escape') handleTitleCancel();
                                }}
                                autoFocus
                                className="text-lg font-medium"
                              />
                            ) : (
                              <div 
                                onClick={() => handleTitleEdit('module', module.id, module.title)}
                                className="cursor-pointer"
                              >
                                <h3 className="text-lg font-medium">{module.title}</h3>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                        <span>{module.lessons?.length || 0} conteúdos</span>
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleAddLesson(module.id)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleTitleEdit('module', module.id, module.title)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => duplicateModuleMutation.mutate(module.id)}>
                                  <Copy className="h-4 w-4 mr-2" />
                                  Duplicar
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-600" onClick={() => deleteModuleMutation.mutate(module.id)}>
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                            <button onClick={() => toggleModule(module.id)}>
                              {expandedModules.has(module.id) ? 
                                <ChevronDown className="h-4 w-4" /> : 
                                <ChevronRight className="h-4 w-4" />
                              }
                            </button>
                          </div>
                        </div>

                        {/* Lessons */}
                        {expandedModules.has(module.id) && (
                          <Droppable droppableId={`lessons-${module.id}`} type="LESSON">
                            {(provided) => (
                              <div {...provided.droppableProps} ref={provided.innerRef} className="pl-16 pb-4 space-y-2">
                                {module.lessons?.map((lesson, lessonIndex) => (
                                  <Draggable key={lesson.id} draggableId={`lesson-${lesson.id}`} index={lessonIndex}>
                                    {(provided, snapshot) => (
                                      <div 
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        className={`flex items-center gap-3 py-2 px-4 hover:bg-muted rounded ${snapshot.isDragging ? 'shadow-md bg-card' : ''}`}
                                      >
                                        <div {...provided.dragHandleProps}>
                                          <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                                        </div>
                                        <Checkbox 
                                          checked={selectedItems.has(`lesson-${lesson.id}`)}
                                          onCheckedChange={() => toggleItemSelection(`lesson-${lesson.id}`)}
                                        />
                                        <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                                          <FileText className="h-4 w-4 text-blue-600" />
                                        </div>
                                        <div className="flex-1">
                                          {editingTitle === `lesson-${lesson.id}` ? (
                                            <Input
                                              value={tempTitle}
                                              onChange={(e) => setTempTitle(e.target.value)}
                                              onBlur={() => handleTitleSave('lesson', lesson.id)}
                                              onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleTitleSave('lesson', lesson.id);
                                                if (e.key === 'Escape') handleTitleCancel();
                                              }}
                                              autoFocus
                                              className="font-medium"
                                            />
                                          ) : (
                                            <div 
                                              onClick={() => handleTitleEdit('lesson', lesson.id, lesson.title)}
                                              className="cursor-pointer"
                                            >
                                              <span className="font-medium">{lesson.title}</span>
                                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <MessageSquare className="h-3 w-3" />
                                                <span>0</span>
                                                <Heart className="h-3 w-3" />
                                                <span>{lessonIndex < 2 ? '5' : '0'}</span>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                          {lesson.isPublished !== false && (
                                            <Badge variant="outline" className="text-green-600 border-green-200 text-xs">
                                              Publicado
                                            </Badge>
                                          )}
                                          <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                              <Button variant="ghost" size="sm">
                                                <MoreHorizontal className="h-4 w-4" />
                                              </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                              <DropdownMenuItem onClick={() => setLocation(`/admin/aulas/${lesson.id}/editar`)}>
                                                <Edit className="h-4 w-4 mr-2" />
                                                Editar
                                              </DropdownMenuItem>
                                              <DropdownMenuItem onClick={() => duplicateLessonMutation.mutate(lesson.id)}>
                                                <Copy className="h-4 w-4 mr-2" />
                                                Duplicar
                                              </DropdownMenuItem>
                                              <DropdownMenuSeparator />
                                              <DropdownMenuItem className="text-red-600" onClick={() => deleteLessonMutation.mutate(lesson.id)}>
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                Excluir
                                              </DropdownMenuItem>
                                            </DropdownMenuContent>
                                          </DropdownMenu>
                                        </div>
                                      </div>
                                    )}
                                  </Draggable>
                                ))}
                                {provided.placeholder}
                                
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleAddLesson(module.id)}
                                  className="ml-11 text-blue-600 hover:text-blue-700"
                                >
                                  <Plus className="h-4 w-4 mr-2" />
                                  Adicionar
                                </Button>
                              </div>
                            )}
                          </Droppable>
                        )}
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>


    </AdminLayout>
  );
}