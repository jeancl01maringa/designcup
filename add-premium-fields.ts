/**
 * Script para adicionar os campos license_type e is_pro na tabela posts do Supabase
 * 
 * Este script verifica se os campos existem e os adiciona se necessário
 * Para executar: npx tsx add-premium-fields.ts
 */

import { supabase } from './server/supabase-client';
import { Pool, neonConfig } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
import ws from 'ws';

// Necessário para conexão WebSocket no Replit
neonConfig.webSocketConstructor = ws as any;

dotenv.config();

async function addPremiumFields() {
  console.log("🔍 Verificando e adicionando campos necessários para gestão de conteúdo premium");
  
  try {
    // Conexão direta com PostgreSQL
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });
    
    console.log("🔄 Conectado ao banco de dados PostgreSQL");
    
    // Verificar se os campos já existem
    const checkColumns = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'posts' 
      AND column_name IN ('license_type', 'is_pro')
    `);
    
    const existingColumns = checkColumns.rows.map(row => row.column_name);
    console.log("📋 Colunas existentes:", existingColumns);
    
    // Adicionar campos com transação para garantir atomicidade
    await pool.query('BEGIN');
    
    try {
      // Adicionar campo license_type se não existir
      if (!existingColumns.includes('license_type')) {
        console.log("➕ Adicionando coluna license_type à tabela posts...");
        await pool.query(`
          ALTER TABLE posts
          ADD COLUMN license_type TEXT DEFAULT 'free'
        `);
        console.log("✅ Coluna license_type adicionada com sucesso!");
      } else {
        console.log("ℹ️ Coluna license_type já existe.");
      }
      
      // Adicionar campo is_pro se não existir
      if (!existingColumns.includes('is_pro')) {
        console.log("➕ Adicionando coluna is_pro à tabela posts...");
        await pool.query(`
          ALTER TABLE posts
          ADD COLUMN is_pro BOOLEAN DEFAULT FALSE
        `);
        console.log("✅ Coluna is_pro adicionada com sucesso!");
      } else {
        console.log("ℹ️ Coluna is_pro já existe.");
      }
      
      // Atualizar valores para sincronizar (is_pro true para itens com license_type 'premium')
      console.log("🔄 Atualizando valores para sincronizar license_type e is_pro...");
      await pool.query(`
        UPDATE posts
        SET is_pro = TRUE
        WHERE license_type = 'premium' AND (is_pro = FALSE OR is_pro IS NULL)
      `);
      
      await pool.query(`
        UPDATE posts
        SET license_type = 'premium'
        WHERE is_pro = TRUE AND (license_type != 'premium' OR license_type IS NULL)
      `);
      
      // Sucesso: confirmar alterações
      await pool.query('COMMIT');
      console.log("✅ Transação finalizada com sucesso!");
      
      // Verificar posts atualizados
      const updatedPosts = await pool.query(`
        SELECT id, title, license_type, is_pro
        FROM posts
        LIMIT 10
      `);
      
      console.log("\n📋 Amostra de posts após atualização:");
      console.table(updatedPosts.rows);
      
    } catch (err) {
      // Erro: desfazer alterações
      await pool.query('ROLLBACK');
      console.error("❌ Erro durante a transação. Alterações desfeitas:", err);
      throw err;
    } finally {
      // Fechar conexão com o pool
      await pool.end();
    }
    
    // Verificar alterações refletidas no Supabase
    console.log("🔄 Verificando alterações através do cliente Supabase...");
    try {
      const { data, error } = await supabase.from("posts").select("id, title").limit(3);
      
      if (error) {
        console.error("❌ Erro ao consultar posts via Supabase API:", error);
      } else {
        console.log("✅ Consulta via Supabase API funcionou! Encontrados", data?.length, "posts");
      }
    } catch (supabaseError) {
      console.error("❌ Exceção ao consultar Supabase:", supabaseError);
    }
    
  } catch (error) {
    console.error("❌ Erro global:", error);
  }
}

// Executar a função principal
addPremiumFields()
  .then(() => console.log("✅ Processo concluído!"))
  .catch(err => console.error("❌ Erro na execução:", err));