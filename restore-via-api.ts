/**
 * Script para restaurar posts via API REST do Supabase (sem WebSocket)
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL?.replace(/"/g, '') || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.replace(/"/g, '') || '';

async function restorePostsViaAPI() {
  try {
    console.log('🔄 Iniciando restauração via API REST...');
    
    // Usar fetch direto para buscar posts do Supabase
    const response = await fetch(`${supabaseUrl}/rest/v1/posts?select=*&order=created_at.desc`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.error('❌ Erro ao buscar posts:', response.statusText);
      return;
    }
    
    const supabasePosts = await response.json();
    console.log(`📊 Encontrados ${supabasePosts.length} posts no Supabase`);
    
    if (supabasePosts.length === 0) {
      console.log('⚠️ Nenhum post encontrado no Supabase');
      return;
    }
    
    // Inserir posts diretamente no PostgreSQL via API local
    let restored = 0;
    for (const post of supabasePosts) {
      try {
        const postData = {
          title: post.title,
          description: post.description,
          imageUrl: post.image_url,
          categoryId: post.category_id || 1,
          status: post.status || 'aprovado',
          isPro: post.is_pro || false,
          licenseType: post.license_type || 'free',
          formato: post.formato,
          groupId: post.group_id,
          tituloBase: post.titulo_base || post.title,
          canvaUrl: post.canva_url,
          formatoData: post.formato_data,
          tags: post.tags || [],
          formats: post.formats || [],
          formatData: post.format_data,
          isVisible: post.is_visible !== false
        };
        
        const createResponse = await fetch('http://localhost:5000/api/admin/posts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': 'connect.sid=your-session-id' // Precisa de sessão válida
          },
          body: JSON.stringify(postData)
        });
        
        if (createResponse.ok) {
          restored++;
          if (restored % 5 === 0) {
            console.log(`📝 Restaurados ${restored}/${supabasePosts.length} posts...`);
          }
        } else {
          console.log(`⚠️ Post já existe ou erro: ${post.title}`);
        }
        
      } catch (error) {
        console.error(`❌ Erro ao restaurar post ${post.title}:`, error);
      }
    }
    
    console.log(`✅ Processo concluído! ${restored} posts novos restaurados`);
    
  } catch (error) {
    console.error('❌ Erro durante restauração:', error);
  }
}

restorePostsViaAPI().catch(console.error);