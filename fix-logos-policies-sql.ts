/**
 * Script para corrigir as políticas do bucket "logos" usando SQL direto
 * 
 * Para executar: npx tsx fix-logos-policies-sql.ts
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

async function fixLogoPolicies() {
  console.log('🔧 Configurando políticas do bucket "logos" via SQL...');

  const policies = [
    {
      name: 'Public Access',
      sql: `
        CREATE POLICY "Public Access" ON storage.objects FOR SELECT
        USING (bucket_id = 'logos');
      `
    },
    {
      name: 'Authenticated users can upload logos',
      sql: `
        CREATE POLICY "Authenticated users can upload logos" ON storage.objects FOR INSERT
        WITH CHECK (bucket_id = 'logos' AND auth.role() = 'authenticated');
      `
    },
    {
      name: 'Authenticated users can update logos',
      sql: `
        CREATE POLICY "Authenticated users can update logos" ON storage.objects FOR UPDATE
        USING (bucket_id = 'logos' AND auth.role() = 'authenticated')
        WITH CHECK (bucket_id = 'logos' AND auth.role() = 'authenticated');
      `
    },
    {
      name: 'Authenticated users can delete logos',
      sql: `
        CREATE POLICY "Authenticated users can delete logos" ON storage.objects FOR DELETE
        USING (bucket_id = 'logos' AND auth.role() = 'authenticated');
      `
    }
  ];

  for (const policy of policies) {
    try {
      console.log(`📝 Criando política: ${policy.name}...`);
      
      const { error } = await supabase.rpc('exec_sql', {
        sql: policy.sql
      });

      if (error) {
        if (error.message.includes('already exists')) {
          console.log(`✅ Política "${policy.name}" já existe`);
        } else {
          console.error(`❌ Erro ao criar política "${policy.name}":`, error);
        }
      } else {
        console.log(`✅ Política "${policy.name}" criada com sucesso`);
      }
    } catch (error) {
      console.error(`❌ Erro inesperado na política "${policy.name}":`, error);
    }
  }

  // Verificar se RLS está ativado
  try {
    console.log('🔒 Verificando RLS no storage.objects...');
    
    const { error: rlsError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;'
    });

    if (rlsError && !rlsError.message.includes('already enabled')) {
      console.error('❌ Erro ao ativar RLS:', rlsError);
    } else {
      console.log('✅ RLS ativado no storage.objects');
    }
  } catch (error) {
    console.error('❌ Erro ao verificar RLS:', error);
  }

  console.log('\n🎉 Políticas do bucket "logos" configuradas!');
}

// Executar script
fixLogoPolicies();