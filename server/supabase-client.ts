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