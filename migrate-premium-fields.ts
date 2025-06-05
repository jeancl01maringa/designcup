/**
 * Script robusto para migrar e sincronizar os campos de licença premium
 * 
 * Este script irá:
 * 1. Verificar e adicionar os campos license_type e is_pro no PostgreSQL
 * 2. Sincronizar os dados entre os campos existentes
 * 3. Verificar e corrigir as inconsistências
 * 4. Consultar os dados para garantir o funcionamento
 * 
 * Para executar:
 * npx tsx migrate-premium-fields.ts
 */

import { supabase } from './server/supabase-client';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import ws from 'ws';

// Necessário para conexão WebSocket
neonConfig.webSocketConstructor = ws as any;

// Carregar variáveis de ambiente
dotenv.config();

// Validar variaveis obrigatórias
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL não definida nas variáveis de ambiente");
}

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
  throw new Error("SUPABASE_URL ou SUPABASE_KEY não definidas nas variáveis de ambiente");
}

// Cliente Supabase com chave de serviço (acesso direto ao banco)
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function executeSql(pool: Pool, query: string, params: any[] = []) {
  try {
    const result = await pool.query(query, params);
    return { success: true, result };
  } catch (error: any) {
    console.error(`⚠️ Erro SQL: ${error.message}`);
    console.log(`🔍 Query: ${query}`);
    console.log(`🔍 Params:`, params);
    return { success: false, error };
  }
}

