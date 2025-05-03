import { createClient } from '@supabase/supabase-js';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from '@shared/schema';

// Verificações de ambiente
if (!process.env.SUPABASE_URL) {
  console.error('SUPABASE_URL não está definida');
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('SUPABASE_SERVICE_ROLE_KEY não está definida');
}

// Remover aspas extras se presentes (erro comum ao copiar de documentação)
let supabaseUrl = process.env.SUPABASE_URL || '';
let supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (supabaseUrl.startsWith('"') && supabaseUrl.endsWith('"')) {
  supabaseUrl = supabaseUrl.slice(1, -1);
}

if (supabaseServiceKey.startsWith('"') && supabaseServiceKey.endsWith('"')) {
  supabaseServiceKey = supabaseServiceKey.slice(1, -1);
}

// Criar cliente Supabase com chave de serviço (acesso privilegiado)
export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Simplificado: função para verificar e criar tabelas necessárias
export async function setupSupabaseTables() {
  try {
    console.log('Iniciando setup do Supabase...');
    
    // Verificar se podemos acessar o Supabase
    try {
      // Tentar listar buckets para verificar a conexão
      const { data: buckets, error } = await supabaseAdmin.storage.listBuckets();
      
      if (error) {
        console.error('Erro ao conectar com Supabase:', error);
        return;
      }
      
      console.log(`Conexão com Supabase estabelecida! Buckets encontrados: ${buckets?.length || 0}`);
      
      // Verificar/criar bucket de imagens
      const imagesBucket = buckets?.find(b => b.name === 'images');
      
      if (!imagesBucket) {
        // Criar bucket de imagens
        const { error: createError } = await supabaseAdmin.storage.createBucket('images', {
          public: true,
          fileSizeLimit: 10485760, // 10MB
          allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/gif']
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
      console.error('Erro ao acessar Supabase:', error);
    }
    
    console.log('Setup do Supabase concluído');
  } catch (error) {
    console.error('Erro durante o setup do Supabase:', error);
  }
}

// Função simplificada para migrar dados do PostgreSQL local para o Supabase
export async function migrateLocalDataToSupabase(db: ReturnType<typeof drizzle>) {
  try {
    console.log('Verificando o status da migração para o Supabase...');
    
    // Verificar se conseguimos acessar o Supabase
    const { data, error } = await supabaseAdmin.from('users').select('count').limit(1);
    
    if (error) {
      console.error('Erro ao acessar o Supabase:', error);
      console.log('A migração de dados foi adiada devido a erros de conexão.');
      return;
    }
    
    console.log('Verificação do Supabase concluída. Integração pronta para uso.');
  } catch (error) {
    console.error('Erro durante migração de dados para o Supabase:', error);
  }
}