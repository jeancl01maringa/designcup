import { useState, useEffect } from 'react';

export function useCourseProgress(courseId: number) {
  const [completedLessons, setCompletedLessons] = useState<Set<number>>(new Set());
  const [lessonRatings, setLessonRatings] = useState<Record<number, number>>({});

  // Carregar progresso do localStorage ao montar
  useEffect(() => {
    const storageKey = `course_progress_${courseId}`;
    const ratingsKey = `course_ratings_${courseId}`;
    
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const lessonIds = JSON.parse(saved);
        setCompletedLessons(new Set(lessonIds));
      } catch (error) {
        console.error('Erro ao carregar progresso:', error);
      }
    }

    const savedRatings = localStorage.getItem(ratingsKey);
    if (savedRatings) {
      try {
        const ratings = JSON.parse(savedRatings);
        setLessonRatings(ratings);
      } catch (error) {
        console.error('Erro ao carregar avaliações:', error);
      }
    }
  }, [courseId]);

  // Salvar progresso no localStorage sempre que mudar
  useEffect(() => {
    const storageKey = `course_progress_${courseId}`;
    const lessonIds = Array.from(completedLessons);
    localStorage.setItem(storageKey, JSON.stringify(lessonIds));
  }, [completedLessons, courseId]);

  // Salvar avaliações no localStorage sempre que mudar
  useEffect(() => {
    const ratingsKey = `course_ratings_${courseId}`;
    localStorage.setItem(ratingsKey, JSON.stringify(lessonRatings));
  }, [lessonRatings, courseId]);

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

  const setLessonRating = (lessonId: number, rating: number) => {
    setLessonRatings(prev => ({
      ...prev,
      [lessonId]: rating
    }));
  };

  const getLessonRating = (lessonId: number) => {
    return lessonRatings[lessonId] || 0;
  };

  return {
    completedLessons,
    markLessonCompleted,
    markLessonIncomplete,
    toggleLessonCompletion,
    isLessonCompleted,
    setLessonRating,
    getLessonRating,
    lessonRatings,
  };
}