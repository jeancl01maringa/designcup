import React, { useState, useRef } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { AdminLayout } from "@/components/admin/layout/AdminLayout";
import { PageHeader } from "@/components/admin/layout/PageHeader";
import { Upload, Image as ImageIcon, Trash2, Eye } from "lucide-react";
import { apiRequest, queryClient, getQueryFn } from "@/lib/queryClient";

export default function LogoPage() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Buscar o logo atual da plataforma
  const { data: currentLogo, isLoading } = useQuery({
    queryKey: ["/api/settings/logo_plataforma"],
    queryFn: getQueryFn(),
  });

  // Mutation para salvar o novo logo
  const updateLogoMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch("/api/settings/logo", {
        method: "POST",
        body: formData,
        credentials: "include"
      });
      
      if (!res.ok) {
        const errorData = await res.text();
        throw new Error(errorData || "Erro ao fazer upload do logo");
      }
      
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Logo atualizado",
        description: "O logo da plataforma foi atualizado com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/settings/logo_plataforma"] });
      setSelectedFile(null);
      setPreviewUrl(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar logo",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation para remover o logo personalizado
  const removeLogoMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", "/api/settings/logo_plataforma");
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Logo removido",
        description: "O logo personalizado foi removido. O logo padrão será usado.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/settings/logo_plataforma"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao remover logo",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/svg+xml"];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Formato inválido",
        description: "Por favor, selecione um arquivo PNG, JPG ou SVG.",
        variant: "destructive",
      });
      return;
    }

    // Validar tamanho (máximo 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "O arquivo deve ter no máximo 2MB.",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    
    // Criar preview
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("logo", selectedFile);
      
      await updateLogoMutation.mutateAsync(formData);
    } finally {
      setIsUploading(false);
    }
  };

  const logoUrl = currentLogo?.value || "/generated-icon.png";

  return (
    <AdminLayout>
      <div className="space-y-6">
        <PageHeader
          title="Alterar Logo da Plataforma"
          description="Personalize o logo que aparece no cabeçalho e painel administrativo"
        />

        <div className="grid gap-6 md:grid-cols-2">
          {/* Upload de Novo Logo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload de Novo Logo
              </CardTitle>
              <CardDescription>
                Selecione uma imagem PNG, JPG ou SVG. Máximo 2MB.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="logo-upload">Selecionar arquivo</Label>
                <Input
                  id="logo-upload"
                  type="file"
                  accept=".png,.jpg,.jpeg,.svg"
                  onChange={handleFileSelect}
                  ref={fileInputRef}
                  className="mt-2"
                />
              </div>

              {previewUrl && (
                <div className="space-y-2">
                  <Label>Preview</Label>
                  <div className="border rounded-lg p-4 bg-muted/50">
                    <img
                      src={previewUrl}
                      alt="Preview do logo"
                      className="max-w-[200px] max-h-[100px] object-contain mx-auto"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={handleUpload}
                  disabled={!selectedFile || isUploading}
                  className="flex-1"
                >
                  {isUploading ? "Enviando..." : "Salvar Logo"}
                </Button>
                {selectedFile && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewUrl(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = "";
                      }
                    }}
                  >
                    Cancelar
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Logo Atual */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Logo Atual
              </CardTitle>
              <CardDescription>
                Este é o logo que aparece atualmente na plataforma.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <div className="border rounded-lg p-8 bg-muted/50 flex items-center justify-center">
                  <span className="text-muted-foreground">Carregando...</span>
                </div>
              ) : (
                <div className="border rounded-lg p-4 bg-muted/50">
                  <img
                    src={logoUrl}
                    alt="Logo atual da plataforma"
                    className="max-w-[200px] max-h-[100px] object-contain mx-auto"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/generated-icon.png";
                    }}
                  />
                </div>
              )}

              {currentLogo?.value && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remover Logo Personalizado
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remover logo personalizado?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta ação irá remover o logo personalizado e voltar a usar o logo padrão da plataforma.
                        Esta ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => removeLogoMutation.mutate()}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Remover
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Informações sobre onde o logo aparece */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Onde o logo aparece
            </CardTitle>
            <CardDescription>
              O logo personalizado será exibido automaticamente nos seguintes locais:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                Cabeçalho da página inicial e demais páginas públicas
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                Topo da sidebar do painel administrativo
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                Páginas de autenticação (login/registro)
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                Emails automáticos e notificações
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}