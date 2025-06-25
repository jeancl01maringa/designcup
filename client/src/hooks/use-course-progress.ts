import { useState, useEffect } from 'react';

export function useCourseProgress(courseId: number) {
  const [completedLessons, setCompletedLessons] = useState<Set<number>>(new Set());

  // Carregar progresso do localStorage ao montar
  useEffect(() => {
    const storageKey = `course_progress_${courseId}`;
    
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const lessonIds = JSON.parse(saved);
        setCompletedLessons(new Set(lessonIds));
      } catch (error) {
        console.error('Erro ao carregar progresso:', error);
      }
    }
  }, [courseId]);

  // Salvar progresso no localStorage sempre que mudar
  useEffect(() => {
    const storageKey = `course_progress_${courseId}`;
    const lessonIds = Array.from(completedLessons);
    localStorage.setItem(storageKey, JSON.stringify(lessonIds));
  }, [completedLessons, courseId]);

  const markLessonCompleted = (lessonId: number) => {
    setCompletedLessons(prev => {
      const newSet = new Set(prev);
      newSet.add(lessonId);
      return newSet;
    });
  };

  const markLessonIncomplete = (lessonId: number) => {
    setCompletedLessons(prev => {
      const newSet = new Set(prev);
      newSet.delete(lessonId);
      return newSet;
    });
  };

  const toggleLessonCompletion = (lessonId: number) => {
    if (completedLessons.has(lessonId)) {
      markLessonIncomplete(lessonId);
    } else {
      markLessonCompleted(lessonId);
    }
  };

  const isLessonCompleted = (lessonId: number) => {
    return completedLessons.has(lessonId);
  };

  return {
    completedLessons,
    markLessonCompleted,
    markLessonIncomplete,
    toggleLessonCompletion,
    isLessonCompleted,
  };
}