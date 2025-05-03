import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { uploadToSupabase, getPublicUrl } from '@/lib/admin/uploadToSupabase';
import { nanoid } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export default function ImageUploadDemo() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Criar uma URL para preview
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);
      // Limpar URL após upload
      setUploadedUrl(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "Nenhum arquivo selecionado",
        description: "Por favor, selecione uma imagem para fazer upload",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      // Criar ID único para o teste
      const uniqueId = nanoid();
      const filePath = `test/${uniqueId}/${selectedFile.name}`;
      
      // Fazer upload com otimização
      const imageUrl = await uploadToSupabase(selectedFile, filePath, true);
      
      if (imageUrl) {
        setUploadedUrl(imageUrl);
        toast({
          title: "Upload concluído!",
          description: "Imagem otimizada e enviada com sucesso.",
          variant: "default",
        });
      } else {
        throw new Error("Falha ao fazer upload da imagem");
      }
    } catch (error) {
      console.error('Erro no upload:', error);
      toast({
        title: "Erro no upload",
        description: "Não foi possível enviar a imagem. Verifique as credenciais do Supabase.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Teste de Upload de Imagem para Supabase</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="mb-4">
          <label 
            htmlFor="file-upload" 
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Selecione uma imagem
          </label>
          <input
            id="file-upload"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-md file:border-0
                      file:text-sm file:font-semibold
                      file:bg-primary file:text-white
                      hover:file:bg-primary/80"
          />
        </div>
        
        {preview && (
          <div className="mb-4">
            <h2 className="text-sm font-medium text-gray-700 mb-2">Preview:</h2>
            <div className="relative w-full h-60 border rounded-md overflow-hidden">
              <img 
                src={preview} 
                alt="Preview" 
                className="absolute w-full h-full object-contain"
              />
            </div>
          </div>
        )}
        
        <Button 
          onClick={handleUpload} 
          disabled={!selectedFile || isUploading}
          className="w-full"
        >
          {isUploading ? 'Enviando...' : 'Fazer Upload'}
        </Button>
        
        {uploadedUrl && (
          <div className="mt-6">
            <h2 className="text-sm font-medium text-gray-700 mb-2">Imagem Otimizada (WebP):</h2>
            <div className="relative w-full h-60 border rounded-md overflow-hidden">
              <img 
                src={uploadedUrl} 
                alt="Imagem Otimizada" 
                className="absolute w-full h-full object-contain"
              />
            </div>
            <p className="mt-2 text-xs text-gray-500 break-all">
              <strong>URL:</strong> {uploadedUrl}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}