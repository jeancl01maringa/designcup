/**
 * Script para restaurar posts do Supabase para o PostgreSQL
 */
import { createClient } from '@supabase/supabase-js';
import { Pool } from '@neondatabase/serverless';

const supabaseUrl = process.env.VITE_SUPABASE_URL?.replace(/"/g, '') || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.replace(/"/g, '') || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function restorePosts() {
  try {
    console.log('🔄 Iniciando restauração de posts do Supabase...');
    
    // Buscar todos os posts do Supabase
    const { data: supabasePosts, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Erro ao buscar posts do Supabase:', error);
      return;
    }
    
    if (!supabasePosts || supabasePosts.length === 0) {
      console.log('⚠️ Nenhum post encontrado no Supabase');
      return;
    }
    
    console.log(`📊 Encontrados ${supabasePosts.length} posts no Supabase`);
    
    // Verificar quais posts já existem no PostgreSQL
    const { rows: existingPosts } = await pool.query('SELECT id FROM posts');
    const existingIds = new Set(existingPosts.map(p => p.id));
    
    console.log(`📊 ${existingIds.size} posts já existem no PostgreSQL`);
    
    // Filtrar posts que não existem no PostgreSQL
    const postsToRestore = supabasePosts.filter(post => !existingIds.has(post.id));
    
    if (postsToRestore.length === 0) {
      console.log('✅ Todos os posts já estão sincronizados');
      return;
    }
    
    console.log(`🔄 Restaurando ${postsToRestore.length} posts...`);
    
    let restored = 0;
    for (const post of postsToRestore) {
      try {
        const insertQuery = `
          INSERT INTO posts (
            id, title, description, image_url, unique_code, category_id, 
            status, created_at, published_at, formato, group_id, titulo_base,
            is_pro, license_type, canva_url, formato_data, tags, formats,
            format_data, is_visible
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
          )
        `;
        
        const values = [
          post.id,
          post.title,
          post.description,
          post.image_url,
          post.unique_code,
          post.category_id,
          post.status || 'aprovado',
          post.created_at,
          post.published_at,
          post.formato,
          post.group_id,
          post.titulo_base || post.title,
          post.is_pro || false,
          post.license_type || 'free',
          post.canva_url,
          post.formato_data,
          post.tags || [],
          post.formats || [],
          post.format_data,
          post.is_visible !== false
        ];
        
        await pool.query(insertQuery, values);
        restored++;
        
        if (restored % 10 === 0) {
          console.log(`📝 Restaurados ${restored}/${postsToRestore.length} posts...`);
        }
      } catch (error) {
        console.error(`❌ Erro ao restaurar post ${post.id}:`, error);
      }
    }
    
    console.log(`✅ Restauração concluída! ${restored} posts restaurados`);
    
  } catch (error) {
    console.error('❌ Erro durante restauração:', error);
  } finally {
    await pool.end();
  }
}

restorePosts().catch(console.error);