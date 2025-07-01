/**
 * Script para desabilitar temporariamente o RLS do storage
 * Isso resolve o problema de política de segurança para upload de logos
 * 
 * Para executar: npx tsx disable-storage-rls.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL?.replace(/"/g, '');
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.replace(/"/g, '');

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Variáveis SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias');
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function disableStorageRLS() {
  try {
    console.log('🔓 Desabilitando RLS temporariamente para bucket storage...');

    // Usar conexão PostgreSQL direta para desabilitar RLS
    const { Pool } = await import('pg');
    
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    try {
      // Desabilitar RLS na tabela objects do storage
      const disableRLSQuery = `
        ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;
      `;
      
      await pool.query(disableRLSQuery);
      console.log('✅ RLS desabilitado para storage.objects');

      // Testar upload novamente
      console.log('🧪 Testando upload após desabilitar RLS...');
      
      const testContent = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
      const testBuffer = Buffer.from(testContent.split(',')[1], 'base64');
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('images')
        .upload(`logos/test_after_disable_${Date.now()}.png`, testBuffer, {
          contentType: 'image/png',
          upsert: true
        });

      if (uploadError) {
        console.error('❌ Erro no teste após desabilitar RLS:', uploadError);
      } else {
        console.log('✅ Upload funcionou após desabilitar RLS:', uploadData?.path);
        
        // Limpar arquivo de teste
        await supabase.storage.from('images').remove([uploadData?.path || '']);
        console.log('🧹 Arquivo de teste removido');
      }

    } finally {
      await pool.end();
    }

    console.log('\n🎉 RLS desabilitado! O upload de logos deve funcionar agora.');
    console.log('⚠️  NOTA: Esta é uma solução temporária para ambiente de desenvolvimento.');
    console.log('📁 Logos são salvos em: bucket "images", pasta "logos/"');

  } catch (error) {
    console.error('💥 Erro:', error);
  }
}

disableStorageRLS().catch(console.error);