/**
 * Script para limpar todos os posts do banco de dados
 * Mantém usuários, categorias e outras tabelas intactas
 * Reseta a sequência de IDs para começar do 1 novamente
 */

import { Pool } from '@neondatabase/serverless';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function clearPostsData() {
  try {
    console.log('Iniciando limpeza dos dados de posts...');
    
    // 1. Verificar quantos posts existem atualmente
    const countResult = await pool.query('SELECT COUNT(*) as total FROM posts');
    console.log(`Encontrados ${countResult.rows[0].total} posts para remover`);
    
    // 2. Limpar todos os posts
    await pool.query('DELETE FROM posts');
    console.log('✅ Todos os posts foram removidos');
    
    // 3. Resetar a sequência de ID para começar do 1
    await pool.query('ALTER SEQUENCE posts_id_seq RESTART WITH 1');
    console.log('✅ Sequência de IDs resetada para começar do 1');
    
    // 4. Verificar se a limpeza foi bem-sucedida
    const finalCount = await pool.query('SELECT COUNT(*) as total FROM posts');
    console.log(`Posts restantes: ${finalCount.rows[0].total}`);
    
    // 5. Verificar se outras tabelas estão intactas
    const usersCount = await pool.query('SELECT COUNT(*) as total FROM users');
    const categoriesCount = await pool.query('SELECT COUNT(*) as total FROM categories');
    
    console.log('\n📊 Status das outras tabelas:');
    console.log(`- Usuários: ${usersCount.rows[0].total}`);
    console.log(`- Categorias: ${categoriesCount.rows[0].total}`);
    
    console.log('\n🎉 Banco de dados limpo e pronto para novos uploads!');
    console.log('Agora você pode fazer o upload das imagens novamente.');
    
  } catch (error) {
    console.error('Erro ao limpar dados dos posts:', error);
  } finally {
    await pool.end();
  }
}

clearPostsData();