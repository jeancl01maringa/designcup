/**
 * Script para sincronizar posts recentes do PostgreSQL para o Supabase
 * Resolve o problema de posts não aparecerem no feed após criação
 */

import { pool } from './server/db';
import { supabase } from './server/supabase-client';

async function syncRecentPosts() {
  try {
    console.log('Sincronizando posts recentes...');
    
    // Buscar posts com títulos problemáticos no Supabase
    const { data: supabasePosts } = await supabase
      .from('posts')
      .select('id, title, image_url')
      .or('title.ilike.%xxx%,title.ilike.%test%,title.ilike.%eee%,title.ilike.%dd3d%')
      .order('id', { ascending: true });
    
    console.log(`Encontrados ${supabasePosts?.length || 0} posts problemáticos no Supabase`);
    
    if (!supabasePosts || supabasePosts.length === 0) {
      console.log('Nenhum post problemático encontrado');
      return;
    }
    
    // Para cada post problemático, buscar dados corretos no PostgreSQL
    for (const post of supabasePosts) {
      console.log(`\nCorrigindo post ${post.id}: "${post.title}"`);
      
      const pgResult = await pool.query('SELECT * FROM posts WHERE id = $1', [post.id]);
      
      if (pgResult.rows.length === 0) {
        console.log(`Post ${post.id} não encontrado no PostgreSQL`);
        continue;
      }
      
      const correctData = pgResult.rows[0];
      console.log(`Dados corretos: "${correctData.title}"`);
      
      // Limpar URL da imagem
      let cleanImageUrl = correctData.image_url;
      if (cleanImageUrl && cleanImageUrl.includes('?download=')) {
        cleanImageUrl = cleanImageUrl.split('?download=')[0];
      }
      
      // Atualizar no Supabase
      const { error } = await supabase
        .from('posts')
        .update({
          title: correctData.title,
          description: correctData.description || '',
          image_url: cleanImageUrl
        })
        .eq('id', post.id);
      
      if (error) {
        console.error(`Erro ao atualizar post ${post.id}:`, error.message);
      } else {
        console.log(`✅ Post ${post.id} atualizado com sucesso`);
      }
    }
    
    console.log('\n🎉 Sincronização concluída!');
    
  } catch (error) {
    console.error('❌ Erro na sincronização:', error);
  }
}

syncRecentPosts();
