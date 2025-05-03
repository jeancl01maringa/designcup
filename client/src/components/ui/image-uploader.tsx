import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { supabase, ensureImageBucket } from '@/lib/supabase';
import { nanoid } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { Upload, ImageOff, X, RefreshCw } from 'lucide-react';
import imageCompression from 'browser-image-compression';

interface ImageUploaderProps {
  onImageUploaded: (imageUrl: string) => void;
  defaultImageUrl?: string;
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  className?: string;
  buttonText?: string;
}

export function ImageUploader({
  onImageUploaded,
  defaultImageUrl,
  maxSizeMB = 1,
  maxWidthOrHeight = 1080,
  className,
  buttonText = 'Escolher imagem'
}: ImageUploaderProps) {
  const [imageUrl, setImageUrl] = useState<string | undefined>(defaultImageUrl);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(async (file: File) => {
    try {
      setError(null);
      setIsUploading(true);
      setUploadProgress(10);

      // Verificar se é uma imagem
      if (!file.type.startsWith('image/')) {
        throw new Error('Por favor, selecione um arquivo de imagem válido');
      }

      setUploadProgress(20);
      
      // Comprimir imagem
      console.log(`Comprimindo imagem... (tamanho original: ${(file.size / 1024 / 1024).toFixed(2)}MB)`);
      const compressedFile = await imageCompression(file, {
        maxSizeMB,
        maxWidthOrHeight,
        useWebWorker: true,
        fileType: 'image/webp',
      });
      console.log(`Imagem comprimida! (novo tamanho: ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB)`);
      
      setUploadProgress(50);

      // Garantir que o bucket existe
      await ensureImageBucket();
      
      setUploadProgress(60);

      // Gerar nome único para o arquivo
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'webp';
      const timestamp = Date.now();
      const uniqueId = nanoid();
      const fileName = `uploads/${uniqueId}-${timestamp}.${fileExt}`;
      
      // Enviar para o Supabase
      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(fileName, compressedFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }
      
      setUploadProgress(90);
      
      // Obter URL pública
      const { data } = supabase.storage.from('images').getPublicUrl(fileName);
      const publicUrl = data.publicUrl;
      
      setImageUrl(publicUrl);
      onImageUploaded(publicUrl);
      
      setUploadProgress(100);
    } catch (err) {
      console.error('Erro ao fazer upload da imagem:', err);
      setError(err instanceof Error ? err.message : 'Erro ao enviar imagem');
    } finally {
      setIsUploading(false);
    }
  }, [maxSizeMB, maxWidthOrHeight, onImageUploaded]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }, [handleFileSelect]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  }, [handleFileSelect]);

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const clearImage = useCallback(() => {
    setImageUrl(undefined);
    onImageUploaded('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [onImageUploaded]);

  return (
    <div 
      className={cn(
        "relative flex flex-col items-center justify-center w-full min-h-[200px] border-2 border-dashed rounded-lg transition-all",
        isDragging 
          ? "border-primary bg-primary/5" 
          : "border-gray-300 hover:border-primary/50 hover:bg-gray-50/50",
        className
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <Input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleInputChange}
      />
      
      {isUploading ? (
        <div className="flex flex-col items-center justify-center p-6 w-full h-full">
          <RefreshCw size={30} className="text-primary/70 mb-4 animate-spin" />
          <p className="text-sm text-gray-500 mb-3">Processando imagem...</p>
          <div className="w-full max-w-xs">
            <Progress value={uploadProgress} className="h-2" />
          </div>
        </div>
      ) : imageUrl ? (
        <div className="relative w-full h-full">
          <img 
            src={imageUrl} 
            alt="Imagem carregada" 
            className="w-full h-full object-contain rounded-lg" 
          />
          <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity bg-black/50 rounded-lg flex flex-col items-center justify-center">
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="bg-white hover:bg-gray-100"
                onClick={triggerFileInput}
              >
                Trocar
              </Button>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={clearImage}
              >
                <X size={16} className="mr-1" />
                Remover
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-6 w-full h-full">
          {error ? (
            <>
              <ImageOff size={30} className="text-destructive mb-3" />
              <p className="text-sm text-destructive font-medium">{error}</p>
              <Button 
                variant="ghost"
                size="sm"
                className="mt-3"
                onClick={() => setError(null)}
              >
                Tentar novamente
              </Button>
            </>
          ) : (
            <>
              <Upload size={30} className="text-gray-400 mb-3" />
              <p className="text-sm text-gray-500 mb-1">
                Arraste e solte uma imagem aqui ou
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={triggerFileInput}
              >
                {buttonText}
              </Button>
              <p className="text-xs text-gray-400 mt-4">
                Formatos aceitos: JPG, PNG • Tamanho máx: {maxSizeMB}MB
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}