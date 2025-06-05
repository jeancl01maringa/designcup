/**
 * Script para criar as tabelas de formatos diretamente no banco de dados PostgreSQL
 */
import { pool } from './server/db';

async function createTables() {
  console.log('Criando tabelas de formatos no banco de dados PostgreSQL...');
  
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
      ALTER TABLE file_formats ADD CONSTRAINT unique_file_format_name UNIQUE (name);
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
      ALTER TABLE post_formats ADD CONSTRAINT unique_post_format_name UNIQUE (name);
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
    
    console.log('Todas as tabelas de formatos foram criadas com sucesso!');
  } catch (error) {
    console.error('Erro ao criar tabelas de formatos:', error);
  } finally {
    // Fechar a conexão com o banco de dados
    await pool.end();
  }
}

// Executar a função
createTables().catch(console.error);