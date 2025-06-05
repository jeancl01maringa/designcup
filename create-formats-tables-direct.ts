/**
 * Script para criar as tabelas de formatos diretamente no PostgreSQL do Supabase
 * usando a conexão direta ao banco de dados com a lib @neondatabase/serverless
 */

import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import dotenv from "dotenv";

dotenv.config();

// Configurar o WebSocket para o NeonDB
neonConfig.webSocketConstructor = ws;

// Usar DATABASE_URL para conectar diretamente ao banco de dados do Supabase
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

async function createFormatTables() {
  console.log("Criando tabelas de formatos direto no PostgreSQL com DATABASE_URL...");
  
  const pool = new Pool({ connectionString: DATABASE_URL });
  
  try {
    // Criar tabela de formatos de arquivo
    await pool.query(`
      CREATE TABLE IF NOT EXISTS file_formats (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        icon TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    
    // Adicionar restrição única para o nome do formato de arquivo
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'unique_file_format_name'
        ) THEN
          ALTER TABLE file_formats ADD CONSTRAINT unique_file_format_name UNIQUE (name);
        END IF;
      END$$;
    `);
    
    // Inserir dados iniciais para formatos de arquivo
    await pool.query(`
      INSERT INTO file_formats (name, type, icon, is_active)
      VALUES
        ('Canva', 'Editável', 'canva', true),
        ('PNG', 'Download', 'download', true),
        ('JPG', 'Download', 'download', true),
        ('Adobe Photoshop', 'Editável', 'photoshop', true)
      ON CONFLICT (name) DO NOTHING;
    `);
    
    console.log('Tabela de formatos de arquivo criada com sucesso!');
    
    // Criar tabela de formatos de post
    await pool.query(`
      CREATE TABLE IF NOT EXISTS post_formats (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        size TEXT NOT NULL,
        orientation TEXT NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    
    // Adicionar restrição única para o nome do formato de post
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'unique_post_format_name'
        ) THEN
          ALTER TABLE post_formats ADD CONSTRAINT unique_post_format_name UNIQUE (name);
        END IF;
      END$$;
    `);
    
    // Inserir dados iniciais para formatos de post
    await pool.query(`
      INSERT INTO post_formats (name, size, orientation, is_active)
      VALUES
        ('Feed', '1080x1080px', 'Quadrado', true),
        ('Stories', '1080x1920px', 'Vertical', true),
        ('Cartaz', '1080x1350px', 'Vertical', true),
        ('Banner', '1200x628px', 'Horizontal', true)
      ON CONFLICT (name) DO NOTHING;
    `);
    
    console.log('Tabela de formatos de post criada com sucesso!');
    
    // Listar os formatos de arquivo criados
    const { rows: fileFormats } = await pool.query('SELECT * FROM file_formats');
    console.log(`Formatos de arquivo (${fileFormats.length}):`, fileFormats);
    
    // Listar os formatos de post criados
    const { rows: postFormats } = await pool.query('SELECT * FROM post_formats');
    console.log(`Formatos de post (${postFormats.length}):`, postFormats);
    
    console.log('Todas as tabelas de formatos foram criadas com sucesso!');
  } catch (error) {
    console.error('Erro ao criar tabelas de formatos:', error);
  } finally {
    // Fechar a conexão com o banco de dados
    await pool.end();
  }
}

// Executar a função
createFormatTables().catch(console.error);