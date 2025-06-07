/**
 * Script para criar as tabelas de curtidas e salvos no banco de dados
 * 
 * Para executar: npx tsx create-likes-saves-tables.ts
 */

import { Pool } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';

dotenv.config();

async function createLikesAndSavesTables() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    console.log('Criando tabelas de curtidas e salvos...');

    // Criar tabela de curtidas
    await pool.query(`
      CREATE TABLE IF NOT EXISTS post_likes (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id, post_id)
      );
    `);

    // Criar tabela de salvos
    await pool.query(`
      CREATE TABLE IF NOT EXISTS post_saves (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id, post_id)
      );
    `);

    // Criar índices para melhor performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON post_likes(user_id);
      CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON post_likes(post_id);
      CREATE INDEX IF NOT EXISTS idx_post_saves_user_id ON post_saves(user_id);
      CREATE INDEX IF NOT EXISTS idx_post_saves_post_id ON post_saves(post_id);
    `);

    console.log('✅ Tabelas de curtidas e salvos criadas com sucesso!');

    // Verificar se as tabelas foram criadas
    const likesResult = await pool.query(`
      SELECT COUNT(*) as count FROM information_schema.tables 
      WHERE table_name = 'post_likes' AND table_schema = 'public'
    `);

    const savesResult = await pool.query(`
      SELECT COUNT(*) as count FROM information_schema.tables 
      WHERE table_name = 'post_saves' AND table_schema = 'public'
    `);

    console.log(`Tabela post_likes: ${likesResult.rows[0].count > 0 ? 'Criada' : 'Não encontrada'}`);
    console.log(`Tabela post_saves: ${savesResult.rows[0].count > 0 ? 'Criada' : 'Não encontrada'}`);

  } catch (error: any) {
    console.error('❌ Erro ao criar tabelas:', error.message);
  } finally {
    await pool.end();
  }
}

createLikesAndSavesTables();