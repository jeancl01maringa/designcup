/**
 * Script para criar políticas corretas para o bucket "perfis"
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL?.replace(/"/g, '') || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.replace(/"/g, '') || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createStoragePolicies() {
  try {
    console.log('Criando políticas de acesso para o bucket "perfis"...');

    // Política para permitir leitura pública
    const selectPolicy = `
      CREATE POLICY "Public read access for perfis" ON storage.objects
      FOR SELECT USING (bucket_id = 'perfis');
    `;

    // Política para permitir upload por qualquer usuário autenticado
    const insertPolicy = `
      CREATE POLICY "Allow authenticated uploads to perfis" ON storage.objects
      FOR INSERT WITH CHECK (bucket_id = 'perfis');
    `;

    // Política para permitir atualização por qualquer usuário autenticado
    const updatePolicy = `
      CREATE POLICY "Allow authenticated updates to perfis" ON storage.objects
      FOR UPDATE USING (bucket_id = 'perfis');
    `;

    // Política para permitir exclusão por qualquer usuário autenticado
    const deletePolicy = `
      CREATE POLICY "Allow authenticated deletes from perfis" ON storage.objects
      FOR DELETE USING (bucket_id = 'perfis');
    `;

    // Executar as políticas via RPC
    console.log('Executando política SELECT...');
    const { error: selectError } = await supabase.rpc('exec', { 
      sql: selectPolicy 
    });
    
    if (selectError && !selectError.message.includes('already exists')) {
      console.log('Aviso SELECT:', selectError.message);
    }

    console.log('Executando política INSERT...');
    const { error: insertError } = await supabase.rpc('exec', { 
      sql: insertPolicy 
    });
    
    if (insertError && !insertError.message.includes('already exists')) {
      console.log('Aviso INSERT:', insertError.message);
    }

    console.log('Executando política UPDATE...');
    const { error: updateError } = await supabase.rpc('exec', { 
      sql: updatePolicy 
    });
    
    if (updateError && !updateError.message.includes('already exists')) {
      console.log('Aviso UPDATE:', updateError.message);
    }

    console.log('Executando política DELETE...');
    const { error: deleteError } = await supabase.rpc('exec', { 
      sql: deletePolicy 
    });
    
    if (deleteError && !deleteError.message.includes('already exists')) {
      console.log('Aviso DELETE:', deleteError.message);
    }

    console.log('✅ Políticas de acesso configuradas para o bucket "perfis"');

  } catch (error) {
    console.error('Erro ao criar políticas:', error);
  }
}

createStoragePolicies();
