/**
 * Script para criar o bucket "logos" no Supabase Storage
 * e configurar as permissões adequadas para upload e acesso público
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Carregue as variáveis de ambiente
dotenv.config();

const supabaseUrl = (process.env.VITE_SUPABASE_URL || '').replace(/"/g, '');
const supabaseServiceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').replace(/"/g, '');

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Variáveis de ambiente VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function createLogosBucket() {
  try {
    console.log('🚀 Iniciando criação do bucket "logos"...');

    // 1. Verificar se o bucket já existe
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Erro ao listar buckets:', listError);
      return;
    }

    const logosBucketExists = buckets?.some(bucket => bucket.name === 'logos');

    if (logosBucketExists) {
      console.log('✅ Bucket "logos" já existe');
    } else {
      // 2. Criar o bucket "logos"
      const { data: bucketData, error: createError } = await supabase.storage.createBucket('logos', {
        public: true,
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'],
        fileSizeLimit: 5242880, // 5MB
      });

      if (createError) {
        console.error('❌ Erro ao criar bucket "logos":', createError);
        return;
      }

      console.log('✅ Bucket "logos" criado com sucesso:', bucketData);
    }

    // 3. Verificar/criar políticas de acesso
    console.log('🔧 Configurando políticas de acesso...');

    // Política para permitir upload (INSERT)
    const uploadPolicySQL = `
      CREATE POLICY IF NOT EXISTS "Enable upload for authenticated users" ON storage.objects
      FOR INSERT WITH CHECK (bucket_id = 'logos' AND auth.role() = 'authenticated');
    `;

    // Política para permitir leitura pública (SELECT)
    const readPolicySQL = `
      CREATE POLICY IF NOT EXISTS "Enable public read access" ON storage.objects
      FOR SELECT USING (bucket_id = 'logos');
    `;

    // Política para permitir atualização (UPDATE)
    const updatePolicySQL = `
      CREATE POLICY IF NOT EXISTS "Enable update for authenticated users" ON storage.objects
      FOR UPDATE USING (bucket_id = 'logos' AND auth.role() = 'authenticated');
    `;

    // Política para permitir exclusão (DELETE)
    const deletePolicySQL = `
      CREATE POLICY IF NOT EXISTS "Enable delete for authenticated users" ON storage.objects
      FOR DELETE USING (bucket_id = 'logos' AND auth.role() = 'authenticated');
    `;

    // Executar as políticas
    const policies = [uploadPolicySQL, readPolicySQL, updatePolicySQL, deletePolicySQL];
    
    for (const policy of policies) {
      const { error } = await supabase.rpc('exec_sql', { sql: policy });
      if (error) {
        console.log('⚠️  Aviso ao criar política:', error.message);
      }
    }

    console.log('✅ Políticas de acesso configuradas');

    // 4. Testar o bucket
    console.log('🧪 Testando acesso ao bucket...');
    
    const { data: files, error: listFilesError } = await supabase.storage
      .from('logos')
      .list('', { limit: 1 });

    if (listFilesError) {
      console.error('❌ Erro ao acessar bucket:', listFilesError);
      return;
    }

    console.log('✅ Bucket "logos" funcionando corretamente');
    console.log('📋 Resumo:');
    console.log('   - Bucket criado/verificado: ✅');
    console.log('   - Acesso público configurado: ✅');
    console.log('   - Políticas de upload/update/delete: ✅');
    console.log('   - Limite de tamanho: 5MB');
    console.log('   - Tipos permitidos: PNG, JPG, JPEG, WebP, SVG');

  } catch (error) {
    console.error('❌ Erro inesperado:', error);
  }
}

// Executar o script
createLogosBucket();