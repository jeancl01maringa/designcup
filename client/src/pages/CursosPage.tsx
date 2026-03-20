import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Play, Search, Lock, Users, Clock } from "lucide-react";
import type { Course } from "@shared/schema";

interface CourseWithAccess extends Course {
  moduleCount: number;
  lessonCount: number;
  hasAccess: boolean;
  progress?: number;
}

export default function CursosPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");

  // Buscar cursos disponíveis para o usuário
  const { data: courses = [], isLoading } = useQuery<CourseWithAccess[]>({
    queryKey: ["/api/courses"],
    enabled: !!user,
  });

  // Filtrar cursos por termo de busca
  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.shortDescription?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted">
        <Helmet>
          <title>Cursos - Design para Estética</title>
        </Helmet>
        
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Meus Cursos</h1>
            <p className="text-muted-foreground">Acesse seus cursos e continue aprendendo</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="h-80">
                <div className="h-48 bg-gray-200 rounded-t-lg animate-pulse"></div>
                <CardContent className="p-4">
                  <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted">
      <Helmet>
        <title>Cursos - Design para Estética</title>
      </Helmet>
      
      <div className="container mx-auto px-4 py-8">
        {/* Cabeçalho */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Meus Cursos</h1>
          <p className="text-muted-foreground">Acesse seus cursos e continue aprendendo</p>
        </div>

        {/* Barra de busca */}
        <div className="flex items-center space-x-2 mb-8">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar cursos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>

        {/* Grid de cursos */}
        {filteredCourses.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                {searchTerm ? "Nenhum curso encontrado" : "Nenhum curso disponível"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm 
                  ? "Tente buscar com outros termos"
                  : "Você ainda não tem acesso a nenhum curso"
                }
              </p>
              {!searchTerm && (
                <Button asChild>
                  <Link href="/planos">Ver Planos</Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <Card key={course.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                {/* Capa do curso */}
                <div className="h-48 bg-gradient-to-br from-pink-100 to-purple-100 relative">
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
                  
                  {/* Badge de status */}
                  <div className="absolute top-4 right-4">
                    {course.hasAccess ? (
                      course.progress !== undefined && course.progress > 0 ? (
                        <Badge className="bg-blue-100 text-blue-800">
                          {Math.round(course.progress)}% concluído
                        </Badge>
                      ) : (
                        <Badge className="bg-green-100 text-green-800">
                          Disponível
                        </Badge>
                      )
                    ) : (
                      <Badge className="bg-muted text-foreground">
                        <Lock className="h-3 w-3 mr-1" />
                        Premium
                      </Badge>
                    )}
                  </div>
                </div>

                <CardContent className="p-4">
                  <CardTitle className="text-lg mb-2 line-clamp-2">
                    {course.title}
                  </CardTitle>
                  
                  {course.shortDescription && (
                    <CardDescription className="mb-4 line-clamp-2">
                      {course.shortDescription}
                    </CardDescription>
                  )}

                  {/* Estatísticas */}
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <BookOpen className="h-4 w-4" />
                        {course.moduleCount} módulos
                      </div>
                      <div className="flex items-center gap-1">
                        <Play className="h-4 w-4" />
                        {course.lessonCount} aulas
                      </div>
                    </div>
                  </div>

                  {/* Botão de ação */}
                  {course.hasAccess ? (
                    <Button 
                      onClick={() => {
                        // Redirecionar direto para primeira aula do curso
                        setLocation(`/cursos/${course.id}/primeira-aula`);
                      }}
                      className="w-full bg-[#AA5E2F] hover:bg-[#AA5E2F]/90 text-white"
                    >
                      {course.progress !== undefined && course.progress > 0 ? "Continuar" : "Acessar Curso"}
                    </Button>
                  ) : (
                    <Button variant="outline" className="w-full" asChild>
                      <Link href="/planos">
                        <Lock className="h-4 w-4 mr-2" />
                        Fazer Upgrade
                      </Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}