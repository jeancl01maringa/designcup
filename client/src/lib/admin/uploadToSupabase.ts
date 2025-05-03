import { supabase } from '@/lib/supabase';
import imageCompression from 'browser-image-compression';

/**
 * Gera um nome de arquivo único baseado no timestamp e randomização
 */
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
 * Faz o upload de uma imagem para o Supabase, com compressão opcional
 */
export async function uploadImageToSupabase(
  file: File,
  folderPath: string,
  options: {
    compress?: boolean;
    maxSizeMB?: number;
    maxWidthOrHeight?: number;
  } = {}
): Promise<string> {
  try {
    console.log(`Iniciando upload para ${folderPath}...`);
    
    // Opções de compressão padrão
    const {
      compress = true,
      maxSizeMB = 1,
      maxWidthOrHeight = 1920
    } = options;
    
    // Comprimir a imagem se necessário
    let fileToUpload = file;
    
    if (compress && file.type.startsWith('image/')) {
      console.log('Comprimindo imagem...');
      
      const compressionOptions = {
        maxSizeMB,
        maxWidthOrHeight,
        useWebWorker: true,
        fileType: 'image/webp'
      };
      
      fileToUpload = await imageCompression(file, compressionOptions);
      console.log(`Imagem comprimida de ${file.size} para ${fileToUpload.size} bytes`);
    }
    
    // Gerar um nome de arquivo único
    const fileName = generateUniqueFileName(file.name);
    const filePath = `${folderPath}/${fileName}`;
    
    // Upload para o Supabase
    const { data, error } = await supabase.storage
      .from('images')
      .upload(filePath, fileToUpload, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) {
      throw new Error(`Erro ao fazer upload: ${error.message}`);
    }
    
    // Obter a URL pública
    const { data: publicUrlData } = supabase.storage
      .from('images')
      .getPublicUrl(filePath);
    
    console.log(`Upload concluído: ${publicUrlData.publicUrl}`);
    return publicUrlData.publicUrl;
  } catch (error: any) {
    console.error('Erro no upload para Supabase:', error);
    throw new Error(`Falha ao fazer upload: ${error.message}`);
  }
}