import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Upload, CheckCircle, AlertCircle, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import browserImageCompression from 'browser-image-compression';

interface LogoData {
  dataUrl: string;
  filename: string;
  mimeType: string;
}

export default function LogoPage() {
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar logo atual
  const { data: currentLogo, isLoading: loadingLogo } = useQuery<LogoData>({
    queryKey: ["/api/logo"],
    queryFn: async () => {
      const response = await fetch('/api/logo');
      if (!response.ok) {
        throw new Error('Logo não encontrado');
      }
      return response.json();
    },
    retry: false,
  });

  // Otimizar imagem antes do upload
  const optimizeImage = async (file: File): Promise<File> => {
    try {
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 800,
        useWebWorker: true,
      };
      return await browserImageCompression(file, options);
    } catch (error) {
      console.warn('Erro na otimização, usando arquivo original:', error);
      return file;
    }
  };

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      setIsUploading(true);
      
      try {
        // Otimizar arquivo
        const optimizedFile = await optimizeImage(file);
        
        // Upload para o banco
        const formData = new FormData();
        formData.append('logo', optimizedFile);

        const response = await fetch('/api/logo/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Erro no upload');
        }

        return await response.json();
      } finally {
        setIsUploading(false);
      }
    },
    onSuccess: () => {
      toast({
        title: "Logo atualizado!",
        description: "O logo da plataforma foi atualizado com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/logo"] });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Erro no upload",
        description: error.message,
      });
    },
  });

  const handleFileSelect = (file: File) => {
    // Validar arquivo
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      toast({
        variant: "destructive",
        title: "Formato inválido",
        description: "Use apenas PNG, JPG ou SVG.",
      });
      return;
    }

    // Validar tamanho (máximo 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "Arquivo muito grande",
        description: "O arquivo deve ter no máximo 2MB.",
      });
      return;
    }

    uploadMutation.mutate(file);
  };

  const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
    
    const file = event.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Logo da Plataforma</h1>
        <p className="text-muted-foreground">
          Personalize o logo que aparece no cabeçalho da plataforma
        </p>
      </div>

      {/* Logo Atual */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Logo Atual
          </CardTitle>
          <CardDescription>
            Este é o logo que aparece atualmente no cabeçalho
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingLogo ? (
            <div className="flex items-center justify-center h-32 bg-muted rounded-lg">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : currentLogo ? (
            <div className="flex items-center justify-center p-6 bg-muted rounded-lg">
              <img 
                src={currentLogo.dataUrl} 
                alt="Logo atual" 
                className="max-h-20 max-w-48 object-contain"
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 bg-muted rounded-lg text-muted-foreground">
              <div className="text-center">
                <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Nenhum logo personalizado configurado</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Atualizar Logo
          </CardTitle>
          <CardDescription>
            Faça upload de uma nova imagem (PNG, JPG ou SVG - máx. 2MB)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragOver 
                ? 'border-primary bg-primary/5' 
                : 'border-muted-foreground/25 hover:border-muted-foreground/50'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            {isUploading ? (
              <div className="space-y-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-sm text-muted-foreground">Fazendo upload...</p>
              </div>
            ) : (
              <div className="space-y-4">
                <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                <div>
                  <p className="text-lg font-medium">
                    Arraste uma imagem aqui ou clique para selecionar
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    PNG, JPG ou SVG até 2MB
                  </p>
                </div>
                <div>
                  <input
                    type="file"
                    id="logo-upload"
                    accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                    onChange={handleFileInput}
                    className="hidden"
                    disabled={isUploading}
                  />
                  <Button asChild variant="outline">
                    <label htmlFor="logo-upload" className="cursor-pointer">
                      Selecionar Arquivo
                    </label>
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Status */}
          {uploadMutation.isSuccess && (
            <div className="flex items-center gap-2 mt-4 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm">Logo atualizado com sucesso!</span>
            </div>
          )}

          {uploadMutation.isError && (
            <div className="flex items-center gap-2 mt-4 text-red-600">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">
                {uploadMutation.error?.message || 'Erro no upload'}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}