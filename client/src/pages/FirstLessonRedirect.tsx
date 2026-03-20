import { useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

interface FirstLessonResponse {
  courseId: number;
  lessonId: number;
  redirectUrl: string;
}

export default function FirstLessonRedirect() {
  const params = useParams();
  const courseId = parseInt(params.courseId || "0");
  const [, setLocation] = useLocation();

  // Buscar primeira aula do curso
  const { data: firstLesson, isLoading } = useQuery<FirstLessonResponse>({
    queryKey: [`/api/courses/${courseId}/first-lesson`],
    enabled: courseId > 0,
  });

  useEffect(() => {
    if (firstLesson) {
      console.log('🚀 Redirecionando para primeira aula:', firstLesson);
      setLocation(firstLesson.redirectUrl);
    }
  }, [firstLesson, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#AA5E2F] mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando curso...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted flex items-center justify-center">
      <div className="text-center">
        <p className="text-muted-foreground">Redirecionando...</p>
      </div>
    </div>
  );
}