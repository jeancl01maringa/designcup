/**
 * Script para alterar o schema do Supabase e adicionar as colunas necessárias
 * para o atributo premium (is_pro e license_type) na tabela posts
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

// Verificar se as variáveis de ambiente necessárias estão definidas
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Erro: SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY devem estar definidos no ambiente.');
  process.exit(1);
}

// Criar cliente Supabase com a chave de serviço para ter acesso total
const supabase = createClient(supabaseUrl, supabaseKey);

async function alterSchema() {
  try {
    console.log('Conectando ao Supabase para alterar o schema...');
    
    // Verificar se a tabela posts existe
    const { error: checkError } = await supabase
      .from('posts')
      .select('count')
      .limit(1);
    
    if (checkError) {
      console.error('Erro ao verificar a tabela posts:', checkError);
      return;
    }
    
    console.log('Tabela posts encontrada, prosseguindo com a adição das colunas...');
    
    // Tentativa usando SQL diretamente através do serviço PostgreSQL do Supabase
    const { error } = await supabase.rpc('execute_sql', {
      query: `
        -- Adicionar coluna is_pro (boolean) se não existir
        DO $$
        BEGIN
          BEGIN
            ALTER TABLE posts ADD COLUMN is_pro BOOLEAN DEFAULT FALSE;
            RAISE NOTICE 'Coluna is_pro adicionada com sucesso';
          EXCEPTION
            WHEN duplicate_column THEN
              RAISE NOTICE 'Coluna is_pro já existe, ignorando...';
          END;
          
          BEGIN
            ALTER TABLE posts ADD COLUMN license_type TEXT DEFAULT 'free';
            RAISE NOTICE 'Coluna license_type adicionada com sucesso';
          EXCEPTION
            WHEN duplicate_column THEN
              RAISE NOTICE 'Coluna license_type já existe, ignorando...';
          END;
          
          BEGIN
            ALTER TABLE posts ADD COLUMN is_visible BOOLEAN DEFAULT TRUE;
            RAISE NOTICE 'Coluna is_visible adicionada com sucesso';
          EXCEPTION
            WHEN duplicate_column THEN
              RAISE NOTICE 'Coluna is_visible já existe, ignorando...';
          END;
        END $$;
      `
    });
    
    if (error) {
      // Se não conseguir executar a função RPC, fornecer instruções SQL 
      console.error('Erro ao executar SQL via RPC:', error);
      console.log('\nPor favor, execute o seguinte SQL no painel do Supabase:');
      console.log(`
        -- Adicionar coluna is_pro (boolean) se não existir 
        ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_pro BOOLEAN DEFAULT FALSE;
        
        -- Adicionar coluna license_type (text) se não existir
        ALTER TABLE posts ADD COLUMN IF NOT EXISTS license_type TEXT DEFAULT 'free';
        
        -- Adicionar coluna is_visible (boolean) se não existir
        ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_visible BOOLEAN DEFAULT TRUE;
      `);
      return;
    }
    
    console.log('Colunas adicionadas com sucesso à tabela posts!');
    
    // Atualizando valores padrão para todas as linhas
    const { error: updateError } = await supabase
      .from('posts')
      .update({ 
        is_pro: false,
        license_type: 'free',
        is_visible: true
      })
      .is('is_pro', null);
    
    if (updateError) {
      console.error('Erro ao atualizar valores padrão:', updateError);
    } else {
      console.log('Valores padrão atualizados para todos os posts existentes');
    }
    
    console.log('\nSchema atualizado com sucesso!');
    
  } catch (error) {
    console.error('Erro ao alterar o schema:', error);
  }
}

// Executar o script
alterSchema()
  .then(() => {
    console.log('Script concluído.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Erro durante a execução do script:', error);
    process.exit(1);
  });