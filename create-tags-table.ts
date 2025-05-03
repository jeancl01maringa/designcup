/**
 * Script para criar a tabela tags diretamente no banco de dados PostgreSQL e Supabase
 * 
 * Para executar: npx tsx create-tags-table.ts
 */

import { createClient } from '@supabase/supabase-js';
import { Pool } from '@neondatabase/serverless';
import ws from 'ws';
import 'dotenv/config';

// Configuração para Neon PostgreSQL (WebSockets)
import { neonConfig } from '@neondatabase/serverless';
neonConfig.webSocketConstructor = ws;

// Configuração do cliente Supabase
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Conexão direta ao PostgreSQL
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required');
}

const pool = new Pool({ connectionString: databaseUrl });
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Função principal que cria a tabela tags
 */
async function createTagsTable() {
  console.log('Iniciando criação da tabela tags...');
  
  try {
    // Verificar se a tabela já existe diretamente no PostgreSQL
    try {
      const checkTableResult = await pool.query(`
        SELECT EXISTS (
          SELECT FROM pg_tables
          WHERE schemaname = 'public'
          AND tablename = 'tags'
        );
      `);
      
      if (checkTableResult.rows[0].exists) {
        console.log('Tabela tags já existe no banco de dados');
        return;
      }
    } catch (checkError) {
      console.error('Erro ao verificar se tabela tags existe:', checkError);
      // Continuar mesmo com erro na verificação
    }
    
    // Criar a tabela através de SQL direto
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS public.tags (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        slug VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        count INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      );
      
      -- Criar a tabela de relacionamento entre posts e tags (muitos para muitos)
      CREATE TABLE IF NOT EXISTS public.post_tags (
        id SERIAL PRIMARY KEY,
        post_id INTEGER NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
        tag_id INTEGER NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        UNIQUE(post_id, tag_id)
      );
      
      -- Adicionar índices para melhorar performance
      CREATE INDEX IF NOT EXISTS idx_tags_name ON public.tags(name);
      CREATE INDEX IF NOT EXISTS idx_tags_slug ON public.tags(slug);
      CREATE INDEX IF NOT EXISTS idx_tags_is_active ON public.tags(is_active);
      CREATE INDEX IF NOT EXISTS idx_post_tags_post_id ON public.post_tags(post_id);
      CREATE INDEX IF NOT EXISTS idx_post_tags_tag_id ON public.post_tags(tag_id);
      
      -- Função para atualizar o contador de tags
      CREATE OR REPLACE FUNCTION update_tag_count() RETURNS TRIGGER AS $$
      BEGIN
        IF TG_OP = 'INSERT' THEN
          UPDATE public.tags SET count = count + 1 WHERE id = NEW.tag_id;
        ELSIF TG_OP = 'DELETE' THEN
          UPDATE public.tags SET count = count - 1 WHERE id = OLD.tag_id;
        END IF;
        RETURN NULL;
      END;
      $$ LANGUAGE plpgsql;
      
      -- Criar triggers para manter o contador de tags atualizado
      DROP TRIGGER IF EXISTS trig_update_tag_count_insert ON public.post_tags;
      CREATE TRIGGER trig_update_tag_count_insert
        AFTER INSERT ON public.post_tags
        FOR EACH ROW
        EXECUTE FUNCTION update_tag_count();
        
      DROP TRIGGER IF EXISTS trig_update_tag_count_delete ON public.post_tags;
      CREATE TRIGGER trig_update_tag_count_delete
        AFTER DELETE ON public.post_tags
        FOR EACH ROW
        EXECUTE FUNCTION update_tag_count();
    `;
    
    // Executar a query SQL diretamente no PostgreSQL
    console.log('Executando query SQL para criar tabela tags...');
    await pool.query(createTableQuery);
    console.log('Tabela tags e post_tags criadas com sucesso!');
    
    // Inserir algumas tags de exemplo
    console.log('Inserindo tags de exemplo...');
    const exampleTags = [
      { name: 'Beleza', slug: 'beleza', description: 'Conteúdos relacionados à beleza', is_active: true },
      { name: 'Estética', slug: 'estetica', description: 'Conteúdos sobre tratamentos estéticos', is_active: true },
      { name: 'Skincare', slug: 'skincare', description: 'Cuidados com a pele', is_active: true },
      { name: 'Limpeza de Pele', slug: 'limpeza-de-pele', description: 'Procedimentos de limpeza facial', is_active: true },
      { name: 'Botox', slug: 'botox', description: 'Conteúdos sobre aplicação de botox', is_active: true },
      { name: 'Promoções', slug: 'promocoes', description: 'Promoções especiais', is_active: true }
    ];
    
    // Inserir as tags diretamente no PostgreSQL
    const insertTagsQuery = `
      INSERT INTO public.tags (name, slug, description, is_active)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (slug) DO UPDATE
      SET name = EXCLUDED.name,
          description = EXCLUDED.description,
          is_active = EXCLUDED.is_active
      RETURNING id, name, slug
    `;
    
    for (const tag of exampleTags) {
      const result = await pool.query(insertTagsQuery, [
        tag.name,
        tag.slug,
        tag.description,
        tag.is_active
      ]);
      
      if (result.rows.length > 0) {
        console.log(`Tag inserida: ${result.rows[0].name} (${result.rows[0].slug})`);
      }
    }
    
    console.log('Tags de exemplo inseridas com sucesso!');
    
  } catch (error) {
    console.error('Erro ao criar tabela tags:', error);
    throw error;
  } finally {
    // Fechar a conexão com o pool
    await pool.end();
  }
}

// Executar a função principal
createTagsTable()
  .then(() => {
    console.log('Processo concluído com sucesso!');
  })
  .catch(error => {
    console.error('Erro no processo:', error);
    process.exit(1);
  });