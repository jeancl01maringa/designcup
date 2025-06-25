import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ArrowLeft, Play, Clock, BookOpen, Users, Star, Lock, ChevronDown, ChevronRight, CheckCircle, FileText } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface Course {
  id: number;
  title: string;
  description: string;
  coverImage?: string;
  modules?: Module[];
}

interface Module {
  id: number;
  title: string;
  orderIndex: number;
  lessons: Lesson[];
}

interface Lesson {
  id: number;
  moduleId: number;
  title: string;
  description?: string;
  content?: string;
  type: 'video' | 'text' | 'quiz';
  duration?: number;
  orderIndex: number;
}

export default function CursoDetailPage() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  
  const courseId = parseInt(params.courseId || "0");
  const [openModules, setOpenModules] = useState<Set<number>>(new Set([1])); // Primeiro módulo aberto por padrão
  const [completedLessons, setCompletedLessons] = useState<Set<number>>(new Set());

  // Buscar dados do curso completo
  const { data: course, isLoading } = useQuery<Course>({
    queryKey: [`/api/courses/${courseId}/full`],
    enabled: courseId > 0,
  });

  // Verificar se usuário tem acesso (todos os cursos são acessíveis para usuários logados)
  const hasAccess = true;
  
  // Calcular progresso
  const totalLessons = course?.modules?.reduce((acc, module) => acc + module.lessons.length, 0) || 0;
  const completedCount = completedLessons.size;
  const progressPercentage = totalLessons > 0 ? (completedCount / totalLessons) * 100 : 0;

  const handleBack = () => {
    setLocation('/cursos');
  };

  const toggleModule = (moduleId: number) => {
    const newOpenModules = new Set(openModules);
    if (newOpenModules.has(moduleId)) {
      newOpenModules.delete(moduleId);
    } else {
      newOpenModules.add(moduleId);
    }
    setOpenModules(newOpenModules);
  };

  const startLesson = (lessonId: number) => {
    setLocation(`/cursos/${courseId}/aulas/${lessonId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-64 bg-gray-200 rounded mb-6"></div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="text-center p-8">
          <CardContent>
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Curso não encontrado
            </h3>
            <p className="text-gray-600 mb-4">
              O curso que você está procurando não existe ou foi removido.
            </p>
            <Button onClick={handleBack}>
              Voltar aos Cursos
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <Lock className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <CardTitle>Curso Premium</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">
              Este curso está disponível apenas para assinantes premium.
            </p>
            <Button onClick={() => setLocation('/planos')}>
              Fazer Upgrade para Premium
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>{course.title}</title>
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        <Button 
          variant="ghost" 
          onClick={handleBack}
          className="mb-6 flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar aos Cursos
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Conteúdo Principal */}
          <div className="lg:col-span-3">
            {/* Header do Curso */}
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-2xl mb-2">{course.title}</CardTitle>
                    <p className="text-muted-foreground mb-4">{course.description}</p>
                    
                    {/* Progresso */}
                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex-1">
                        <div className="flex justify-between text-sm mb-2">
                          <span>Meu progresso</span>
                          <span className="font-medium">{Math.round(progressPercentage)}%</span>
                        </div>
                        <Progress value={progressPercentage} className="h-2" />
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {completedCount} de {totalLessons} aulas
                      </span>
                    </div>
                  </div>
                  {user?.tipo === 'premium' && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Star className="h-3 w-3" />
                      Premium
                    </Badge>
                  )}
                </div>
              </CardHeader>
            </Card>

            {/* Lista de Conteúdos */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Lista de Conteúdos</h3>
              
              {course.modules && course.modules.length > 0 ? (
                <div className="space-y-3">
                  {course.modules.map((module, moduleIndex) => (
                    <Card key={module.id} className="overflow-hidden">
                      <Collapsible 
                        open={openModules.has(module.id)} 
                        onOpenChange={() => toggleModule(module.id)}
                      >
                        <CollapsibleTrigger asChild>
                          <CardHeader className="hover:bg-gray-50 cursor-pointer transition-colors">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                                  {moduleIndex + 1}
                                </div>
                                <div>
                                  <CardTitle className="text-lg">{module.title}</CardTitle>
                                  <p className="text-sm text-muted-foreground">
                                    {module.lessons.length} aula{module.lessons.length !== 1 ? 's' : ''}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">
                                  {module.lessons.filter(l => completedLessons.has(l.id)).length}/{module.lessons.length}
                                </span>
                                {openModules.has(module.id) ? (
                                  <ChevronDown className="h-5 w-5" />
                                ) : (
                                  <ChevronRight className="h-5 w-5" />
                                )}
                              </div>
                            </div>
                          </CardHeader>
                        </CollapsibleTrigger>
                        
                        <CollapsibleContent>
                          <CardContent className="pt-0">
                            <div className="space-y-2">
                              {module.lessons.map((lesson, lessonIndex) => {
                                const isCompleted = completedLessons.has(lesson.id);
                                const lessonNumber = lessonIndex + 1;
                                
                                return (
                                  <div 
                                    key={lesson.id} 
                                    className={`flex items-center justify-between p-3 rounded-lg border transition-colors cursor-pointer ${
                                      isCompleted ? 'bg-green-50 border-green-200' : 'bg-white hover:bg-gray-50'
                                    }`}
                                    onClick={() => startLesson(lesson.id)}
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className="flex items-center justify-center w-6 h-6 text-xs text-muted-foreground">
                                        {lessonNumber.toString().padStart(2, '0')}
                                      </div>
                                      
                                      {isCompleted ? (
                                        <CheckCircle className="h-5 w-5 text-green-600" />
                                      ) : lesson.type === 'video' ? (
                                        <Play className="h-5 w-5 text-blue-600" />
                                      ) : (
                                        <FileText className="h-5 w-5 text-gray-600" />
                                      )}
                                      
                                      <div>
                                        <h4 className="font-medium">{lesson.title}</h4>
                                        {lesson.description && (
                                          <p className="text-sm text-muted-foreground">{lesson.description}</p>
                                        )}
                                      </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-3">
                                      {lesson.duration && (
                                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                          <Clock className="h-3 w-3" />
                                          {lesson.duration} min
                                        </div>
                                      )}
                                      
                                      <Button 
                                        size="sm" 
                                        variant={isCompleted ? "outline" : "default"}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          startLesson(lesson.id);
                                        }}
                                      >
                                        {isCompleted ? 'Revisar' : 'Assistir'}
                                      </Button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </CardContent>
                        </CollapsibleContent>
                      </Collapsible>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="text-center py-8">
                    <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-muted-foreground">Nenhum módulo disponível ainda.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Sobre o Curso</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{course.modules?.length || 0} módulos</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Play className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{totalLessons} aulas</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Acesso vitalício</span>
                </div>

                <Separator />
                
                <p className="text-xs text-muted-foreground">
                  Continue seu aprendizado e complete todas as aulas para dominar o conteúdo.
                </p>
              </CardContent>
            </Card>

            {/* Progresso Detalhado */}
            <Card>
              <CardHeader>
                <CardTitle>Seu Progresso</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Concluído</span>
                    <span className="font-medium">{Math.round(progressPercentage)}%</span>
                  </div>
                  <Progress value={progressPercentage} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {completedCount} de {totalLessons} aulas concluídas
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}