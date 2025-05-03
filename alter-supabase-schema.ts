/**
 * Script para alterar o schema do Supabase e adicionar as colunas necessárias
 * para o sistema de formatos e atributos premium na tabela posts
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
        -- Adicionar todas as colunas necessárias se não existirem
        DO $$
        BEGIN
          -- Colunas para o sistema premium
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
          
          -- Colunas para o sistema de formatos
          BEGIN
            ALTER TABLE posts ADD COLUMN titulo_base TEXT;
            RAISE NOTICE 'Coluna titulo_base adicionada com sucesso';
          EXCEPTION
            WHEN duplicate_column THEN
              RAISE NOTICE 'Coluna titulo_base já existe, ignorando...';
          END;
          
          BEGIN
            ALTER TABLE posts ADD COLUMN formato TEXT;
            RAISE NOTICE 'Coluna formato adicionada com sucesso';
          EXCEPTION
            WHEN duplicate_column THEN
              RAISE NOTICE 'Coluna formato já existe, ignorando...';
          END;
          
          BEGIN
            ALTER TABLE posts ADD COLUMN formats TEXT[];
            RAISE NOTICE 'Coluna formats adicionada com sucesso';
          EXCEPTION
            WHEN duplicate_column THEN
              RAISE NOTICE 'Coluna formats já existe, ignorando...';
          END;
          
          BEGIN
            ALTER TABLE posts ADD COLUMN format_data TEXT;
            RAISE NOTICE 'Coluna format_data adicionada com sucesso';
          EXCEPTION
            WHEN duplicate_column THEN
              RAISE NOTICE 'Coluna format_data já existe, ignorando...';
          END;
          
          BEGIN
            ALTER TABLE posts ADD COLUMN formato_data TEXT;
            RAISE NOTICE 'Coluna formato_data adicionada com sucesso';
          EXCEPTION
            WHEN duplicate_column THEN
              RAISE NOTICE 'Coluna formato_data já existe, ignorando...';
          END;
          
          BEGIN
            ALTER TABLE posts ADD COLUMN canva_url TEXT;
            RAISE NOTICE 'Coluna canva_url adicionada com sucesso';
          EXCEPTION
            WHEN duplicate_column THEN
              RAISE NOTICE 'Coluna canva_url já existe, ignorando...';
          END;
          
          BEGIN
            ALTER TABLE posts ADD COLUMN group_id TEXT;
            RAISE NOTICE 'Coluna group_id adicionada com sucesso';
          EXCEPTION
            WHEN duplicate_column THEN
              RAISE NOTICE 'Coluna group_id já existe, ignorando...';
          END;
          
          BEGIN
            ALTER TABLE posts ADD COLUMN tags TEXT[];
            RAISE NOTICE 'Coluna tags adicionada com sucesso';
          EXCEPTION
            WHEN duplicate_column THEN
              RAISE NOTICE 'Coluna tags já existe, ignorando...';
          END;
        END $$;
      `
    });
    
    if (error) {
      // Se não conseguir executar a função RPC, fornecer instruções SQL 
      console.error('Erro ao executar SQL via RPC:', error);
      console.log('\nPor favor, execute o seguinte SQL no painel do Supabase:');
      console.log(`
        -- Adicionar colunas para sistema premium
        ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_pro BOOLEAN DEFAULT FALSE;
        ALTER TABLE posts ADD COLUMN IF NOT EXISTS license_type TEXT DEFAULT 'free';
        ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_visible BOOLEAN DEFAULT TRUE;
        
        -- Adicionar colunas para sistema de formatos
        ALTER TABLE posts ADD COLUMN IF NOT EXISTS titulo_base TEXT;
        ALTER TABLE posts ADD COLUMN IF NOT EXISTS formato TEXT;
        ALTER TABLE posts ADD COLUMN IF NOT EXISTS formats TEXT[];
        ALTER TABLE posts ADD COLUMN IF NOT EXISTS format_data TEXT;
        ALTER TABLE posts ADD COLUMN IF NOT EXISTS formato_data TEXT;
        ALTER TABLE posts ADD COLUMN IF NOT EXISTS canva_url TEXT;
        ALTER TABLE posts ADD COLUMN IF NOT EXISTS group_id TEXT;
        ALTER TABLE posts ADD COLUMN IF NOT EXISTS tags TEXT[];
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
      .is('titulo_base', null);
      
    // Tentar atualizar título_base via SQL diretamente
    try {
      const { error: titleUpdateError } = await supabase.rpc('execute_sql', {
        query: `
          UPDATE posts 
          SET titulo_base = title 
          WHERE titulo_base IS NULL
        `
      });
      
      if (titleUpdateError) {
        console.error('Erro ao atualizar titulo_base:', titleUpdateError);
      } else {
        console.log('Campo titulo_base atualizado com sucesso para todos os posts.');
      }
    } catch (err) {
      console.error('Erro ao executar SQL para atualizar titulo_base:', err);
    }
    
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