import React, { useState, useCallback, useEffect } from "react";
import imageCompression from "browser-image-compression";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Loader2, Upload, X, Check, Image as ImageIcon } from "lucide-react";
import { supabase, ensureImageBucket, generateUniqueFileName, getPublicImageUrl } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

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
  className = "",
  buttonText = "Carregar imagem"
}: ImageUploaderProps) {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(defaultImageUrl || null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [compressProgress, setCompressProgress] = useState(0);
  const [fileError, setFileError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Inicializa o bucket de armazenamento quando o componente é montado
  useEffect(() => {
    ensureImageBucket();
  }, []);

  // Reset status da UI quando um novo arquivo é selecionado
  useEffect(() => {
    if (selectedFile) {
      setFileError(null);
      setUploadSuccess(false);
      setCompressProgress(0);
      setUploadProgress(0);

      // Criar preview da imagem selecionada
      const objectUrl = URL.createObjectURL(selectedFile);
      setPreview(objectUrl);

      return () => URL.revokeObjectURL(objectUrl);
    }
  }, [selectedFile]);

  // Manipula mudanças no input de arquivo
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      setSelectedFile(null);
      return;
    }

    const file = e.target.files[0];
    
    // Verifica se o arquivo é uma imagem
    if (!file.type.startsWith("image/")) {
      setFileError("Por favor, selecione um arquivo de imagem válido.");
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  // Manipula o clique no botão de upload
  const handleUpload = useCallback(async () => {
    if (!selectedFile) {
      setFileError("Nenhum arquivo selecionado.");
      return;
    }

    try {
      setIsUploading(true);
      setFileError(null);
      setUploadSuccess(false);

      // Comprimir a imagem
      setCompressProgress(10);
      console.log("Comprimindo imagem...");
      
      const options = {
        maxSizeMB,
        maxWidthOrHeight,
        useWebWorker: true,
        onProgress: (progress: number) => {
          setCompressProgress(Math.round(progress * 50)); // Compressão vai até 50% do progresso
        }
      };

      const compressedFile = await imageCompression(selectedFile, options);
      setCompressProgress(50);
      
      // Converter para WebP se o navegador suportar
      let finalFile = compressedFile;
      
      // Gerar nome único para o arquivo
      const fileName = generateUniqueFileName(selectedFile.name);
      
      // Upload para o Supabase
      console.log("Enviando para o Supabase...");
      setUploadProgress(60);
      
      const { data, error } = await supabase.storage
        .from("images")
        .upload(fileName, finalFile, {
          cacheControl: "3600",
          upsert: false,
          contentType: "image/webp"
        });

      if (error) {
        throw new Error(`Erro ao fazer upload: ${error.message}`);
      }

      setUploadProgress(90);
      
      // Obter a URL pública da imagem
      const imageUrl = getPublicImageUrl(data.path);
      console.log("Upload concluído:", imageUrl);
      
      setUploadProgress(100);
      setUploadSuccess(true);
      onImageUploaded(imageUrl);
      
      toast({
        title: "Upload concluído",
        description: "Sua imagem foi enviada com sucesso.",
      });
    } catch (error) {
      console.error("Erro no processo de upload:", error);
      setFileError(error instanceof Error ? error.message : "Erro desconhecido no upload.");
      
      toast({
        title: "Erro no upload",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao processar sua imagem.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  }, [selectedFile, maxSizeMB, maxWidthOrHeight, onImageUploaded, toast]);

  // Limpa a seleção de arquivo
  const handleClearSelection = () => {
    setSelectedFile(null);
    setPreview(defaultImageUrl || null);
    setFileError(null);
    setUploadSuccess(false);
    setCompressProgress(0);
    setUploadProgress(0);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Área de preview da imagem */}
      {preview ? (
        <div className="relative w-full h-48 border rounded-md overflow-hidden">
          <img 
            src={preview} 
            alt="Preview" 
            className="w-full h-full object-cover"
          />
          <button 
            onClick={handleClearSelection}
            className="absolute top-2 right-2 bg-black/70 text-white p-1 rounded-full hover:bg-black transition-colors"
            type="button"
            disabled={isUploading}
          >
            <X className="h-4 w-4" />
          </button>
          {uploadSuccess && (
            <div className="absolute bottom-2 right-2 bg-green-500/80 text-white px-2 py-1 rounded-full text-xs flex items-center">
              <Check className="h-3 w-3 mr-1" />
              Enviado
            </div>
          )}
        </div>
      ) : (
        <div 
          className="w-full h-48 border-2 border-dashed rounded-md flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => document.getElementById("file-upload")?.click()}
        >
          <ImageIcon className="h-10 w-10 text-gray-300 mb-2" />
          <p className="text-sm text-gray-500">Clique para selecionar uma imagem</p>
          <p className="text-xs text-gray-400 mt-1">PNG, JPG ou WEBP (máx. {maxSizeMB}MB)</p>
        </div>
      )}

      {/* Input para seleção de arquivo (escondido) */}
      <input
        id="file-upload"
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
        disabled={isUploading}
      />

      {/* Mensagem de erro */}
      {fileError && (
        <div className="text-red-500 text-sm">
          {fileError}
        </div>
      )}

      {/* Barra de progresso */}
      {(isUploading || uploadProgress > 0) && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-gray-500">
            <span>{isUploading ? "Enviando..." : uploadProgress === 100 ? "Concluído" : "Progresso"}</span>
            <span>{Math.max(compressProgress, uploadProgress)}%</span>
          </div>
          <Progress value={Math.max(compressProgress, uploadProgress)} className="h-2" />
        </div>
      )}

      {/* Botões */}
      <div className="flex space-x-2">
        {!preview ? (
          <Button 
            type="button" 
            variant="outline"
            className="w-full"
            onClick={() => document.getElementById("file-upload")?.click()}
            disabled={isUploading}
          >
            <Upload className="h-4 w-4 mr-2" />
            {buttonText}
          </Button>
        ) : (
          <Button 
            type="button" 
            variant="default"
            className="w-full"
            onClick={handleUpload}
            disabled={isUploading || uploadSuccess}
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : uploadSuccess ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Enviado
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Enviar imagem
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}