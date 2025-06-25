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
  const { data: course } = useQuery({
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
    
    // Se está movendo aulas dentro do mesmo módulo
    else if (source.droppableId.startsWith("lessons-") && source.droppableId === destination.droppableId) {
      const moduleId = parseInt(source.droppableId.replace("lessons-", ""));
      const module = modules.find(m => m.id === moduleId);
      if (module?.lessons) {
        const lessonIds = module.lessons.map(l => l.id);
        const [reorderedId] = lessonIds.splice(source.index, 1);
        lessonIds.splice(destination.index, 0, reorderedId);
        updateLessonOrderMutation.mutate({ moduleId, lessonIds });
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
          <span>Produtos</span>
          <span className="text-primary font-medium">{course?.title || 'Kit de Mídias para Estética'}</span>
          <span>Conteúdo</span>
        </div>

        {/* Course Info */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
            <FileText className="h-6 w-6 text-orange-600" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">{course?.title || 'Kit de Mídias para Estética'}</h1>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>Curso Online</span>
              <span>ID: 2569032</span>
              <Badge variant="outline" className="text-green-600 border-green-200">Vendas ativas</Badge>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-6 border-b mb-6">
          <button className="pb-3 px-1 text-sm font-medium border-b-2 border-primary text-primary">
            Conteúdo
          </button>
          <button className="pb-3 px-1 text-sm text-muted-foreground hover:text-foreground">
            Configurações
          </button>
          <button className="pb-3 px-1 text-sm text-muted-foreground hover:text-foreground">
            Personalização
          </button>
          <button className="pb-3 px-1 text-sm text-muted-foreground hover:text-foreground">
            Certificado
          </button>
          <button className="pb-3 px-1 text-sm text-muted-foreground hover:text-foreground">
            Usuários
          </button>
          <button className="pb-3 px-1 text-sm text-muted-foreground hover:text-foreground">
            Turmas
          </button>
          <button className="pb-3 px-1 text-sm text-muted-foreground hover:text-foreground">
            Comentários
          </button>
          <button className="pb-3 px-1 text-sm text-muted-foreground hover:text-foreground">
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
                <DropdownMenuItem onClick={() => createLessonMutation.mutate({ moduleId: modules[0]?.id || 1, title: "Nova aula" })}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Aula
                </DropdownMenuItem>
                <DropdownMenuItem>
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
                        <div className="flex items-center gap-3 p-4 hover:bg-gray-50">
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
                                  <Badge variant="secondary" className="text-xs">Módulo principal</Badge>
                                  <span>{module.lessons?.length || 0} conteúdos</span>
                                  <button className="text-blue-600 hover:underline">Mostrar turmas</button>
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
                                <DropdownMenuItem>
                                  <Copy className="h-4 w-4 mr-2" />
                                  Duplicar
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-600">
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
                                        className={`flex items-center gap-3 py-2 px-4 hover:bg-gray-50 rounded ${snapshot.isDragging ? 'shadow-md bg-white' : ''}`}
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
                                              <DropdownMenuItem onClick={() => handleTitleEdit('lesson', lesson.id, lesson.title)}>
                                                <Edit className="h-4 w-4 mr-2" />
                                                Editar
                                              </DropdownMenuItem>
                                              <DropdownMenuItem>
                                                <Copy className="h-4 w-4 mr-2" />
                                                Duplicar
                                              </DropdownMenuItem>
                                              <DropdownMenuSeparator />
                                              <DropdownMenuItem className="text-red-600">
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