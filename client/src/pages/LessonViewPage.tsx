import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Play, FileText, Download, Clock, CheckCircle, Lock, Book, Star, ChevronDown, BookOpen } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useCourseProgress } from "@/hooks/use-course-progress";

interface Lesson {
  id: number;
  moduleId: number;
  title: string;
  description: string;
  content: string;
  type: 'video' | 'text' | 'quiz';
  duration?: number;
  orderIndex: number;
  videoUrl?: string;
  files?: string[];
  extra_materials?: string[];
}

interface Module {
  id: number;
  title: string;
  lessons: Lesson[];
}

interface Course {
  id: number;
  title: string;
  description: string;
  modules: Module[];
}

interface LessonRating {
  average_rating: number;
  rating_count: number;
}

export default function LessonViewPage() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const courseId = parseInt(params.courseId || "0");
  const lessonId = parseInt(params.lessonId || "0");
  
  const [currentModuleId, setCurrentModuleId] = useState<number | null>(null);
  const { completedLessons, toggleLessonCompletion, isLessonCompleted } = useCourseProgress(courseId);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [openModules, setOpenModules] = useState<Set<number>>(new Set());
  const queryClient = useQueryClient();

  // Buscar dados do curso completo
  const { data: course, isLoading: courseLoading } = useQuery<Course>({
    queryKey: [`/api/courses/${courseId}/full`],
    enabled: courseId > 0,
  });

  // Buscar dados da aula específica
  const { data: lesson, isLoading: lessonLoading } = useQuery<Lesson>({
    queryKey: [`/api/lessons/${lessonId}`],
    enabled: lessonId > 0,
  });

  // Buscar avaliação média da aula
  const { data: lessonRating } = useQuery<LessonRating>({
    queryKey: [`/api/lessons/${lessonId}/rating`],
    enabled: lessonId > 0,
  });

  // Mutation para enviar avaliação
  const ratingMutation = useMutation({
    mutationFn: async (rating: number) => {
      const response = await fetch(`/api/lessons/${lessonId}/rating`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating }),
      });
      if (!response.ok) throw new Error('Erro ao enviar avaliação');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/lessons/${lessonId}/rating`] });
      toast({
        title: "Avaliação enviada!",
        description: "Obrigado por avaliar esta aula.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível enviar sua avaliação.",
        variant: "destructive",
      });
    },
  });

  // Encontrar aula atual e informações de navegação
  const currentLesson = lesson || (course?.modules.flatMap(m => m.lessons).find(l => l.id === lessonId));
  const currentModule = course?.modules.find(m => m.lessons.some(l => l.id === lessonId));
  const currentLessonIndex = currentModule?.lessons.findIndex(l => l.id === lessonId) ?? -1;

  // Controle de módulos abertos
  const toggleModule = (moduleId: number) => {
    setOpenModules(prev => {
      const newSet = new Set(prev);
      if (newSet.has(moduleId)) {
        newSet.delete(moduleId);
      } else {
        newSet.add(moduleId);
      }
      return newSet;
    });
  };

  // Abrir automaticamente o módulo atual e definir moduleId
  useEffect(() => {
    if (currentModule && !openModules.has(currentModule.id)) {
      setOpenModules(prev => new Set([...prev, currentModule.id]));
      setCurrentModuleId(currentModule.id);
    }
  }, [currentModule, openModules]);

  // Funções de navegação
  const navigateToLesson = (newLessonId: number) => {
    setLocation(`/cursos/${courseId}/aula/${newLessonId}`);
  };

  const handleBack = () => {
    setLocation(`/cursos/${courseId}`);
  };

  const getNextLesson = () => {
    if (!course || !currentModule) return null;
    
    const currentIndex = currentModule.lessons.findIndex(l => l.id === lessonId);
    if (currentIndex < currentModule.lessons.length - 1) {
      return currentModule.lessons[currentIndex + 1];
    }
    
    // Próximo módulo
    const moduleIndex = course.modules.findIndex(m => m.id === currentModule.id);
    if (moduleIndex < course.modules.length - 1) {
      const nextModule = course.modules[moduleIndex + 1];
      return nextModule.lessons[0] || null;
    }
    
    return null;
  };

  const getPrevLesson = () => {
    if (!course || !currentModule) return null;
    
    const currentIndex = currentModule.lessons.findIndex(l => l.id === lessonId);
    if (currentIndex > 0) {
      return currentModule.lessons[currentIndex - 1];
    }
    
    // Módulo anterior
    const moduleIndex = course.modules.findIndex(m => m.id === currentModule.id);
    if (moduleIndex > 0) {
      const prevModule = course.modules[moduleIndex - 1];
      return prevModule.lessons[prevModule.lessons.length - 1] || null;
    }
    
    return null;
  };

  // Verificar se usuário tem acesso à aula
  const hasAccess = user && (user.tipo === 'premium' || user.isAdmin);

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-card flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Acesso Restrito</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">
              Este conteúdo é exclusivo para assinantes premium.
            </p>
            <Button onClick={() => setLocation('/planos')}>
              Ver Planos
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (courseLoading || lessonLoading) {
    return (
      <div className="min-h-screen bg-card flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando aula...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-card flex items-center justify-center">
        <div className="text-center">
          <Book className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <p className="text-muted-foreground">Curso não encontrado</p>
        </div>
      </div>
    );
  }

  if (!currentLesson) {
    return (
      <div className="min-h-screen bg-card flex items-center justify-center">
        <div className="text-center">
          <Play className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <p className="text-muted-foreground">Selecione uma aula para assistir</p>
        </div>
      </div>
    );
  }

  const nextLesson = getNextLesson();
  const prevLesson = getPrevLesson();
  
  console.log('🎯 NAVIGATION STATUS:', {
    currentLesson: currentLesson?.title,
    currentLessonId: lessonId,
    nextLesson: nextLesson ? { id: nextLesson.id, title: nextLesson.title } : null,
    prevLesson: prevLesson ? { id: prevLesson.id, title: prevLesson.title } : null,
    currentModule: currentModule?.title,
    courseId
  });

  return (
    <div className="min-h-screen bg-card">
      <Helmet>
        <title>{currentLesson.title} - {course.title}</title>
      </Helmet>

      {/* Nome do curso e botão voltar - SEMPRE NO TOPO NO MOBILE */}
      <div className="lg:hidden bg-card border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={handleBack} className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <h2 className="font-semibold text-base text-foreground">{course.title}</h2>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:grid lg:grid-cols-4 gap-0">
          
          {/* Conteúdo Principal - ÚNICO E RESPONSIVO */}
          <div className="order-1 lg:order-2 lg:col-span-3 p-4 lg:p-6 bg-card">
            <Card className="border-0 shadow-none">
              <CardHeader className="px-0 lg:px-6">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl lg:text-2xl break-words">{currentLesson.title}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6 px-0 lg:px-6">
                {/* 1. Conteúdo da Aula (Vídeo/Texto) */}
                {currentLesson.type === 'video' ? (
                  <div className="space-y-4">
                    {/* Renderizar vídeo do YouTube ou outros links */}
                    {currentLesson.content && currentLesson.content.includes('youtube.com') ? (
                      <div className="aspect-video">
                        <iframe
                          src={currentLesson.content.replace('watch?v=', 'embed/')}
                          className="w-full h-full rounded-lg"
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    ) : currentLesson.content && currentLesson.content.includes('youtu.be') ? (
                      <div className="aspect-video">
                        <iframe
                          src={currentLesson.content.replace('youtu.be/', 'youtube.com/embed/')}
                          className="w-full h-full rounded-lg"
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    ) : currentLesson.content ? (
                      <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                        <div className="text-center">
                          <Play className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                          <p className="text-muted-foreground">Link do vídeo:</p>
                          <a 
                            href={currentLesson.content} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline break-all"
                          >
                            {currentLesson.content}
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                        <div className="text-center text-muted-foreground">
                          <Play className="h-16 w-16 mx-auto mb-4" />
                          <p>Nenhum vídeo configurado para esta aula</p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="prose max-w-none">
                    {currentLesson.content ? (
                      <div dangerouslySetInnerHTML={{ __html: currentLesson.content }} />
                    ) : (
                      <p className="text-muted-foreground">Nenhum conteúdo disponível para esta aula.</p>
                    )}
                  </div>
                )}

                {/* 2. Navegação e Avaliação - APENAS NO DESKTOP */}
                <div className="hidden lg:flex items-center justify-between py-4 border-t border-b">
                  <div className="text-sm text-muted-foreground">
                    Aula {Math.max(currentLessonIndex + 1, 1)} de {currentModule?.lessons.length}
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {/* Sistema de Avaliação com 5 estrelas */}
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground">Avalie:</span>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => {
                          const averageRating = lessonRating?.average_rating || 0;
                          return (
                            <button
                              key={star}
                              onClick={() => ratingMutation.mutate(star)}
                              onMouseEnter={() => setHoveredRating(star)}
                              onMouseLeave={() => setHoveredRating(0)}
                              className="p-1 hover:scale-110 transition-transform"
                              disabled={ratingMutation.isPending}
                            >
                              <Star
                                className={`h-3 w-3 ${
                                  star <= (hoveredRating || Math.round(averageRating))
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-300'
                              }`}
                            />
                          </button>
                        );
                      })}
                      </div>
                      
                      {/* Exibir média e quantidade de avaliações */}
                      {lessonRating && lessonRating.rating_count > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {Number(lessonRating.average_rating).toFixed(1)} ({lessonRating.rating_count})
                        </span>
                      )}
                    </div>
                    
                    {/* Botão Concluir */}
                    <Button 
                      onClick={() => toggleLessonCompletion(lessonId)}
                      variant={isLessonCompleted(lessonId) ? "default" : "outline"}
                      size="sm"
                      className={`flex items-center gap-2 ${
                        isLessonCompleted(lessonId) 
                          ? 'bg-green-300 hover:bg-green-400 text-green-900 border-green-400' 
                          : 'hover:bg-green-100 hover:text-green-800 hover:border-green-300'
                      }`}
                    >
                      <CheckCircle className="h-4 w-4" />
                      {isLessonCompleted(lessonId) ? 'Concluída' : 'Concluir'}
                    </Button>
                    
                    {/* Botão Anterior */}
                    {prevLesson && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigateToLesson(prevLesson.id)}
                        className="flex items-center gap-2"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        Anterior
                      </Button>
                    )}
                    
                    {/* Botão Próxima */}
                    {nextLesson && (
                      <Button 
                        onClick={() => navigateToLesson(nextLesson.id)}
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        Próxima
                        <ArrowLeft className="h-4 w-4 rotate-180" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Descrição da Aula - Mobile */}
                <div className="lg:hidden">
                  {currentLesson.description && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Descrição</h3>
                      <div 
                        className="prose max-w-none text-muted-foreground leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: currentLesson.description }}
                      />
                    </div>
                  )}

                  {/* Material Extra - Mobile */}
                  {currentLesson.extra_materials && currentLesson.extra_materials.length > 0 && (
                    <div className="space-y-4 mt-6">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Material Extra
                      </h3>
                      <div className="grid gap-2">
                        {currentLesson.extra_materials.map((file: any, index: number) => {
                          const fileUrl = typeof file === 'string' ? file : file.url;
                          const fileName = typeof file === 'string' ? 
                            file.split('/').pop() || `Arquivo ${index + 1}` : 
                            file.name || `Arquivo ${index + 1}`;
                          const fileExtension = fileName.split('.').pop()?.toLowerCase();
                          
                          return (
                            <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                                  <FileText className="h-4 w-4 text-blue-600" />
                                </div>
                                <div>
                                  <p className="font-medium text-sm">{fileName}</p>
                                  <p className="text-xs text-muted-foreground capitalize">
                                    {fileExtension === 'pdf' ? 'Documento PDF' : 
                                     fileExtension === 'doc' || fileExtension === 'docx' ? 'Documento Word' :
                                     fileExtension === 'txt' ? 'Arquivo de Texto' :
                                     fileExtension === 'zip' || fileExtension === 'rar' ? 'Arquivo Compactado' :
                                     'Arquivo'}
                                  </p>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(fileUrl, '_blank')}
                                className="flex items-center gap-1"
                              >
                                <Download className="h-3 w-3" />
                                Baixar
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Ações da Aula - Mobile - MOVIDAS PARA BAIXO DO CONTEÚDO */}
                  <div className="bg-muted p-4 rounded-lg border space-y-4 mt-6">
                    {/* Sistema de Avaliação - Mobile */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">Avalie esta aula:</span>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => {
                          const averageRating = lessonRating?.average_rating || 0;
                          return (
                            <button
                              key={star}
                              onClick={() => ratingMutation.mutate(star)}
                              onMouseEnter={() => setHoveredRating(star)}
                              onMouseLeave={() => setHoveredRating(0)}
                              className="p-1 hover:scale-110 transition-transform"
                              disabled={ratingMutation.isPending}
                            >
                              <Star
                                className={`h-4 w-4 ${
                                  star <= (hoveredRating || Math.round(averageRating))
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-300'
                              }`}
                            />
                          </button>
                        );
                      })}
                      </div>
                    </div>
                    
                    {/* Exibir média de avaliações */}
                    {lessonRating && lessonRating.rating_count > 0 && (
                      <div className="text-xs text-muted-foreground text-center">
                        Média: {Number(lessonRating.average_rating).toFixed(1)} ({lessonRating.rating_count} avaliações)
                      </div>
                    )}

                    {/* Botão Concluir - Mobile */}
                    <Button 
                      onClick={() => toggleLessonCompletion(lessonId)}
                      variant={isLessonCompleted(lessonId) ? "default" : "outline"}
                      className={`w-full flex items-center justify-center gap-2 ${
                        isLessonCompleted(lessonId) 
                          ? 'bg-green-300 hover:bg-green-400 text-green-900 border-green-400' 
                          : 'hover:bg-green-100 hover:text-green-800 hover:border-green-300'
                      }`}
                    >
                      <CheckCircle className="h-4 w-4" />
                      {isLessonCompleted(lessonId) ? 'Aula Concluída' : 'Marcar como Concluída'}
                    </Button>

                    {/* Navegação entre aulas */}
                    <div className="flex justify-between gap-2 pt-2">
                      <Button
                        variant="outline"
                        onClick={() => prevLesson && navigateToLesson(prevLesson.id)}
                        disabled={!prevLesson}
                        className="flex items-center gap-1 flex-1 text-xs px-3"
                        size="sm"
                      >
                        <ArrowLeft className="h-3 w-3" />
                        Anterior
                      </Button>
                      
                      <Button
                        onClick={() => nextLesson && navigateToLesson(nextLesson.id)}
                        disabled={!nextLesson}
                        className="flex items-center gap-1 flex-1 text-xs px-3"
                        size="sm"
                      >
                        Próxima
                        <ArrowLeft className="h-3 w-3 rotate-180" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* 3. Descrição da Aula - DESKTOP */}
                <div className="hidden lg:block">
                  {currentLesson.description && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Descrição</h3>
                      <div 
                        className="prose max-w-none text-muted-foreground leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: currentLesson.description }}
                      />
                    </div>
                  )}

                  {/* Material Extra - DESKTOP */}
                  {currentLesson.extra_materials && currentLesson.extra_materials.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Material Extra
                      </h3>
                      <div className="grid gap-2">
                        {currentLesson.extra_materials.map((file: any, index: number) => {
                          const fileUrl = typeof file === 'string' ? file : file.url;
                          const fileName = typeof file === 'string' ? 
                            file.split('/').pop() || `Arquivo ${index + 1}` : 
                            file.name || `Arquivo ${index + 1}`;
                          const fileExtension = fileName.split('.').pop()?.toLowerCase();
                          
                          return (
                            <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                                  <FileText className="h-4 w-4 text-blue-600" />
                                </div>
                                <div>
                                  <p className="font-medium text-sm">{fileName}</p>
                                  <p className="text-xs text-muted-foreground capitalize">
                                    {fileExtension === 'pdf' ? 'Documento PDF' : 
                                     fileExtension === 'doc' || fileExtension === 'docx' ? 'Documento Word' :
                                     fileExtension === 'txt' ? 'Arquivo de Texto' :
                                     fileExtension === 'zip' || fileExtension === 'rar' ? 'Arquivo Compactado' :
                                     'Arquivo'}
                                  </p>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(fileUrl, '_blank')}
                                className="flex items-center gap-1"
                              >
                                <Download className="h-3 w-3" />
                                Baixar
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar de navegação das aulas - SEGUNDO NO MOBILE */}
          <div className="order-2 lg:order-1 col-span-1 bg-muted/50">
            {/* Layout Desktop - Sidebar à esquerda com lista de aulas */}
            <div className="hidden lg:block h-full">
              <div className="p-6 border-b border-border">
                <Button variant="ghost" onClick={handleBack} className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="h-4 w-4" />
                  Voltar ao curso
                </Button>
                <h3 className="text-xl font-bold text-foreground mt-4">{course.title}</h3>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <BookOpen className="h-5 w-5" />
                  <span className="text-base font-medium">{course.modules.length} módulos</span>
                </div>
              </div>
            
              <ScrollArea className="h-[calc(100vh-200px)]">
                <div className="p-6 space-y-6">
                  {course.modules.map((module, moduleIndex) => (
                    <div key={module.id} className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                          {moduleIndex + 1}
                        </div>
                        <h4 className="font-bold text-lg text-foreground">{module.title}</h4>
                      </div>
                      
                      <div className="space-y-2 ml-11">
                        {module.lessons.map((lesson) => {
                          const isActive = lesson.id === lessonId;
                          const isCompleted = isLessonCompleted(lesson.id);
                          
                          return (
                            <button
                              key={lesson.id}
                              onClick={() => navigateToLesson(lesson.id)}
                              className={`w-full text-left p-3 rounded-lg border transition-colors ${
                                isActive 
                                  ? 'bg-blue-50 border-blue-200 text-blue-900' 
                                  : isCompleted 
                                    ? 'bg-green-50 border-green-200 text-green-900 hover:bg-green-100' 
                                    : 'bg-card hover:bg-muted border-border'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                {isCompleted ? (
                                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                                ) : lesson.type === 'video' ? (
                                  <Play className={`h-4 w-4 flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                                ) : (
                                  <FileText className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                )}
                                <span className={`text-sm break-words ${isActive ? 'font-medium text-blue-900' : 'text-muted-foreground'}`}>
                                  {lesson.title}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Layout Mobile - Design com dropdowns */}
            <div className="lg:hidden bg-card">
              <div className="p-4 border-b border-border">
                <h3 className="text-xl font-bold text-foreground">Lista de Conteúdos</h3>
              </div>
              
              <div className="p-4 space-y-4">
                {course.modules.map((module, moduleIndex) => {
                  const currentModuleLessons = module.lessons;
                  const completedLessons = currentModuleLessons.filter(lesson => isLessonCompleted(lesson.id)).length;
                  const totalLessons = currentModuleLessons.length;
                  
                  return (
                    <div key={module.id} className="bg-muted rounded-lg p-4 border">
                      {/* Cabeçalho do Módulo - CLICÁVEL PARA ABRIR/FECHAR */}
                      <button 
                        onClick={() => toggleModule(module.id)}
                        className="w-full flex items-center justify-between mb-4 text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-lg">
                            {moduleIndex + 1}
                          </div>
                          <div>
                            <h4 className="font-bold text-lg text-foreground">{module.title}</h4>
                            <p className="text-sm text-muted-foreground">{totalLessons} aulas</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-base font-semibold text-muted-foreground">{completedLessons}/{totalLessons}</p>
                          <ChevronDown className={`h-5 w-5 text-muted-foreground mx-auto mt-1 transition-transform ${
                            openModules.has(module.id) ? 'rotate-180' : ''
                          }`} />
                        </div>
                      </button>

                      {/* Lista de Aulas - APARECE APENAS SE MÓDULO ESTIVER ABERTO */}
                      {openModules.has(module.id) && (
                        <div className="space-y-3">
                          {currentModuleLessons.map((lesson) => {
                            const isActive = lesson.id === lessonId;
                            const isCompleted = isLessonCompleted(lesson.id);
                            
                            return (
                              <div key={lesson.id} className="flex items-center justify-between p-3 bg-card rounded-lg border">
                                <div className="flex items-center gap-3 flex-1">
                                  <Play className="h-5 w-5 text-blue-500 flex-shrink-0" />
                                  <div className="flex-1">
                                    <h5 className={`font-semibold text-base ${
                                      isActive ? 'text-blue-900' : 'text-foreground'
                                    }`}>
                                      {lesson.title}
                                    </h5>
                                    {lesson.description && (
                                      <div className="text-sm text-muted-foreground mt-1"
                                           dangerouslySetInnerHTML={{ 
                                             __html: lesson.description.length > 50 ? 
                                             lesson.description.substring(0, 50) + '...' : 
                                             lesson.description 
                                           }}
                                      />
                                    )}
                                  </div>
                                  <div className="text-center">
                                    <span className="text-lg font-bold text-foreground">{isCompleted ? '1' : '0'}</span>
                                  </div>
                                </div>
                                <Button
                                  onClick={() => navigateToLesson(lesson.id)}
                                  size="sm"
                                  variant={isActive ? "default" : "secondary"}
                                  className="ml-3 font-semibold text-sm px-4 py-2"
                                >
                                  Assistir
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}


              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}