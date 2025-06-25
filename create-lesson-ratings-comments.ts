/**
 * Script para criar tabelas de avaliações e comentários das aulas
 * 
 * Para executar: npx tsx create-lesson-ratings-comments.ts
 */

import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from "ws";

neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function createTables() {
  try {
    console.log('🎯 Criando tabelas de avaliações e comentários...');

    // Tabela de avaliações das aulas
    await pool.query(`
      CREATE TABLE IF NOT EXISTS lesson_ratings (
        id SERIAL PRIMARY KEY,
        lesson_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(lesson_id, user_id)
      );
    `);

    // Tabela de comentários das aulas
    await pool.query(`
      CREATE TABLE IF NOT EXISTS lesson_comments (
        id SERIAL PRIMARY KEY,
        lesson_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        comment TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('✅ Tabelas criadas com sucesso!');

    // Verificar se as tabelas foram criadas
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('lesson_ratings', 'lesson_comments')
      ORDER BY table_name;
    `);

    console.log('📋 Tabelas encontradas:', tables.rows.map(r => r.table_name));

  } catch (error) {
    console.error('❌ Erro ao criar tabelas:', error);
  } finally {
    await pool.end();
  }
}

createTables();