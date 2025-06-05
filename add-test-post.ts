/**
 * Script para criar um post de teste com os campos license_type e isPro definidos
 * Para testar se os campos estão funcionando corretamente
 * 
 * Para executar: npx tsx add-test-post.ts
 */

import { Pool, neonConfig } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
import ws from 'ws';
import { supabase } from './server/supabase-client';

// Necessário para conexão WebSocket
neonConfig.webSocketConstructor = ws as any;

dotenv.config();

async function createTestPost() {
  console.log("🔍 Criando post de teste para verificar os campos license_type e is_pro");
  
  try {
    // Gerar um código único
    const uniqueCode = `TEST${Math.floor(Math.random() * 10000)}`;
    
    console.log("🔄 Tentando criar posts via API do Supabase");
    
    // Criar post premium via Supabase
    const { data: premiumData, error: premiumError } = await supabase
      .from('posts')
      .insert([{
        title: 'Post de teste premium (Supabase)', 
        description: 'Este é um post de teste premium criado via Supabase', 
        image_url: 'https://kmunxjuiuxaqitbovjls.supabase.co/storage/v1/object/public/images/uploads/test-premium.jpg', 
        unique_code: uniqueCode + '-premium-api', 
        category_id: 2, 
        status: 'aprovado',
        license_type: 'premium',
        is_pro: true
      }])
      .select('id, title, license_type, is_pro');
    
    if (premiumError) {
      console.error("❌ Erro ao criar post premium via Supabase:", premiumError);
    } else {
      console.log("✅ Post premium criado via Supabase:");
      console.table(premiumData);
    }
    
    // Criar post gratuito via Supabase
    const { data: freeData, error: freeError } = await supabase
      .from('posts')
      .insert([{
        title: 'Post de teste gratuito (Supabase)', 
        description: 'Este é um post de teste gratuito criado via Supabase', 
        image_url: 'https://kmunxjuiuxaqitbovjls.supabase.co/storage/v1/object/public/images/uploads/test-free.jpg', 
        unique_code: uniqueCode + '-free-api', 
        category_id: 2, 
        status: 'aprovado',
        license_type: 'free',
        is_pro: false
      }])
      .select('id, title, license_type, is_pro');
    
    if (freeError) {
      console.error("❌ Erro ao criar post gratuito via Supabase:", freeError);
    } else {
      console.log("✅ Post gratuito criado via Supabase:");
      console.table(freeData);
    }
    
    console.log("\n🔄 Tentando abordagem alternativa com PostgreSQL direto");
    
    // Conexão direta com PostgreSQL
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });
    
    console.log("🔄 Conectado ao banco de dados PostgreSQL");
    
    // Criar um post premium com PostgreSQL
    const premiumPostResult = await pool.query(`
      INSERT INTO posts (
        title, 
        description, 
        image_url, 
        unique_code, 
        category_id,
        status,
        license_type,
        is_pro
      ) VALUES (
        'Post de teste premium (PostgreSQL)', 
        'Este é um post de teste com licença premium criado via PostgreSQL', 
        'https://kmunxjuiuxaqitbovjls.supabase.co/storage/v1/object/public/images/uploads/test-premium.jpg', 
        $1, 
        2, 
        'aprovado',
        'premium',
        TRUE
      ) RETURNING id, title, license_type, is_pro
    `, [uniqueCode + '-premium-pg']);
    
    console.log("✅ Post premium criado via PostgreSQL:");
    console.table(premiumPostResult.rows);
    
    // Criar um post free com PostgreSQL
    const freePostResult = await pool.query(`
      INSERT INTO posts (
        title, 
        description, 
        image_url, 
        unique_code, 
        category_id,
        status,
        license_type,
        is_pro
      ) VALUES (
        'Post de teste gratuito (PostgreSQL)', 
        'Este é um post de teste com licença gratuita criado via PostgreSQL', 
        'https://kmunxjuiuxaqitbovjls.supabase.co/storage/v1/object/public/images/uploads/test-free.jpg', 
        $1, 
        2, 
        'aprovado',
        'free',
        FALSE
      ) RETURNING id, title, license_type, is_pro
    `, [uniqueCode + '-free-pg']);
    
    console.log("✅ Post gratuito criado via PostgreSQL:");
    console.table(freePostResult.rows);
    
    // Recuperar todos os posts de teste
    const checkResult = await pool.query(`
      SELECT id, title, license_type, is_pro
      FROM posts
      WHERE unique_code LIKE $1
      ORDER BY id DESC
    `, [uniqueCode + '%']);
    
    console.log("\n🔄 Verificando todos os posts de teste criados:");
    console.table(checkResult.rows);
    
    // Fechar a conexão
    await pool.end();
    
  } catch (error) {
    console.error("❌ Erro ao criar post de teste:", error);
  }
}

createTestPost()
  .then(() => console.log("✅ Processo concluído!"))
  .catch(err => console.error("❌ Erro na execução:", err));