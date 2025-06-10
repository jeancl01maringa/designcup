/**
 * Script para testar o fluxo completo de múltiplos formatos
 * 1. Criar uma arte com 3 formatos (Feed, Stories, Cartaz)
 * 2. Verificar se cada formato mantém dados únicos
 * 3. Testar edição em grupo
 * 4. Validar navegação na página individual
 */

import { Pool } from '@neondatabase/serverless';
import crypto from 'crypto';

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });

async function createMultiFormatPost() {
  console.log('🔄 Criando arte com múltiplos formatos...');
  
  const groupId = crypto.randomUUID();
  const tituloBase = "Teste Multi-Formato";
  
  const formatos = [
    {
      tipo: "Feed",
      imageUrl: "https://example.com/feed-image.jpg",
      canvaUrl: "https://www.canva.com/design/feed-link",
      dimensoes: "1080x1080"
    },
    {
      tipo: "Stories", 
      imageUrl: "https://example.com/stories-image.jpg",
      canvaUrl: "https://www.canva.com/design/stories-link",
      dimensoes: "1080x1920"
    },
    {
      tipo: "Cartaz",
      imageUrl: "https://example.com/cartaz-image.jpg", 
      canvaUrl: "https://www.canva.com/design/cartaz-link",
      dimensoes: "2480x3508"
    }
  ];
  
  const createdPosts = [];
  
  for (const formato of formatos) {
    const uniqueCode = `test-${formato.tipo}-${Date.now()}`;
    const title = `${tituloBase} - ${formato.tipo}`;
    
    // Dados únicos para cada formato
    const postData = {
      title,
      titulo_base: tituloBase,
      description: `Teste para formato ${formato.tipo}`,
      image_url: formato.imageUrl,
      unique_code: uniqueCode,
      category_id: 4, // Botox
      user_id: 3, // Jean Carlos
      status: 'aprovado',
      formato: formato.tipo,
      format_data: JSON.stringify({
        formato: formato.tipo,
        imageUrl: formato.imageUrl,
        canvaUrl: formato.canvaUrl,
        dimensoes: formato.dimensoes
      }),
      canva_url: formato.canvaUrl,
      group_id: groupId,
      license_type: 'free',
      is_pro: false,
      is_visible: true
    };
    
    try {
      // Inserir via PostgreSQL direto
      const result = await pool.query(`
        INSERT INTO posts (
          title, titulo_base, description, image_url, unique_code, 
          category_id, user_id, status, formato, format_data, 
          canva_url, group_id, license_type, is_pro, is_visible
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
        ) RETURNING *
      `, [
        postData.title, postData.titulo_base, postData.description, 
        postData.image_url, postData.unique_code, postData.category_id,
        postData.user_id, postData.status, postData.formato, 
        postData.format_data, postData.canva_url, postData.group_id,
        postData.license_type, postData.is_pro, postData.is_visible
      ]);
      
      createdPosts.push(result.rows[0]);
      console.log(`✅ Criado formato ${formato.tipo} - ID: ${result.rows[0].id}`);
      
    } catch (error) {
      console.error(`❌ Erro ao criar formato ${formato.tipo}:`, error);
    }
  }
  
  return { groupId, createdPosts };
}

async function testGroupRetrieval(groupId: string) {
  console.log('\n🔍 Testando busca por grupo...');
  
  try {
    const result = await pool.query(
      'SELECT * FROM posts WHERE group_id = $1 ORDER BY formato',
      [groupId]
    );
    
    console.log(`📦 Encontrados ${result.rows.length} posts no grupo ${groupId}`);
    
    result.rows.forEach(post => {
      console.log(`- ${post.formato}: ${post.image_url} | ${post.canva_url}`);
    });
    
    return result.rows;
  } catch (error) {
    console.error('❌ Erro ao buscar grupo:', error);
    return [];
  }
}

async function testUniqueData(posts: any[]) {
  console.log('\n🧪 Verificando dados únicos por formato...');
  
  const imageUrls = new Set();
  const canvaUrls = new Set();
  
  let uniqueImages = true;
  let uniqueCanvaLinks = true;
  
  posts.forEach(post => {
    if (imageUrls.has(post.image_url)) {
      console.log(`❌ Imagem duplicada encontrada: ${post.image_url}`);
      uniqueImages = false;
    } else {
      imageUrls.add(post.image_url);
    }
    
    if (canvaUrls.has(post.canva_url)) {
      console.log(`❌ Link Canva duplicado encontrado: ${post.canva_url}`);
      uniqueCanvaLinks = false;
    } else {
      canvaUrls.add(post.canva_url);
    }
  });
  
  if (uniqueImages && uniqueCanvaLinks) {
    console.log('✅ Todos os formatos têm dados únicos!');
  } else {
    console.log('❌ Dados duplicados encontrados entre formatos');
  }
}

async function cleanupTestData(groupId: string) {
  console.log('\n🧹 Limpando dados de teste...');
  
  try {
    const result = await pool.query(
      'DELETE FROM posts WHERE group_id = $1 RETURNING id',
      [groupId]
    );
    
    console.log(`🗑️ Removidos ${result.rows.length} posts de teste`);
  } catch (error) {
    console.error('❌ Erro ao limpar dados:', error);
  }
}

async function main() {
  try {
    // 1. Criar arte com múltiplos formatos
    const { groupId, createdPosts } = await createMultiFormatPost();
    
    if (createdPosts.length === 0) {
      console.log('❌ Nenhum post foi criado. Abortando teste.');
      return;
    }
    
    // 2. Testar busca por grupo
    const groupPosts = await testGroupRetrieval(groupId);
    
    // 3. Verificar dados únicos
    await testUniqueData(groupPosts);
    
    // 4. Exibir informações para teste manual
    console.log('\n📋 Informações para teste manual:');
    console.log(`Group ID: ${groupId}`);
    console.log('Posts criados:');
    groupPosts.forEach(post => {
      console.log(`- ${post.formato} (ID: ${post.id}): /artes/${post.id}-${post.title.toLowerCase().replace(/\s+/g, '-')}`);
    });
    
    console.log('\n🔗 URLs para testar navegação:');
    groupPosts.forEach(post => {
      const slug = `${post.id}-${post.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`;
      console.log(`- ${post.formato}: http://localhost:5000/artes/${slug}`);
    });
    
    // Aguardar input do usuário antes de limpar
    console.log('\n⏳ Pressione Ctrl+C para manter os dados ou aguarde 30s para limpeza automática...');
    
    setTimeout(async () => {
      await cleanupTestData(groupId);
      console.log('✅ Teste concluído!');
      process.exit(0);
    }, 30000);
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
    process.exit(1);
  }
}

main();