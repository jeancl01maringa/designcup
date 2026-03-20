import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { uploadToSupabase } from "@/lib/admin/uploadToSupabase";
import { useToast } from "@/hooks/use-toast";
import { 
  Upload, 
  ImageIcon, 
  AlertCircle, 
  CheckCircle, 
  X,
  ExternalLink
} from "lucide-react";
import type { Post } from "@shared/schema";

interface ImageRestoreManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImageRestoreManager({ open, onOpenChange }: ImageRestoreManagerProps) {
  const [uploading, setUploading] = useState<{ [key: number]: boolean }>({});
  const { toast } = useToast();

  // Buscar posts com problemas de imagem
  const { data: posts, isLoading } = useQuery<Post[]>({
    queryKey: ["/api/admin/posts"],
    enabled: open,
  });

  // Mutation para atualizar a URL da imagem
  const updateImageMutation = useMutation({
    mutationFn: async ({ postId, imageUrl }: { postId: number, imageUrl: string }) => {
      await apiRequest('PATCH', `/api/admin/posts/${postId}`, { imageUrl });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/posts/approved"] });
    },
  });

  // Função para verificar se uma URL de imagem é válida
  const checkImageUrl = (url: string): boolean => {
    if (!url) return false;
    if (url.startsWith('blob:')) return false;
    if (url === '/placeholder.jpg') return false;
    return true;
  };

  // Função para fazer upload de uma nova imagem
  const handleImageUpload = async (postId: number, file: File) => {
    setUploading(prev => ({ ...prev, [postId]: true }));
    
    try {
      // Upload para Supabase
      const imageUrl = await uploadToSupabase(file, `post_${postId}_${Date.now()}.webp`);
      
      if (!imageUrl) {
        throw new Error('Falha no upload da imagem');
      }

      // Atualizar o post com a nova URL
      await updateImageMutation.mutateAsync({ postId, imageUrl });

      toast({
        title: "Sucesso",
        description: "Imagem restaurada com sucesso",
      });

    } catch (error) {
      console.error('Erro no upload:', error);
      toast({
        title: "Erro",
        description: "Falha ao fazer upload da imagem",
        variant: "destructive",
      });
    } finally {
      setUploading(prev => ({ ...prev, [postId]: false }));
    }
  };

  // Filtrar posts com problemas de imagem
  const postsWithImageIssues = posts?.filter(post => 
    !checkImageUrl(post.imageUrl || '')
  ) || [];

  const postsWithValidImages = posts?.filter(post => 
    checkImageUrl(post.imageUrl || '')
  ) || [];

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gerenciar Imagens dos Posts</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Gerenciar Imagens dos Posts
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Estatísticas */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-red-600">{postsWithImageIssues.length}</div>
                <div className="text-sm text-muted-foreground">Posts sem imagem</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{postsWithValidImages.length}</div>
                <div className="text-sm text-muted-foreground">Posts com imagem</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{posts?.length || 0}</div>
                <div className="text-sm text-muted-foreground">Total de posts</div>
              </CardContent>
            </Card>
          </div>

          {/* Posts sem imagens */}
          {postsWithImageIssues.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <h3 className="text-lg font-semibold">Posts que precisam de imagens</h3>
                <Badge variant="destructive">{postsWithImageIssues.length}</Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {postsWithImageIssues.map((post) => (
                  <Card key={post.id} className="border-red-200">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-sm">{post.title}</h4>
                          <div className="text-xs text-muted-foreground">ID: {post.id}</div>
                          {post.isPro && (
                            <Badge variant="secondary" className="mt-1">Premium</Badge>
                          )}
                        </div>
                        <div className="text-xs text-red-500">
                          {post.imageUrl?.startsWith('blob:') ? 'URL inválida' : 'Sem imagem'}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="w-full h-24 bg-muted rounded border-2 border-dashed border-border flex items-center justify-center">
                          <ImageIcon className="h-8 w-8 text-gray-400" />
                        </div>
                        
                        <div className="flex gap-2">
                          <label className="flex-1">
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  handleImageUpload(post.id, file);
                                }
                              }}
                            />
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="w-full"
                              disabled={uploading[post.id]}
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              {uploading[post.id] ? 'Enviando...' : 'Upload'}
                            </Button>
                          </label>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(`/admin#posts/${post.id}`, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Posts com imagens válidas */}
          {postsWithValidImages.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <h3 className="text-lg font-semibold">Posts com imagens funcionando</h3>
                <Badge variant="secondary">{postsWithValidImages.length}</Badge>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {postsWithValidImages.slice(0, 8).map((post) => (
                  <Card key={post.id} className="border-green-200">
                    <CardContent className="p-2">
                      <div className="aspect-square bg-muted rounded mb-2 overflow-hidden">
                        <img 
                          src={post.imageUrl} 
                          alt={post.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                      <div className="text-xs font-medium truncate">{post.title}</div>
                      <div className="text-xs text-muted-foreground">ID: {post.id}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {postsWithValidImages.length > 8 && (
                <div className="text-center text-sm text-muted-foreground">
                  E mais {postsWithValidImages.length - 8} posts com imagens...
                </div>
              )}
            </div>
          )}

          {/* Instruções */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <h4 className="font-semibold text-blue-900 mb-2">Como restaurar as imagens:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Clique em "Upload" para cada post sem imagem</li>
                <li>• Selecione o arquivo de imagem correspondente ao post</li>
                <li>• A imagem será automaticamente otimizada e enviada para o Supabase</li>
                <li>• Após o upload, as prévias aparecerão no feed principal</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4 mr-2" />
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}