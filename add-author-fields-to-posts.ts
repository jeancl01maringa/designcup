/**
 * Script para adicionar campos do autor na tabela posts
 * Elimina a necessidade de consultas separadas para dados do usuário
 * 
 * Para executar: npx tsx add-author-fields-to-posts.ts
 */

import { pool } from './server/db';

async function addAuthorFields() {
  try {
    console.log('📝 Adicionando campos do autor na tabela posts...');
    
    // Adicionar campos do autor
    await pool.query(`
      ALTER TABLE posts 
      ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id),
      ADD COLUMN IF NOT EXISTS author_name TEXT,
      ADD COLUMN IF NOT EXISTS author_profile_image TEXT,
      ADD COLUMN IF NOT EXISTS author_type TEXT
    `);
    
    console.log('✅ Campos adicionados com sucesso');
    
    // Preencher campos do autor para posts existentes
    console.log('📝 Preenchendo dados do autor para posts existentes...');
    
    const updateResult = await pool.query(`
      UPDATE posts 
      SET 
        user_id = CASE WHEN user_id IS NULL THEN 3 ELSE user_id END,
        author_name = (SELECT username FROM users WHERE users.id = COALESCE(posts.user_id, 3)),
        author_profile_image = (SELECT profile_image FROM users WHERE users.id = COALESCE(posts.user_id, 3)),
        author_type = (SELECT COALESCE(tipo, 'free') FROM users WHERE users.id = COALESCE(posts.user_id, 3))
      WHERE author_name IS NULL OR author_profile_image IS NULL OR author_type IS NULL
    `);
    
    console.log(`✅ Atualizados ${updateResult.rowCount} posts com dados do autor`);
    
    // Verificar resultado
    const verifyResult = await pool.query(`
      SELECT 
        COUNT(*) as total_posts,
        COUNT(author_name) as posts_with_author_name,
        COUNT(author_profile_image) as posts_with_author_image,
        COUNT(author_type) as posts_with_author_type
      FROM posts
    `);
    
    console.log('📊 Verificação dos dados:');
    console.log(verifyResult.rows[0]);
    
  } catch (error) {
    console.error('❌ Erro ao adicionar campos do autor:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

addAuthorFields();