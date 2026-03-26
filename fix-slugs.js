import "dotenv/config";
import pkg from 'pg';

const { Pool } = pkg;
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

function createSlug(text) {
    if (!text) return `category-${Date.now()}`;
    return text.toString().toLowerCase()
        .replace(/[àáâãäå]/g, 'a')
        .replace(/[èéêë]/g, 'e')
        .replace(/[ìíîï]/g, 'i')
        .replace(/[òóôõö]/g, 'o')
        .replace(/[ùúûü]/g, 'u')
        .replace(/[ç]/g, 'c')
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
}

async function migrate() {
    console.log('Buscando categorias com slug NULL...');
    const res = await pool.query('SELECT id, name FROM categories WHERE slug IS NULL OR slug = \'\'');

    if (res.rows.length === 0) {
        console.log('Nenhuma categoria com slug vazio.');
    } else {
        for (const cat of res.rows) {
            const slug = createSlug(cat.name);
            console.log(`Atualizando categoria ${cat.id} (${cat.name}) para slug = ${slug}`);
            await pool.query('UPDATE categories SET slug = $1 WHERE id = $2', [slug, cat.id]);
        }
    }

    console.log('Republishing featured categories config...');
    const featured = await pool.query(
        'SELECT id, name, slug, description FROM categories WHERE home_visible = true AND is_active = true ORDER BY home_order ASC, name ASC'
    );

    const configData = [];

    for (const category of featured.rows) {
        const postsResult = await pool.query(`
      WITH grouped_posts AS (
        SELECT id, title, image_url, is_pro, created_at,
          ROW_NUMBER() OVER (PARTITION BY COALESCE(group_id, 'single_' || id::text) ORDER BY created_at DESC) as rn
        FROM posts
        WHERE category_id = $1 
        AND status = 'aprovado' 
        AND formato = 'Cartaz'
        AND (is_visible IS NULL OR is_visible = true)
      )
      SELECT id, title, image_url as "imageUrl", is_pro as "isPro"
      FROM grouped_posts
      WHERE rn = 1
      ORDER BY created_at DESC
      LIMIT 4
    `, [category.id]);

        configData.push({
            id: category.id,
            name: category.name,
            slug: category.slug || createSlug(category.name),
            description: category.description,
            posts: postsResult.rows
        });
    }

    const finalConfig = configData.filter(c => c.posts.length > 0);

    if (finalConfig.length > 0) {
        await pool.query(
            'INSERT INTO site_config (key, value, updated_at) VALUES ($1, $2, now()) ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = now()',
            ['featured-categories', JSON.stringify(finalConfig)]
        );
        console.log('Configuração site_config salva com sucesso!');
    }

    console.log('Migração concluída!');
    process.exit(0);
}

migrate().catch(console.error);
