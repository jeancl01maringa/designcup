import React, { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AdminLayout } from "@/components/admin/layout/AdminLayout";
import { PageHeader } from "@/components/admin/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Upload, Save, Loader2, Image as ImageIcon, RotateCw } from "lucide-react";

const logoSchema = z.object({
  logo: z.any().optional(),
});

type LogoFormData = z.infer<typeof logoSchema>;

export default function LogoPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Buscar logo atual
  const { data: currentLogo, isLoading: isLoadingLogo } = useQuery({
    queryKey: ["/api/logo"],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", "/api/logo");
        return await response.json();
      } catch (error) {
        return null;
      }
    },
  });

  const form = useForm<LogoFormData>({
    resolver: zodResolver(logoSchema),
    defaultValues: {
      logo: null,
    },
  });

  const updateLogoMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('logo', file);
      
      const response = await fetch('/api/logo', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao fazer upload do logo');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Logo atualizado com sucesso!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/logo"] });
      setPreviewUrl(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar logo",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Erro",
          description: "Por favor, selecione apenas arquivos de imagem",
          variant: "destructive",
        });
        return;
      }

      // Validar tamanho (máx 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Erro",
          description: "O arquivo deve ter no máximo 5MB",
          variant: "destructive",
        });
        return;
      }

      // Criar preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      form.setValue('logo', file);
    }
  };

  const onSubmit = async (data: LogoFormData) => {
    if (!data.logo) {
      toast({
        title: "Erro",
        description: "Por favor, selecione um arquivo de logo",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await updateLogoMutation.mutateAsync(data.logo);
    } finally {
      setIsLoading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <PageHeader
          title="Gerenciar Logo"
          description="Configure o logo da plataforma que aparece no cabeçalho"
        />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Logo da Plataforma
            </CardTitle>
            <CardDescription>
              Faça upload de um novo logo. Recomendamos formato PNG ou SVG com fundo transparente.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Logo atual */}
                {currentLogo?.dataUrl && (
                  <div className="space-y-2">
                    <FormLabel>Logo Atual</FormLabel>
                    <div className="p-4 border-2 border-dashed border-border rounded-lg bg-muted">
                      <div className="flex items-center justify-center">
                        <img 
                          src={currentLogo.dataUrl} 
                          alt="Logo atual" 
                          className="max-h-24 max-w-full object-contain"
                          style={{
                            imageRendering: 'crisp-edges',
                            filter: 'contrast(1.1) brightness(1.05)'
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Upload novo logo */}
                <FormField
                  control={form.control}
                  name="logo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Novo Logo</FormLabel>
                      <FormControl>
                        <div className="space-y-4">
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileSelect}
                            className="hidden"
                          />
                          
                          <Button
                            type="button"
                            variant="outline"
                            onClick={triggerFileInput}
                            className="w-full h-32 border-2 border-dashed hover:border-primary/50 transition-colors"
                          >
                            <div className="flex flex-col items-center gap-2">
                              <Upload className="h-8 w-8 text-muted-foreground" />
                              <span className="text-sm font-medium">Clique para selecionar um arquivo</span>
                              <span className="text-xs text-muted-foreground">PNG, JPG, SVG (máx. 5MB)</span>
                            </div>
                          </Button>

                          {/* Preview do novo logo */}
                          {previewUrl && (
                            <div className="space-y-2">
                              <FormLabel>Preview do Novo Logo</FormLabel>
                              <div className="p-4 border-2 border-dashed border-green-200 rounded-lg bg-green-50">
                                <div className="flex items-center justify-center">
                                  <img 
                                    src={previewUrl} 
                                    alt="Preview do novo logo" 
                                    className="max-h-24 max-w-full object-contain"
                                    style={{
                                      imageRendering: 'crisp-edges',
                                      filter: 'contrast(1.1) brightness(1.05)'
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex items-center gap-4">
                  <Button 
                    type="submit" 
                    disabled={isLoading || updateLogoMutation.isPending || !previewUrl}
                    className="min-w-[120px] bg-blue-600 hover:bg-blue-700"
                  >
                    {(isLoading || updateLogoMutation.isPending) ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Salvar Logo
                      </>
                    )}
                  </Button>

                  {currentLogo && (
                    <div className="text-sm text-muted-foreground">
                      Última atualização: {new Date().toLocaleString('pt-BR')}
                    </div>
                  )}
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Onde o logo aparece</CardTitle>
            <CardDescription>
              O logo configurado será exibido automaticamente nos seguintes locais:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                Cabeçalho principal da plataforma
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                Menu de navegação mobile
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                Páginas de login e registro
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                Emails automáticos da plataforma
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dicas para o melhor resultado</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full mt-2 flex-shrink-0"></div>
                Use formato PNG ou SVG para melhor qualidade
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full mt-2 flex-shrink-0"></div>
                Prefira fundo transparente para melhor integração
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full mt-2 flex-shrink-0"></div>
                Mantenha proporção retangular horizontal (landscape)
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full mt-2 flex-shrink-0"></div>
                Teste em diferentes tamanhos de tela após o upload
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}