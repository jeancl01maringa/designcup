/**
 * Script para testar a funcionalidade de edição em lote
 * Verifica se os posts com múltiplos formatos estão sendo carregados corretamente
 */

import { Pool } from '@neondatabase/serverless';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function testBatchEdit() {
  try {
    console.log('🔍 Testando funcionalidade de edição em lote...\n');

    // 1. Buscar posts que têm group_id (posts agrupados)
    const groupedPostsQuery = `
      SELECT id, title, group_id, format_data, formats 
      FROM posts 
      WHERE group_id IS NOT NULL 
      ORDER BY group_id, created_at 
      LIMIT 10
    `;
    
    const { rows: groupedPosts } = await pool.query(groupedPostsQuery);
    
    if (groupedPosts.length === 0) {
      console.log('❌ Nenhum post agrupado encontrado no banco');
      return;
    }

    console.log(`✅ Encontrados ${groupedPosts.length} posts agrupados:\n`);
    
    // Agrupar por group_id
    const groups = groupedPosts.reduce((acc, post) => {
      const groupId = post.group_id;
      if (!acc[groupId]) {
        acc[groupId] = [];
      }
      acc[groupId].push(post);
      return acc;
    }, {} as Record<string, any[]>);

    // 2. Exibir informações dos grupos
    Object.entries(groups).forEach(([groupId, posts]) => {
      console.log(`📁 Grupo: ${groupId}`);
      console.log(`   Contém ${posts.length} posts:`);
      
      posts.forEach((post, index) => {
        console.log(`   ${index + 1}. Post #${post.id}: "${post.title}"`);
        console.log(`      Formatos: ${post.formats || 'N/A'}`);
        
        // Tentar parsear format_data se existir
        if (post.format_data) {
          try {
            const formatData = JSON.parse(post.format_data);
            console.log(`      Format Data: ${formatData.length} formatos`);
            formatData.forEach((format: any) => {
              console.log(`        - ${format.type}: ${format.imageUrl ? '✅ com imagem' : '❌ sem imagem'}`);
            });
          } catch (e) {
            console.log(`      Format Data: Erro ao parsear JSON`);
          }
        }
      });
      console.log('');
    });

    // 3. Testar busca por group_id específico (simular o que a API faz)
    const testGroupId = Object.keys(groups)[0];
    if (testGroupId) {
      console.log(`🧪 Testando busca para grupo: ${testGroupId}`);
      
      const groupQuery = `
        SELECT * FROM posts 
        WHERE group_id = $1 
        ORDER BY created_at
      `;
      
      const { rows: groupPosts } = await pool.query(groupQuery, [testGroupId]);
      
      console.log(`✅ API retornaria ${groupPosts.length} posts para edição em lote`);
      
      groupPosts.forEach((post, index) => {
        console.log(`   ${index + 1}. #${post.id} - ${post.title} (${post.formato || 'N/A'})`);
      });
    }

    console.log('\n✅ Teste de edição em lote concluído!');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  } finally {
    await pool.end();
  }
}

testBatchEdit();