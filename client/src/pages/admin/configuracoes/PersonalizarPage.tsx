import { useState, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Upload, Image as ImageIcon, Trash2, Save } from "lucide-react";
import imageCompression from 'browser-image-compression';
import { AdminLayout } from "@/components/admin/layout/AdminLayout";
import { uploadFileToSupabase } from "@/lib/supabase";

export default function PersonalizarPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const logoFileInputRef = useRef<HTMLInputElement>(null);
  const backgroundFileInputRef = useRef<HTMLInputElement>(null);

  const [logoUploading, setLogoUploading] = useState(false);
  const [backgroundUploading, setBackgroundUploading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [backgroundPreview, setBackgroundPreview] = useState<string | null>(null);

  // Buscar configurações atuais
  const { data: settings, isLoading } = useQuery({
    queryKey: ['/api/settings'],
  });

  const logoUrl = settings?.find((s: any) => s.key === 'logo_url')?.value || '';
  const backgroundUrl = settings?.find((s: any) => s.key === 'login_background_url')?.value || '';

  // Atualizar configuração
  const updateSettingMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value }),
      });

      if (!response.ok) throw new Error('Erro ao atualizar configuração');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
      toast({
        title: "Sucesso",
        description: "Configuração atualizada com sucesso!",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar configuração",
        variant: "destructive",
      });
    },
  });

  // Função para comprimir e fazer upload da imagem
  const handleImageUpload = async (file: File, type: 'logo' | 'background') => {
    try {
      if (type === 'logo') {
        setLogoUploading(true);
      } else {
        setBackgroundUploading(true);
      }

      // Comprimir imagem para WebP
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: type === 'logo' ? 800 : 1920,
        useWebWorker: true,
        fileType: 'image/webp' as const,
      };

      const compressedFile = await imageCompression(file, options);

      // Criar preview
      const previewUrl = URL.createObjectURL(compressedFile);
      if (type === 'logo') {
        setLogoPreview(previewUrl);
      } else {
        setBackgroundPreview(previewUrl);
      }

      // Upload para Supabase Storage usando o novo padrão
      const fileName = type === 'logo' ? 'plataforma_logo' : 'login_background';
      const { url: imageUrl, error: uploadError } = await uploadFileToSupabase(
        compressedFile,
        'images',
        `uploads/${fileName}`
      );

      if (uploadError || !imageUrl) {
        throw new Error(`Erro no upload: ${uploadError || 'URL não retornada'}`);
      }

      console.log(`Upload concluído: ${imageUrl}`);

      // Atualizar configuração no banco
      const settingKey = type === 'logo' ? 'logo_url' : 'login_background_url';
      await updateSettingMutation.mutateAsync({ key: settingKey, value: imageUrl });

      toast({
        title: "Upload realizado",
        description: `${type === 'logo' ? 'Logo' : 'Imagem de fundo'} atualizada com sucesso!`,
      });

    } catch (error) {
      console.error('Erro no upload:', error);
      toast({
        title: "Erro",
        description: "Erro ao fazer upload da imagem",
        variant: "destructive",
      });
    } finally {
      if (type === 'logo') {
        setLogoUploading(false);
      } else {
        setBackgroundUploading(false);
      }
    }
  };

  // Remover imagem
  const handleRemoveImage = async (type: 'logo' | 'background') => {
    const settingKey = type === 'logo' ? 'logo_url' : 'login_background_url';
    await updateSettingMutation.mutateAsync({ key: settingKey, value: '' });

    if (type === 'logo') {
      setLogoPreview(null);
    } else {
      setBackgroundPreview(null);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Personalizar</h1>
          <p className="text-gray-600 mt-2">
            Configure o logo da plataforma e a imagem de fundo da página de login
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Logo da Plataforma */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5" />
                Logo da Plataforma
              </CardTitle>
              <CardDescription>
                Logo exibido no cabeçalho e página de login
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Preview do logo */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center min-h-[200px] flex items-center justify-center">
                {logoPreview || logoUrl ? (
                  <div className="space-y-4">
                    <img
                      src={logoPreview || logoUrl}
                      alt="Logo preview"
                      className="max-h-32 mx-auto object-contain"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveImage('logo')}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Remover
                    </Button>
                  </div>
                ) : (
                  <div className="text-gray-500">
                    <ImageIcon className="w-12 h-12 mx-auto mb-4" />
                    <p>Nenhum logo configurado</p>
                  </div>
                )}
              </div>

              {/* Upload do logo */}
              <div className="space-y-2">
                <Label htmlFor="logo-upload">Selecionar Logo</Label>
                <div className="flex gap-2">
                  <Input
                    ref={logoFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file, 'logo');
                    }}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    onClick={() => logoFileInputRef.current?.click()}
                    disabled={logoUploading}
                    className="flex-1"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {logoUploading ? 'Enviando...' : 'Escolher Arquivo'}
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  Formatos: PNG, JPG, JPEG. Será comprimido para WebP automaticamente.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Imagem de Fundo do Login */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5" />
                Fundo do Login
              </CardTitle>
              <CardDescription>
                Imagem de fundo da página de login
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Preview da imagem de fundo */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center min-h-[200px] flex items-center justify-center">
                {backgroundPreview || backgroundUrl ? (
                  <div className="space-y-4 w-full">
                    <img
                      src={backgroundPreview || backgroundUrl}
                      alt="Background preview"
                      className="max-h-32 mx-auto object-cover rounded-lg w-full"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveImage('background')}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Remover
                    </Button>
                  </div>
                ) : (
                  <div className="text-gray-500">
                    <ImageIcon className="w-12 h-12 mx-auto mb-4" />
                    <p>Nenhuma imagem de fundo configurada</p>
                  </div>
                )}
              </div>

              {/* Upload da imagem de fundo */}
              <div className="space-y-2">
                <Label htmlFor="background-upload">Selecionar Imagem de Fundo</Label>
                <div className="flex gap-2">
                  <Input
                    ref={backgroundFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file, 'background');
                    }}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    onClick={() => backgroundFileInputRef.current?.click()}
                    disabled={backgroundUploading}
                    className="flex-1"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {backgroundUploading ? 'Enviando...' : 'Escolher Arquivo'}
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  Formatos: PNG, JPG, JPEG. Resolução recomendada: 1920x1080px ou superior.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Instruções */}
        <Card>
          <CardHeader>
            <CardTitle>Como usar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Logo da Plataforma</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Aparece no cabeçalho de todas as páginas</li>
                  <li>• Exibido na página de login</li>
                  <li>• Tamanho recomendado: 200x60px</li>
                  <li>• Fundo transparente (PNG) é recomendado</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Imagem de Fundo</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Aparece como fundo na página de login</li>
                  <li>• Resolução recomendada: 1920x1080px</li>
                  <li>• Será automaticamente otimizada</li>
                  <li>• Use imagens relacionadas ao tema estética</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}