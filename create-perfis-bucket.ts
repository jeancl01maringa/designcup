/**
 * Script para criar o bucket "perfis" no Supabase Storage
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createPerfisBucket() {
  try {
    console.log('Criando bucket "perfis" no Supabase Storage...');

    // Criar o bucket
    const { data: bucketData, error: bucketError } = await supabase.storage.createBucket('perfis', {
      public: true,
      fileSizeLimit: 5242880, // 5MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    });

    if (bucketError && !bucketError.message.includes('already exists')) {
      console.error('Erro ao criar bucket:', bucketError);
      return;
    }

    console.log('Bucket "perfis" criado ou já existe');

    // Criar política de SELECT (leitura pública)
    const { error: selectPolicyError } = await supabase.rpc('create_policy', {
      table_name: 'objects',
      schema_name: 'storage',
      policy_name: 'perfis_select_policy',
      definition: 'bucket_id = \'perfis\'',
      command: 'SELECT'
    });

    if (selectPolicyError && !selectPolicyError.message.includes('already exists')) {
      console.warn('Aviso na política SELECT:', selectPolicyError.message);
    }

    // Criar política de INSERT (upload por usuários autenticados)
    const { error: insertPolicyError } = await supabase.rpc('create_policy', {
      table_name: 'objects',
      schema_name: 'storage', 
      policy_name: 'perfis_insert_policy',
      definition: 'bucket_id = \'perfis\'',
      command: 'INSERT'
    });

    if (insertPolicyError && !insertPolicyError.message.includes('already exists')) {
      console.warn('Aviso na política INSERT:', insertPolicyError.message);
    }

    // Verificar se o bucket foi criado
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Erro ao listar buckets:', listError);
      return;
    }

    const perfisBucket = buckets?.find(bucket => bucket.name === 'perfis');
    
    if (perfisBucket) {
      console.log('✅ Bucket "perfis" está configurado e pronto para uso');
      console.log('Configurações:', {
        id: perfisBucket.id,
        name: perfisBucket.name,
        public: perfisBucket.public,
        fileSizeLimit: perfisBucket.file_size_limit,
        allowedMimeTypes: perfisBucket.allowed_mime_types
      });
    } else {
      console.log('❌ Bucket "perfis" não foi encontrado');
    }

  } catch (error) {
    console.error('Erro geral:', error);
  }
}

createPerfisBucket();