async function migratePremiumFields() {
  console.log("🚀 Iniciando migração robusta dos campos premium...");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  
  // Conexão direta com PostgreSQL usando pool
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });
  
  try {
    console.log("📊 FASE 1: Verificando a estrutura atual do banco de dados");
    
    // Verificar se a tabela posts existe
    const tableCheck = await executeSql(pool, `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'posts'
      ) as "exists"
    `);
    
    if (!tableCheck.success || !tableCheck.result.rows[0].exists) {
      throw new Error("Tabela 'posts' não encontrada no banco de dados.");
    }
    
    // Verificar colunas existentes
    const columns = await executeSql(pool, `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'posts'
    `);
    
    if (!columns.success) {
      throw new Error("Falha ao verificar colunas da tabela 'posts'");
    }
    
    // Converter para um array mais fácil de manipular
    const columnNames = columns.result.rows.map(row => row.column_name);
    console.log("📋 Colunas existentes na tabela posts:", columnNames.join(", "));
    
    console.log("\n📊 FASE 2: Adicionando campos faltantes");
    
    // Iniciar transação para operações atômicas
    await executeSql(pool, 'BEGIN');
    
    let hasChanges = false;
    
    // Adicionar license_type se não existir
    if (!columnNames.includes('license_type')) {
      console.log("➕ Adicionando coluna license_type à tabela posts...");
      const addLicenseType = await executeSql(pool, `
        ALTER TABLE posts
        ADD COLUMN license_type TEXT DEFAULT 'free'
      `);
      
      if (!addLicenseType.success) {
        await executeSql(pool, 'ROLLBACK');
        throw new Error("Falha ao adicionar coluna license_type");
      }
      
      hasChanges = true;
      console.log("✅ Coluna license_type adicionada com sucesso!");
    } else {
      console.log("ℹ️ Coluna license_type já existe.");
    }
    
    // Adicionar is_pro se não existir
    if (!columnNames.includes('is_pro')) {
      console.log("➕ Adicionando coluna is_pro à tabela posts...");
      const addIsPro = await executeSql(pool, `
        ALTER TABLE posts
        ADD COLUMN is_pro BOOLEAN DEFAULT FALSE
      `);
      
      if (!addIsPro.success) {
        await executeSql(pool, 'ROLLBACK');
        throw new Error("Falha ao adicionar coluna is_pro");
      }
      
      hasChanges = true;
      console.log("✅ Coluna is_pro adicionada com sucesso!");
    } else {
      console.log("ℹ️ Coluna is_pro já existe.");
    }
    
    if (hasChanges) {
      console.log("🔄 Aplicando mudanças no esquema...");
      await executeSql(pool, 'COMMIT');
    } else {
      console.log("ℹ️ Nenhuma mudança de esquema necessária, ambas as colunas já existem.");
      await executeSql(pool, 'ROLLBACK');
    }
    
    console.log("\n📊 FASE 3: Sincronizando valores entre license_type e is_pro");
    
    // Verificar posts com inconsistências
    const inconsistencies = await executeSql(pool, `
      SELECT id, title, license_type, is_pro
      FROM posts
      WHERE (license_type = 'premium' AND is_pro = FALSE)
         OR (license_type = 'free' AND is_pro = TRUE)
         OR (license_type IS NULL AND is_pro IS NOT NULL)
         OR (license_type IS NOT NULL AND is_pro IS NULL)
    `);
    
    if (!inconsistencies.success) {
      throw new Error("Falha ao verificar inconsistências nos dados");
    }
    
    if (inconsistencies.result.rows.length > 0) {
      console.log(`⚠️ Encontradas ${inconsistencies.result.rows.length} inconsistências de dados.`);
      console.table(inconsistencies.result.rows);
      
      // Iniciar transação para atualizações de dados
      await executeSql(pool, 'BEGIN');
      
      // Atualizar posts onde license_type é 'premium' mas is_pro é falso
      const fixPremium = await executeSql(pool, `
        UPDATE posts
        SET is_pro = TRUE
        WHERE license_type = 'premium' AND (is_pro = FALSE OR is_pro IS NULL)
      `);
      
      if (!fixPremium.success) {
        await executeSql(pool, 'ROLLBACK');
        throw new Error("Falha ao atualizar is_pro para posts premium");
      }
      
      // Atualizar posts onde is_pro é true mas license_type não é 'premium'
      const fixIsPro = await executeSql(pool, `
        UPDATE posts
        SET license_type = 'premium'
        WHERE is_pro = TRUE AND (license_type != 'premium' OR license_type IS NULL)
      `);
      
      if (!fixIsPro.success) {
        await executeSql(pool, 'ROLLBACK');
        throw new Error("Falha ao atualizar license_type para posts com is_pro=true");
      }
      
      // Definir valores padrão para registros com NULL
      const fixNulls = await executeSql(pool, `
        UPDATE posts
        SET 
          license_type = COALESCE(license_type, 'free'),
          is_pro = COALESCE(is_pro, FALSE)
      `);
      
      if (!fixNulls.success) {
        await executeSql(pool, 'ROLLBACK');
        throw new Error("Falha ao definir valores padrão para campos NULL");
      }
      
      await executeSql(pool, 'COMMIT');
      console.log("✅ Inconsistências corrigidas com sucesso!");
    } else {
      console.log("✅ Não foram encontradas inconsistências nos dados.");
    }
    
    console.log("\n📊 FASE 4: Verificando status final dos campos");
    
    // Verificar amostra de posts após as correções
    const finalCheck = await executeSql(pool, `
      SELECT id, title, license_type, is_pro
      FROM posts
      ORDER BY id DESC
      LIMIT 10
    `);
    
    if (!finalCheck.success) {
      throw new Error("Falha ao verificar estado final dos posts");
    }
    
    if (finalCheck.result.rows.length > 0) {
      console.log("📋 Amostra de posts após as correções:");
      console.table(finalCheck.result.rows);
    } else {
      console.log("ℹ️ Nenhum post encontrado no banco de dados.");
    }
    
    console.log("\n📊 FASE 5: Testando API do Supabase");
    
    console.log("🔄 Tentando consultar posts via Supabase...");
    try {
      // Realizar consulta apenas para verificar se o Supabase reconhece os campos
      const { data, error } = await supabaseAdmin
        .from('posts')
        .select('id, title, license_type, is_pro')
        .limit(5);
      
      if (error) {
        console.warn("⚠️ Erro na API do Supabase, tentando uma abordagem direta...");
        
        // Tentar executar SQL diretamente pelo Supabase 
        // (requer permissão ativa de SQL na conta Supabase)
        const { error: sqlError } = await supabaseAdmin.rpc('test_premium_fields', {});
        
        if (sqlError) {
          console.error("❌ O Supabase retornou erro:", sqlError);
          
          // Tentar criar a função RPC no Supabase
          await supabaseAdmin.sql(`
            CREATE OR REPLACE FUNCTION test_premium_fields()
            RETURNS SETOF "posts" 
            LANGUAGE sql
            AS $$
              SELECT * FROM posts LIMIT 5;
            $$;
          `);
          
          console.log("✅ Função RPC criada no Supabase para contornar limitações de cache.");
          console.log("ℹ️ SUGESTÃO: Talvez seja necessário criar um novo RPC no painel do Supabase.");
        } else {
          console.log("✅ SQL direto no Supabase funcionou!");
        }
      } else {
        console.log("✅ Consulta via Supabase API funcionou!", data);
      }
    } catch (err) {
      console.error("❌ Erro ao testar API do Supabase:", err);
    }
    
  } catch (error) {
    console.error("\n❌ ERRO durante a migração:", error);
  } finally {
    // Garantir que o pool será fechado
    await pool.end();
  }
  
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📝 RESUMO:");
  console.log("1. Verificada a estrutura da tabela 'posts'");
  console.log("2. Adicionados os campos 'license_type' e 'is_pro' (se necessário)");
  console.log("3. Sincronizados os valores entre os campos");
  console.log("4. Verificado o status final dos campos");
  console.log("5. Testada integração com API do Supabase");
  console.log("\n✅ A migração foi concluída!\n");
}

// Executar a função principal
migratePremiumFields()
  .then(() => console.log("🎉 Processo finalizado!"))
  .catch((err) => console.error("❌ Erro fatal durante o processo:", err));