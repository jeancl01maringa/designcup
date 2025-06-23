/**
 * Script para verificar e corrigir URLs das imagens no banco de dados
 * Remove erros de carregamento de imagens
 */

import { Pool } from '@neondatabase/serverless';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function fixImageUrls() {
  try {
    console.log('🔧 Verificando URLs das imagens...');

    // 1. Buscar posts com URLs problemáticas
    const query = `
      SELECT id, title, image_url 
      FROM posts 
      WHERE image_url IS NOT NULL 
      AND (
        image_url LIKE '%download=%' 
        OR image_url LIKE '%?t=%'
        OR image_url NOT LIKE 'https://kmunxjuiuxaqitbovjls.supabase.co/storage/v1/object/public/images/%'
      )
      LIMIT 10
    `;
    
    const result = await pool.query(query);
    console.log(`📊 Encontrados ${result.rows.length} posts com URLs problemáticas`);

    // 2. Corrigir URLs das imagens
    for (const post of result.rows) {
      let cleanUrl = post.image_url;
      
      // Remover parâmetros que causam problemas
      cleanUrl = cleanUrl.split('?')[0]; // Remove todos os parâmetros
      
      // Garantir que está no formato correto do Supabase
      if (!cleanUrl.includes('supabase.co/storage/v1/object/public/images/')) {
        // Se não está no formato correto, pular
        console.log(`⚠️  URL problemática ignorada: ${post.title}`);
        continue;
      }

      // Atualizar no banco
      const updateQuery = `
        UPDATE posts 
        SET image_url = $1 
        WHERE id = $2
      `;
      
      await pool.query(updateQuery, [cleanUrl, post.id]);
      console.log(`✅ Corrigida URL do post: ${post.title}`);
    }

    // 3. Verificar posts sem imagem
    const noImageQuery = `
      SELECT COUNT(*) as total 
      FROM posts 
      WHERE image_url IS NULL OR image_url = ''
    `;
    
    const noImageResult = await pool.query(noImageQuery);
    console.log(`📊 Posts sem imagem: ${noImageResult.rows[0].total}`);

    // 4. Estatísticas finais
    const statsQuery = `
      SELECT 
        COUNT(*) as total_posts,
        COUNT(CASE WHEN image_url IS NOT NULL AND image_url != '' THEN 1 END) as posts_com_imagem,
        COUNT(CASE WHEN image_url IS NULL OR image_url = '' THEN 1 END) as posts_sem_imagem
      FROM posts
    `;
    
    const stats = await pool.query(statsQuery);
    const data = stats.rows[0];
    
    console.log(`
📊 ESTATÍSTICAS FINAIS:
- Total de posts: ${data.total_posts}
- Posts com imagem: ${data.posts_com_imagem}
- Posts sem imagem: ${data.posts_sem_imagem}
    `);

    console.log('✅ Correção de URLs concluída');

  } catch (error: any) {
    console.error('❌ Erro ao corrigir URLs:', error.message);
  } finally {
    await pool.end();
  }
}

fixImageUrls().catch(console.error);