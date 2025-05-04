/**
 * Script para criar um post de teste com os campos license_type e isPro definidos
 * Para testar se os campos estão funcionando corretamente
 * 
 * Para executar: npx tsx add-test-post.ts
 */

import { Pool, neonConfig } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
import ws from 'ws';

// Necessário para conexão WebSocket
neonConfig.webSocketConstructor = ws as any;

dotenv.config();

async function createTestPost() {
  console.log("🔍 Criando post de teste para verificar os campos license_type e is_pro");
  
  try {
    // Conexão direta com PostgreSQL
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });
    
    console.log("🔄 Conectado ao banco de dados PostgreSQL");
    
    // Gerar um código único
    const uniqueCode = `TEST${Math.floor(Math.random() * 10000)}`;
    
    // Criar um post premium
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
        'Post de teste premium', 
        'Este é um post de teste com licença premium', 
        'https://kmunxjuiuxaqitbovjls.supabase.co/storage/v1/object/public/images/uploads/test-premium.jpg', 
        $1, 
        2, /* Categoria 'Facial' */
        'aprovado',
        'premium',
        TRUE
      ) RETURNING id, title, license_type, is_pro
    `, [uniqueCode + '-premium']);
    
    console.log("✅ Post premium criado:");
    console.table(premiumPostResult.rows);
    
    // Criar um post free
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
        'Post de teste gratuito', 
        'Este é um post de teste com licença gratuita', 
        'https://kmunxjuiuxaqitbovjls.supabase.co/storage/v1/object/public/images/uploads/test-free.jpg', 
        $1, 
        2, /* Categoria 'Facial' */
        'aprovado',
        'free',
        FALSE
      ) RETURNING id, title, license_type, is_pro
    `, [uniqueCode + '-free']);
    
    console.log("✅ Post gratuito criado:");
    console.table(freePostResult.rows);
    
    // Recuperar os posts para verificar
    const checkResult = await pool.query(`
      SELECT id, title, license_type, is_pro
      FROM posts
      WHERE unique_code IN ($1, $2)
    `, [uniqueCode + '-premium', uniqueCode + '-free']);
    
    console.log("🔄 Verificando posts criados:");
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