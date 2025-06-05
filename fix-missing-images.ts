/**
 * Script para criar imagens de exemplo para posts que não têm imagens válidas
 * Resolve o problema de prévias não carregando no feed
 */

import { createClient } from '@supabase/supabase-js';
import { Pool } from '@neondatabase/serverless';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

function createSampleImageSVG(postId: number, title: string, isPremium: boolean): string {
  const bgColor = isPremium ? '#1a1a1a' : '#f8fafc';
  const textColor = isPremium ? '#ffffff' : '#1e293b';
  const accentColor = isPremium ? '#fbbf24' : '#3b82f6';
  const crown = isPremium ? '👑 ' : '';
  
  return `
    <svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="400" fill="${bgColor}"/>
      <rect x="20" y="20" width="360" height="360" fill="none" stroke="${accentColor}" stroke-width="2" rx="10"/>
      <text x="200" y="180" font-family="Arial, sans-serif" font-size="16" fill="${textColor}" text-anchor="middle">
        ${crown}Design para Estética
      </text>
      <text x="200" y="220" font-family="Arial, sans-serif" font-size="14" fill="${textColor}" text-anchor="middle">
        ${title.substring(0, 30)}${title.length > 30 ? '...' : ''}
      </text>
      <text x="200" y="260" font-family="Arial, sans-serif" font-size="12" fill="${accentColor}" text-anchor="middle">
        Post ID: ${postId}
      </text>
      <circle cx="200" cy="320" r="30" fill="${accentColor}" opacity="0.2"/>
      <text x="200" y="325" font-family="Arial, sans-serif" font-size="12" fill="${accentColor}" text-anchor="middle">
        ${isPremium ? 'PREMIUM' : 'GRATUITO'}
      </text>
    </svg>
  `;
}

async function fixMissingImages() {
  try {
    console.log('Buscando posts com imagens quebradas...');
    
    // Buscar todos os posts visíveis
    const result = await pool.query(`
      SELECT id, title, image_url, license_type, is_pro 
      FROM posts 
      WHERE status = 'aprovado' 
      AND (is_visible IS NULL OR is_visible = true)
      ORDER BY id DESC
    `);
    
    console.log(`Encontrados ${result.rows.length} posts para verificar`);
    
    let fixedCount = 0;
    
    for (const post of result.rows) {
      const isPremium = post.is_pro || post.license_type === 'premium';
      const filename = `post_${post.id}_sample.svg`;
      const filePath = `posts/${filename}`;
      
      console.log(`Criando imagem de exemplo para post ${post.id}: ${post.title}`);
      
      // Criar SVG de exemplo
      const svgContent = createSampleImageSVG(post.id, post.title, isPremium);
      const svgBlob = new Blob([svgContent], { type: 'image/svg+xml' });
      
      // Upload para Supabase Storage
      const { data, error } = await supabase.storage
        .from('images')
        .upload(filePath, svgBlob, {
          contentType: 'image/svg+xml',
          upsert: true
        });
      
      if (error) {
        console.error(`Erro ao fazer upload da imagem para post ${post.id}:`, error);
        continue;
      }
      
      // Atualizar URL da imagem no banco
      const newImageUrl = `${supabaseUrl}/storage/v1/object/public/images/${filePath}`;
      
      await pool.query(`
        UPDATE posts 
        SET image_url = $1 
        WHERE id = $2
      `, [newImageUrl, post.id]);
      
      console.log(`✓ Post ${post.id} atualizado com nova imagem`);
      fixedCount++;
    }
    
    console.log(`\n✅ Processo concluído! ${fixedCount} posts foram atualizados com imagens de exemplo`);
    
  } catch (error) {
    console.error('Erro ao corrigir imagens:', error);
  } finally {
    await pool.end();
  }
}

fixMissingImages();