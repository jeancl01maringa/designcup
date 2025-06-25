import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Helmet } from "react-helmet";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { 
  BookOpen, 
  Play, 
  FileText, 
  ExternalLink, 
  Download, 
  ChevronDown, 
  ChevronRight,
  Check,
  Lock,
  ArrowLeft,
  Clock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import type { Course, CourseModule, CourseLesson } from "@shared/schema";

interface CourseWithModules extends Course {
  modules: (CourseModule & {
    lessons: (CourseLesson & {
      isCompleted?: boolean;
    })[];
  })[];
  hasAccess: boolean;
  progress: number;
}

export default function CursoDetailPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, params] = useRoute("/curso/:id");
  const courseId = params?.id ? parseInt(params.id) : null;
  const [openModules, setOpenModules] = useState<number[]>([]);

  // Buscar detalhes do curso
  const { data: course, isLoading } = useQuery<CourseWithModules>({
    queryKey: ["/api/courses", courseId],
    enabled: !!courseId && !!user,
  });

  // Mutation para marcar aula como concluída
  const markLessonCompleteMutation = useMutation({
    mutationFn: async (lessonId: number) => {
      const res = await apiRequest("POST", "/api/course-progress", {
        lessonId,
        isCompleted: true,
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses", courseId] });
      toast({
        title: "Aula concluída!",
        description: "Seu progresso foi salvo.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao salvar progresso",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const toggleModule = (moduleId: number) => {
    setOpenModules(prev => 
      prev.includes(moduleId) 
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const getLessonIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Play className="h-4 w-4" />;
      case 'pdf':
        return <FileText className="h-4 w-4" />;
      case 'link':
        return <ExternalLink className="h-4 w-4" />;
      default:
        return <BookOpen className="h-4 w-4" />;
    }
  };

  const getLessonTypeLabel = (type: string) => {
    switch (type) {
      case 'video':
        return 'Vídeo';
      case 'pdf':
        return 'PDF';
      case 'link':
        return 'Link Externo';
      case 'text':
        return 'Texto';
      default:
        return type;
    }
  };

  const handleLessonClick = (lesson: CourseLesson) => {
    if (lesson.type === 'video' && lesson.content) {
      // Abrir vídeo em nova aba
      window.open(lesson.content, '_blank');
    } else if (lesson.type === 'pdf' && lesson.content) {
      // Baixar PDF
      window.open(lesson.content, '_blank');
    } else if (lesson.type === 'link' && lesson.content) {
      // Abrir link externo
      window.open(lesson.content, '_blank');
    }
    
    // Marcar como concluída se não estiver
    if (!lesson.isCompleted) {
      markLessonCompleteMutation.mutate(lesson.id);
    }
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
            <Button asChild>
              <Link href="/cursos">Voltar aos Cursos</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!course.hasAccess) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Helmet>
          <title>{course.title} - Design para Estética</title>
        </Helmet>
        
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <Button variant="ghost" asChild>
              <Link href="/cursos">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar aos Cursos
              </Link>
            </Button>
          </div>

          <Card className="text-center p-8">
            <CardContent>
              <Lock className="h-12 w-12 text-amber-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                Curso Premium
              </h3>
              <p className="text-gray-600 mb-6">
                Este curso está disponível apenas para assinantes premium.
              </p>
              <Button asChild>
                <Link href="/planos">Fazer Upgrade para Premium</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const totalLessons = course.modules.reduce((acc, module) => acc + module.lessons.length, 0);
  const completedLessons = course.modules.reduce(
    (acc, module) => acc + module.lessons.filter(lesson => lesson.isCompleted).length, 
    0
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>{course.title} - Design para Estética</title>
      </Helmet>
      
      <div className="container mx-auto px-4 py-8">
        {/* Navegação */}
        <div className="mb-6">
          <Button variant="ghost" asChild>
            <Link href="/cursos">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar aos Cursos
            </Link>
          </Button>
        </div>

        {/* Cabeçalho do curso */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Capa do curso */}
              <div className="lg:w-64 h-48 bg-gradient-to-br from-pink-100 to-purple-100 rounded-lg overflow-hidden flex-shrink-0">
                {course.coverImage ? (
                  <img
                    src={course.coverImage}
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <BookOpen className="h-16 w-16 text-pink-300" />
                  </div>
                )}
              </div>

              {/* Informações do curso */}
              <div className="flex-1">
                <CardTitle className="text-2xl mb-3">{course.title}</CardTitle>
                {course.description && (
                  <CardDescription className="text-base mb-4">
                    {course.description}
                  </CardDescription>
                )}
                
                {/* Progresso */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Progresso do Curso</span>
                    <span className="text-sm text-gray-600">
                      {completedLessons} de {totalLessons} aulas
                    </span>
                  </div>
                  <Progress value={course.progress} className="h-2" />
                  <p className="text-sm text-gray-600 mt-1">
                    {Math.round(course.progress)}% concluído
                  </p>
                </div>

                {/* Estatísticas */}
                <div className="flex gap-6 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <BookOpen className="h-4 w-4" />
                    {course.modules.length} módulos
                  </div>
                  <div className="flex items-center gap-1">
                    <Play className="h-4 w-4" />
                    {totalLessons} aulas
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Módulos e aulas */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold mb-4">Conteúdo do Curso</h2>
          
          {course.modules.map((module, moduleIndex) => {
            const moduleCompleted = module.lessons.filter(lesson => lesson.isCompleted).length;
            const moduleProgress = module.lessons.length > 0 
              ? (moduleCompleted / module.lessons.length) * 100 
              : 0;
            const isOpen = openModules.includes(module.id);

            return (
              <Card key={module.id}>
                <Collapsible open={isOpen} onOpenChange={() => toggleModule(module.id)}>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {isOpen ? (
                            <ChevronDown className="h-5 w-5 text-gray-400" />
                          ) : (
                            <ChevronRight className="h-5 w-5 text-gray-400" />
                          )}
                          <div>
                            <CardTitle className="text-lg">
                              Módulo {moduleIndex + 1}: {module.title}
                            </CardTitle>
                            {module.description && (
                              <CardDescription className="mt-1">
                                {module.description}
                              </CardDescription>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-600 mb-1">
                            {moduleCompleted} de {module.lessons.length} aulas
                          </div>
                          <Progress value={moduleProgress} className="w-20 h-1" />
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <CardContent className="pt-0">
                      <Separator className="mb-4" />
                      <div className="space-y-3">
                        {module.lessons.map((lesson, lessonIndex) => (
                          <div
                            key={lesson.id}
                            className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                              lesson.isCompleted 
                                ? 'bg-green-50 border-green-200' 
                                : 'bg-white border-gray-200 hover:bg-gray-50'
                            }`}
                            onClick={() => handleLessonClick(lesson)}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                                lesson.isCompleted 
                                  ? 'bg-green-100 text-green-600' 
                                  : 'bg-gray-100 text-gray-600'
                              }`}>
                                {lesson.isCompleted ? (
                                  <Check className="h-4 w-4" />
                                ) : (
                                  getLessonIcon(lesson.type)
                                )}
                              </div>
                              <div>
                                <div className="font-medium">
                                  {lessonIndex + 1}. {lesson.title}
                                </div>
                                {lesson.description && (
                                  <div className="text-sm text-gray-600">
                                    {lesson.description}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">
                                {getLessonTypeLabel(lesson.type)}
                              </Badge>
                              {lesson.type === 'pdf' && (
                                <Download className="h-4 w-4 text-gray-400" />
                              )}
                              {lesson.type === 'link' && (
                                <ExternalLink className="h-4 w-4 text-gray-400" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}