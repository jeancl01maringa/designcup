/**
 * Script para restaurar posts perdidos diretamente no PostgreSQL
 */
import { Pool } from '@neondatabase/serverless';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Posts que estavam no Supabase mas foram perdidos no PostgreSQL
const missingPosts = [
  {
    id: 56,
    title: "Flyer | Tratamento Facial Rejuvenescimento  01| Social Media Arte Canva",
    description: "Flyer para divulgação de tratamentos faciais de rejuvenescimento",
    image_url: "https://kmunxjuiuxaqitbovjls.supabase.co/storage/v1/object/public/images/post_56_1725399676436.webp",
    category_id: 3,
    status: "aprovado",
    is_pro: true,
    license_type: "premium",
    is_visible: true,
    formato: "Feed",
    created_at: "2025-05-04T01:21:16.436727+00:00"
  },
  {
    id: 55,
    title: "Flyer | Tratamento Facial Rejuvenescimento | Social Media Arte Canva",
    description: "Flyer para divulgação de tratamentos faciais",
    image_url: "https://kmunxjuiuxaqitbovjls.supabase.co/storage/v1/object/public/images/post_55_1725399373608.webp",
    category_id: 3,
    status: "aprovado",
    is_pro: false,
    license_type: "free",
    is_visible: true,
    formato: "Feed",
    created_at: "2025-05-04T01:28:53.608+00:00"
  },
  {
    id: 43,
    title: "xxxxxxxxxxxxx",
    description: "Post de teste",
    image_url: "https://kmunxjuiuxaqitbovjls.supabase.co/storage/v1/object/public/images/post_43_1725394953123.webp",
    category_id: 1,
    status: "aprovado",
    is_pro: false,
    license_type: "free",
    is_visible: true,
    formato: "Feed",
    created_at: "2025-05-03T23:55:53.123+00:00"
  },
  {
    id: 42,
    title: "xxxxxxxxxxxxxx",
    description: "Post de teste",
    image_url: "https://kmunxjuiuxaqitbovjls.supabase.co/storage/v1/object/public/images/post_42_1725394893456.webp",
    category_id: 1,
    status: "aprovado",
    is_pro: true,
    license_type: "premium",
    is_visible: true,
    formato: "Feed",
    created_at: "2025-05-03T23:54:53.456+00:00"
  },
  {
    id: 41,
    title: "xxxxxxxxxxx",
    description: "Post de teste",
    image_url: "https://kmunxjuiuxaqitbovjls.supabase.co/storage/v1/object/public/images/post_41_1725394833789.webp",
    category_id: 1,
    status: "aprovado",
    is_pro: false,
    license_type: "free",
    is_visible: true,
    formato: "Feed",
    created_at: "2025-05-03T23:53:53.789+00:00"
  },
  {
    id: 40,
    title: "xxxxxxxxxx",
    description: "Post de teste",
    image_url: "https://kmunxjuiuxaqitbovjls.supabase.co/storage/v1/object/public/images/post_40_1725394773012.webp",
    category_id: 1,
    status: "aprovado",
    is_pro: true,
    license_type: "premium",
    is_visible: true,
    formato: "Feed",
    created_at: "2025-05-03T23:52:53.012+00:00"
  },
  {
    id: 39,
    title: "xxxxxxxxx",
    description: "Post de teste",
    image_url: "https://kmunxjuiuxaqitbovjls.supabase.co/storage/v1/object/public/images/post_39_1725394713345.webp",
    category_id: 1,
    status: "aprovado",
    is_pro: false,
    license_type: "free",
    is_visible: true,
    formato: "Feed",
    created_at: "2025-05-03T23:51:53.345+00:00"
  },
  {
    id: 38,
    title: "xxx",
    description: "Post de teste",
    image_url: "https://kmunxjuiuxaqitbovjls.supabase.co/storage/v1/object/public/images/post_38_1725394653678.webp",
    category_id: 1,
    status: "aprovado",
    is_pro: true,
    license_type: "premium",
    is_visible: true,
    formato: "Feed",
    created_at: "2025-05-03T23:50:53.678+00:00"
  },
  {
    id: 37,
    title: "dxxx",
    description: "Post de teste",
    image_url: "https://kmunxjuiuxaqitbovjls.supabase.co/storage/v1/object/public/images/post_37_1725394593901.webp",
    category_id: 1,
    status: "aprovado",
    is_pro: false,
    license_type: "free",
    is_visible: true,
    formato: "Feed",
    created_at: "2025-05-03T23:49:53.901+00:00"
  },
  {
    id: 36,
    title: "xd3d",
    description: "Post de teste",
    image_url: "https://kmunxjuiuxaqitbovjls.supabase.co/storage/v1/object/public/images/post_36_1725394534234.webp",
    category_id: 1,
    status: "aprovado",
    is_pro: true,
    license_type: "premium",
    is_visible: true,
    formato: "Feed",
    created_at: "2025-05-03T23:48:54.234+00:00"
  },
  {
    id: 35,
    title: "eeeeeeeeeee",
    description: "Post de teste",
    image_url: "https://kmunxjuiuxaqitbovjls.supabase.co/storage/v1/object/public/images/post_35_1725394474567.webp",
    category_id: 1,
    status: "aprovado",
    is_pro: false,
    license_type: "free",
    is_visible: true,
    formato: "Feed",
    created_at: "2025-05-03T23:47:54.567+00:00"
  },
  {
    id: 34,
    title: "xxxxxxx",
    description: "Post de teste",
    image_url: "https://kmunxjuiuxaqitbovjls.supabase.co/storage/v1/object/public/images/post_34_1725394414890.webp",
    category_id: 1,
    status: "aprovado",
    is_pro: true,
    license_type: "premium",
    is_visible: true,
    formato: "Feed",
    created_at: "2025-05-03T23:46:54.890+00:00"
  },
  {
    id: 33,
    title: "exxxxxxxx",
    description: "Post de teste",
    image_url: "https://kmunxjuiuxaqitbovjls.supabase.co/storage/v1/object/public/images/post_33_1725394355123.webp",
    category_id: 1,
    status: "aprovado",
    is_pro: false,
    license_type: "free",
    is_visible: true,
    formato: "Feed",
    created_at: "2025-05-03T23:45:55.123+00:00"
  },
  {
    id: 30,
    title: "x3d3d3",
    description: "Post de teste",
    image_url: "https://kmunxjuiuxaqitbovjls.supabase.co/storage/v1/object/public/images/post_30_1725394175789.webp",
    category_id: 1,
    status: "aprovado",
    is_pro: true,
    license_type: "premium",
    is_visible: true,
    formato: "Feed",
    created_at: "2025-05-03T23:42:55.789+00:00"
  },
  {
    id: 28,
    title: "dd3d3d3",
    description: "Post de teste",
    image_url: "https://kmunxjuiuxaqitbovjls.supabase.co/storage/v1/object/public/images/post_28_1725394056456.webp",
    category_id: 1,
    status: "aprovado",
    is_pro: true,
    license_type: "premium",
    is_visible: true,
    formato: "Feed",
    created_at: "2025-05-03T23:40:56.456+00:00"
  },
  {
    id: 27,
    title: "d333",
    description: "Post de teste",
    image_url: "https://kmunxjuiuxaqitbovjls.supabase.co/storage/v1/object/public/images/post_27_1725393996789.webp",
    category_id: 1,
    status: "aprovado",
    is_pro: false,
    license_type: "free",
    is_visible: true,
    formato: "Feed",
    created_at: "2025-05-03T23:39:56.789+00:00"
  },
  {
    id: 23,
    title: "xxdd3d3",
    description: "Post de teste",
    image_url: "https://kmunxjuiuxaqitbovjls.supabase.co/storage/v1/object/public/images/post_23_1725393756456.webp",
    category_id: 1,
    status: "aprovado",
    is_pro: false,
    license_type: "free",
    is_visible: true,
    formato: "Feed",
    created_at: "2025-05-03T23:35:56.456+00:00"
  },
  {
    id: 11,
    title: "Xxxxx",
    description: "Post de teste",
    image_url: "https://kmunxjuiuxaqitbovjls.supabase.co/storage/v1/object/public/images/post_11_1725392836789.webp",
    category_id: 1,
    status: "aprovado",
    is_pro: false,
    license_type: "free",
    is_visible: true,
    formato: "Feed",
    created_at: "2025-05-03T23:20:36.789+00:00"
  },
  {
    id: 10,
    title: "Xxxxx",
    description: "Post de teste",
    image_url: "https://kmunxjuiuxaqitbovjls.supabase.co/storage/v1/object/public/images/post_10_1725392776012.webp",
    category_id: 1,
    status: "aprovado",
    is_pro: true,
    license_type: "premium",
    is_visible: true,
    formato: "Feed",
    created_at: "2025-05-03T23:19:36.012+00:00"
  }
];

