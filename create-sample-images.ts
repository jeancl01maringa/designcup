/**
 * Script para criar imagens de exemplo temporárias no Supabase Storage
 * Para resolver o problema de imagens ausentes enquanto aguardamos upload das imagens reais
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY devem estar configurados');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Função para criar uma imagem SVG simples
function createSampleImageSVG(postId: number, title: string, isPremium: boolean): string {
  const bgColor = isPremium ? '#1a1a1a' : '#f8f9fa';
  const textColor = isPremium ? '#ffc107' : '#333333';
  const borderColor = isPremium ? '#ffc107' : '#dee2e6';
  const crownIcon = isPremium ? `<circle cx="200" cy="80" r="15" fill="#ffc107"/><text x="200" y="85" text-anchor="middle" font-size="12" fill="#000">👑</text>` : '';
  
  return `
<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
  <rect width="400" height="300" fill="${bgColor}" stroke="${borderColor}" stroke-width="2"/>
  ${crownIcon}
  <text x="200" y="150" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="${textColor}" font-weight="bold">
    Post #${postId}
  </text>
  <text x="200" y="180" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="${textColor}">
    ${title.length > 30 ? title.substring(0, 30) + '...' : title}
  </text>
  <text x="200" y="210" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="${textColor}">
    ${isPremium ? 'PREMIUM' : 'FREE'}
  </text>
  <text x="200" y="270" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="${textColor}" opacity="0.7">
    Design para Estética
  </text>
</svg>`;
}

async function uploadSampleImages() {
  console.log('Criando imagens de exemplo para os posts...');
  
  try {
    // Buscar posts que precisam de imagens
    const response = await fetch(`${process.env.DATABASE_URL?.includes('localhost') ? 'http://localhost:5000' : ''}/api/posts`);
    if (!response.ok) {
      console.error('Erro ao buscar posts:', response.statusText);
      return;
    }
    
    const posts = await response.json();
    console.log(`Encontrados ${posts.length} posts para processar`);
    
    for (const post of posts.slice(0, 10)) { // Processar apenas os primeiros 10 posts como exemplo
      try {
        const filename = `post_${post.id}_${Date.now()}.svg`;
        const svgContent = createSampleImageSVG(post.id, post.title, post.isPro || false);
        
        // Converter SVG para Buffer
        const svgBuffer = Buffer.from(svgContent, 'utf-8');
        
        // Upload para Supabase
        const { data, error } = await supabase.storage
          .from('images')
          .upload(filename, svgBuffer, {
            contentType: 'image/svg+xml',
            cacheControl: '3600',
            upsert: true,
          });
        
        if (error) {
          console.error(`Erro ao fazer upload da imagem para post ${post.id}:`, error);
          continue;
        }
        
        // Gerar URL pública
        const { data: urlData } = supabase.storage
          .from('images')
          .getPublicUrl(filename);
        
        console.log(`✅ Imagem criada para post ${post.id}: ${urlData.publicUrl}`);
        
        // Aqui você poderia atualizar o banco de dados com a nova URL se necessário
        // await updatePostImageUrl(post.id, urlData.publicUrl);
        
      } catch (postError) {
        console.error(`Erro ao processar post ${post.id}:`, postError);
      }
    }
    
  } catch (error) {
    console.error('Erro geral:', error);
  }
}

// Executar apenas se for executado diretamente
if (require.main === module) {
  uploadSampleImages().then(() => {
    console.log('Processo concluído');
  }).catch(console.error);
}

export { uploadSampleImages, createSampleImageSVG };