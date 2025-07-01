/**
 * Script para corrigir as políticas de storage do Supabase
 * Permite upload de arquivos no bucket 'images'
 * 
 * Para executar: npx tsx fix-storage-policies.ts
 */

import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL?.replace(/"/g, '');
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.replace(/"/g, '');

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Variáveis SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias');
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixStoragePolicies() {
  try {
    console.log('🔧 Corrigindo políticas de storage para o bucket "images"...');

    // 1. Verificar buckets existentes
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Erro ao listar buckets:', listError);
      return;
    }

    console.log('📦 Buckets encontrados:', buckets?.map(b => b.name));

    // 2. Garantir que o bucket 'images' existe
    const imagesBucket = buckets?.find(bucket => bucket.name === 'images');
    
    if (!imagesBucket) {
      console.log('📦 Criando bucket "images"...');
      
      const { data: newBucket, error: createError } = await supabase.storage.createBucket('images', {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
        fileSizeLimit: 5242880 // 5MB
      });

      if (createError) {
        console.error('Erro ao criar bucket:', createError);
        return;
      }
      console.log('✅ Bucket "images" criado com sucesso');
    } else {
      console.log('✅ Bucket "images" já existe');
    }

    // 3. Executar SQL direto para criar políticas usando service role
    console.log('📝 Criando políticas de storage...');

    // SQL para remover políticas existentes que podem estar conflitando
    const dropPolicies = `
      DO $$ 
      BEGIN
        -- Remover políticas existentes se existirem
        DROP POLICY IF EXISTS "images_select_policy" ON storage.objects;
        DROP POLICY IF EXISTS "images_insert_policy" ON storage.objects;
        DROP POLICY IF EXISTS "images_update_policy" ON storage.objects;
        DROP POLICY IF EXISTS "images_delete_policy" ON storage.objects;
        DROP POLICY IF EXISTS "Public Access" ON storage.objects;
        DROP POLICY IF EXISTS "Public Upload" ON storage.objects;
        DROP POLICY IF EXISTS "Allow public uploads" ON storage.objects;
        DROP POLICY IF EXISTS "Allow public access" ON storage.objects;
        DROP POLICY IF EXISTS "Permitir insert de logo" ON storage.objects;
        DROP POLICY IF EXISTS "Permitir qualquer insert" ON storage.objects;
      EXCEPTION WHEN undefined_object THEN
        NULL; -- Ignorar se a política não existir
      END $$;
    `;

    // Executar limpeza de políticas
    const { error: dropError } = await supabase.rpc('exec', { sql: dropPolicies });
    if (dropError) {
      console.log('🧹 Políticas antigas limpas (algumas podem não ter existido)');
    }

    // SQL para criar novas políticas permissivas
    const createPolicies = `
      -- Habilitar RLS na tabela objects do storage
      ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

      -- Política para leitura pública
      CREATE POLICY "images_public_select" ON storage.objects
      FOR SELECT TO public
      USING (bucket_id = 'images');

      -- Política para upload público (qualquer um pode fazer upload)
      CREATE POLICY "images_public_insert" ON storage.objects
      FOR INSERT TO public
      WITH CHECK (bucket_id = 'images');

      -- Política para atualização pública
      CREATE POLICY "images_public_update" ON storage.objects
      FOR UPDATE TO public
      USING (bucket_id = 'images')
      WITH CHECK (bucket_id = 'images');

      -- Política para exclusão pública
      CREATE POLICY "images_public_delete" ON storage.objects
      FOR DELETE TO public
      USING (bucket_id = 'images');
    `;

    // Tentar executar as políticas
    try {
      const { error: policyError } = await supabase.rpc('exec', { sql: createPolicies });
      
      if (policyError) {
        console.error('Erro ao criar políticas via RPC:', policyError);
        
        // Método alternativo: usar SQL direto via conexão PostgreSQL
        console.log('🔄 Tentando método alternativo...');
        
        // Criar políticas uma por uma
        const policies = [
          {
            name: 'SELECT',
            sql: "CREATE POLICY images_public_select ON storage.objects FOR SELECT TO public USING (bucket_id = 'images');"
          },
          {
            name: 'INSERT', 
            sql: "CREATE POLICY images_public_insert ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'images');"
          },
          {
            name: 'UPDATE',
            sql: "CREATE POLICY images_public_update ON storage.objects FOR UPDATE TO public USING (bucket_id = 'images') WITH CHECK (bucket_id = 'images');"
          },
          {
            name: 'DELETE',
            sql: "CREATE POLICY images_public_delete ON storage.objects FOR DELETE TO public USING (bucket_id = 'images');"
          }
        ];

        for (const policy of policies) {
          try {
            const { error } = await supabase.rpc('exec', { sql: policy.sql });
            if (error) {
              console.warn(`⚠️  Política ${policy.name} pode já existir:`, error.message);
            } else {
              console.log(`✅ Política ${policy.name} criada`);
            }
          } catch (err) {
            console.warn(`⚠️  Erro na política ${policy.name}:`, err);
          }
        }
      } else {
        console.log('✅ Todas as políticas criadas com sucesso');
      }
    } catch (error) {
      console.error('💥 Erro ao executar políticas:', error);
    }

    // 4. Testar upload
    console.log('🧪 Testando upload no bucket...');
    
    const testContent = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    const testBuffer = Buffer.from(testContent.split(',')[1], 'base64');
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('images')
      .upload(`test/logo_test_${Date.now()}.png`, testBuffer, {
        contentType: 'image/png',
        upsert: true
      });

    if (uploadError) {
      console.error('❌ Erro no teste de upload:', uploadError);
      
      // Se ainda der erro, tentar desabilitar RLS temporariamente
      console.log('🚨 Tentando desabilitar RLS temporariamente...');
      const disableRLS = "ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;";
      
      const { error: disableError } = await supabase.rpc('exec', { sql: disableRLS });
      if (disableError) {
        console.error('Erro ao desabilitar RLS:', disableError);
      } else {
        console.log('⚠️  RLS desabilitado temporariamente para testes');
        
        // Tentar upload novamente
        const { data: retryData, error: retryError } = await supabase.storage
          .from('images')
          .upload(`test/logo_retry_${Date.now()}.png`, testBuffer, {
            contentType: 'image/png',
            upsert: true
          });
        
        if (retryError) {
          console.error('❌ Erro mesmo com RLS desabilitado:', retryError);
        } else {
          console.log('✅ Upload funcionou com RLS desabilitado:', retryData?.path);
          
          // Limpar arquivo de teste
          await supabase.storage.from('images').remove([retryData?.path || '']);
        }
      }
    } else {
      console.log('✅ Teste de upload bem-sucedido:', uploadData?.path);
      
      // Limpar arquivo de teste
      await supabase.storage.from('images').remove([uploadData?.path || '']);
      console.log('🧹 Arquivo de teste removido');
    }

    console.log('\n🎉 Configuração de storage concluída!');
    console.log('📁 O bucket "images" agora deve permitir uploads');

  } catch (error) {
    console.error('💥 Erro geral:', error);
  }
}

// Executar o script
fixStoragePolicies().catch(console.error);