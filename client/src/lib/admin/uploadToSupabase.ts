import { supabase } from "../supabase";
import browserImageCompression from "browser-image-compression";

/**
 * Comprime uma imagem antes do upload
 * @param file Arquivo de imagem a ser comprimido 
 * @returns Arquivo comprimido
 */
async function compressImage(file: File): Promise<File> {
  // Configurações de compressão
  const options = {
    maxSizeMB: 1, // tamanho máximo em MB
    maxWidthOrHeight: 1920, // resolução máxima
    useWebWorker: true,
    fileType: 'image/webp', // converter para WebP para melhor compressão
  };
  
  try {
    return await browserImageCompression(file, options);
  } catch (error) {
    console.error("Erro ao comprimir imagem:", error);
    // Em caso de erro, retornar o arquivo original
    return file;
  }
}

/**
 * Faz upload de uma imagem para o Supabase Storage
 * @param file Arquivo a ser enviado
 * @param path Caminho no bucket (ex: 'posts/imagem.webp')
 * @returns URL pública da imagem ou null em caso de erro
 */
export async function uploadToSupabase(file: File, path: string): Promise<string | null> {
  try {
    // Verificar se o cliente Supabase está disponível
    if (!supabase) {
      throw new Error("Cliente Supabase não inicializado");
    }
    
    // Comprimir a imagem antes do upload
    const compressedFile = await compressImage(file);
    
    // Fazer o upload para o bucket 'images'
    const { data, error } = await supabase.storage
      .from('images')
      .upload(path, compressedFile, {
        cacheControl: '3600',
        upsert: true,
      });
    
    if (error) {
      throw error;
    }
    
    // Gerar URL pública
    const { data: publicURL } = supabase.storage
      .from('images')
      .getPublicUrl(path);
    
    return publicURL?.publicUrl || null;
  } catch (error) {
    console.error('Erro no upload para o Supabase:', error);
    return null;
  }
}

/**
 * Exclui uma imagem do Supabase Storage
 * @param path Caminho da imagem no bucket
 * @returns Boolean indicando sucesso ou falha
 */
export async function deleteFromSupabase(path: string): Promise<boolean> {
  try {
    // Verificar se o cliente Supabase está disponível
    if (!supabase) {
      throw new Error("Cliente Supabase não inicializado");
    }
    
    // Remover o prefixo da URL pública se existir
    const cleanPath = path.includes('/storage/v1/object/public/images/')
      ? path.split('/storage/v1/object/public/images/')[1]
      : path;
    
    // Fazer a remoção
    const { error } = await supabase.storage
      .from('images')
      .remove([cleanPath]);
    
    if (error) {
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao excluir do Supabase:', error);
    return false;
  }
}