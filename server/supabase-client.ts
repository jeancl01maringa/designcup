/**
 * Este arquivo centraliza a instância do Supabase client para o servidor
 * Reutiliza a mesma lógica do cliente, mas pode ser configurado de forma independente
 */

import { createClient } from '@supabase/supabase-js';

// Verificar se as variáveis de ambiente estão definidas
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
  throw new Error(
    'As variáveis de ambiente SUPABASE_URL e SUPABASE_KEY devem estar definidas'
  );
}

function isValidUrl(urlString: string): boolean {
  try {
    new URL(urlString);
    return true;
  } catch (error) {
    return false;
  }
}

function createSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;
  
  // Definir URL e chave de fallback para desenvolvimento (não usadas em produção)
  const fallbackUrl = 'https://mysupabase.supabase.co';
  const fallbackKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
  
  const url = supabaseUrl || fallbackUrl;
  const key = supabaseKey || fallbackKey;
  
  if (!isValidUrl(url)) {
    console.error('SUPABASE_URL inválida:', url);
    throw new Error('SUPABASE_URL inválida');
  }
  
  console.log('Inicializando cliente Supabase do servidor com URL:', url);
  console.log('Chave Supabase válida:', Boolean(key));
  
  return createClient(url, key);
}

export const supabase = createSupabaseClient();

/**
 * Verifica se o bucket de imagens existe e o cria se necessário
 */
export async function ensureImageBucket() {
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('Erro ao listar buckets:', error);
      return;
    }
    
    const imagesBucket = buckets.find(bucket => bucket.name === 'images');
    
    if (!imagesBucket) {
      console.log('Criando bucket de imagens...');
      
      const { error: createError } = await supabase.storage.createBucket('images', {
        public: true
      });
      
      if (createError) {
        console.error('Erro ao criar bucket de imagens:', createError);
      } else {
        console.log('Bucket de imagens criado com sucesso');
      }
    } else {
      console.log('Bucket de imagens já existe');
    }
  } catch (error) {
    console.error('Erro ao verificar/criar bucket de imagens:', error);
  }
}

/**
 * Retorna a URL pública de uma imagem armazenada no Supabase
 */
export function getPublicImageUrl(filePath: string) {
  const { data } = supabase.storage.from('images').getPublicUrl(filePath);
  return data.publicUrl;
}