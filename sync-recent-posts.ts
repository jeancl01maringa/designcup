/**
 * Script para sincronizar posts recentes do PostgreSQL para o Supabase
 * Resolve o problema de posts não aparecerem no feed após criação
 */

import { Pool } from '@neondatabase/serverless';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL?.replace(/"/g, '') || 'https://kmunxjuiuxaqitbovjls.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.replace(/"/g, '') || process.env.VITE_SUPABASE_KEY?.replace(/"/g, '');
const supabase = createClient(supabaseUrl, supabaseKey);

// Conexão PostgreSQL
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function syncRecentPosts() {
  try {
    console.log('🔄 Iniciando sincronização de posts recentes...');

    // Buscar posts recentes do PostgreSQL (últimos 10)
    const pgQuery = `
      SELECT * FROM posts 
      WHERE created_at >= NOW() - INTERVAL '1 hour'
      ORDER BY created_at DESC
      LIMIT 10
    `;
    
    const pgResult = await pool.query(pgQuery);
    const pgPosts = pgResult.rows;
    
    console.log(`📊 Encontrados ${pgPosts.length} posts recentes no PostgreSQL`);

    if (pgPosts.length === 0) {
      console.log('✅ Nenhum post recente para sincronizar');
      return;
    }

    // Para cada post do PostgreSQL, verificar se existe no Supabase
    for (const pgPost of pgPosts) {
      console.log(`🔍 Verificando post ID ${pgPost.id}: "${pgPost.title}"`);
      
      // Verificar se já existe no Supabase
      const { data: existingPost } = await supabase
        .from('posts')
        .select('id')
        .eq('id', pgPost.id)
        .single();

      if (existingPost) {
        console.log(`✅ Post ${pgPost.id} já existe no Supabase`);
        continue;
      }

      // Preparar dados para inserção no Supabase
      const supabaseData = {
        id: pgPost.id,
        title: pgPost.title,
        description: pgPost.description,
        image_url: pgPost.image_url,
        unique_code: pgPost.unique_code,
        category_id: pgPost.category_id,
        status: pgPost.status,
        created_at: pgPost.created_at,
        license_type: pgPost.license_type || 'free',
        is_pro: pgPost.is_pro || false,
        is_visible: pgPost.is_visible !== false,
        tags: pgPost.tags || [],
        formats: pgPost.formats || []
      };

      // Inserir no Supabase
      const { error } = await supabase
        .from('posts')
        .insert(supabaseData);

      if (error) {
        console.error(`❌ Erro ao inserir post ${pgPost.id} no Supabase:`, error.message);
      } else {
        console.log(`✅ Post ${pgPost.id} sincronizado com sucesso no Supabase`);
      }
    }

    console.log('🎉 Sincronização concluída!');
    
  } catch (error) {
    console.error('❌ Erro durante sincronização:', error);
  } finally {
    await pool.end();
  }
}

// Executar sincronização
syncRecentPosts();