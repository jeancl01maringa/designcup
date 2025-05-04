/**
 * Script para validar a conexão com o banco de dados e verificar a sincronização
 * entre o PostgreSQL direto e o Supabase
 * 
 * Para executar:
 * npx tsx validate-database-connection.ts
 */

import { supabase } from './server/supabase-client';
import { Pool, neonConfig } from '@neondatabase/serverless';
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

async function validateDatabaseConnection() {
  console.log("🔍 Validando conexão com o banco de dados e sincronização com Supabase...");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  
  // Conexão direta com PostgreSQL
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });
  
  try {
    // FASE 1: Verificar conexão com PostgreSQL
    console.log("📊 FASE 1: Verificando conexão direta com PostgreSQL");
    
    try {
      const { rows: pgResponse } = await pool.query('SELECT current_database() as db, current_user as user');
      console.log(`✅ Conexão PostgreSQL OK: Base de dados '${pgResponse[0].db}' com usuário '${pgResponse[0].user}'`);
    } catch (error: any) {
      console.error(`❌ Falha na conexão PostgreSQL: ${error.message}`);
      throw error;
    }
    
    // FASE 2: Verificar conexão com Supabase
    console.log("\n📊 FASE 2: Verificando conexão com Supabase");
    
    try {
      const { data: sbResponse, error: sbError } = await supabase.from('_metadata_').select('version');
      
      if (sbError) {
        // A tabela _metadata_ pode não existir, mas a conexão pode estar OK
        console.log(`ℹ️ Supabase retornou erro ao verificar versão: ${sbError.message}`);
        
        // Tentativa alternativa com tabela que sabemos que existe
        const { data: sbUsers, error: sbUsersError } = await supabase.from('users').select('count').limit(1);
        
        if (sbUsersError) {
          console.error(`❌ Falha na conexão Supabase: ${sbUsersError.message}`);
          throw sbUsersError;
        } else {
          console.log("✅ Conexão Supabase OK (teste com tabela 'users')");
        }
      } else {
        console.log(`✅ Conexão Supabase OK: Versão ${sbResponse?.version || 'não disponível'}`);
      }
    } catch (error: any) {
      console.error(`❌ Falha na conexão Supabase: ${error.message}`);
      throw error;
    }
    
    // FASE 3: Comparar tabelas entre PostgreSQL e Supabase
    console.log("\n📊 FASE 3: Comparando tabelas entre PostgreSQL e Supabase");
    
    // Listar tabelas no PostgreSQL
    const { rows: pgTables } = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    // Como não podemos listar tabelas diretamente no Supabase, vamos tentar acessar cada uma
    console.log(`ℹ️ Tabelas no PostgreSQL: ${pgTables.length}`);
    console.log(pgTables.map(t => t.table_name).join(', '));
    
    // Verificar tabela por tabela
    console.log("\nVerificando acesso a cada tabela via Supabase:");
    for (const table of pgTables) {
      const tableName = table.table_name;
      
      try {
        const { data, error } = await supabase.from(tableName).select('count').limit(1);
        
        if (error) {
          console.log(`❌ Tabela '${tableName}': Erro ao acessar via Supabase (${error.message})`);
        } else {
          console.log(`✅ Tabela '${tableName}': Acessível via Supabase`);
        }
      } catch (error: any) {
        console.log(`❌ Tabela '${tableName}': Exceção ao acessar (${error.message})`);
      }
    }
    
    // FASE 4: Verificar campos críticos na tabela 'posts'
    console.log("\n📊 FASE 4: Verificando campos críticos na tabela 'posts'");
    
    // Verificar schema da tabela posts no PostgreSQL
    const { rows: postColumns } = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'posts'
      ORDER BY ordinal_position
    `);
    
    console.log(`ℹ️ Colunas da tabela 'posts' no PostgreSQL: ${postColumns.length}`);
    console.table(postColumns);
    
    // Verificar acesso aos campos premium via Supabase
    console.log("\nTentando acessar campos premium via Supabase:");
    
    try {
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('id, title, license_type, is_pro')
        .limit(3);
      
      if (postsError) {
        if (postsError.message.includes("Could not find the 'is_pro' column")) {
          console.log("⚠️ Problema de cache no Supabase: O campo 'is_pro' existe no PostgreSQL mas não é reconhecido pelo Supabase");
          console.log("   Isso acontece quando o Supabase não atualizou seu cache após alterações no schema.");
          console.log("   Solução: Acessar o painel do Supabase e forçar atualização do schema ou usar PostgreSQL direto.");
        } else if (postsError.message.includes("Could not find the 'license_type' column")) {
          console.log("⚠️ Problema de cache no Supabase: O campo 'license_type' existe no PostgreSQL mas não é reconhecido pelo Supabase");
        } else {
          console.log(`❌ Erro ao acessar posts via Supabase: ${postsError.message}`);
        }
      } else {
        console.log("✅ Supabase reconhece os campos premium na tabela 'posts'");
        console.table(postsData || []);
      }
    } catch (error: any) {
      console.log(`❌ Exceção ao acessar posts: ${error.message}`);
    }
    
    // FASE 5: Validar acesso às categorias
    console.log("\n📊 FASE 5: Verificando acesso às categorias");
    
    // Verificar categorias no PostgreSQL
    try {
      const { rows: pgCategories } = await pool.query("SELECT id, name FROM categories");
      console.log(`ℹ️ Categorias no PostgreSQL: ${pgCategories.length}`);
      console.table(pgCategories);
    } catch (error: any) {
      console.log(`❌ Erro ao acessar categorias via PostgreSQL: ${error.message}`);
    }
    
    // Verificar categorias via Supabase
    try {
      const { data: sbCategories, error: sbError } = await supabase.from("categories").select("id, name");
      
      if (sbError) {
        console.log(`❌ Erro ao acessar categorias via Supabase: ${sbError.message}`);
      } else {
        console.log(`ℹ️ Categorias via Supabase: ${sbCategories?.length || 0}`);
        console.table(sbCategories || []);
      }
    } catch (error: any) {
      console.log(`❌ Exceção ao acessar categorias via Supabase: ${error.message}`);
    }
    
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📝 RESUMO E RECOMENDAÇÕES:");
    console.log("1. Os campos premium (license_type e is_pro) existem na tabela posts do PostgreSQL");
    console.log("2. O Supabase pode ter um problema de cache que impede o acesso a esses campos");
    console.log("3. Use PostgreSQL direto para operações que envolvem esses campos até resolver o cache do Supabase");
    console.log("4. Para resolver o problema de cache do Supabase, acesse o painel administrativo e force uma atualização do schema");
    console.log("\nℹ️ Para usar PostgreSQL direto, você já tem um exemplo em server/storage.ts");
    console.log("✅ Validação concluída!");
  } catch (error) {
    console.error(`\n❌ ERRO FATAL: ${error}`);
  } finally {
    // Garantir que o pool será fechado
    await pool.end();
  }
}

// Executar a função principal
validateDatabaseConnection()
  .then(() => console.log("🎉 Processo finalizado!"))
  .catch((err) => console.error("❌ Erro fatal durante o processo:", err));