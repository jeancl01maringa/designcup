import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Play, FileText, Download, Clock, CheckCircle, Lock, Book } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

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

export default function LessonViewPage() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const courseId = parseInt(params.courseId || "0");
  const lessonId = parseInt(params.lessonId || "0");
  
  const [currentModuleId, setCurrentModuleId] = useState<number | null>(null);
  const [completedLessons, setCompletedLessons] = useState<Set<number>>(new Set());

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

  // Encontrar o módulo atual e aula atual
  const currentModule = course?.modules.find(m => m.lessons.some(l => l.id === lessonId));
  const currentLesson = currentModule?.lessons.find(l => l.id === lessonId);
  const currentLessonIndex = currentModule?.lessons.findIndex(l => l.id === lessonId) ?? -1;

  // Verificar se usuário tem acesso
  const hasAccess = user?.tipo === 'premium' || user?.isAdmin;

  useEffect(() => {
    if (currentModule) {
      setCurrentModuleId(currentModule.id);
    }
  }, [currentModule]);

  const handleBack = () => {
    setLocation(`/cursos/${courseId}`);
  };

  const navigateToLesson = (newLessonId: number) => {
    setLocation(`/cursos/${courseId}/aulas/${newLessonId}`);
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
    setCompletedLessons(prev => new Set([...prev, lessonId]));
    toast({ title: "Aula marcada como concluída!" });
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">Carregando aula...</div>
      </div>
    );
  }

  if (!course || !currentLesson) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">Aula não encontrada</div>
      </div>
    );
  }

  const nextLesson = getNextLesson();
  const prevLesson = getPrevLesson();

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>{currentLesson.title} - {course.title}</title>
      </Helmet>

      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Sidebar - Lista de Aulas */}
          <div className="lg:col-span-1 bg-white border-r">
            <div className="p-4 border-b">
              <Button variant="ghost" onClick={handleBack} className="flex items-center gap-2 mb-4">
                <ArrowLeft className="h-4 w-4" />
                Voltar ao curso
              </Button>
              <h3 className="font-semibold text-lg">{course.title}</h3>
            </div>
            
            <ScrollArea className="h-[calc(100vh-120px)]">
              <div className="p-4 space-y-4">
                {course.modules.map((module) => (
                  <div key={module.id} className="space-y-2">
                    <h4 className="font-medium text-sm text-gray-900 sticky top-0 bg-white py-2">
                      {module.title}
                    </h4>
                    
                    <div className="space-y-1">
                      {module.lessons.map((lesson) => {
                        const isActive = lesson.id === lessonId;
                        const isCompleted = completedLessons.has(lesson.id);
                        
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
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              ) : lesson.type === 'video' ? (
                                <Play className="h-4 w-4 text-gray-400" />
                              ) : (
                                <FileText className="h-4 w-4 text-gray-400" />
                              )}
                              <span className={`text-sm ${isActive ? 'font-medium text-blue-900' : 'text-gray-700'}`}>
                                {lesson.title}
                              </span>
                            </div>
                            {lesson.duration && (
                              <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                                <Clock className="h-3 w-3" />
                                {lesson.duration} min
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Conteúdo Principal */}
          <div className="lg:col-span-3 p-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary">
                        {currentLesson.type === 'video' ? 'Vídeo' : 'Texto'}
                      </Badge>
                      {currentLesson.duration && (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {currentLesson.duration} min
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-2xl">{currentLesson.title}</CardTitle>
                    {currentLesson.description && (
                      <p className="text-muted-foreground mt-2">{currentLesson.description}</p>
                    )}
                  </div>
                  
                  <Button 
                    onClick={markAsCompleted}
                    variant={completedLessons.has(lessonId) ? "default" : "outline"}
                    className="flex items-center gap-2"
                  >
                    <CheckCircle className="h-4 w-4" />
                    {completedLessons.has(lessonId) ? 'Concluída' : 'Marcar como concluída'}
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Conteúdo da Aula */}
                {currentLesson.type === 'video' && currentLesson.videoUrl ? (
                  <div className="aspect-video bg-black rounded-lg flex items-center justify-center">
                    <div className="text-white text-center">
                      <Play className="h-16 w-16 mx-auto mb-4" />
                      <p>Player de vídeo em desenvolvimento</p>
                      <p className="text-sm opacity-75">URL: {currentLesson.videoUrl}</p>
                    </div>
                  </div>
                ) : (
                  <div className="prose max-w-none">
                    {currentLesson.content ? (
                      <div dangerouslySetInnerHTML={{ __html: currentLesson.content }} />
                    ) : (
                      <p className="text-muted-foreground">Conteúdo da aula será exibido aqui.</p>
                    )}
                  </div>
                )}

                {/* Arquivos da Aula */}
                {currentLesson.files && currentLesson.files.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <Download className="h-4 w-4" />
                        Materiais da Aula
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {currentLesson.files.map((file, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            className="justify-start h-auto p-3"
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            <span className="truncate">Material {index + 1}</span>
                          </Button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Navegação */}
                <Separator />
                <div className="flex justify-between items-center">
                  <div>
                    {prevLesson && (
                      <Button
                        variant="outline"
                        onClick={() => navigateToLesson(prevLesson.id)}
                        className="flex items-center gap-2"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        {prevLesson.title}
                      </Button>
                    )}
                  </div>
                  
                  <div>
                    {nextLesson && (
                      <Button
                        onClick={() => navigateToLesson(nextLesson.id)}
                        className="flex items-center gap-2"
                      >
                        {nextLesson.title}
                        <ArrowLeft className="h-4 w-4 rotate-180" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}