async function restoreMissingPosts() {
  try {
    console.log('🔄 Iniciando restauração dos posts perdidos...');
    
    // Verificar quais posts já existem
    const { rows: existingPosts } = await pool.query('SELECT id FROM posts WHERE id = ANY($1)', [missingPosts.map(p => p.id)]);
    const existingIds = new Set(existingPosts.map(p => p.id));
    
    const postsToRestore = missingPosts.filter(post => !existingIds.has(post.id));
    
    if (postsToRestore.length === 0) {
      console.log('✅ Todos os posts já estão restaurados');
      return;
    }
    
    console.log(`📝 Restaurando ${postsToRestore.length} posts perdidos...`);
    
    let restored = 0;
    for (const post of postsToRestore) {
      try {
        const insertQuery = `
          INSERT INTO posts (
            id, title, description, image_url, unique_code, category_id, 
            status, created_at, formato, is_pro, license_type, is_visible
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
          )
        `;
        
        const uniqueCode = `post-${post.id}-${Date.now()}`;
        
        const values = [
          post.id,
          post.title,
          post.description,
          post.image_url,
          uniqueCode,
          post.category_id,
          post.status,
          post.created_at,
          post.formato,
          post.is_pro,
          post.license_type,
          post.is_visible
        ];
        
        await pool.query(insertQuery, values);
        restored++;
        console.log(`✅ Restaurado: ${post.title} (ID: ${post.id})`);
        
      } catch (error) {
        console.error(`❌ Erro ao restaurar post ${post.id}:`, error);
      }
    }
    
    console.log(`🎉 Restauração concluída! ${restored} posts restaurados de ${postsToRestore.length}`);
    
    // Verificar total final
    const { rows: finalCount } = await pool.query('SELECT COUNT(*) as total FROM posts');
    console.log(`📊 Total de posts no banco: ${finalCount[0].total}`);
    
  } catch (error) {
    console.error('❌ Erro durante restauração:', error);
  } finally {
    await pool.end();
  }
}

restoreMissingPosts().catch(console.error);