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
 * Faz upload de um arquivo para o Supabase Storage
 * @param file Arquivo para upload
 * @param path Caminho no bucket para armazenar
 * @param optimize Se verdadeiro, comprime e converte para WebP
 * @returns URL público do arquivo ou null em caso de erro
 */
export async function uploadToSupabase(
  file: File,
  path: string,
  optimize = true
): Promise<string | null> {
  try {
    console.log(`Iniciando upload para '${path}'...`);
    
    // Verificar conexão com Supabase
    const isConnected = await checkSupabaseConnection();
    if (!isConnected) {
      console.error('Erro no upload: Não foi possível conectar ao Supabase. Verifique suas credenciais.');
      throw new Error('Não foi possível conectar ao Supabase. Verifique suas credenciais.');
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
      // Continuar mesmo se falhar a verificação do bucket
    }
    
    // Otimizar imagem se solicitado
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
    
    // Gerar um nome de arquivo seguro usando apenas caracteres permitidos
    // e com timestamp para garantir unicidade
    const timestamp = Date.now();
    const fileExt = file.name.split('.').pop() || 'webp';
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const basePath = path.split('/').slice(0, -1).join('/');
    const safeFileName = `${timestamp}_${cleanFileName}`;
    const safePath = `${basePath}/${safeFileName}`;
    
    console.log(`Fazendo upload para Supabase em '${safePath}'...`);
      
    // Fazer upload do arquivo
    const { data, error } = await supabase.storage
      .from('images')
      .upload(safePath, fileToUpload, {
        cacheControl: '3600',
        upsert: true, // substituir arquivo existente
      });
      
    if (error) {
      console.error('Erro no upload para Supabase:', error);
      
      // Verificar tipo de erro para melhor diagnóstico
      if (error.message.includes('auth')) {
        throw new Error('Erro de autenticação no Supabase. Verifique suas credenciais de API.');
      } else if (error.message.includes('permission')) {
        throw new Error('Permissão negada no bucket. Verifique as políticas de acesso do Supabase.');
      } else if (error.message.includes('bucket')) {
        throw new Error('Problema com o bucket. Verifique se o bucket "images" existe.');
      }
      
      // Tentar com nome ainda mais simples em caso de erro
      try {
        const simpleFileName = `${timestamp}.${fileExt}`;
        const simplePath = `${basePath}/${simpleFileName}`;
        
        console.log(`Tentando novamente com nome simplificado: ${simplePath}`);
        
        const { data: retryData, error: retryError } = await supabase.storage
          .from('images')
          .upload(simplePath, fileToUpload, {
            cacheControl: '3600',
            upsert: true,
          });
          
        if (retryError) {
          console.error('Falha na segunda tentativa de upload:', retryError);
          throw retryError;
        }
        
        // Retornar URL do arquivo com nome simplificado
        const publicUrl = getPublicUrl(simplePath);
        console.log('Upload bem-sucedido com nome simplificado:', publicUrl);
        return publicUrl;
      } catch (retryError) {
        console.error('Upload falhou mesmo com nome simplificado:', retryError);
        throw error; // Retorna o erro original
      }
    }
    
    // Retornar URL público
    const publicUrl = getPublicUrl(safePath);
    console.log('Upload bem-sucedido:', publicUrl);
    return publicUrl;
  } catch (error) {
    console.error('Falha no upload:', error);
    return null;
  }
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