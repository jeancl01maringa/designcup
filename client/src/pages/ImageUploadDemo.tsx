import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { uploadFileToSupabase } from '@/lib/supabase';
import { SupabaseRLSAlert } from '@/components/ui/supabase-alert';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ImageWithFallback } from '@/components/ui/image-with-fallback';
import { ArrowUp, Loader2, Image, Upload, CheckCircle2, AlertTriangle } from 'lucide-react';
import { nanoid } from '@/lib/utils';

export default function ImageUploadDemo() {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      
      // Gerar preview temporário
      const objectUrl = URL.createObjectURL(selectedFile);
      setPreviewUrl(objectUrl);
      
      // Limpar URL do Supabase (se houver) e erros
      setUploadedImageUrl(null);
      setError(null);
      
      toast({
        title: 'Arquivo selecionado',
        description: `${selectedFile.name} (${(selectedFile.size / 1024).toFixed(1)}KB)`,
      });
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: 'Nenhum arquivo selecionado',
        description: 'Selecione uma imagem para fazer upload.',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    setError(null);
    
    try {
      // Gerar IDs únicos para simulação
      const userId = 123;
      const postId = Date.now();
      const cursoId = nanoid().substring(0, 8);
      
      // Seletor de tipo para demonstração
      const demoSelector = document.getElementById('demoUploadType') as HTMLSelectElement;
      const uploadType = demoSelector?.value as 'post' | 'perfil' | 'curso' | 'personalizado' || 'post';
      
      toast({
        title: 'Enviando imagem...',
        description: `Tipo de upload: ${uploadType}. Aguarde enquanto processamos sua imagem.`,
      });
      
      let uploadOptions = {
        type: uploadType,
        data: {},
        convertToWebP: true
      } as any;
      
      // Configurar dados específicos para cada tipo
      switch (uploadType) {
        case 'post':
          uploadOptions.data = {
            categoria: 'estetica-facial',
            postId: postId
          };
          break;
        
        case 'perfil':
          uploadOptions.data = {
            userId: userId
          };
          break;
        
        case 'curso':
          uploadOptions.data = {
            cursoId: cursoId
          };
          break;
        
        case 'personalizado':
        default:
          uploadOptions.data = {
            customPath: `demo/${nanoid().substring(0, 8)}/${file.name}`
          };
      }
      
      // Fazer upload usando nossa função aprimorada
      const imageUrl = await uploadFileToSupabase(file, uploadOptions);
      
      if (imageUrl) {
        setUploadedImageUrl(imageUrl);
        toast({
          title: 'Upload concluído!',
          description: 'Sua imagem foi salva com sucesso no Supabase.',
        });
      } else {
        setError('Não foi possível concluir o upload. Verifique as políticas de acesso do Supabase.');
        toast({
          title: 'Falha no upload',
          description: 'Não foi possível salvar a imagem no Supabase.',
          variant: 'destructive',
        });
      }
    } catch (err) {
      console.error('Erro no upload:', err);
      setError(`Erro: ${err instanceof Error ? err.message : 'Falha desconhecida'}`);
      toast({
        title: 'Erro no upload',
        description: 'Ocorreu um erro durante o upload da imagem.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6">Teste de Upload para Supabase</h1>
      <p className="text-muted-foreground mb-6">
        Esta página demonstra como fazer upload de imagens para o bucket do Supabase
        usando as práticas recomendadas.
      </p>
      
      {/* Alerta com instruções sobre RLS */}
      <SupabaseRLSAlert supabaseUrl={import.meta.env.VITE_SUPABASE_URL as string} />
      
      <div className="grid md:grid-cols-2 gap-8 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>1. Selecione uma imagem</CardTitle>
            <CardDescription>
              Escolha um arquivo de imagem do seu dispositivo para upload.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="image">Arquivo de imagem</Label>
                <Input 
                  id="image" 
                  type="file" 
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={uploading}
                  className="cursor-pointer"
                />
              </div>
              
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="demoUploadType">Tipo de upload</Label>
                <select 
                  id="demoUploadType" 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={uploading}
                >
                  <option value="post">Postagem (posts/[categoria]/[postId]-arquivo.webp)</option>
                  <option value="perfil">Perfil (perfis/[userId]-perfil.webp)</option>
                  <option value="curso">Curso (posts/capas/cursos/[cursoId]-capa.webp)</option>
                  <option value="personalizado">Personalizado (caminho customizado)</option>
                </select>
                <p className="text-xs text-muted-foreground">
                  Selecione a categoria de upload para organizar automaticamente os arquivos
                </p>
              </div>
            </div>
            
            {previewUrl && (
              <div className="mt-4">
                <p className="text-sm text-muted-foreground mb-2">Preview:</p>
                <div className="border rounded-md overflow-hidden w-full max-h-[300px] bg-muted flex items-center justify-center">
                  <ImageWithFallback
                    src={previewUrl}
                    alt="Preview"
                    className="max-h-[300px] w-auto object-contain"
                  />
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button 
              onClick={handleUpload}
              disabled={!file || uploading}
              className="w-full"
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Fazer Upload
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>2. Resultado do Upload</CardTitle>
            <CardDescription>
              O resultado do upload para o Supabase Storage será exibido aqui.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {uploadedImageUrl ? (
              <div className="space-y-4">
                <div className="flex items-center space-x-2 text-green-600 bg-green-50 p-3 rounded-md">
                  <CheckCircle2 className="h-5 w-5" />
                  <p className="text-sm font-medium">Upload concluído com sucesso!</p>
                </div>
                
                <div className="border rounded-md overflow-hidden max-h-[250px] bg-muted flex items-center justify-center">
                  <ImageWithFallback
                    src={uploadedImageUrl}
                    alt="Imagem enviada"
                    className="max-h-[250px] w-auto object-contain"
                  />
                </div>
                
                <div className="mt-2 space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">URL da imagem:</p>
                    <div className="bg-muted p-2 rounded text-xs font-mono break-all border">
                      {uploadedImageUrl}
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 p-3 rounded-md text-sm border border-blue-100">
                    <h4 className="font-medium text-blue-700 mb-1 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Limites de otimização de imagem
                    </h4>
                    <ul className="text-blue-800 pl-5 list-disc text-xs space-y-1">
                      <li>Perfil: máximo 300px, qualidade 80%</li>
                      <li>Cursos: máximo 1080px, qualidade 85%</li>
                      <li>Posts: máximo 1920px, qualidade 85%</li>
                      <li><strong>Limite global:</strong> 2MB, máximo 1920px</li>
                    </ul>
                  </div>
                </div>
              </div>
            ) : error ? (
              <div className="h-full flex flex-col items-center justify-center py-8">
                <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-md mb-4 w-full">
                  <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                  <p className="text-sm">{error}</p>
                </div>
                
                <p className="text-center text-muted-foreground text-sm mt-4">
                  Verifique se você configurou corretamente as políticas RLS no Supabase, 
                  conforme as instruções acima.
                </p>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Image className="h-12 w-12 mb-4 opacity-20" />
                <p className="text-center">
                  Selecione uma imagem e faça upload para ver o resultado aqui.
                </p>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <p className="text-xs text-muted-foreground w-full">
              As imagens são armazenadas no bucket "images" do Supabase. 
              Verifique se o bucket existe e tem as permissões corretas configuradas.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}