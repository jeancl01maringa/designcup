/**
 * Script para atualizar URLs das imagens no banco para o caminho correto do Supabase Storage
 * Corrige os caminhos para apontar para images/uploads/ onde as imagens estão realmente armazenadas
 */

import { Pool } from '@neondatabase/serverless';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function updateImageUrls() {
  try {
    console.log('Atualizando URLs das imagens para o caminho correto...');
    
    // Buscar todos os posts com URLs do Supabase que não incluem 'uploads/'
    const result = await pool.query(`
      SELECT id, title, image_url 
      FROM posts 
      WHERE image_url LIKE '%supabase.co%' 
      AND image_url NOT LIKE '%uploads/%'
    `);
    
    console.log(`Encontrados ${result.rows.length} posts com URLs para corrigir`);
    
    let updatedCount = 0;
    
    for (const post of result.rows) {
      // Extrair o nome do arquivo da URL atual
      const filename = post.image_url.split('/').pop()?.split('?')[0];
      
      if (filename) {
        // Construir a URL correta apontando para images/uploads/
        const baseUrl = post.image_url.split('/storage/v1/object/public/images/')[0];
        const correctUrl = `${baseUrl}/storage/v1/object/public/images/uploads/${filename}`;
        
        console.log(`Post #${post.id}: ${post.title}`);
        console.log(`  De: ${post.image_url}`);
        console.log(`  Para: ${correctUrl}`);
        
        // Atualizar no banco
        await pool.query(`
          UPDATE posts 
          SET image_url = $1 
          WHERE id = $2
        `, [correctUrl, post.id]);
        
        updatedCount++;
      }
    }
    
    console.log(`\n✅ ${updatedCount} URLs de imagens foram atualizadas com sucesso!`);
    
    // Verificar alguns resultados
    const checkResult = await pool.query(`
      SELECT id, title, image_url 
      FROM posts 
      WHERE image_url LIKE '%uploads/%'
      ORDER BY id 
      LIMIT 5
    `);
    
    console.log('\nPrimeiros 5 posts com URLs corrigidas:');
    checkResult.rows.forEach(post => {
      console.log(`#${post.id}: ${post.title} -> ${post.image_url}`);
    });
    
  } catch (error) {
    console.error('Erro ao atualizar URLs das imagens:', error);
  } finally {
    await pool.end();
  }
}

updateImageUrls();