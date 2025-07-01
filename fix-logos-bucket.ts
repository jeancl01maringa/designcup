/**
 * Script para corrigir as políticas do bucket "logos" no Supabase
 * 
 * Para executar: npx tsx fix-logos-bucket.ts
 */

import { createClient } from '@supabase/supabase-js';

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixLogosBucket() {
  try {
    console.log('🔧 Verificando bucket "logos"...');

    // Primeiro, verificar se o bucket existe
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Erro ao listar buckets:', listError);
      return;
    }

    const logosBucket = buckets?.find(bucket => bucket.name === 'logos');
    
    if (!logosBucket) {
      console.log('📁 Criando bucket "logos"...');
      
      const { data: newBucket, error: createError } = await supabase.storage.createBucket('logos', {
        public: true,
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'],
        fileSizeLimit: 5242880 // 5MB
      });

      if (createError) {
        console.error('❌ Erro ao criar bucket:', createError);
        return;
      }

      console.log('✅ Bucket "logos" criado com sucesso');
    } else {
      console.log('✅ Bucket "logos" já existe');
    }

    // Verificar/criar políticas RLS
    console.log('🔒 Configurando políticas de acesso...');

    // Criar política de leitura pública
    const { error: selectPolicyError } = await supabase.rpc('create_storage_policy', {
      bucket_name: 'logos',
      policy_name: 'Public Read Access',
      definition: 'true',
      operation: 'SELECT'
    });

    if (selectPolicyError && !selectPolicyError.message.includes('already exists')) {
      console.error('❌ Erro ao criar política de leitura:', selectPolicyError);
    } else {
      console.log('✅ Política de leitura configurada');
    }

    // Criar política de upload para admins
    const { error: insertPolicyError } = await supabase.rpc('create_storage_policy', {
      bucket_name: 'logos',
      policy_name: 'Admin Upload Access',
      definition: 'auth.role() = \'authenticated\'',
      operation: 'INSERT'
    });

    if (insertPolicyError && !insertPolicyError.message.includes('already exists')) {
      console.error('❌ Erro ao criar política de upload:', insertPolicyError);
    } else {
      console.log('✅ Política de upload configurada');
    }

    // Criar política de atualização para admins
    const { error: updatePolicyError } = await supabase.rpc('create_storage_policy', {
      bucket_name: 'logos',
      policy_name: 'Admin Update Access',
      definition: 'auth.role() = \'authenticated\'',
      operation: 'UPDATE'
    });

    if (updatePolicyError && !updatePolicyError.message.includes('already exists')) {
      console.error('❌ Erro ao criar política de atualização:', updatePolicyError);
    } else {
      console.log('✅ Política de atualização configurada');
    }

    // Criar política de exclusão para admins
    const { error: deletePolicyError } = await supabase.rpc('create_storage_policy', {
      bucket_name: 'logos',
      policy_name: 'Admin Delete Access',
      definition: 'auth.role() = \'authenticated\'',
      operation: 'DELETE'
    });

    if (deletePolicyError && !deletePolicyError.message.includes('already exists')) {
      console.error('❌ Erro ao criar política de exclusão:', deletePolicyError);
    } else {
      console.log('✅ Política de exclusão configurada');
    }

    console.log('\n🎉 Bucket "logos" configurado com sucesso!');
    console.log('📋 Configurações aplicadas:');
    console.log('   - Acesso público para leitura');
    console.log('   - Upload permitido para usuários autenticados');
    console.log('   - Tipos de arquivo: PNG, JPG, SVG');
    console.log('   - Tamanho máximo: 5MB');

  } catch (error) {
    console.error('❌ Erro inesperado:', error);
  }
}

// Executar script
fixLogosBucket();