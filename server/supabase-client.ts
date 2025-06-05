/**
 * Este arquivo centraliza a instância do Supabase client para o servidor
 * Reutiliza a mesma lógica do cliente, mas pode ser configurado de forma independente
 */

import { createClient } from '@supabase/supabase-js';

function isValidUrl(urlString: string): boolean {
  try {
    new URL(urlString);
    return true;
  } catch (error) {
    return false;
  }
}

function createSupabaseClient() {
  let supabaseUrl = process.env.SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || '';
  const projectRef = process.env.SUPABASE_PROJECT_REF || '';
  
  // If we have a project reference but no full URL, construct the URL
  if (projectRef && (!supabaseUrl || !isValidUrl(supabaseUrl))) {
    supabaseUrl = `https://${projectRef}.supabase.co`;
    console.log('Construindo URL do Supabase a partir do project ref:', supabaseUrl);
  }
  
  // If still no valid URL, try to extract project ref from existing URL-like string
  if (!isValidUrl(supabaseUrl) && supabaseUrl) {
    // Clean the URL string and reconstruct
    const cleanRef = supabaseUrl.replace(/[^a-zA-Z0-9]/g, '');
    if (cleanRef.length > 10) { // Supabase project refs are typically 20+ chars
      supabaseUrl = `https://${cleanRef}.supabase.co`;
      console.log('URL reconstruída:', supabaseUrl);
    }
  }
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Credenciais do Supabase não encontradas');
    console.error('SUPABASE_URL:', supabaseUrl);
    console.error('SUPABASE_KEY exists:', Boolean(supabaseKey));
    throw new Error('Credenciais do Supabase não configuradas');
  }
  
  if (!isValidUrl(supabaseUrl)) {
    console.error('SUPABASE_URL inválida após processamento:', supabaseUrl);
    throw new Error('SUPABASE_URL inválida');
  }
  
  console.log('Inicializando cliente Supabase do servidor com URL:', supabaseUrl);
  console.log('Chave Supabase válida:', Boolean(supabaseKey));
  
  return createClient(supabaseUrl, supabaseKey);
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
 * 
 * Nota: As políticas de acesso geralmente são configuradas no painel do Supabase,
 * não via API. Aqui tentamos garantir que o bucket seja público para leitura,
 * mas as políticas de RLS (Row Level Security) precisam ser configuradas no painel.
 */
async function configureImageBucketPolicies() {
  try {
    // Nome do bucket
    const bucketName = 'images';
    
    // Atualizar configurações do bucket para permitir acesso público
    const { error: updateError } = await supabase.storage.updateBucket(bucketName, {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'],
      fileSizeLimit: 10485760 // 10MB
    });
    
    if (updateError) {
      console.error('Erro ao atualizar bucket para acesso público:', updateError);
    } else {
      console.log('Bucket configurado para acesso público com sucesso');
    }
    
    // Mensagem de instruções para o console
    console.log(`
=================================================
IMPORTANTE: POLÍTICAS DE ACESSO PARA SUPABASE
=================================================
Para garantir que o upload de imagens funcione corretamente, 
você precisa configurar as políticas de acesso no painel do Supabase:

1. Acesse o painel do Supabase: https://app.supabase.io
2. Vá para "Storage" > "Policies"
3. Para o bucket "images", adicione políticas:
   - Para permitir SELECT para todos: "true"
   - Para permitir INSERT para usuários autenticados: "true"
   
Sem estas políticas, os uploads podem falhar com erros de permissão.
=================================================
`);
    
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