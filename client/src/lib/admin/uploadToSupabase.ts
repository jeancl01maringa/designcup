import { supabase } from '@/lib/supabase';
import imageCompression from 'browser-image-compression';

// Gera um nome de arquivo único baseado no timestamp e randomização
export function generateUniqueFileName(originalName: string): string {
  const timestamp = new Date().getTime();
  const randomString = Math.random().toString(36).substring(2, 8);
  
  // Limpa o nome do arquivo original, removendo caracteres especiais
  const cleanName = originalName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-{2,}/g, '-')
    .substring(0, 20);
  
  return `${cleanName}-${timestamp}-${randomString}`;
}

/**
 * Faz upload de uma imagem para o Supabase Storage
 * @param file Arquivo a ser enviado
 * @param options Opções adicionais
 * @returns URL pública da imagem
 */
export async function uploadImageToSupabase(
  file: File,
  options: {
    bucket?: string;
    folder?: string;
    maxSizeMB?: number;
    maxWidthOrHeight?: number;
    quality?: number;
    onProgress?: (progress: number) => void;
  } = {}
): Promise<string> {
  const {
    bucket = 'uploads',
    folder = 'postagens',
    maxSizeMB = 2,
    maxWidthOrHeight = 1200,
    quality = 0.8,
    onProgress
  } = options;
  
  try {
    if (onProgress) onProgress(10);
    
    // Comprimir a imagem antes do upload
    const compressedFile = await imageCompression(file, {
      maxSizeMB,
      maxWidthOrHeight,
      useWebWorker: true,
      fileType: 'image/webp',
      initialQuality: quality,
    });
    
    if (onProgress) onProgress(40);
    
    // Gerar nome de arquivo único
    const fileName = generateUniqueFileName(file.name);
    const filePath = folder ? `${folder}/${fileName}.webp` : `${fileName}.webp`;
    
    // Garantir que o bucket exista
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(b => b.name === bucket);
    
    if (!bucketExists) {
      // Criar bucket se não existir
      await supabase.storage.createBucket(bucket, {
        public: true,
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp']
      });
    }
    
    if (onProgress) onProgress(60);
    
    // Fazer upload do arquivo
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, compressedFile, {
        contentType: 'image/webp',
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) throw error;
    
    if (onProgress) onProgress(80);
    
    // Obter URL pública
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);
      
    if (onProgress) onProgress(100);
    
    // Notificar o backend sobre o upload
    try {
      await fetch('/api/admin/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: publicUrl,
          filename: filePath,
          size: compressedFile.size
        })
      });
    } catch (e) {
      console.warn('Failed to notify backend about upload', e);
    }
    
    return publicUrl;
  } catch (error) {
    console.error('Error uploading image to Supabase:', error);
    throw new Error(error instanceof Error ? error.message : 'Unknown error uploading image');
  }
}