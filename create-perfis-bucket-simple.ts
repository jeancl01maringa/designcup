/**
 * Script para criar o bucket "perfis" no Supabase Storage
 */
import { createClient } from '@supabase/supabase-js';

// Limpar URLs removendo aspas extras
const supabaseUrl = process.env.VITE_SUPABASE_URL?.replace(/"/g, '') || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.replace(/"/g, '') || '';

console.log('URL do Supabase após limpeza:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createPerfisBucket() {
  try {
    console.log('Verificando buckets existentes...');

    // Listar buckets existentes
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Erro ao listar buckets:', listError);
      return;
    }

    console.log('Buckets existentes:', buckets?.map(b => b.name));

    // Verificar se o bucket "perfis" já existe
    const perfisBucket = buckets?.find(bucket => bucket.name === 'perfis');
    
    if (perfisBucket) {
      console.log('✅ Bucket "perfis" já existe');
      return;
    }

    console.log('Criando bucket "perfis"...');

    // Criar o bucket
    const { data: bucketData, error: bucketError } = await supabase.storage.createBucket('perfis', {
      public: true,
      fileSizeLimit: 5242880, // 5MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    });

    if (bucketError) {
      console.error('Erro ao criar bucket:', bucketError);
      return;
    }

    console.log('✅ Bucket "perfis" criado com sucesso');

    // Verificar novamente
    const { data: newBuckets } = await supabase.storage.listBuckets();
    const newPerfisBucket = newBuckets?.find(bucket => bucket.name === 'perfis');
    
    if (newPerfisBucket) {
      console.log('Bucket "perfis" confirmado:', {
        id: newPerfisBucket.id,
        name: newPerfisBucket.name,
        public: newPerfisBucket.public
      });
    }

  } catch (error) {
    console.error('Erro geral:', error);
  }
}

createPerfisBucket();
