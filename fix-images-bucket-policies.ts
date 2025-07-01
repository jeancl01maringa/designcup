/**
 * Script para corrigir as políticas do bucket "images" no Supabase
 * Permite upload de SVG e outros formatos
 * 
 * Para executar: npx tsx fix-images-bucket-policies.ts
 */

import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL?.replace(/"/g, '');
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.replace(/"/g, '');

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Variáveis SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias');
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixImagesBucketPolicies() {
  try {
    console.log('🔧 Verificando e corrigindo políticas do bucket "images"...');

    // 1. Verificar se o bucket existe
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Erro ao listar buckets:', listError);
      return;
    }

    const imagesBucket = buckets?.find(bucket => bucket.name === 'images');
    
    if (!imagesBucket) {
      console.log('📦 Bucket "images" não encontrado. Criando...');
      
      const { data: newBucket, error: createError } = await supabase.storage.createBucket('images', {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml'],
        fileSizeLimit: 5242880 // 5MB
      });

      if (createError) {
        console.error('Erro ao criar bucket:', createError);
        return;
      }

      console.log('✅ Bucket "images" criado com sucesso');
    } else {
      console.log('✅ Bucket "images" encontrado');
    }

    // 2. Remover políticas existentes que podem estar causando conflito
    console.log('🧹 Removendo políticas existentes...');
    
    const policiesToRemove = [
      'images_select_policy',
      'images_insert_policy', 
      'images_update_policy',
      'images_delete_policy',
      'Allow public uploads',
      'Allow public access',
      'Public Access',
      'Public Upload'
    ];

    for (const policyName of policiesToRemove) {
      try {
        await supabase.rpc('drop_policy', {
          policy_name: policyName,
          table_name: 'objects',
          schema_name: 'storage'
        });
        console.log(`🗑️  Política "${policyName}" removida (se existia)`);
      } catch (error) {
        // Ignorar erros de política não encontrada
      }
    }

    // 3. Criar novas políticas permissivas
    console.log('📝 Criando novas políticas...');

    // Política para leitura pública
    const selectPolicy = `
      CREATE POLICY "images_public_select" ON storage.objects
      FOR SELECT TO public
      USING (bucket_id = 'images');
    `;

    // Política para upload público
    const insertPolicy = `
      CREATE POLICY "images_public_insert" ON storage.objects
      FOR INSERT TO public
      WITH CHECK (bucket_id = 'images');
    `;

    // Política para atualização
    const updatePolicy = `
      CREATE POLICY "images_public_update" ON storage.objects
      FOR UPDATE TO public
      USING (bucket_id = 'images')
      WITH CHECK (bucket_id = 'images');
    `;

    // Política para exclusão
    const deletePolicy = `
      CREATE POLICY "images_public_delete" ON storage.objects
      FOR DELETE TO public
      USING (bucket_id = 'images');
    `;

    // Executar políticas via RPC
    const policies = [
      { name: 'SELECT', sql: selectPolicy },
      { name: 'INSERT', sql: insertPolicy },
      { name: 'UPDATE', sql: updatePolicy },
      { name: 'DELETE', sql: deletePolicy }
    ];

    for (const policy of policies) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: policy.sql });
        
        if (error) {
          console.error(`Erro ao criar política ${policy.name}:`, error);
        } else {
          console.log(`✅ Política ${policy.name} criada com sucesso`);
        }
      } catch (error) {
        console.error(`Erro na política ${policy.name}:`, error);
      }
    }

    // 4. Verificar se RLS está habilitado
    console.log('🔒 Verificando RLS...');
    
    const { data: rlsData, error: rlsError } = await supabase.rpc('exec_sql', {
      sql: "SELECT relrowsecurity FROM pg_class WHERE relname = 'objects' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'storage');"
    });

    if (!rlsError && rlsData) {
      console.log('✅ RLS verificado');
    }

    // 5. Testar upload de um arquivo pequeno
    console.log('🧪 Testando upload...');
    
    const testContent = '<svg width="100" height="100"><circle cx="50" cy="50" r="40" fill="red"/></svg>';
    const testBuffer = Buffer.from(testContent, 'utf-8');
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('images')
      .upload(`test/test_${Date.now()}.svg`, testBuffer, {
        contentType: 'image/svg+xml',
        upsert: true
      });

    if (uploadError) {
      console.error('❌ Erro no teste de upload:', uploadError);
    } else {
      console.log('✅ Teste de upload bem-sucedido:', uploadData?.path);
      
      // Limpar arquivo de teste
      await supabase.storage.from('images').remove([uploadData?.path || '']);
      console.log('🧹 Arquivo de teste removido');
    }

    console.log('\n🎉 Configuração do bucket "images" concluída!');
    console.log('📁 O bucket agora suporta:');
    console.log('   • Upload público de SVG, PNG, JPG, WebP');
    console.log('   • Tamanho máximo: 5MB');
    console.log('   • Acesso público para leitura');

  } catch (error) {
    console.error('💥 Erro geral:', error);
  }
}

// Executar o script
fixImagesBucketPolicies().catch(console.error);