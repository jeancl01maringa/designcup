/**
 * Script para verificar como os posts estão sendo criados e verificar os campos licenseType e isPro
 * 
 * Para executar:
 * npx tsx check-license-type-posts.ts
 */
import { supabase } from './server/supabase-client';
import { Pool, neonConfig } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
import ws from 'ws';

// Necessário para conexão WebSocket no Replit
neonConfig.webSocketConstructor = ws as any;

dotenv.config();

async function checkPostsLicenseType() {
  console.log("🔍 Verificando campos licenseType e isPro nos posts...");
  
  try {
    // Conexão direta com PostgreSQL
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });
    
    // Verificar a estrutura das colunas
    const columnsResult = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'posts' 
      AND column_name IN ('license_type', 'is_pro')
    `);
    
    console.log("\n📊 Estrutura das colunas license_type e is_pro:");
    console.table(columnsResult.rows);
    
    // Verificar valores atuais nos posts
    const postsResult = await pool.query(`
      SELECT id, title, license_type, is_pro
      FROM posts
      ORDER BY id DESC
      LIMIT 20
    `);
    
    console.log("\n📋 Últimos 20 posts criados (com license_type e is_pro):");
    console.table(postsResult.rows);
    
    // Verificar inconsistências - posts onde license_type = 'premium' mas is_pro = false (ou vice-versa)
    const inconsistenciesResult = await pool.query(`
      SELECT id, title, license_type, is_pro
      FROM posts
      WHERE (license_type = 'premium' AND is_pro = false)
         OR (license_type = 'free' AND is_pro = true)
      LIMIT 10
    `);
    
    if (inconsistenciesResult.rows.length > 0) {
      console.log("\n⚠️ Inconsistências encontradas (license_type e is_pro não estão sincronizados):");
      console.table(inconsistenciesResult.rows);
      
      // Oferecer a opção de corrigir as inconsistências
      console.log("\n🔄 Deseja corrigir essas inconsistências? (Isso atualizará os valores de is_pro para corresponder ao license_type)");
      console.log("Para corrigir, execute: npx tsx update-post-premium.ts");
    } else {
      console.log("\n✅ Não foram encontradas inconsistências entre license_type e is_pro.");
    }
    
    await pool.end();
  } catch (error) {
    console.error("❌ Erro ao verificar os posts:", error);
  }
}

checkPostsLicenseType()
  .then(() => console.log("✅ Verificação concluída!"))
  .catch(err => console.error("❌ Erro na execução:", err));