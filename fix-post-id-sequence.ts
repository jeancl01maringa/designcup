/**
 * Script para corrigir a sequência de IDs dos posts
 * Reordena os IDs para sequência 1,2,3,4,5... conforme a ordem de criação
 */

import { Pool } from '@neondatabase/serverless';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function fixPostIdSequence() {
  try {
    console.log('Iniciando correção da sequência de IDs dos posts...');
    
    // 1. Buscar todos os posts ordenados por data de criação
    const result = await pool.query(`
      SELECT id, title, created_at 
      FROM posts 
      ORDER BY created_at ASC
    `);
    
    console.log(`Encontrados ${result.rows.length} posts para reordenar`);
    
    // 2. Criar uma tabela temporária com novos IDs sequenciais
    await pool.query(`
      CREATE TEMPORARY TABLE posts_temp AS 
      SELECT 
        ROW_NUMBER() OVER (ORDER BY created_at ASC) as new_id,
        *
      FROM posts
    `);
    
    // 3. Desabilitar temporariamente as constraints de chave estrangeira
    await pool.query('SET session_replication_role = replica;');
    
    // 4. Limpar a tabela original
    await pool.query('TRUNCATE TABLE posts RESTART IDENTITY CASCADE;');
    
    // 5. Inserir os dados com novos IDs sequenciais
    await pool.query(`
      INSERT INTO posts (
        id, title, description, image_url, unique_code, category_id, 
        status, created_at, published_at, formato, group_id, titulo_base,
        is_pro, license_type, canva_url, formato_data, tags, formats,
        format_data, is_visible
      )
      SELECT 
        new_id, title, description, image_url, unique_code, category_id,
        status, created_at, published_at, formato, group_id, titulo_base,
        is_pro, license_type, canva_url, formato_data, tags, formats,
        format_data, is_visible
      FROM posts_temp
      ORDER BY new_id
    `);
    
    // 6. Reabilitar as constraints
    await pool.query('SET session_replication_role = DEFAULT;');
    
    // 7. Resetar a sequência do ID para continuar do próximo número
    const maxIdResult = await pool.query('SELECT MAX(id) as max_id FROM posts');
    const nextId = (maxIdResult.rows[0].max_id || 0) + 1;
    
    await pool.query(`SELECT setval('posts_id_seq', ${nextId}, false);`);
    
    // 8. Verificar os resultados
    const finalResult = await pool.query(`
      SELECT id, title, created_at 
      FROM posts 
      ORDER BY id ASC
      LIMIT 10
    `);
    
    console.log('\n✅ Sequência de IDs corrigida com sucesso!');
    console.log('Primeiros 10 posts com novos IDs:');
    finalResult.rows.forEach(post => {
      console.log(`#${post.id}: ${post.title}`);
    });
    
    console.log(`\nPróximo ID será: ${nextId}`);
    
  } catch (error) {
    console.error('Erro ao corrigir sequência de IDs:', error);
  } finally {
    await pool.end();
  }
}

fixPostIdSequence();