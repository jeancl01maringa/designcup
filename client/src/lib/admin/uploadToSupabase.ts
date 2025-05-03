import { supabase, ensureImageBucket, checkSupabaseConnection } from "@/lib/supabase";
import browserImageCompression from "browser-image-compression";

/**
 * Comprime e converte uma imagem para o formato WebP
 * @param file Arquivo de imagem para otimizar
 * @returns Promise com o arquivo otimizado
 */
async function optimizeImage(file: File): Promise<File> {
  try {
    // Opções de compressão
    const options = {
      maxSizeMB: 1, // tamanho máximo em MB
      maxWidthOrHeight: 1920, // dimensão máxima
      useWebWorker: true, // usar Web Worker para processamento em segundo plano
      fileType: 'image/webp', // converter para formato WebP
    };
    
    // Compressão e conversão para WebP
    const compressedFile = await browserImageCompression(file, options);
    
    // Criar um novo arquivo com extensão .webp
    const filename = file.name.split('.').slice(0, -1).join('.') + '.webp';
    return new File([compressedFile], filename, { type: 'image/webp' });
  } catch (error) {
    console.error('Erro ao otimizar imagem:', error);
    return file; // Retorna o arquivo original em caso de falha
  }
}

/**
 * Faz upload de um arquivo para o Supabase Storage
 * @param file Arquivo para upload
 * @param path Caminho no bucket para armazenar
 * @param optimize Se verdadeiro, comprime e converte para WebP
 * @returns URL público do arquivo ou null em caso de erro
 */
/**
 * Faz upload de uma imagem para o Supabase ou, caso falhe, 
 * converte a imagem para base64 para armazenamento direto no banco de dados.
 * 
 * A função tenta primeiro fazer upload para o Supabase e, se falhar,
 * automaticamente converte a imagem para base64 como fallback.
 * 
 * @param file Arquivo para upload
 * @param path Caminho no bucket para armazenar
 * @param optimize Se verdadeiro, comprime e converte para WebP
 * @returns URL da imagem (do Supabase ou base64) ou null em caso de erro
 */
export async function uploadToSupabase(
  file: File,
  path: string,
  optimize = true
): Promise<string | null> {
  try {
    console.log(`Iniciando processamento de imagem para '${path}'...`);
    
    // Otimizar imagem se solicitado (independente do destino)
    let fileToUpload = file;
    if (optimize && file.type.startsWith('image/')) {
      try {
        console.log(`Otimizando imagem de ${(file.size / 1024 / 1024).toFixed(2)}MB...`);
        fileToUpload = await optimizeImage(file);
        console.log(`Imagem otimizada para ${(fileToUpload.size / 1024 / 1024).toFixed(2)}MB`);
      } catch (optimizeError) {
        console.error('Falha ao otimizar imagem, usando original:', optimizeError);
        fileToUpload = file;
      }
    }
    
    // Tentar primeiro o upload para o Supabase
    try {
      // Verificar conexão com Supabase
      const isConnected = await checkSupabaseConnection();
      if (!isConnected) {
        throw new Error('Supabase não disponível. Usando base64 como alternativa.');
      }
      
      // Verificar o tipo de arquivo
      if (!file.type.startsWith('image/')) {
        console.warn('Tipo de arquivo não é uma imagem:', file.type);
      }
      
      try {
        // Verificar se o bucket existe
        await ensureImageBucket();
      } catch (bucketError) {
        console.error('Erro ao verificar/criar bucket:', bucketError);
        throw new Error('Erro no bucket. Usando base64 como alternativa.');
      }
      
      // Sanitizar caminho para garantir que não tenha caracteres problemáticos
      const safePath = path.replace(/[^a-zA-Z0-9-_\/.]/g, '_');
      
      console.log(`Tentando upload para Supabase em '${safePath}'...`);
        
      // Fazer upload do arquivo
      const { data, error } = await supabase.storage
        .from('images')
        .upload(safePath, fileToUpload, {
          cacheControl: '3600',
          upsert: true, // substituir arquivo existente
        });
        
      if (error) {
        console.warn('Erro no upload para Supabase, usando base64 como alternativa:', error);
        throw error;
      }
      
      // Retornar URL público
      const publicUrl = getPublicUrl(safePath);
      console.log('Upload para Supabase bem-sucedido:', publicUrl);
      return publicUrl;
      
    } catch (supabaseError) {
      // Se o upload para o Supabase falhar, converter para base64
      console.log('Usando estratégia alternativa: conversão para base64...');
      return convertToBase64(fileToUpload);
    }
  } catch (error) {
    console.error('Falha no processamento da imagem:', error);
    return null;
  }
}

/**
 * Converte um arquivo para uma string base64 data URL
 * Usa FileReader para ler o arquivo como data URL (base64)
 * @param file Arquivo para converter
 * @returns Promise com a string base64 data URL
 */
export async function convertToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = () => {
      // A propriedade result contém a string base64 quando readAsDataURL é chamado
      const result = reader.result as string;
      console.log('Conversão para base64 bem-sucedida. Tamanho:', 
        Math.round(result.length / 1024), 'KB');
      resolve(result);
    };
    
    reader.onerror = (error) => {
      console.error('Erro ao ler arquivo como base64:', error);
      reject(error);
    };
    
    // Iniciar a leitura do arquivo como base64 data URL
    reader.readAsDataURL(file);
  });
}

// Nota: A função ensureBucketExists foi removida pois estamos usando ensureImageBucket do cliente Supabase

/**
 * Remove um arquivo do Supabase Storage
 * @param path Caminho do arquivo a ser removido
 * @returns Promise<boolean> verdadeiro se removido com sucesso
 */
export async function removeFromSupabase(path: string): Promise<boolean> {
  try {
    const { error } = await supabase.storage
      .from('images')
      .remove([path]);
      
    return !error;
  } catch (error) {
    console.error('Erro ao remover arquivo:', error);
    return false;
  }
}

/**
 * Obtém o URL público de um arquivo no Supabase Storage
 * @param path Caminho do arquivo no bucket
 * @returns URL público do arquivo
 */
export function getPublicUrl(path: string): string {
  const { data } = supabase.storage
    .from('images')
    .getPublicUrl(path);
    
  return data.publicUrl;
}

/**
 * Cria caminho para arquivos no Supabase incluindo o ID único
 * @param uniqueId ID único da entidade relacionada
 * @param fileName Nome do arquivo
 * @param folder Pasta opcional dentro do bucket (default: 'posts')
 */
export function createFilePath(uniqueId: string, fileName: string, folder = 'posts'): string {
  // Remover caracteres especiais e espaços do nome do arquivo
  const sanitizedFileName = fileName
    .replace(/[^a-zA-Z0-9-.]/g, '_')
    .toLowerCase();
    
  return `${folder}/${uniqueId}/${sanitizedFileName}`;
}