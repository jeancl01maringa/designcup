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

  // Encontrar o módulo atual e aula atual
  const currentModule = course?.modules.find(m => m.lessons.some(l => l.id === lessonId));
  const currentLesson = currentModule?.lessons.find(l => l.id === lessonId);
  const currentLessonIndex = currentModule?.lessons.findIndex(l => l.id === lessonId) ?? -1;

  // Verificar se usuário tem acesso
  const hasAccess = user?.tipo === 'premium' || user?.isAdmin;
  
  console.log('[LESSON ACCESS] User:', user);
  console.log('[LESSON ACCESS] Has access:', hasAccess);

  useEffect(() => {
    if (currentModule) {
      setCurrentModuleId(currentModule.id);
    }
  }, [currentModule]);

  const handleBack = () => {
    setLocation(`/cursos/${courseId}`);
  };

  const navigateToLesson = (newLessonId: number) => {
    console.log('🔄 Navegando para aula:', newLessonId, 'curso:', courseId);
    setLocation(`/cursos/${courseId}/aula/${newLessonId}`);
  };

  const getNextLesson = () => {
    if (!currentModule || currentLessonIndex === -1) return null;
    
    // Próxima aula no mesmo módulo
    if (currentLessonIndex < currentModule.lessons.length - 1) {
      return currentModule.lessons[currentLessonIndex + 1];
    }
    
    // Primeira aula do próximo módulo
    if (course) {
      const currentModuleIndex = course.modules.findIndex(m => m.id === currentModule.id);
      if (currentModuleIndex < course.modules.length - 1) {
        const nextModule = course.modules[currentModuleIndex + 1];
        return nextModule.lessons[0];
      }
    }
    
    return null;
  };

  const getPrevLesson = () => {
    if (!currentModule || currentLessonIndex === -1) return null;
    
    // Aula anterior no mesmo módulo
    if (currentLessonIndex > 0) {
      return currentModule.lessons[currentLessonIndex - 1];
    }
    
    // Última aula do módulo anterior
    if (course) {
      const currentModuleIndex = course.modules.findIndex(m => m.id === currentModule.id);
      if (currentModuleIndex > 0) {
        const prevModule = course.modules[currentModuleIndex - 1];
        return prevModule.lessons[prevModule.lessons.length - 1];
      }
    }
    
    return null;
  };

  const markAsCompleted = () => {
    toggleLessonCompletion(lessonId);
    if (isLessonCompleted(lessonId)) {
      toast({ title: "Conclusão removida" });
    } else {
      toast({ title: "Aula marcada como concluída!" });
    }
  };

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <Lock className="h-12 w-12 mx-auto text-gray-400 mb-4" />
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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando aula...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Book className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">Curso não encontrado</p>
        </div>
      </div>
    );
  }

  if (!currentLesson) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Play className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">Selecione uma aula para assistir</p>
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
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>{currentLesson.title} - {course.title}</title>
      </Helmet>

      {/* Nome do curso e botão voltar - SEMPRE NO TOPO NO MOBILE */}
      <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={handleBack} className="flex items-center gap-2 text-gray-700 hover:text-gray-900">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <h2 className="font-semibold text-base text-gray-900">{course.title}</h2>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:grid lg:grid-cols-4 gap-0">
          
          {/* Conteúdo Principal - PRIMEIRO NO MOBILE */}
          <div className="order-1 lg:order-2 lg:col-span-3 p-4 lg:p-6 bg-white">
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
                      <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                        <div className="text-center">
                          <Play className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                          <p className="text-gray-600">Link do vídeo:</p>
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
                      <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                        <div className="text-center text-gray-500">
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
                      <p className="text-gray-500">Nenhum conteúdo disponível para esta aula.</p>
                    )}
                  </div>
                )}

                {/* Descrição da Aula - Mobile */}
                <div className="lg:hidden">
                  {currentLesson.description && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Descrição</h3>
                      <div 
                        className="prose max-w-none text-gray-600 leading-relaxed"
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
                            <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                                  <FileText className="h-4 w-4 text-blue-600" />
                                </div>
                                <div>
                                  <p className="font-medium text-sm">{fileName}</p>
                                  <p className="text-xs text-gray-500 capitalize">
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

                {/* Navegação e controles para mobile - visível apenas em mobile */}
                <div className="lg:hidden">
                  <div className="flex flex-col gap-3 py-4 border-t border-b">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        Aula {Math.max(currentLessonIndex + 1, 1)} de {currentModule?.lessons.length}
                      </div>
                      
                      <Button
                        onClick={markAsCompleted}
                        variant={isLessonCompleted(lessonId) ? "default" : "outline"}
                        size="sm"
                        className="flex items-center gap-1 text-xs"
                      >
                        <CheckCircle className="h-3 w-3" />
                        {isLessonCompleted(lessonId) ? "Concluir" : "Concluir"}
                      </Button>
                    </div>
                  </div>

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
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Lista de Aulas - SEGUNDO NO MOBILE */}
          <div className="order-2 lg:order-1 lg:col-span-1 bg-gray-50 border-r lg:border-r border-t lg:border-t-0 border-gray-200">
            
            {/* Layout Desktop - Mantém o original */}
            <div className="hidden lg:block">
              <div className="p-4 border-b border-gray-200">
                <Button variant="ghost" onClick={handleBack} className="flex items-center gap-2 mb-4 text-gray-700 hover:text-gray-900">
                  <ArrowLeft className="h-4 w-4" />
                  Voltar ao curso
                </Button>
                <h3 className="font-semibold text-lg text-gray-900">{course.title}</h3>
              </div>
              
              <ScrollArea className="h-[calc(100vh-120px)]">
                <div className="p-4 space-y-4">
                  {course.modules.map((module) => (
                    <div key={module.id} className="space-y-2">
                      <h4 className="font-medium text-sm text-gray-900 sticky top-0 bg-gray-50 py-2">
                        {module.title}
                      </h4>
                      
                      <div className="space-y-1">
                        {module.lessons.map((lesson) => {
                          const isActive = lesson.id === lessonId;
                          const isCompleted = isLessonCompleted(lesson.id);
                          
                          return (
                            <button
                              key={lesson.id}
                              onClick={() => navigateToLesson(lesson.id)}
                              className={`w-full text-left p-3 rounded-lg transition-colors ${
                                isActive 
                                  ? 'bg-blue-50 border border-blue-200' 
                                  : 'hover:bg-gray-50'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                {isCompleted ? (
                                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                                ) : lesson.type === 'video' ? (
                                  <Play className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                ) : (
                                  <FileText className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                )}
                                <span className={`text-sm break-words ${isActive ? 'font-medium text-blue-900' : 'text-gray-700'}`}>
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

            {/* Layout Mobile - Novo design com dropdowns conforme imagem */}
            <div className="lg:hidden bg-white">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-xl font-bold text-gray-900">Lista de Conteúdos</h3>
              </div>
              
              <div className="p-4 space-y-4">
                {course.modules.map((module, moduleIndex) => {
                  const currentModuleLessons = module.lessons;
                  const completedLessons = currentModuleLessons.filter(lesson => isLessonCompleted(lesson.id)).length;
                  const totalLessons = currentModuleLessons.length;
                  const isCurrentModule = currentModuleLessons.some(lesson => lesson.id === lessonId);
                  
                  return (
                    <div key={module.id} className="bg-gray-50 rounded-lg p-4 border">
                      {/* Cabeçalho do Módulo */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-lg">
                            {moduleIndex + 1}
                          </div>
                          <div>
                            <h4 className="font-bold text-lg text-gray-900">{module.title}</h4>
                            <p className="text-sm text-gray-600">{totalLessons} aulas</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-base font-semibold text-gray-700">{completedLessons}/{totalLessons}</p>
                          <ChevronDown className="h-5 w-5 text-gray-500 mx-auto mt-1" />
                        </div>
                      </div>

                      {/* Lista de Aulas */}
                      <div className="space-y-3">
                        {currentModuleLessons.map((lesson) => {
                          const isActive = lesson.id === lessonId;
                          const isCompleted = isLessonCompleted(lesson.id);
                          
                          return (
                            <div key={lesson.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                              <div className="flex items-center gap-3 flex-1">
                                <Play className="h-5 w-5 text-blue-500 flex-shrink-0" />
                                <div className="flex-1">
                                  <h5 className={`font-semibold text-base ${
                                    isActive ? 'text-blue-900' : 'text-gray-900'
                                  }`}>
                                    {lesson.title}
                                  </h5>
                                  {lesson.description && (
                                    <div className="text-sm text-gray-600 mt-1"
                                         dangerouslySetInnerHTML={{ 
                                           __html: lesson.description.length > 50 ? 
                                           lesson.description.substring(0, 50) + '...' : 
                                           lesson.description 
                                         }}
                                    />
                                  )}
                                </div>
                                <div className="text-center">
                                  <span className="text-lg font-bold text-gray-900">{isCompleted ? '1' : '0'}</span>
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
                    </div>
                  );
                })}
                
                {/* Sobre o Curso */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
                  <h4 className="text-xl font-bold text-gray-900 mb-3">Sobre o Curso</h4>
                  <div className="flex items-center gap-2 text-gray-700">
                    <BookOpen className="h-5 w-5" />
                    <span className="text-base font-medium">{course.modules.length} módulos</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Conteúdo Principal - VERSÃO DESKTOP OCULTA */}
          <div className="hidden lg:block lg:col-span-3 p-6 bg-white">
            <Card className="border-0 shadow-none">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl">{currentLesson.title}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
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
                      <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                        <div className="text-center">
                          <Play className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                          <p className="text-gray-600">Link do vídeo:</p>
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
                      <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                        <div className="text-center text-gray-500">
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
                      <p className="text-gray-500">Nenhum conteúdo disponível para esta aula.</p>
                    )}
                  </div>
                )}

                {/* 2. Navegação e Avaliação - OCULTO NO MOBILE */}
                <div className="hidden lg:flex items-center justify-between py-4 border-t border-b">
                  <div className="text-sm text-muted-foreground">
                    Aula {Math.max(currentLessonIndex + 1, 1)} de {currentModule?.lessons.length}
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {/* Sistema de Avaliação com 5 estrelas - Média da Comunidade */}
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

                    {/* Botão Próximo */}
                    {nextLesson && (
                      <Button 
                        onClick={() => {
                          console.log('🔥 CLIQUE NO PRÓXIMO - nextLesson:', nextLesson);
                          navigateToLesson(nextLesson.id);
                        }}
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        Próximo
                        <ArrowLeft className="h-4 w-4 rotate-180" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* 3. Descrição da Aula */}
                {currentLesson.description && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Descrição</h3>
                    <div 
                      className="prose max-w-none text-gray-600 leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: currentLesson.description }}
                    />
                  </div>
                )}

                {/* 4. Material Extra */}
                {currentLesson.extra_materials && currentLesson.extra_materials.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Material Extra
                    </h3>
                    <div className="grid gap-2">
                      {currentLesson.extra_materials.map((file: any, index: number) => {
                        // Handle both string URLs and object format
                        const fileUrl = typeof file === 'string' ? file : file.url;
                        const fileName = typeof file === 'string' ? 
                          file.split('/').pop() || `Arquivo ${index + 1}` : 
                          file.name || `Arquivo ${index + 1}`;
                        const fileExtension = fileName.split('.').pop()?.toLowerCase();
                        
                        return (
                          <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                                <FileText className="h-4 w-4 text-blue-600" />
                              </div>
                              <div>
                                <p className="font-medium text-sm">{fileName}</p>
                                <p className="text-xs text-gray-500 capitalize">
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
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}