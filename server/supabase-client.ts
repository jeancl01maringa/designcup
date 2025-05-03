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
    
    // Contar buckets encontrados para debug
    console.log(`Buckets encontrados: ${buckets.length}`);
    
    const imagesBucket = buckets.find(bucket => bucket.name === 'images');
    
    if (!imagesBucket) {
      console.log('Criando bucket de imagens...');
      
      const { error: createError } = await supabase.storage.createBucket('images', {
        public: true, // Acesso público para leitura
        fileSizeLimit: 10485760 // 10MB
      });
      
      if (createError) {
        console.error('Erro ao criar bucket de imagens:', createError);
      } else {
        console.log('Bucket de imagens criado com sucesso');
        
        // Configurar políticas de acesso
        await configureImageBucketPolicies();
      }
    } else {
      console.log('Bucket de imagens já existe');
      
      // Verificar se as políticas estão configuradas
      await configureImageBucketPolicies();
    }
  } catch (error) {
    console.error('Erro ao verificar/criar bucket de imagens:', error);
  }
}

/**
 * Configura políticas de acesso para o bucket de imagens
 * Isso é necessário para permitir operações de upload/download
 */
async function configureImageBucketPolicies() {
  try {
    // Nome do bucket
    const bucketName = 'images';
    
    // 1. Política para leitura pública (qualquer pessoa pode visualizar)
    const { error: publicReadError } = await supabase.storage.from(bucketName)
      .createPolicy('public_read', {
        name: 'Public Read Policy',
        definition: {
          type: 'READ',
          permissions: ['SELECT'],
          check: {},
          inverted: false
        }
      });
    
    if (publicReadError) {
      console.error('Erro ao criar política de leitura pública:', publicReadError);
    } else {
      console.log('Política de leitura pública criada/atualizada com sucesso');
    }
    
    // 2. Política para escrita (upload) por qualquer usuário autenticado
    const { error: writeError } = await supabase.storage.from(bucketName)
      .createPolicy('authenticated_write', {
        name: 'Authenticated Write Policy',
        definition: {
          type: 'WRITE',
          permissions: ['INSERT', 'UPDATE'],
          check: {},
          inverted: false
        }
      });
    
    if (writeError) {
      console.error('Erro ao criar política de escrita autenticada:', writeError);
    } else {
      console.log('Política de escrita autenticada criada/atualizada com sucesso');
    }
    
  } catch (error) {
    console.error('Erro ao configurar políticas de bucket:', error);
  }
}

/**
 * Retorna a URL pública de uma imagem armazenada no Supabase
 */
export function getPublicImageUrl(filePath: string) {
  const { data } = supabase.storage.from('images').getPublicUrl(filePath);
  return data.publicUrl;
}