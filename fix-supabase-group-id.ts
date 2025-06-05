/**
 * Script para adicionar a coluna group_id na tabela posts do Supabase
 */

import { supabase } from './server/supabase-client';

async function addGroupIdColumn() {
  try {
    console.log('Adicionando coluna group_id na tabela posts do Supabase...');
    
    // Executar SQL para adicionar a coluna group_id se não existir
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        DO $$ 
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'posts' AND column_name = 'group_id'
          ) THEN
            ALTER TABLE posts ADD COLUMN group_id TEXT;
            PRINT 'Coluna group_id adicionada com sucesso';
          ELSE
            PRINT 'Coluna group_id já existe';
          END IF;
        END $$;
      `
    });
    
    if (error) {
      console.error('Erro ao executar SQL:', error);
      
      // Tentar método alternativo
      console.log('Tentando método alternativo...');
      const { error: altError } = await supabase
        .from('posts')
        .select('group_id')
        .limit(1);
        
      if (altError && altError.code === '42703') {
        console.log('A coluna group_id realmente não existe no Supabase. Será necessário adicionar manualmente no painel.');
        console.log('Execute este SQL no SQL Editor do Supabase:');
        console.log('ALTER TABLE posts ADD COLUMN group_id TEXT;');
      }
    } else {
      console.log('Comando executado com sucesso:', data);
    }
    
  } catch (error) {
    console.error('Erro:', error);
  }
}

addGroupIdColumn();
