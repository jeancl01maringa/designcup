import { createClient } from '@supabase/supabase-js';

// Verificar se as variáveis de ambiente estão disponíveis
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY || '';

// Mostrar alerta se as chaves não estiverem definidas
if (!supabaseUrl || !supabaseKey) {
  console.warn('Variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_KEY não definidas. O armazenamento de imagens não funcionará corretamente.');
}

// Criar uma função que retorna um cliente mock se as credenciais não estiverem disponíveis
function createSupabaseClient() {
  if (!supabaseUrl || !supabaseKey) {
    // Retornar um cliente mock que não faz nada
    // @ts-ignore - permitindo um mock rudimentar para evitar erros
    return {
      storage: {
        listBuckets: () => ({ data: [], error: new Error('Credenciais Supabase não fornecidas') }),
        createBucket: () => ({ error: new Error('Credenciais Supabase não fornecidas') }),
        from: () => ({
          upload: () => ({ error: new Error('Credenciais Supabase não fornecidas') }),
          getPublicUrl: () => ({ data: { publicUrl: '' } }),
        }),
      },
    };
  }
  
  // Criar um cliente real se tivermos credenciais
  try {
    return createClient(supabaseUrl, supabaseKey);
  } catch (error) {
    console.error('Erro ao criar cliente Supabase:', error);
    // @ts-ignore - permitindo um mock rudimentar para evitar erros
    return {
      storage: {
        listBuckets: () => ({ data: [], error: new Error('Erro ao criar cliente Supabase') }),
        createBucket: () => ({ error: new Error('Erro ao criar cliente Supabase') }),
        from: () => ({
          upload: () => ({ error: new Error('Erro ao criar cliente Supabase') }),
          getPublicUrl: () => ({ data: { publicUrl: '' } }),
        }),
      },
    };
  }
}

// Exportar o cliente
export const supabase = createSupabaseClient();

/**
 * Verifica se o bucket de imagens existe e o cria se necessário
 */
export async function ensureImageBucket() {
  try {
    // Verificar se o bucket já existe
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      throw listError;
    }
    
    const imagesBucketExists = buckets?.some(bucket => bucket.name === 'images');
    
    if (!imagesBucketExists) {
      // Criar bucket se não existir
      const { error: createError } = await supabase.storage.createBucket('images', {
        public: true,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp']
      });
      
      if (createError) {
        throw createError;
      }
      
      console.log('Bucket de imagens criado com sucesso!');
    }
  } catch (error) {
    console.error('Erro ao configurar bucket de imagens:', error);
    throw new Error('Não foi possível configurar o armazenamento de imagens.');
  }
}

/**
 * Gera um nome de arquivo único para upload
 */
export function generateUniqueFileName(originalFileName: string, extension = 'webp') {
  const timestamp = new Date().getTime();
  const randomString = Math.random().toString(36).substring(2, 10);
  const cleanFileName = originalFileName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  
  return `${cleanFileName.substring(0, 20)}-${timestamp}-${randomString}.${extension}`;
}

/**
 * Retorna a URL pública de uma imagem armazenada no Supabase
 */
export function getPublicImageUrl(filePath: string) {
  const { data } = supabase.storage.from('images').getPublicUrl(filePath);
  return data.publicUrl;
}