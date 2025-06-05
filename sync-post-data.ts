/**
 * Script para sincronizar dados específicos do post 38 entre PostgreSQL e Supabase
 */

import { pool } from './server/db';
import { supabase } from './server/supabase-client';

async function syncPostData() {
  try {
    console.log('Sincronizando dados do post 38...');
    
    // Buscar dados corretos do PostgreSQL
    const pgResult = await pool.query('SELECT * FROM posts WHERE id = 38');
    
    if (pgResult.rows.length === 0) {
      console.log('Post 38 não encontrado no PostgreSQL');
      return;
    }
    
    const correctData = pgResult.rows[0];
    console.log('Dados corretos do PostgreSQL:', {
      id: correctData.id,
      title: correctData.title,
      image_url: correctData.image_url
    });
    
    // Atualizar no Supabase
    const { data, error } = await supabase
      .from('posts')
      .update({
        title: correctData.title,
        description: correctData.description,
        image_url: correctData.image_url,
        unique_code: correctData.unique_code,
        category_id: correctData.category_id,
        status: correctData.status,
        created_at: correctData.created_at,
        published_at: correctData.published_at,
        license_type: correctData.license_type,
        tags: correctData.tags,
        formato: correctData.formato,
        formats: correctData.formats,
        format_data: correctData.format_data,
        formato_data: correctData.formato_data,
        canva_url: correctData.canva_url,
        group_id: correctData.group_id,
        is_visible: correctData.is_visible,
        is_pro: correctData.is_pro
      })
      .eq('id', 38);
    
    if (error) {
      console.error('Erro ao atualizar no Supabase:', error);
    } else {
      console.log('✅ Post 38 atualizado com sucesso no Supabase');
    }
    
    // Verificar resultado
    const { data: verifyData } = await supabase
      .from('posts')
      .select('id, title, image_url')
      .eq('id', 38);
    
    console.log('Dados verificados no Supabase:', verifyData);
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

syncPostData();
