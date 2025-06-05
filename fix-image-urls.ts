/**
 * Script para corrigir URLs das imagens no banco para o formato correto do Supabase Storage
 * Remove parâmetros desnecessários que causam erro 400
 */

import { pool } from './server/db';

async function fixImageUrls() {
  try {
    console.log('Corrigindo URLs das imagens...');
    
    // Buscar posts com URLs problemáticas
    const result = await pool.query(`
      SELECT id, title, image_url, format_data 
      FROM posts 
      WHERE image_url LIKE '%?download=%' OR format_data LIKE '%?download=%'
      ORDER BY id ASC
    `);
    
    console.log(`Encontrados ${result.rows.length} posts com URLs problemáticas`);
    
    for (const post of result.rows) {
      let updateNeeded = false;
      let newImageUrl = post.image_url;
      let newFormatData = post.format_data;
      
      // Corrigir image_url principal
      if (post.image_url && post.image_url.includes('?download=')) {
        newImageUrl = post.image_url.split('?download=')[0];
        updateNeeded = true;
        console.log(`Post ${post.id}: Corrigindo image_url`);
      }
      
      // Corrigir URLs dentro do format_data
      if (post.format_data) {
        try {
          const formatData = JSON.parse(post.format_data);
          let formatDataChanged = false;
          
          if (Array.isArray(formatData)) {
            for (const format of formatData) {
              if (format.imageUrl && format.imageUrl.includes('?download=')) {
                format.imageUrl = format.imageUrl.split('?download=')[0];
                formatDataChanged = true;
              }
            }
          }
          
          if (formatDataChanged) {
            newFormatData = JSON.stringify(formatData);
            updateNeeded = true;
            console.log(`Post ${post.id}: Corrigindo format_data`);
          }
        } catch (error) {
          console.warn(`Erro ao parsear format_data do post ${post.id}:`, error);
        }
      }
      
      // Atualizar se necessário
      if (updateNeeded) {
        await pool.query(`
          UPDATE posts 
          SET image_url = $1, format_data = $2 
          WHERE id = $3
        `, [newImageUrl, newFormatData, post.id]);
        
        console.log(`✅ Post ${post.id} "${post.title}" atualizado`);
      }
    }
    
    console.log('✅ Correção de URLs concluída!');
    
  } catch (error) {
    console.error('❌ Erro ao corrigir URLs:', error);
  }
}

fixImageUrls();
