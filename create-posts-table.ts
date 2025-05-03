/**
 * Script para criar a tabela posts diretamente no banco de dados PostgreSQL e Supabase
 * 
 * Para executar: npx tsx create-posts-table.ts
 */
import { pool } from './server/db';
import { supabase } from './server/supabase-client';

async function createPostsTable() {
  try {
    console.log('Criando tabela posts no PostgreSQL...');

    // Primeiro criar o enum para o status dos posts
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'post_status') THEN
          CREATE TYPE post_status AS ENUM ('aprovado', 'rascunho', 'rejeitado');
        END IF;
      END$$;
    `);
    
    // Depois criar a tabela posts
    await pool.query(`
      CREATE TABLE IF NOT EXISTS posts (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        titulo_base TEXT,
        description TEXT,
        image_url TEXT NOT NULL,
        unique_code TEXT NOT NULL UNIQUE,
        category_id INTEGER REFERENCES categories(id),
        status post_status NOT NULL DEFAULT 'rascunho',
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        published_at TIMESTAMP WITH TIME ZONE,
        license_type TEXT DEFAULT 'free',
        tags TEXT[],
        formato TEXT,
        formats TEXT[],
        format_data TEXT,
        formato_data TEXT,
        canva_url TEXT,
        group_id TEXT,
        is_visible BOOLEAN NOT NULL DEFAULT TRUE,
        is_pro BOOLEAN DEFAULT FALSE
      );
    `);

    console.log('Tabela posts criada com sucesso no PostgreSQL.');

    // Tentar criar também no Supabase
    console.log('Tentando criar tabela posts no Supabase...');
    
    try {
      const { error: supabaseError } = await supabase.rpc('create_posts_table', {});
      
      if (supabaseError) {
        console.error('Erro ao criar tabela posts no Supabase via RPC:', supabaseError);
        console.log('Tentando criar usando SQL direto no Supabase...');
        
        // Criar função SQL no Supabase
        const { error: sqlError } = await supabase.sql(`
          CREATE OR REPLACE FUNCTION create_posts_table()
          RETURNS void
          LANGUAGE plpgsql
          AS $$
          BEGIN
            -- Criar enum se não existir
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'post_status') THEN
              CREATE TYPE post_status AS ENUM ('aprovado', 'rascunho', 'rejeitado');
            END IF;
            
            -- Criar tabela se não existir
            CREATE TABLE IF NOT EXISTS posts (
              id SERIAL PRIMARY KEY,
              title TEXT NOT NULL,
              titulo_base TEXT,
              description TEXT,
              image_url TEXT NOT NULL,
              unique_code TEXT NOT NULL UNIQUE,
              category_id INTEGER REFERENCES categories(id),
              status post_status NOT NULL DEFAULT 'rascunho',
              created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
              published_at TIMESTAMP WITH TIME ZONE,
              license_type TEXT DEFAULT 'free',
              tags TEXT[],
              formato TEXT,
              formats TEXT[],
              format_data TEXT,
              formato_data TEXT,
              canva_url TEXT,
              group_id TEXT,
              is_visible BOOLEAN NOT NULL DEFAULT TRUE,
              is_pro BOOLEAN DEFAULT FALSE
            );
          END;
          $$;
          
          SELECT create_posts_table();
        `);
        
        if (sqlError) {
          console.error('Erro ao criar tabela posts no Supabase via SQL:', sqlError);
          console.log('Você precisará criar a tabela manualmente no console do Supabase.');
        } else {
          console.log('Tabela posts criada com sucesso no Supabase.');
        }
      } else {
        console.log('Tabela posts criada com sucesso no Supabase.');
      }
    } catch (supabaseError) {
      console.error('Exceção ao criar tabela no Supabase:', supabaseError);
      console.log('Você precisará criar a tabela manualmente no console do Supabase.');
    }
    
    console.log('Script concluído.');
  } catch (error) {
    console.error('Erro ao criar tabela posts:', error);
  } finally {
    // Fechar pool de conexão
    await pool.end();
  }
}

createPostsTable().catch(console.error);