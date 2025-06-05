/**
 * Script para corrigir as contagens de posts nas categorias
 * Remove contagens incorretas e atualiza apenas para a categoria do post existente
 * 
 * Para executar:
 * npx tsx fix-category-counts.ts
 */

import { Pool } from '@neondatabase/serverless';
import ws from "ws";

// Configurar WebSocket para Neon
if (typeof WebSocket === 'undefined') {
  (global as any).WebSocket = ws;
}

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL 
});

async function fixCategoryCounts() {
  try {
    console.log('🔄 Iniciando correção das contagens de categorias...');

    // 1. Primeiro, vamos ver qual categoria o post atual pertence
    const currentPostResult = await pool.query(`
      SELECT category_id, title FROM posts WHERE id = 1
    `);

    if (currentPostResult.rows.length === 0) {
      console.log('❌ Nenhum post encontrado com ID 1');
      return;
    }

    const currentPost = currentPostResult.rows[0];
    console.log(`📝 Post atual: "${currentPost.title}" - Categoria ID: ${currentPost.category_id}`);

    // 2. Resetar todas as contagens de posts para 0
    await pool.query(`
      UPDATE categories SET posts_count = 0
    `);
    console.log('✅ Resetadas todas as contagens de categorias para 0');

    // 3. Atualizar apenas a categoria do post existente
    if (currentPost.category_id) {
      await pool.query(`
        UPDATE categories 
        SET posts_count = 1 
        WHERE id = $1
      `, [currentPost.category_id]);
      
      // Verificar o nome da categoria
      const categoryResult = await pool.query(`
        SELECT name FROM categories WHERE id = $1
      `, [currentPost.category_id]);
      
      const categoryName = categoryResult.rows[0]?.name || 'Desconhecida';
      console.log(`✅ Atualizada contagem da categoria "${categoryName}" para 1 post`);
    }

    // 4. Verificar o resultado final
    const finalResult = await pool.query(`
      SELECT id, name, posts_count 
      FROM categories 
      ORDER BY name
    `);

    console.log('\n📊 Contagens finais das categorias:');
    finalResult.rows.forEach(category => {
      console.log(`  - ${category.name}: ${category.posts_count} posts`);
    });

    console.log('\n✅ Correção das contagens concluída com sucesso!');

  } catch (error) {
    console.error('❌ Erro ao corrigir contagens das categorias:', error);
  } finally {
    await pool.end();
  }
}

fixCategoryCounts();