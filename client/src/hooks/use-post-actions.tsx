import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

interface PostActionsState {
  liked: boolean;
  saved: boolean;
}

export function usePostActions(postId: number) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isLiking, setIsLiking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Buscar status atual do post (curtido/salvo)
  const { data: status } = useQuery<PostActionsState>({
    queryKey: ['/api/posts', postId, 'status'],
    enabled: !!user && !!postId,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  // Mutation para curtir/descurtir
  const likeMutation = useMutation({
    mutationFn: async () => {
      setIsLiking(true);
      const response = await apiRequest("POST", `/api/posts/${postId}/like`);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['/api/posts', postId, 'status'], (old: PostActionsState | undefined) => ({
        ...old,
        liked: data.liked,
        saved: old?.saved || false
      }));
      
      // Invalidar cache das páginas de curtidas
      queryClient.invalidateQueries({ queryKey: ['/api/user/liked-posts'] });
      
      toast({
        title: data.liked ? "Curtido!" : "Curtida removida",
        description: data.liked ? "Arte adicionada às suas curtidas" : "Arte removida das suas curtidas",
        duration: 2000,
      });
      setIsLiking(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao curtir",
        description: error.message,
        variant: "destructive",
      });
      setIsLiking(false);
    },
  });

  // Mutation para salvar/remover dos salvos
  const saveMutation = useMutation({
    mutationFn: async () => {
      setIsSaving(true);
      const response = await apiRequest("POST", `/api/posts/${postId}/save`);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['/api/posts', postId, 'status'], (old: PostActionsState | undefined) => ({
        ...old,
        saved: data.saved,
        liked: old?.liked || false
      }));
      
      // Invalidar cache das páginas de salvos
      queryClient.invalidateQueries({ queryKey: ['/api/user/saved-posts'] });
      
      toast({
        title: data.saved ? "Salvo!" : "Removido dos salvos",
        description: data.saved ? "Arte salva na sua coleção" : "Arte removida da sua coleção",
        duration: 2000,
      });
      setIsSaving(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
      setIsSaving(false);
    },
  });

  const handleLike = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!user) {
      toast({
        title: "Login necessário",
        description: "Faça login para curtir artes",
        variant: "destructive",
      });
      return;
    }
    
    if (!isLiking) {
      likeMutation.mutate();
    }
  };

  const handleSave = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!user) {
      toast({
        title: "Login necessário",
        description: "Faça login para salvar artes",
        variant: "destructive",
      });
      return;
    }
    
    if (!isSaving) {
      saveMutation.mutate();
    }
  };

  return {
    liked: status?.liked || false,
    saved: status?.saved || false,
    isLiking,
    isSaving,
    handleLike,
    handleSave,
  };
}