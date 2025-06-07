import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminLayout } from "@/components/admin/layout/AdminLayout";
import { PageHeader } from "@/components/admin/layout/PageHeader";
import { Upload, Trash2, Eye, Image as ImageIcon, Loader2 } from "lucide-react";
import { getQueryFn, queryClient } from "@/lib/queryClient";
import imageCompression from 'browser-image-compression';
import { supabase } from "@/lib/supabase";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function LogoPage() {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Buscar o logo atual da plataforma
  const { data: currentLogo, isLoading } = useQuery({
    queryKey: ["/api/settings/logo_plataforma"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  // Função para otimizar imagem
  const optimizeImage = async (file: File): Promise<File> => {
    const options = {
      maxSizeMB: 0.5, // Máximo 500KB
      maxWidthOrHeight: 800, // Máximo 800px de largura/altura
      useWebWorker: true,
      fileType: 'image/webp' as const, // Converter para WebP para melhor compressão
    };

    try {
      const compressedFile = await imageCompression(file, options);
      return compressedFile;
    } catch (error) {
      console.error('Erro ao otimizar imagem:', error);
      return file; // Retorna arquivo original se falhar
    }
  };

  // Função para fazer upload para Supabase Storage
  const uploadToSupabase = async (file: File): Promise<string> => {
    const fileName = `logo_${Date.now()}.webp`;
    const filePath = `logos/${fileName}`;

    const { data, error } = await supabase.storage
      .from('images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Erro no upload para Supabase:', error);
      throw new Error(`Falha no upload: ${error.message}`);
    }

    // Obter URL público
    const { data: publicUrlData } = supabase.storage
      .from('images')
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
  };

  // Função para remover logo antigo do Supabase
  const removeOldLogo = async (logoUrl: string) => {
    try {
      // Extrair o caminho do arquivo da URL
      const urlParts = logoUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const filePath = `logos/${fileName}`;

      await supabase.storage
        .from('images')
        .remove([filePath]);
    } catch (error) {
      console.error('Erro ao remover logo antigo:', error);
      // Não bloqueia o processo se falhar
    }
  };

  // Mutation para salvar o novo logo
  const updateLogoMutation = useMutation({
    mutationFn: async (file: File) => {
      setIsUploading(true);
      
      try {
        // 1. Otimizar imagem
        const optimizedFile = await optimizeImage(file);
        
        // 2. Upload para Supabase Storage
        const publicUrl = await uploadToSupabase(optimizedFile);
        
        // 3. Remover logo antigo se existir
        const currentLogoUrl = (currentLogo as any)?.value;
        if (currentLogoUrl && currentLogoUrl.includes('supabase')) {
          await removeOldLogo(currentLogoUrl);
        }
        
        // 4. Salvar nova URL no banco
        const response = await fetch('/api/settings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            key: 'logo_plataforma',
            value: publicUrl,
            description: 'Logo personalizado da plataforma'
          }),
        });

        if (!response.ok) {
          throw new Error('Falha ao salvar no banco de dados');
        }

        return await response.json();
      } finally {
        setIsUploading(false);
      }
    },
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Logo atualizado com sucesso",
      });
      setSelectedFile(null);
      setPreviewUrl(null);
      queryClient.invalidateQueries({ queryKey: ["/api/settings/logo_plataforma"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation para deletar logo
  const deleteLogoMutation = useMutation({
    mutationFn: async () => {
      const currentLogoUrl = (currentLogo as any)?.value;
      
      // Remover do Supabase Storage
      if (currentLogoUrl && currentLogoUrl.includes('supabase')) {
        await removeOldLogo(currentLogoUrl);
      }
      
      // Remover do banco de dados
      const response = await fetch('/api/settings/logo_plataforma', {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Falha ao remover logo');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Logo removido com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/settings/logo_plataforma"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Erro",
        description: "Formato de arquivo inválido. Use PNG, JPG ou SVG.",
        variant: "destructive",
      });
      return;
    }

    // Validar tamanho (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Erro",
        description: "Arquivo muito grande. Máximo 5MB.",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    await updateLogoMutation.mutateAsync(selectedFile);
  };

  const logoUrl = (currentLogo as any)?.value || "/generated-icon.png";

  return (
    <AdminLayout>
      <div className="space-y-6">
        <PageHeader
          title="Alterar Logo"
          description="Gerencie o logo personalizado da plataforma"
        />

        <div className="grid gap-6 md:grid-cols-2">
          {/* Logo Atual */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Logo Atual
              </CardTitle>
              <CardDescription>
                Logo atualmente exibido na plataforma
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-center bg-muted rounded-lg p-8 min-h-[200px]">
                {isLoading ? (
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                ) : (
                  <img
                    src={logoUrl}
                    alt="Logo atual"
                    className="max-w-full max-h-32 object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "/generated-icon.png";
                    }}
                  />
                )}
              </div>

              {(currentLogo as any)?.value && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remover Logo
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remover Logo</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja remover o logo personalizado? 
                        O logo padrão da plataforma será usado.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteLogoMutation.mutate()}
                        className="bg-destructive hover:bg-destructive/90"
                      >
                        Remover
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </CardContent>
          </Card>

          {/* Upload de Novo Logo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Novo Logo
              </CardTitle>
              <CardDescription>
                Faça upload de um novo logo (PNG, JPG ou SVG - máx. 5MB)
                <br />
                <small className="text-xs text-muted-foreground">
                  A imagem será otimizada automaticamente para web
                </small>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-center bg-muted rounded-lg p-8 min-h-[200px] border-2 border-dashed">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Preview do novo logo"
                    className="max-w-full max-h-32 object-contain"
                  />
                ) : (
                  <div className="text-center">
                    <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Preview aparecerá aqui
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />

                {selectedFile && (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Arquivo selecionado: {selectedFile.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Tamanho: {(selectedFile.size / 1024).toFixed(1)}KB
                    </p>
                    <Button
                      onClick={handleUpload}
                      disabled={isUploading || updateLogoMutation.isPending}
                      className="w-full"
                    >
                      {isUploading || updateLogoMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          {isUploading ? "Otimizando e enviando..." : "Salvando..."}
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Atualizar Logo
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Informações Técnicas */}
        <Card>
          <CardHeader>
            <CardTitle>Informações Técnicas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-medium mb-2">Otimização Automática</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Conversão para formato WebP</li>
                  <li>• Compressão inteligente (máx. 500KB)</li>
                  <li>• Redimensionamento (máx. 800px)</li>
                  <li>• Cache otimizado</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Armazenamento</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Upload para Supabase Storage</li>
                  <li>• URL pública gerada automaticamente</li>
                  <li>• Remoção automática de logos antigos</li>
                  <li>• Backup seguro na nuvem</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}