import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { supabase, checkSupabaseConnection, ensureImageBucket } from '@/lib/supabase';
import { nanoid } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { Upload, ImageOff, X, RefreshCw, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
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
  const [supabaseConnected, setSupabaseConnected] = useState<boolean | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  useEffect(() => {
    const checkConnection = async () => {
      try {
        console.log('Verificando conexão com Supabase...');
        const isConnected = await checkSupabaseConnection();
        console.log('Status da conexão com Supabase:', isConnected ? 'Conectado' : 'Desconectado');
        setSupabaseConnected(isConnected);
      } catch (error) {
        console.error('Erro ao verificar conexão:', error);
        setSupabaseConnected(false);
      }
    };
    
    checkConnection();
  }, []);

  // Função para validar os limites de arquivo antes de começar o upload
  const validateFileSize = useCallback((file: File): Promise<{valid: boolean, message?: string}> => {
    return new Promise((resolve) => {
      // Verificar o tamanho do arquivo (limite absoluto)
      const maxFileSizeMB = 2; // Limite global absoluto: 2MB
      const fileSizeMB = file.size / (1024 * 1024);
      
      if (fileSizeMB > maxFileSizeMB) {
        resolve({
          valid: false,
          message: `Arquivo muito grande (${fileSizeMB.toFixed(1)}MB). Limite máximo permitido é ${maxFileSizeMB}MB.`
        });
        return;
      }
      
      // Para imagens, verificar também as dimensões
      if (file.type.startsWith('image/')) {
        const img = new Image();
        const objectUrl = URL.createObjectURL(file);
        
        img.onload = () => {
          // Liberar a URL temporária
          URL.revokeObjectURL(objectUrl);
          
          // O limite absoluto global é 1920px
          const absoluteMaxDimension = 1920;
          
          if (img.width > absoluteMaxDimension || img.height > absoluteMaxDimension) {
            resolve({
              valid: false,
              message: `Imagem muito grande (${img.width}x${img.height}px). Dimensão máxima permitida é ${absoluteMaxDimension}px.`
            });
          } else {
            resolve({ valid: true });
          }
        };
        
        img.onerror = () => {
          URL.revokeObjectURL(objectUrl);
          resolve({ valid: true }); // Em caso de erro na leitura da imagem, permite prosseguir
        };
        
        img.src = objectUrl;
      } else {
        // Se não for imagem, apenas passa pela validação de tamanho
        resolve({ valid: true });
      }
    });
  }, []);

  const handleFileSelect = useCallback(async (file: File) => {
    try {
      setError(null);
      setIsUploading(true);
      setUploadProgress(5);

      // Verificar se é uma imagem
      if (!file.type.startsWith('image/')) {
        throw new Error('Por favor, selecione um arquivo de imagem válido');
      }
      
      // Validar tamanho e dimensões do arquivo
      const { valid, message } = await validateFileSize(file);
      if (!valid) {
        throw new Error(message);
      }
      
      setUploadProgress(10);

      // Verificar conexão com Supabase
      const isConnected = await checkSupabaseConnection();
      setSupabaseConnected(isConnected);
      
      if (!isConnected) {
        toast({
          title: "Erro de conexão",
          description: "Não foi possível conectar ao serviço de armazenamento. Verifique suas credenciais do Supabase.",
          variant: "destructive",
        });
        throw new Error('Erro de conexão com o serviço de armazenamento. Verifique suas credenciais do Supabase.');
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
      
      setUploadProgress(40);

      try {
        // Garantir que o bucket existe
        await ensureImageBucket();
      } catch (bucketError) {
        console.error('Erro ao verificar/criar bucket:', bucketError);
        toast({
          title: "Aviso",
          description: "Não foi possível verificar o bucket de imagens. Tentando upload mesmo assim.",
        });
      }
      
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
          upsert: true, // Alterado para true para garantir que substitua se já existir
        });

      if (uploadError) {
        console.error('Erro no upload para Supabase:', uploadError);
        
        if (uploadError.message.includes('auth')) {
          throw new Error('Erro de autenticação no Supabase. Verifique suas credenciais.');
        } else if (uploadError.message.includes('permission')) {
          throw new Error('Permissão negada no bucket. Verifique as políticas de acesso do Supabase.');
        } else if (uploadError.message.includes('bucket')) {
          throw new Error('Problema com o bucket. Verifique se o bucket "images" existe.');
        }
        
        throw uploadError;
      }
      
      setUploadProgress(90);
      
      // Obter URL pública
      const { data } = supabase.storage.from('images').getPublicUrl(fileName);
      const publicUrl = data.publicUrl;
      
      setImageUrl(publicUrl);
      onImageUploaded(publicUrl);
      
      setUploadProgress(100);
      toast({
        title: "Sucesso!",
        description: "Imagem enviada com sucesso.",
      });
    } catch (err) {
      console.error('Erro ao fazer upload da imagem:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao enviar imagem';
      setError(errorMessage);
      toast({
        title: "Erro no upload",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  }, [maxSizeMB, maxWidthOrHeight, onImageUploaded, toast]);

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
      ) : supabaseConnected === false ? (
        <div className="flex flex-col items-center justify-center p-6 w-full h-full">
          <AlertCircle size={30} className="text-amber-500 mb-3" />
          <p className="text-sm text-amber-600 font-medium mb-2">Falha na conexão com Supabase</p>
          <div className="text-xs text-gray-500 text-center max-w-xs">
            <p className="mb-2">Verifique se as variáveis de ambiente do Supabase estão configuradas:</p>
            <ol className="list-decimal list-inside text-left space-y-1 mb-3">
              <li>VITE_SUPABASE_URL</li>
              <li>VITE_SUPABASE_KEY</li>
            </ol>
            <p>Essas credenciais são necessárias para upload de imagens.</p>
          </div>
          <Button 
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => setSupabaseConnected(null)}
          >
            Entendi
          </Button>
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
              <div className="text-xs text-gray-400 mt-4 space-y-1 text-center">
                <p>Formatos aceitos: JPG, PNG, WebP</p>
                <p>Limites: <strong>2MB máximo</strong> • <strong>1920px máximo</strong> de largura ou altura</p>
                <p>Imagens maiores serão automaticamente redimensionadas</p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}