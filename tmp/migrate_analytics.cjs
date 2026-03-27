const { Pool } = require('pg');
require('dotenv').config();
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.SUPABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  console.log('Iniciando migração de analytics...');
  try {
    // 1. Adicionar colunas na tabela posts
    console.log('Adicionando colunas views e downloads em posts...');
    await pool.query(`
      ALTER TABLE posts 
      ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS downloads INTEGER DEFAULT 0;
    `);

    // 2. Criar tabela post_views
    console.log('Criando tabela post_views...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS post_views (
        id SERIAL PRIMARY KEY,
        post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Criar tabela post_downloads
    console.log('Criando tabela post_downloads...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS post_downloads (
        id SERIAL PRIMARY KEY,
        post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('Migração concluída com sucesso!');
  } catch (err) {
    console.error('Erro na migração:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
