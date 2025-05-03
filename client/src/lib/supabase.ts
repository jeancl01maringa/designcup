import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase URL ou Key está faltando. Verifique as variáveis de ambiente.');
}

export const supabase = createClient(supabaseUrl as string, supabaseKey as string);

/**
 * Verifica se o bucket de imagens existe e o cria se necessário
 */
export async function ensureImageBucket() {
  try {
    // Verifica se o bucket 'images' existe
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(bucket => bucket.name === 'images');
    
    // Se não existir, cria o bucket
    if (!bucketExists) {
      const { error } = await supabase.storage.createBucket('images', {
        public: true,
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
      });
      
      if (error) {
        console.error('Erro ao criar bucket images:', error);
        return false;
      }
      
      console.log('Bucket images criado com sucesso!');
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao verificar/criar bucket de imagens:', error);
    return false;
  }
}

/**
 * Gera um nome de arquivo único para upload
 */
export function generateUniqueFileName(originalFileName: string, extension = 'webp') {
  const timestamp = new Date().getTime();
  const randomString = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${randomString}.${extension}`;
}

/**
 * Retorna a URL pública de uma imagem armazenada no Supabase
 */
export function getPublicImageUrl(filePath: string) {
  const { data } = supabase.storage.from('images').getPublicUrl(filePath);
  return data.publicUrl;
}