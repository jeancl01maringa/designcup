/**
 * Script para verificar os campos relacionados a premium nos posts
 * 
 * Para executar:
 * npx tsx check-post-premium-fields.ts
 */

import { Pool } from '@neondatabase/serverless';
import { config } from 'dotenv';
import { neonConfig } from '@neondatabase/serverless';
import * as ws from 'ws';

// Configuração para o WebSocket
neonConfig.webSocketConstructor = ws.WebSocket;

// Carrega variáveis de ambiente
config();

async function checkPostPremiumFields() {
  console.log("Verificando campos premium nos posts...");
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });
  
  try {
    // Verifica estrutura dos campos
    const checkColumnsResult = await pool.query(`
      SELECT 
        column_name, 
        data_type, 
        is_nullable 
      FROM 
        information_schema.columns 
      WHERE 
        table_name = 'posts' AND 
        column_name IN ('is_pro', 'license_type')
    `);
    
    if (checkColumnsResult.rows.length === 0) {
      console.log("Os campos 'is_pro' e/ou 'license_type' não existem na tabela posts.");
      return;
    }
    
    console.log("Estrutura dos campos premium:");
    console.table(checkColumnsResult.rows);
    
    // Verifica a quantidade de posts com cada valor
    const countResult = await pool.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN is_pro IS TRUE THEN 1 ELSE 0 END) as premium_count,
        SUM(CASE WHEN is_pro IS FALSE OR is_pro IS NULL THEN 1 ELSE 0 END) as free_count,
        SUM(CASE WHEN license_type = 'premium' THEN 1 ELSE 0 END) as license_premium_count,
        SUM(CASE WHEN license_type = 'free' OR license_type IS NULL THEN 1 ELSE 0 END) as license_free_count
      FROM posts
    `);
    
    console.log("\nEstatísticas de posts premium vs free:");
    console.table(countResult.rows);
    
    // Amostra de alguns posts premium
    const premiumSamplesResult = await pool.query(`
      SELECT id, title, is_pro, license_type
      FROM posts
      WHERE is_pro IS TRUE OR license_type = 'premium'
      LIMIT 5
    `);
    
    console.log("\nExemplos de posts premium:");
    console.table(premiumSamplesResult.rows);
    
    // Verifica inconsistências
    const inconsistenciesResult = await pool.query(`
      SELECT id, title, is_pro, license_type
      FROM posts
      WHERE (is_pro IS TRUE AND (license_type != 'premium' OR license_type IS NULL))
         OR (is_pro IS FALSE AND license_type = 'premium')
      LIMIT 10
    `);
    
    if (inconsistenciesResult.rows.length > 0) {
      console.log("\nPosts com inconsistências entre is_pro e license_type:");
      console.table(inconsistenciesResult.rows);
    } else {
      console.log("\nNão foram encontradas inconsistências entre os campos is_pro e license_type.");
    }
    
  } catch (error) {
    console.error("Erro ao verificar campos premium:", error);
  } finally {
    await pool.end();
  }
}

checkPostPremiumFields()
  .then(() => console.log("\nVerificação concluída."))
  .catch(error => console.error("\nErro na verificação:", error));