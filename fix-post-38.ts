/**
 * Script para corrigir o post 38 no Supabase com apenas os campos básicos
 */

import { pool } from './server/db';
import { supabase } from './server/supabase-client';

async function fixPost38() {
  try {
    console.log('Corrigindo post 38 no Supabase...');
    
    // Buscar dados corretos do PostgreSQL
    const pgResult = await pool.query('SELECT * FROM posts WHERE id = 38');
    const correctData = pgResult.rows[0];
    
    // Atualizar apenas campos básicos no Supabase
    const { data, error } = await supabase
      .from('posts')
      .update({
        title: correctData.title,
        description: correctData.description || '',
        image_url: correctData.image_url
      })
      .eq('id', 38);
    
    if (error) {
      console.error('Erro:', error);
    } else {
      console.log('✅ Post 38 corrigido com sucesso');
    }
    
    // Verificar resultado
    const { data: result } = await supabase
      .from('posts')
      .select('id, title, image_url')
      .eq('id', 38);
    
    console.log('Resultado:', result);
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

fixPost38();
